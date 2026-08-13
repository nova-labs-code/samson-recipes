// js/voice-chat.js
//
// ⚠️ SECURITY WARNING — READ BEFORE USING ⚠️
// This version signs LiveKit access tokens *in the browser*, using your
// project's API Key + Secret pasted directly into this file. That means
// your API Secret ships to every visitor's browser and is trivially
// readable via "View Source" or the Network tab. Anyone who grabs it can:
//   - join, create, or delete ANY room in your LiveKit project
//   - mute or kick any participant anywhere in the project
//   - mint tokens with any permissions they want, for any room
// This is fine as a short-term prototype (no backend to stand up), but
// treat the secret as burned the moment this ships anywhere public. When
// you're ready to close this hole: move the signing into a small server
// (token-server-example.js is a reference) and delete the secret from
// this file. Nothing else about how you call VoiceChat changes.
//
// Setup: paste your project's API Key, API Secret, and server URL (the
// wss://... one) from LiveKit Cloud's "API Keys" page into the three
// constants below.
import {
    Room,
    RoomEvent,
    Track,
} from "https://cdn.jsdelivr.net/npm/livekit-client@2.21.0/dist/livekit-client.esm.mjs";
import { announceCallJoined, announceCallLeft } from "./firebase.js";

// ---- Config: paste your LiveKit Cloud project values here ----
const LIVEKIT_URL = "YOUR_LIVEKIT_URL";
const LIVEKIT_API_KEY = "YOUR_LIVEKIT_API_KEY";
const LIVEKIT_API_SECRET = "YOUR_LIVEKIT_API_SECRET";

let room = null;
let currentChatId = null;
let lastKnownIdentity = null; // used to clear Firebase presence on unexpected drops
let isIntentionalLeave = false; // true while leaveCall() is running, so the
                                  // Disconnected event handler below doesn't
                                  // ALSO report the leave and double-post
                                  // the "Call ended" system message
let onParticipantsChanged = null;
const locallyMutedSids = new Set(); // "mute for me" only, client-side

// ---- Minimal browser-side JWT signing (HS256) via Web Crypto ----
function base64UrlEncodeBytes(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64UrlEncodeString(str) {
    return base64UrlEncodeBytes(new TextEncoder().encode(str));
}
async function hmacSha256(secret, message) {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
    return base64UrlEncodeBytes(new Uint8Array(signature));
}
async function signLiveKitJwt(claims) {
    const header = { alg: "HS256", typ: "JWT" };
    const signingInput = `${base64UrlEncodeString(JSON.stringify(header))}.${base64UrlEncodeString(JSON.stringify(claims))}`;
    const signature = await hmacSha256(LIVEKIT_API_SECRET, signingInput);
    return `${signingInput}.${signature}`;
}
async function buildJoinToken(roomName, identity, name) {
    const now = Math.floor(Date.now() / 1000);
    return signLiveKitJwt({
        iss: LIVEKIT_API_KEY,
        sub: identity,
        name,
        nbf: now - 10,
        exp: now + 6 * 60 * 60, // 6 hours
        video: {
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            // Voice-only: no camera/screen share. Drop this line if you
            // want video calling too.
            canPublishSources: ["microphone"],
        },
    });
}
async function buildRoomAdminToken(roomName) {
    const now = Math.floor(Date.now() / 1000);
    return signLiveKitJwt({
        iss: LIVEKIT_API_KEY,
        sub: `admin-${Math.random().toString(36).slice(2, 8)}`,
        nbf: now - 10,
        exp: now + 5 * 60,
        video: { roomAdmin: true, room: roomName },
    });
}
function httpBaseUrl() {
    return LIVEKIT_URL.replace(/^wss:\/\//, "https://").replace(/^ws:\/\//, "http://");
}

export function setParticipantsChangedHandler(fn) {
    onParticipantsChanged = fn;
}

export function isInCall() {
    return !!room;
}

export function getCurrentCallChatId() {
    return currentChatId;
}

// Anyone can call this — there's no "host." Whoever taps Call first
// creates the LiveKit room implicitly (LiveKit auto-creates rooms on
// first join); everyone after that just joins the same room. Firebase
// presence (announceCallJoined) is what lets OTHER members see a call is
// active before they've joined it themselves.
export async function joinCall(chatId, identity, displayName) {
    if (room) {
        await leaveCall();
    }
    const roomName = `chat-${chatId}`;
    const token = await buildJoinToken(roomName, identity, displayName);

    room = new Room({ adaptiveStream: true, dynacast: true });

    room.on(RoomEvent.ActiveSpeakersChanged, () => notify());
    room.on(RoomEvent.ParticipantConnected, () => notify());
    room.on(RoomEvent.ParticipantDisconnected, (p) => {
        locallyMutedSids.delete(p.sid);
        notify();
    });
    room.on(RoomEvent.TrackMuted, () => notify());
    room.on(RoomEvent.TrackUnmuted, () => notify());
    room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
        if (track.kind === Track.Kind.Audio) {
            const el = track.attach();
            el.dataset.participantSid = participant.sid;
            el.style.display = "none";
            el.muted = locallyMutedSids.has(participant.sid);
            document.body.appendChild(el);
        }
        notify();
    });
    room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((el) => el.remove());
    });
    room.on(RoomEvent.Disconnected, () => {
        // Covers unexpected drops (network hiccup, server-side kick, etc.)
        // where leaveCall() was never explicitly called — clear Firebase
        // presence so other members don't see a stale "in call" entry.
        // If this fired because leaveCall() itself called room.disconnect(),
        // skip reporting here — leaveCall() already does it below, and
        // letting both run was double-posting the "Call ended" message.
        const disconnectedChatId = currentChatId;
        const disconnectedIdentity = lastKnownIdentity;
        const wasIntentional = isIntentionalLeave;
        room = null;
        currentChatId = null;
        lastKnownIdentity = null;
        locallyMutedSids.clear();
        if (!wasIntentional && disconnectedChatId && disconnectedIdentity) {
            announceCallLeft(disconnectedChatId, disconnectedIdentity).catch((err) => {
                console.error("Failed to clear stale call presence:", err);
            });
        }
        notify();
    });

    await room.connect(LIVEKIT_URL, token);
    await room.localParticipant.setMicrophoneEnabled(true);
    currentChatId = chatId;
    lastKnownIdentity = identity;

    try {
        await announceCallJoined(chatId, identity, displayName);
    } catch (err) {
        console.error("Failed to announce call presence:", err);
    }
    notify();
}

