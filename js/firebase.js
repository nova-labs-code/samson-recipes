// firebase.js - Firebase Modular SDK Configuration & Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    GithubAuthProvider, 
    signInWithPopup, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    collection, 
    query, 
    where, 
    getDocs, 
    deleteDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    getDatabase,
    ref,
    push,
    set as rtdbSet,
    get as rtdbGet,
    remove as rtdbRemove,
    update as rtdbUpdate,
    onValue,
    off,
    onDisconnect,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
};

// Initialize Firebase Services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app, firebaseConfig.databaseURL);

// Authentication Provider Instances
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Custom Phrase Replacements
const phraseReplacements = [
    { pattern: /what the fuck/gi, replacement: "what the hell" },
    { pattern: /what the fk/gi, replacement: "what the heck" },
    { pattern: /what the f/gi, replacement: "what the heck" },
    { pattern: /fuck you/gi, replacement: "screw you" },
    { pattern: /fuck off/gi, replacement: "get lost" },
    { pattern: /shut the fuck up/gi, replacement: "shut up" },
    { pattern: /holy shit/gi, replacement: "holy cow" },
    { pattern: /piece of shit/gi, replacement: "piece of junk" },
    { pattern: /son of a bitch/gi, replacement: "son of a gun" }
];

// Banned words & phrases configuration registry
const forbiddenWords = [
    // Standard Swear Words
    "fuck",
    "fucking",
    "fucker",
    "fck",
    "fk",
    "shit",
    "shitting",
    "shitty",
    "bitch",
    "bitches",
    "bitching",
    "asshole",
    "ass",
    "bastard",
    "cunt",
    "dick",
    "dickhead",
    "pussy",
    "cock",
    "motherfucker",
    "bullshit",
    "damn",
    "dammit",

    // Adult content
    "nsfw",
    "porn",
    "porno",
    "pornography",
    "hentai",
    "onlyfans",
    "fansly",
    "xvideos",
    "xnxx",
    "redtube",

    // Sexual terms
    "sex",
    "sexual",
    "sexy",
    "nude",
    "nudes",
    "naked",
    "boob",
    "boobs",
    "breast",
    "breasts",
    "penis",
    "vagina",
    "genitals",
    "cum",
    "ejaculate",
    "orgasm",
    "masturbate",
    "masturbation",

    // Grooming / solicitation
    "hookup",
    "hookups",
    "hookingup",
    "fwb",
    "horny",
    "kik",
    "telegram",

    // Personal information
    "address",
    "zipcode",
    "postcode",
    "school",
    "snapchat",
    "snap",
    "instagram",
    "discord",
    "whatsapp",
    "phone",
    "number",
    "selfie",
    "location",
    "gps",
    "coordinate",
    "coordinates"
];

const forbiddenPhrases = [
    // Sexual content
    "send nudes",
    "send nude",
    "trade nudes",
    "swap nudes",
    "show me your body",
    "want to have sex",
    "wanna have sex",
    "meet for sex",
    "friends with benefits",
    "one night stand",
    "watch porn",
    "share porn",
    "buy onlyfans",
    "subscribe to onlyfans",

    // Requests to meet
    "meet me",
    "come meet me",
    "meet in person",
    "come over",
    "hang out alone",
    "come to my house",
    "come to your house",

    // Address/location requests
    "what is your address",
    "where do you live",
    "where are you staying",
    "what city do you live in",
    "send your address",
    "give me your address",
    "drop your address",
    "what school do you go to",
    "where do you go to school",

    // Contact requests
    "what is your phone number",
    "give me your phone number",
    "send me your phone number",
    "what is your snapchat",
    "what is your snap",
    "add me on snapchat",
    "what is your instagram",
    "add me on instagram",
    "what is your discord",
    "add me on discord",
    "what is your tiktok",
    "what is your whatsapp",

    // Personal information
    "send me a picture of yourself",
    "send me a selfie",
    "how old are you",
    "are you home alone",
    "are your parents home",
    "are you alone",
    "what is your full name"
];

