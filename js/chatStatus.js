import { isAuthorized } from "/js/security.js";
import {
    auth,
    db,
    getAccountIdFromUid,
    onAuthStateChanged
} from "/js/firebase.js";

import { doc, onSnapshot, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const homeUrl = "/";
let isCurrentlyShowingDisabledUI = false;
let countdownInterval = null;

// Progressive temporal unit breakdown scale prioritizing natural phrasing
function formatRemainingTime(remainingMs) {
    if (remainingMs <= 0) return "0 seconds";
    
    let seconds = Math.floor(remainingMs / 1000);
    let minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    
    let hours = Math.floor(minutes / 60);
    minutes = minutes % 60;
    
    let days = Math.floor(hours / 24);
    hours = hours % 24;
    
    let months = Math.floor(days / 30);
    days = days % 30;
    
    let years = Math.floor(months / 12);
    months = months % 12;
    
    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
    
    // Slice to only keep the top 3 largest active metrics
    return parts.slice(0, 3).join(", ");
}

function disableChat(remainingText = "This chat is currently unavailable.") {
    isCurrentlyShowingDisabledUI = true;
    
    if (countdownInterval) clearInterval(countdownInterval);

    document.documentElement.innerHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chat Disabled</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            html,body { width:100%; height:100%; overflow:hidden; font-family: Inter, sans-serif; }
            body { display:flex; justify-content:center; align-items:center; color:white; background: radial-gradient(circle at top, #17132d, #0b0920 50%, #050510); }
            .card { position:relative; z-index:2; width:min(600px,92vw); padding:52px; text-align:center; border-radius:26px; background: rgba(12,10,30,.88); border: 1px solid rgba(239,68,68,.2); backdrop-filter: blur(22px); box-shadow: 0 30px 80px rgba(0,0,0,.65); }
            .status { display:inline-flex; align-items:center; gap:10px; padding:9px 18px; margin-bottom:28px; border-radius:999px; color:#fca5a5; background: rgba(239,68,68,.12); border: 1px solid rgba(239,68,68,.35); font-weight:700; }
            .dot { width:10px; height:10px; border-radius:50%; background:#ef4444; box-shadow: 0 0 14px #ef4444; }
            h1 { font-size: clamp(34px,5vw,48px); margin-bottom:18px; }
            p { color:#a5a1b8; font-size:17px; line-height:1.7; }
            .timer-info { margin-top: 15px; font-weight: bold; color: #fca5a5; font-size: 15px; }
            button { width:100%; height:54px; margin-top:40px; border:none; border-radius:14px; background: linear-gradient(135deg, #dc2626, #991b1b); color:white; font-weight:700; font-size:16px; cursor:pointer; }
            button:hover { background: linear-gradient(135deg, #ef4444, #b91c1c); }
            .footer { margin-top:28px; color:#68647c; font-size:13px; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="status"><span class="dot"></span>Chat Disabled</div>
            <h1>Chat has been disabled</h1>
            <p>This chat is currently unavailable due to safety protections being enabled.</p>
            <div id="countdownDisplay" class="timer-info">${remainingText}</div>
            <button onclick="location.href='${homeUrl}'">Return Home</button>
            <div class="footer">Safety Protection System</div>
        </div>
    </body>
    </html>
    `;
}

// Function to clean up/remove block properties from the user's Firestore document
async function clearBlockData(accountId) {
    try {
        const userDocRef = doc(db, "users", accountId);
        await updateDoc(userDocRef, {
            isChatDisabled: deleteField(),
            blockedAt: deleteField(),
            blockDuration: deleteField()
        });
        console.log(`Successfully cleaned up expired block parameters for user: ${accountId}`);
    } catch (error) {
        console.error("Failed to execute database block cleanup:", error);
    }
}

function startBlockCountdown(accountId, blockedAt, durationMinutes) {
    const targetTime = blockedAt + (durationMinutes * 60 * 1000);

    const updateTimer = async () => {
        const remainingMs = targetTime - Date.now();

        if (remainingMs <= 0) {
            clearInterval(countdownInterval);
            await clearBlockData(accountId);
            window.location.reload();
            return;
        }

        const timerDisplay = document.getElementById("countdownDisplay");
        if (timerDisplay) {
            timerDisplay.textContent = `Time Remaining: ${formatRemainingTime(remainingMs)}`;
        }
    };

    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        console.log("No user signed in");
        return;
    }

    try {
        const accountId = await getAccountIdFromUid(user.uid);
        console.log("Setting up live chat status listener for:", accountId);

        if (!accountId) return;

        const userDocRef = doc(db, "users", accountId);

        onSnapshot(userDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                let isBlocked = userData.isChatDisabled === true;

                if (isBlocked && userData.blockedAt && userData.blockDuration) {
                    const elapsedMs = Date.now() - userData.blockedAt;
                    const durationMs = userData.blockDuration * 60 * 1000;
                    if (elapsedMs >= durationMs) {
                        isBlocked = false;
                        await clearBlockData(accountId);
                    }
                }

                if (isBlocked) {
                    if (!isCurrentlyShowingDisabledUI) {
                        disableChat();
                    }

                    if (userData.blockedAt && userData.blockDuration) {
                        startBlockCountdown(accountId, userData.blockedAt, userData.blockDuration);
                    } else {
                        const timerDisplay = document.getElementById("countdownDisplay");
                        if (timerDisplay) {
                            timerDisplay.textContent = "Permanent Indefinite Block";
                        }
                    }
                } else {
                    if (isCurrentlyShowingDisabledUI) {
                        if (countdownInterval) clearInterval(countdownInterval);
                        window.location.reload();
                    }
                }
            }
        }, (error) => {
            console.error("Error reading live chat status:", error);
        });

    } catch (error) {
        console.error("Error initializing system chat clearance:", error);
    }
});