export async function leaveCall() {
    if (!room) return;
    const leavingChatId = currentChatId;
    const leavingIdentity = lastKnownIdentity;
    isIntentionalLeave = true;
    await room.disconnect();
    room = null;
    currentChatId = null;
    lastKnownIdentity = null;
    locallyMutedSids.clear();
    if (leavingChatId && leavingIdentity) {
        try {
            await announceCallLeft(leavingChatId, leavingIdentity);
        } catch (err) {
            console.error("Failed to clear call presence:", err);
        }
    }
    isIntentionalLeave = false;
    notify();
}

// Self mute/unmute — this is the real mic toggle, works for everyone.
export async function toggleSelfMute() {
    if (!room) return null;
    const enabled = room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(!enabled);
    notify();
    return !enabled; // returns new muted state (true = now muted)
}

export function isSelfMuted() {
    return room ? !room.localParticipant.isMicrophoneEnabled : true;
}

// "Mute for me" — silences a remote participant's audio locally only.
// Does not affect what anyone else hears. No server call needed.
export function toggleLocalMuteForParticipant(sid) {
    const willMute = !locallyMutedSids.has(sid);
    document
        .querySelectorAll(`audio[data-participant-sid="${sid}"]`)
        .forEach((el) => {
            el.muted = willMute;
        });
    if (willMute) locallyMutedSids.add(sid);
    else locallyMutedSids.delete(sid);
    notify();
    return willMute;
}

export function isLocallyMuted(sid) {
    return locallyMutedSids.has(sid);
}

// Force-mute a remote participant's mic for everyone, by calling LiveKit's
// Room Service HTTP API directly from the browser with a freshly-signed
// admin token. Needs the target's published mic track SID, which the call
// panel already has from getParticipantsInfo().
export async function requestForceMute(chatId, targetIdentity, trackSid) {
    if (!trackSid) return false;
    const roomName = `chat-${chatId}`;
    const adminToken = await buildRoomAdminToken(roomName);
    try {
        const res = await fetch(`${httpBaseUrl()}/twirp/livekit.RoomService/MutePublishedTrack`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
                room: roomName,
                identity: targetIdentity,
                track_sid: trackSid,
                muted: true,
            }),
        });
        return res.ok;
    } catch (err) {
        console.error("Force-mute request failed:", err);
        return false;
    }
}

// Snapshot of everyone currently in the call, with speaking + mute state,
// ready to hand straight to a render function.
export function getParticipantsInfo() {
    if (!room) return [];
    const speakingSids = new Set((room.activeSpeakers || []).map((p) => p.sid));

    const list = [
        {
            sid: room.localParticipant.sid,
            identity: room.localParticipant.identity,
            name: room.localParticipant.name || room.localParticipant.identity,
            isLocal: true,
            speaking: speakingSids.has(room.localParticipant.sid),
            muted: !room.localParticipant.isMicrophoneEnabled,
            locallyMuted: false,
            micTrackSid: null,
        },
    ];

    room.remoteParticipants.forEach((p) => {
        const micPub = p.getTrackPublication
            ? p.getTrackPublication(Track.Source.Microphone)
            : null;
        list.push({
            sid: p.sid,
            identity: p.identity,
            name: p.name || p.identity,
            isLocal: false,
            speaking: speakingSids.has(p.sid),
            muted: micPub ? micPub.isMuted : true,
            locallyMuted: isLocallyMuted(p.sid),
            micTrackSid: micPub ? micPub.trackSid : null,
        });
    });

    return list;
}

function notify() {
    if (onParticipantsChanged) onParticipantsChanged(getParticipantsInfo());
}