// Combine and sort by length (longest first)
const allForbidden = [...forbiddenWords, ...forbiddenPhrases].sort((a, b) => b.length - a.length);

/**
 * Helper to process the Backwards Code cipher (A <-> Z, B <-> Y, etc.)
 */
function runBackwardsCipher(str) {
    if (!str) return "";
    return str.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) {
            return String.fromCharCode(90 - (code - 65));
        }
        if (code >= 97 && code <= 122) {
            return String.fromCharCode(122 - (code - 97));
        }
        return char;
    }).join('');
}

/**
 * Check if a specific string contains any forbidden words
 */
function hasForbiddenContent(text) {
    if (!text) return false;
    
    const plainText = text.toLowerCase();
    const condensedText = plainText.replace(/\s+/g, '');
    const decodedTextAttempt = runBackwardsCipher(text).toLowerCase();
    const condensedDecodedAttempt = decodedTextAttempt.replace(/\s+/g, '');

    return allForbidden.some(item => {
        const lowerItem = item.toLowerCase();
        return (
            plainText.includes(lowerItem) ||
            condensedText.includes(lowerItem) ||
            decodedTextAttempt.includes(lowerItem) ||
            condensedDecodedAttempt.includes(lowerItem)
        );
    });
}

/**
 * Recursively scans any object tree structure to find forbidden content
 */
function objectContainsForbidden(obj) {
    if (obj === null || obj === undefined) return false;
    
    if (typeof obj === 'string') {
        return hasForbiddenContent(obj);
    }
    
    if (Array.isArray(obj)) {
        return obj.some(item => objectContainsForbidden(item));
    }
    
    if (typeof obj === 'object') {
        return Object.values(obj).some(val => objectContainsForbidden(val));
    }
    
    return false;
}

/**
 * Universal Text Moderation Module (For messages, usernames, bios, etc.)
 */
function moderateMessageText(originalText) {
    if (!originalText) return "";

    let moderatedText = originalText;

    // 1. Rephrase specified phrases first
    phraseReplacements.forEach(({ pattern, replacement }) => {
        moderatedText = moderatedText.replace(pattern, replacement);
    });

    // 2. Mask remaining forbidden words/sub-strings
    allForbidden.forEach(item => {
        const escapedItem = item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedItem, "gi");
        const mask = "#".repeat(item.length);
        moderatedText = moderatedText.replace(regex, mask);
    });

    return moderatedText;
}

/**
 * Fetches every recipe across the platform.
 * Automatically DELETES recipes containing forbidden content.
 */
async function getAllRecipesList() {
    try {
        const recipesCollection = collection(db, "recipes");
        const querySnapshot = await getDocs(recipesCollection);
        const recipeList = [];

        for (const docSnap of querySnapshot.docs) {
            const rawData = docSnap.data();
            const recipeId = docSnap.id;

            if (objectContainsForbidden(rawData)) {
                console.warn(`ALERT: Recipe [${recipeId}] contains forbidden content. Deleting immediately.`);
                try {
                    await deleteDoc(doc(db, "recipes", recipeId));
                } catch (delError) {
                    console.error(`Failed to execute auto-delete for legacy recipe ${recipeId}:`, delError);
                }
                continue;
            }

            recipeList.push({
                id: recipeId,
                ...rawData
            });
        }
        return recipeList;
    } catch (error) {
        console.error("Error collecting full recipe list array: ", error);
        return [];
    }
}

/**
 * Moderates and saves/updates a recipe.
 */
async function saveRecipeWithModeration(recipeId, recipeData) {
    try {
        if (objectContainsForbidden(recipeData)) {
            console.warn(`Block: Attempted to save forbidden content in recipe [${recipeId}]. Deleting record.`);
            await deleteDoc(doc(db, "recipes", recipeId));
            return false;
        }

        await setDoc(doc(db, "recipes", recipeId), recipeData, { merge: true });
        return true;
    } catch (error) {
        console.error("Error saving moderated recipe: ", error);
        throw error;
    }
}

