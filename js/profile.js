import { isAuthorized } from "/js/security.js";
// profile.js - Injected Profile Icon & Dropdown Controller (Live Listener)

import { auth, db, getAccountIdFromUid, onAuthStateChanged } from "./firebase.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Hardcoded Admin Registry
const adminAccounts = [
    "1"
];

let unsubProfile = null;

document.addEventListener("DOMContentLoaded", () => {
    injectGlobalStyles();
    initProfileSystem();
});

function injectGlobalStyles() {
    const style = document.createElement("style");

    style.textContent = `
        /* ================================
           PROFILE CONTAINER
        ================================= */

        .samson-profile-container {
            position: fixed !important;
            top: 15px !important;
            right: 20px !important;
            z-index: 9999 !important;
            font-family: sans-serif !important;
        }


        /* ================================
           AVATAR
        ================================= */

        .samson-avatar {
            width: 45px !important;
            height: 45px !important;
            border-radius: 50% !important;
            cursor: pointer !important;
            box-shadow: 0 2px 10px rgba(0,0,0,0.15) !important;
            border: 2px solid #fff !important;
            user-select: none !important;
            object-fit: cover !important;
            display: block !important;
            transition:
                transform .2s ease,
                box-shadow .2s ease !important;
        }

        .samson-avatar:hover {
            transform: scale(1.05) !important;
        }

        .samson-avatar:active {
            transform: scale(0.9) !important;
            box-shadow: 0 1px 5px rgba(0,0,0,0.25) !important;
        }

        .samson-avatar.clicked {
            animation: avatarClick .3s ease !important;
        }


        /* ================================
           AVATAR ANIMATION
        ================================= */

        @keyframes avatarClick {
            0% {
                transform: scale(1) !important;
            }

            50% {
                transform: scale(0.85) rotate(-5deg) !important;
            }

            100% {
                transform: scale(1) !important;
            }
        }


        /* ================================
           DROPDOWN
        ================================= */

        .samson-dropdown {
            position: absolute !important;
            top: 55px !important;
            right: 0 !important;
            background: #fff !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
            width: 200px !important;
            display: none !important;
            overflow: hidden !important;
            border: 1px solid #eee !important;
        }

        .samson-dropdown.active {
            display: block !important;
        }


        /* ================================
           NORMAL DROPDOWN LINKS
        ================================= */

        .samson-dropdown a.original {
            display: block !important;
            padding: 12px 16px !important;
            color: #333 !important;
            text-decoration: none !important;
            font-size: 14px !important;
            font-weight: normal !important;
            border: none !important;
            background: transparent !important;
            transition:
                background .2s ease,
                color .2s ease !important;
        }

        .samson-dropdown a.original:hover {
            background: #f8f9fa !important;
            color: #e67e22 !important;
        }


        /* ================================
           SPECIAL DROPDOWN ELEMENTS
        ================================= */

        .samson-dropdown a.special {
            display: block !important;
            padding: 12px 16px !important;
            text-decoration: none !important;
            font-size: 14px !important;
            font-weight: bold !important;
            border-bottom: 1px solid #eee !important;
            background: transparent !important;
            transition:
                background .2s ease,
                color .2s ease !important;
        }


        /* ================================
           ADMIN DASHBOARD
        ================================= */

        .samson-dropdown a.admin-link {
            color: #dba40b !important;
            font-weight: bold !important;
            border-bottom: 1px solid #eee !important;
        }

        .samson-dropdown a.admin-link:hover {
            color: #735404 !important;
            background: #fff8dc !important;
        }


        /* ================================
           SIGN IN BUTTON
        ================================= */

        .samson-auth-btn {
            display: inline-block !important;
            background: #e67e22 !important;
            color: white !important;
            padding: 10px 18px !important;
            border-radius: 20px !important;
            text-decoration: none !important;
            font-weight: bold !important;
            font-size: 14px !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1) !important;
            transition:
                transform .2s ease,
                background .2s ease !important;
        }

        .samson-auth-btn:hover {
            background: #d35400 !important;
            transform: scale(1.03) !important;
        }

        .samson-auth-btn:active {
            transform: scale(0.97) !important;
        }
    `;

    document.head.appendChild(style);
}


/* ================================
   INITIALIZE PROFILE SYSTEM
================================ */