/**
 * Generates a unique 15-digit custom account ID.
 */
async function generateUniqueAccountId() {
    let unique = false;
    let accountId = "";
    while (!unique) {
        accountId = Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
        const userDoc = await getDoc(doc(db, "users", accountId));
        if (!userDoc.exists()) {
            unique = true;
        }
    }
    return accountId;
}

/**
 * Resolves a Firebase UID to a custom 15-digit Account ID.
 */
async function getAccountIdFromUid(uid) {
    if (!uid) return null;
    const mapDoc = await getDoc(doc(db, "authMappings", uid));
    if (mapDoc.exists()) {
        return mapDoc.data().accountId;
    }
    return null;
}

/**
 * Registers or looks up a user upon authentication (Moderates name).
 */
async function handleUserAuth(firebaseUser, customName = null) {
    let accountId = await getAccountIdFromUid(firebaseUser.uid);
    if (!accountId) {
        accountId = await generateUniqueAccountId();
        const providerId = firebaseUser.providerData[0]?.providerId;
        const email = firebaseUser.email;
        const rawName = customName || firebaseUser.displayName || "Samson Chef";
        const cleanName = moderateMessageText(rawName);

        const userData = {
            accountId: accountId,
            uidReference: firebaseUser.uid,
            name: cleanName,
            githubMethods: providerId === "github.com" ? [email || firebaseUser.uid] : [],
            googleMethod: providerId === "google.com" ? email : null,
            admin: false,
            createdAt: new Date().toISOString(),
            settings: {
                profilePublic: true,
                recipesPublic: true
            },
            profile: {
                bio: "Welcome to my recipe profile!",
                avatarInitials: ""
            }
        };
        await setDoc(doc(db, "users", accountId), userData);
        await setDoc(doc(db, "authMappings", firebaseUser.uid), { accountId: accountId });
        trackLocalAccount(accountId, cleanName, providerId);
    }
    return accountId;
}

function trackLocalAccount(accountId, name, method) {
    const cleanName = moderateMessageText(name);
    let accounts = JSON.parse(localStorage.getItem("samson_accounts") || "[]");
    if (!accounts.some(acc => acc.accountId === accountId)) {
        accounts.push({ accountId, name: cleanName, method });
        localStorage.setItem("samson_accounts", JSON.stringify(accounts));
    }
}

/**
 * Fetches every user profile on the platform as a flat list with moderated names.
 */
async function getAllUsersList() {
    try {
        const usersCollection = collection(db, "users");
        const querySnapshot = await getDocs(usersCollection);
        const users = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const cleanName = moderateMessageText(data.name || "Unnamed Chef");
            users.push({
                accountId: data.accountId || docSnap.id,
                name: cleanName,
                avatarInitials: (data.profile && data.profile.avatarInitials) || cleanName.slice(0, 2).toUpperCase()
            });
        });
        return users;
    } catch (error) {
        console.error("Error collecting all users: ", error);
        return [];
    }
}

/**
 * Looks up a single user profile by their 15-digit account ID.
 */
async function getUserByAccountId(accountId) {
    if (!accountId) return null;
    const userDoc = await getDoc(doc(db, "users", accountId));
    if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.name) {
            data.name = moderateMessageText(data.name);
        }
        if (data.profile && data.profile.bio) {
            data.profile.bio = moderateMessageText(data.profile.bio);
        }
        return { accountId, ...data };
    }
    return null;
}

/**
 * Deterministic chat ID for a 1:1 DM.
 */
function makeDmChatId(idA, idB) {
    return "dm_" + [idA, idB].sort().join("_");
}

/**
 * Opens an existing DM between two accounts, or creates it if needed.
 */
async function createOrGetDmChat(myId, myName, peerId, peerName) {
    const compositeId = myId < peerId ? `${myId}_${peerId}` : `${peerId}_${myId}`;
    const cleanMyName = moderateMessageText(myName);
    const cleanPeerName = moderateMessageText(peerName);

    const myUserChatRef = ref(rtdb, `userChats/${myId}/${compositeId}`);
    const myUserChatSnapshot = await rtdbGet(myUserChatRef);
    
    if (myUserChatSnapshot.exists()) {
        return compositeId;
    }
    
    const globalChatIdRef = ref(rtdb, `chats/${compositeId}/chatId`);
    let globalExists = false;
    try {
        const globalSnapshot = await rtdbGet(globalChatIdRef);
        globalExists = globalSnapshot.exists();
    } catch (e) {
        globalExists = false;
    }
    
    if (!globalExists) {
        const newChatData = {
            chatId: compositeId,
            type: "dm",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            members: { [myId]: true, [peerId]: true },
            memberNames: { [myId]: cleanMyName, [peerId]: cleanPeerName }
        };
        
        await rtdbSet(ref(rtdb, `chats/${compositeId}`), newChatData);
        
        await rtdbSet(ref(rtdb, `userChats/${myId}/${compositeId}`), { chatId: compositeId, type: "dm", peerId: peerId, name: cleanPeerName });
        await rtdbSet(ref(rtdb, `userChats/${peerId}/${compositeId}`), { chatId: compositeId, type: "dm", peerId: myId, name: cleanMyName });
        
        return compositeId;
    }
    
    await rtdbSet(myUserChatRef, {
        chatId: compositeId,
        type: "dm",
        peerId: peerId,
        name: cleanPeerName
    });
    
    await rtdbSet(ref(rtdb, `chats/${compositeId}/members/${myId}`), true);
    await rtdbSet(ref(rtdb, `chats/${compositeId}/memberNames/${myId}`), cleanMyName);
    
    return compositeId;
}

/**
 * Creates a new group chat.
 */
async function createGroupChat(creatorId, creatorName, members, groupName) {
    const newChatRef = push(ref(rtdb, "chats"));
    const chatId = newChatRef.key;
    const now = Date.now();
    const rawName = (groupName && groupName.trim()) || "New Group";
    const cleanGroupName = moderateMessageText(rawName);
    
    const allMembers = [{ accountId: creatorId, name: moderateMessageText(creatorName) }, ...members.map(m => ({
        ...m,
        name: moderateMessageText(m.name)
    }))];

    const membersMap = {};
    const memberNamesMap = {};
    allMembers.forEach((m) => {
        membersMap[m.accountId] = true;
        memberNamesMap[m.accountId] = m.name;
    });

    await rtdbSet(newChatRef, {
        type: "group",
        name: cleanGroupName,
        createdBy: creatorId,
        members: membersMap,
        memberNames: memberNamesMap,
        createdAt: now,
        updatedAt: now,
        lastMessage: null
    });

    const updates = {};
    allMembers.forEach((m) => {
        updates[`userChats/${m.accountId}/${chatId}`] = {
            type: "group",
            name: cleanGroupName,
            memberCount: allMembers.length,
            updatedAt: now,
            lastMessage: null
        };
    });
    await rtdbUpdate(ref(rtdb), updates);
    return chatId;
}

/**
 * Removes a target user from a group chat.
 */
async function kickGroupMember(chatId, targetAccountId) {
    const updates = {};
    updates[`chats/${chatId}/members/${targetAccountId}`] = null;
    updates[`chats/${chatId}/memberNames/${targetAccountId}`] = null;
    updates[`userChats/${targetAccountId}/${chatId}`] = null;
    return rtdbUpdate(ref(rtdb), updates);
}

/**
 * Sends a message into a chat with rephrasing and profanity filtering.
 */