function initProfileSystem() {
    const container = document.createElement("div");

    container.className = "samson-profile-container";

    document.body.appendChild(container);

    onAuthStateChanged(auth, async (user) => {

        // Clear active real-time listeners on auth change
        if (unsubProfile) {
            unsubProfile();
            unsubProfile = null;
        }

        container.innerHTML = "";

        if (user) {
            try {
                const accountId = await getAccountIdFromUid(user.uid);

                if (accountId) {
                    const userRef = doc(db, "users", accountId);

                    // Real-time listener for profile changes
                    unsubProfile = onSnapshot(
                        userRef,
                        (userSnap) => {

                            if (userSnap.exists()) {
                                const userData = userSnap.data();

                                renderProfileIcon(
                                    container,
                                    userData,
                                    accountId
                                );

                            } else {
                                renderLoginButton(container);
                            }
                        },
                        (error) => {
                            console.error(
                                "Error with real-time profile listener:",
                                error
                            );
                        }
                    );

                    return;
                }

            } catch (error) {
                console.error(
                    "Error initializing live profile component:",
                    error
                );
            }
        }

        renderLoginButton(container);
    });
}


/* ================================
   GET INITIAL
================================ */

function getInitials(name) {
    if (!name) return "SR";

    return name
        .trim()
        .split(/\s+/)
        .map(word => word[0])
        .join("")
        .substring(0, 1)
        .toUpperCase();
}


/* ================================
   GENERATE CONSISTENT COLOR
================================ */

function stringToColor(str) {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;

    return `hsl(${hue}, 65%, 45%)`;
}


/* ================================
   CREATE AVATAR
================================ */

function createAvatarImage(name) {
    return new Promise((resolve) => {

        const initials = getInitials(name);
        const color = stringToColor(name);

        const canvas = document.createElement("canvas");

        canvas.width = 200;
        canvas.height = 200;

        const ctx = canvas.getContext("2d");

        ctx.beginPath();

        ctx.arc(
            100,
            100,
            100,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = color;
        ctx.fill();

        ctx.fillStyle = "white";

        ctx.font = "900 120px system-ui, sans-serif";

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            initials,
            100,
            108
        );

        resolve(
            canvas.toDataURL("image/png")
        );
    });
}


/* ================================
   RENDER PROFILE
================================ */

async function renderProfileIcon(
    container,
    userData,
    accountId
) {

    const name =
        userData.name ||
        "Anonymous Chef";

    const avatarImage =
        await createAvatarImage(name);


    /* ================================
       ADMIN CHECK
    ================================= */

    const isAdmin =
        adminAccounts.includes(accountId) ||
        (
            typeof isAuthorized === "function" &&
            isAuthorized(accountId)
        );


    /* ================================
       ADMIN LINK
    ================================= */

    const adminLinkHtml = isAdmin
        ? `
            <a
                class="special admin-link"
                href="/admin.html"
            >
                Admin Dashboard
            </a>
        `
        : "";


    /* ================================
       PRESERVE DROPDOWN STATE
    ================================= */

    const isDropdownActive =
        container
            .querySelector("#samsonDropdownMenu")
            ?.classList
            .contains("active");


    /* ================================
       BUILD HTML
    ================================= */

    container.innerHTML = `
        <img
            class="samson-avatar"
            id="samsonAvatarBtn"
            src="${avatarImage}"
            alt="${name}'s avatar"
        >

        <div
            class="samson-dropdown ${isDropdownActive ? "active" : ""}"
            id="samsonDropdownMenu"
        >

            ${adminLinkHtml}

            <a
                class="original"
                href="/profile.html?${accountId}"
            >
                View Profile
            </a>

            <a
                class="original"
                href="/studio.html"
            >
                Studio
            </a>

            <a
                class="original"
                href="/profiles.html"
            >
                Profiles
            </a>

            <a
                class="original"
                href="/chat.html"
            >
                Chat
            </a>

            <a
                class="original"
                href="/account-settings.html"
            >
                Settings
            </a>

            <a
                class="original"
                href="/logout.html"
            >
                Logout
            </a>

        </div>
    `;


    /* ================================
       GET ELEMENTS
    ================================= */

    const avatarBtn =
        container.querySelector("#samsonAvatarBtn");

    const dropdownMenu =
        container.querySelector("#samsonDropdownMenu");


    /* ================================
       AVATAR CLICK
    ================================= */

    avatarBtn.addEventListener("click", (e) => {

        e.stopPropagation();

        dropdownMenu.classList.toggle("active");

    });


    /* ================================
       CLOSE DROPDOWN
    ================================= */

    document.addEventListener("click", () => {

        dropdownMenu.classList.remove("active");

    });
}


/* ================================
   LOGIN BUTTON
================================ */

function renderLoginButton(container) {

    container.innerHTML = `
        <a
            href="/account-settings.html"
            class="samson-auth-btn"
        >
            Sign In
        </a>
    `;
}