async function sendChatMessage(chatId, senderId, senderName, text) {
    if (!chatId || !text || !text.trim()) return;
    
    const cleanText = moderateMessageText(text.trim());
    const cleanSenderName = moderateMessageText(senderName);
    
    const now = Date.now();
    const newMsgRef = push(ref(rtdb, `chats/${chatId}/messages`));
    
    await rtdbSet(newMsgRef, { senderId, senderName: cleanSenderName, text: cleanText, timestamp: now });
    
    const membersSnap = await rtdbGet(ref(rtdb, `chats/${chatId}/members`));
    const memberIds = membersSnap.exists() ? Object.keys(membersSnap.val()) : [senderId];
    
    const preview = cleanText.length > 60 ? cleanText.slice(0, 57) + "..." : cleanText;
    const lastMessage = { text: preview, senderId, senderName: cleanSenderName, timestamp: now };
    
    const updates = {
        [`chats/${chatId}/lastMessage`]: lastMessage,
        [`chats/${chatId}/updatedAt`]: now
    };
    
    memberIds.forEach((uid) => {
        updates[`userChats/${uid}/${chatId}/lastMessage`] = lastMessage;
        updates[`userChats/${uid}/${chatId}/updatedAt`] = now;
    });
    
    await rtdbUpdate(ref(rtdb), updates);
}

/**
 * Adds one or more members to an existing group chat. This is the ONLY
 * place that should write a group member's userChats entry, because it's
 * what previously went wrong: code that added members after group
 * creation was writing `userChats/{accountId}/{chatId} = true` (a bare
 * boolean) instead of the full { type, name, memberCount, ... } object
 * that createGroupChat() writes for members present at creation time.
 * That's why only the creator (and anyone pre-selected when the group
 * was made) ever showed a correct name in the chat list — everyone added
 * afterward got a boolean with nothing to render. This function always
 * writes the full object, for every member being added, every time.
 */
async function addMembersToGroup(chatId, members) {
    if (!chatId || !members || members.length === 0) return;
    const chatSnap = await rtdbGet(ref(rtdb, `chats/${chatId}`));
    if (!chatSnap.exists()) return;
    const chatData = chatSnap.val();
    const cleanGroupName = moderateMessageText(chatData.name || "Group");
    const existingMemberIds = chatData.members ? Object.keys(chatData.members) : [];
    const incomingIds = members.map((m) => m.accountId);
    const newTotalCount = new Set([...existingMemberIds, ...incomingIds]).size;
    const now = Date.now();

    const updates = {};
    members.forEach((m) => {
        const cleanMemberName = moderateMessageText(m.name);
        updates[`chats/${chatId}/members/${m.accountId}`] = true;
        updates[`chats/${chatId}/memberNames/${m.accountId}`] = cleanMemberName;
        updates[`userChats/${m.accountId}/${chatId}`] = {
            type: "group",
            name: cleanGroupName,
            memberCount: newTotalCount,
            updatedAt: now,
            lastMessage: chatData.lastMessage || null
        };
    });
    // Existing members' cached memberCount is now stale — refresh it too.
    existingMemberIds.forEach((uid) => {
        if (!incomingIds.includes(uid)) {
            updates[`userChats/${uid}/${chatId}/memberCount`] = newTotalCount;
        }
    });
    updates[`chats/${chatId}/updatedAt`] = now;
    await rtdbUpdate(ref(rtdb), updates);
}

/**
 * Repairs a single malformed userChats entry by re-deriving it from the
 * canonical chats/{chatId} node. Fired automatically (fire-and-forget) by
 * listenToUserChats() whenever it encounters an entry that isn't a proper
 * object — i.e. accounts that got hit by the `= true` bug before this fix
 * shipped. Self-heals on next load; no manual migration needed.
 */
async function repairUserChatEntry(accountId, chatId) {
    try {
        const chatSnap = await rtdbGet(ref(rtdb, `chats/${chatId}`));
        if (!chatSnap.exists()) {
            // The chat itself is gone — the dangling reference can't be fixed, just remove it.
            await rtdbRemove(ref(rtdb, `userChats/${accountId}/${chatId}`));
            return;
        }
        const chatData = chatSnap.val();
        const memberIds = chatData.members ? Object.keys(chatData.members) : [];
        let repaired;
        if (chatData.type === "group") {
            repaired = {
                type: "group",
                name: moderateMessageText(chatData.name || "Group"),
                memberCount: memberIds.length,
                updatedAt: chatData.updatedAt || Date.now(),
                lastMessage: chatData.lastMessage || null
            };
        } else {
            const peerId = memberIds.find((id) => id !== accountId) || null;
            const peerName = peerId && chatData.memberNames ? chatData.memberNames[peerId] : null;
            repaired = {
                type: "dm",
                peerId,
                updatedAt: chatData.updatedAt || Date.now(),
                lastMessage: chatData.lastMessage || null
            };
            if (peerName) repaired.name = moderateMessageText(peerName);
        }
        await rtdbUpdate(ref(rtdb, `userChats/${accountId}/${chatId}`), repaired);
    } catch (err) {
        console.error(`Failed to repair userChats entry for ${chatId}:`, err);
    }
}

/**
 * Subscribes to user's chat list.
 */
function listenToUserChats(accountId, callback) {
    const userChatsRef = ref(rtdb, `userChats/${accountId}`);
    const handler = (snapshot) => {
        const chats = [];
        const malformedChatIds = [];
        snapshot.forEach((childSnap) => {
            const chatId = childSnap.key;
            let data = childSnap.val();
            // Anything that isn't a proper object with a `type` is the
            // `= true` bug (or otherwise corrupted) — queue a repair and
            // render a safe placeholder for this pass in the meantime.
            if (data === true || data === null || typeof data !== "object" || !data.type) {
                malformedChatIds.push(chatId);
                data = typeof data === "object" && data !== null ? data : {};
            }
            if (data.name) {
                data.name = moderateMessageText(data.name);
            }
            chats.push({ chatId, ...data });
        });
        chats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        callback(chats);
        // Fire-and-forget: fixes itself for next time without blocking this render.
        malformedChatIds.forEach((chatId) => repairUserChatEntry(accountId, chatId));
    };
    onValue(userChatsRef, handler);
    return () => off(userChatsRef, "value", handler);
}

/**
 * Subscribes to single chat metadata.
 */
function listenToChatMeta(chatId, callback) {
    const chatRef = ref(rtdb, `chats/${chatId}`);
    const handler = (snapshot) => {
        if (!snapshot.exists()) return callback(null);
        const data = snapshot.val();
        if (data.name) {
            data.name = moderateMessageText(data.name);
        }
        callback({ chatId, ...data });
    };
    onValue(chatRef, handler);
    return () => off(chatRef, "value", handler);
}

/**
 * Subscribes to chat messages.
 */
function listenToMessages(chatId, callback) {
    const messagesRef = ref(rtdb, `chats/${chatId}/messages`);
    const handler = (snapshot) => {
        const messages = [];
        snapshot.forEach((childSnap) => {
            const data = childSnap.val();
            if (data) {
                if (data.text) data.text = moderateMessageText(data.text);
                if (data.senderName) data.senderName = moderateMessageText(data.senderName);
            }
            messages.push({ id: childSnap.key, ...data });
        });
        callback(messages);
    };
    onValue(messagesRef, handler);
    return () => off(messagesRef, "value", handler);
}

/**
 * Toggles a user's block record state.
 */
async function toggleBlockUserInDb(currentAccountId, targetId, isBlocked) {
    const updatePath = {};
    updatePath[`users/${currentAccountId}/blockedUsers/${targetId}`] = isBlocked ? true : null;
    return rtdbUpdate(ref(rtdb), updatePath);
}

/**
 * Subscribes live to user's block list.
 */
function listenToBlockedUsers(currentAccountId, callback) {
    const blockRef = ref(rtdb, `users/${currentAccountId}/blockedUsers`);
    const handler = (snapshot) => {
        const data = snapshot.val();
        callback(data ? Object.keys(data) : []);
    };
    onValue(blockRef, handler);
    return () => off(blockRef, "value", handler);
}

// ============================================================
// VOICE CALL PRESENCE (LiveKit calls are tracked here so every
// member — not just whoever started the call — can see a call is
// active and join it, from any chat, without needing to already
// have that thread open.)
// ============================================================

/**
 * Sends a system message into a chat — used for call start/end
 * announcements. Rendered differently from normal messages (centered,
 * no bubble, no sender name) via the `system: true` flag on the record.
 */
async function sendSystemMessage(chatId, text) {
    if (!chatId || !text) return;
    const now = Date.now();
    const newMsgRef = push(ref(rtdb, `chats/${chatId}/messages`));
    await rtdbSet(newMsgRef, {
        senderId: "system",
        senderName: "System",
        text,
        timestamp: now,
        system: true
    });

    const membersSnap = await rtdbGet(ref(rtdb, `chats/${chatId}/members`));
    const memberIds = membersSnap.exists() ? Object.keys(membersSnap.val()) : [];
    const preview = text.length > 60 ? text.slice(0, 57) + "..." : text;
    const lastMessage = { text: preview, senderId: "system", senderName: "System", timestamp: now, system: true };
    const updates = {
        [`chats/${chatId}/lastMessage`]: lastMessage,
        [`chats/${chatId}/updatedAt`]: now
    };
    memberIds.forEach((uid) => {
        updates[`userChats/${uid}/${chatId}/lastMessage`] = lastMessage;
        updates[`userChats/${uid}/${chatId}/updatedAt`] = now;
    });
    await rtdbUpdate(ref(rtdb), updates);
}

/**
 * Formats a millisecond duration as e.g. "4m 12s" or "1h 3m 0s".
 */
function formatCallDuration(ms) {
    const totalSeconds = Math.max(1, Math.round(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (hours > 0 || minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(" ");
}

/**
 * Recomputes who's currently present in a chat's voice call and copies a
 * small summary of it into every member's userChats/{memberId}/{chatId}
 * node, mirroring the same fan-out pattern sendChatMessage() already uses
 * for lastMessage. This lets the sidebar show a "call active" badge on
 * every conversation using the listener it already has (listenToUserChats),
 * instead of needing a dedicated listener per chat.
 */
async function fanOutActiveCallSummary(chatId) {
    const [activeCallSnap, membersSnap] = await Promise.all([
        rtdbGet(ref(rtdb, `chats/${chatId}/activeCall`)),
        rtdbGet(ref(rtdb, `chats/${chatId}/members`))
    ]);
    const activeCallData = activeCallSnap.exists() ? activeCallSnap.val() : {};
    const participantNames = Object.values(activeCallData)
        .map((p) => p && p.name)
        .filter(Boolean);
    const summary = participantNames.length > 0
        ? { count: participantNames.length, names: participantNames.slice(0, 3) }
        : null;

    const memberIds = membersSnap.exists() ? Object.keys(membersSnap.val()) : [];
    if (memberIds.length === 0) return;

    const updates = {};
    memberIds.forEach((uid) => {
        updates[`userChats/${uid}/${chatId}/activeCall`] = summary;
    });
    await rtdbUpdate(ref(rtdb), updates);
}

/**
 * Marks the current user as present in a chat's voice call. Anyone in the
 * chat can call this — there's no "host" requirement, so any member can
 * start a call and others just join the same LiveKit room once they see
 * it's active. Also registers an onDisconnect cleanup so a crashed tab or
 * dropped connection doesn't leave a stale "still in call" entry behind.
 *
 * If nobody else is currently in the call, this join is the one that
 * starts it: records a start timestamp and posts a "X started a call."
 * system message.
 */
async function announceCallJoined(chatId, accountId, name) {
    const presenceRef = ref(rtdb, `chats/${chatId}/activeCall/${accountId}`);
    const cleanName = moderateMessageText(name);

    const beforeSnap = await rtdbGet(ref(rtdb, `chats/${chatId}/activeCall`));
    const wasEmpty = !beforeSnap.exists() || Object.keys(beforeSnap.val() || {}).length === 0;

    await rtdbSet(presenceRef, { name: cleanName, joinedAt: serverTimestamp() });
    onDisconnect(presenceRef).remove();

    if (wasEmpty) {
        // Always overwritten fresh here, so even if a previous call's end
        // was never cleanly recorded (e.g. everyone's tab crashed at once),
        // the next call's duration still starts counting from zero.
        await rtdbSet(ref(rtdb, `chats/${chatId}/activeCallStartedAt`), Date.now());
        await sendSystemMessage(chatId, `${cleanName} started a call.`);
    }

    await fanOutActiveCallSummary(chatId);
}

/**
 * Marks the current user as no longer present in a chat's voice call
 * (graceful leave — the onDisconnect handler above covers ungraceful ones,
 * though see the note below) and refreshes the summary everyone else sees.
 *
 * If this leave brings the call down to zero people, it's the one that
 * ends it: posts a "Call ended — lasted Xm Ys." system message using the
 * start timestamp recorded by announceCallJoined().
 *
 * Known limitation: if the LAST remaining participant's tab crashes
 * (rather than clicking Leave), Firebase's onDisconnect cleans up their
 * presence row server-side, but no client is left running to notice the
 * call just ended — so that particular call won't get an "ended" message.
 * The next call still starts cleanly since its start time is always
 * freshly overwritten above; only the end-of-call summary message for
 * that one crashed session is missed.
 */
async function announceCallLeft(chatId, accountId) {
    const presenceRef = ref(rtdb, `chats/${chatId}/activeCall/${accountId}`);
    await rtdbRemove(presenceRef);
    try {
        // Best-effort cancel of the onDisconnect we registered on join —
        // harmless if it's already fired or wasn't registered this session.
        await onDisconnect(presenceRef).cancel();
    } catch (e) {
        // no-op
    }

    const afterSnap = await rtdbGet(ref(rtdb, `chats/${chatId}/activeCall`));
    const isNowEmpty = !afterSnap.exists() || Object.keys(afterSnap.val() || {}).length === 0;

    if (isNowEmpty) {
        const startedAtSnap = await rtdbGet(ref(rtdb, `chats/${chatId}/activeCallStartedAt`));
        const startedAt = startedAtSnap.exists() ? startedAtSnap.val() : null;
        await rtdbRemove(ref(rtdb, `chats/${chatId}/activeCallStartedAt`));
        // Only ever post the version with a duration. If startedAt is
        // somehow missing (shouldn't happen now that the double-fire race
        // is fixed, but just in case), skip the message entirely rather
        // than posting a bare "Call ended." with no useful info.
        if (startedAt) {
            const durationText = formatCallDuration(Date.now() - startedAt);
            await sendSystemMessage(chatId, `Call ended — lasted ${durationText}.`);
        }
    }

    await fanOutActiveCallSummary(chatId);
}

export { 
    auth, db, rtdb, googleProvider, githubProvider, 
    signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged,
    doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc,
    getAccountIdFromUid, handleUserAuth, getAllRecipesList, saveRecipeWithModeration, generateUniqueAccountId,
    getAllUsersList, getUserByAccountId, makeDmChatId,
    createOrGetDmChat, createGroupChat, kickGroupMember, sendChatMessage, addMembersToGroup,
    listenToUserChats, listenToChatMeta, listenToMessages,
    toggleBlockUserInDb, listenToBlockedUsers, rtdbRemove, moderateMessageText, hasForbiddenContent,
    announceCallJoined, announceCallLeft, sendSystemMessage
};

onAuthStateChanged(auth, async (user) => {
    console.log("Firebase Auth State:", user);
    if (user) {
        const accountId = await getAccountIdFromUid(user.uid);
        console.log("Mapped Account ID:", accountId);
    } else {
        console.log("No Firebase user.");
    }
});