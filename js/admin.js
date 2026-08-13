// admin.js - Privileged Access Control Logic Engine
import { isAuthorized } from "/js/security.js";
import { db, auth, getAccountIdFromUid, onAuthStateChanged, deleteDoc, doc } from "./firebase.js";
import { collection, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Hardcoded Administrator Registry Accounts Check List
const adminAccounts = [
    "1"
];

// Global arrays to store data snapshots for live searching
let allUsersCached = [];
let allRecipesCached = [];

// Inject Dynamic Custom UI Overlay Structures for Prompting / Interactions
const uiStyles = document.createElement("style");
uiStyles.textContent = `
    .custom-modal-backdrop {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(5, 7, 10, 0.85); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center; z-index: 99999;
    }
    .custom-modal-card {
        background: #141b23; border: 1px solid #2d3b4c; border-radius: 12px;
        padding: 24px; width: min(450px, 90vw); box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        color: #f5f7fa; font-family: system-ui, sans-serif;
    }
    .custom-modal-title { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #ffffff; }
    .custom-modal-body { font-size: 14px; color: #d7dee7; margin-bottom: 20px; line-height: 1.5; }
    .custom-modal-input {
        width: 100%; padding: 10px 12px; background: #0d131a; color: #f5f7fa;
        border: 1px solid #2d3b4c; border-radius: 6px; font-size: 14px; margin-bottom: 20px;
    }
    .custom-modal-input:focus { border-color: #3b82f6; outline: none; }
    .custom-modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .custom-modal-btn {
        padding: 8px 16px; border: none; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer;
    }
    .custom-modal-btn-primary { background: #2563eb; color: white; }
    .custom-modal-btn-primary:hover { background: #3b82f6; }
    .custom-modal-btn-secondary { background: #374151; color: #d7dee7; }
    .custom-modal-btn-secondary:hover { background: #4b5563; }
    .custom-modal-btn-danger { background: #dc2626; color: white; }
    .custom-modal-btn-danger:hover { background: #ef4444; }
`;
document.head.appendChild(uiStyles);

// Utility to progressively scale minutes to hours, days, months, and years using full unit names
function formatMinutes(totalMinutes) {
    if (!totalMinutes || isNaN(totalMinutes) || totalMinutes <= 0) return "0 minutes";
    
    let minutes = totalMinutes;
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
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    
    // Slice to only keep the top 3 largest active metrics
    return parts.slice(0, 3).join(", ");
}

function showCustomAlert(title, message, callback) {
    const backdrop = document.createElement("div");
    backdrop.className = "custom-modal-backdrop";
    backdrop.innerHTML = `
        <div class="custom-modal-card">
            <div class="custom-modal-title">${title}</div>
            <div class="custom-modal-body">${message}</div>
            <div class="custom-modal-actions">
                <button class="custom-modal-btn custom-modal-btn-primary" id="customAlertBtn">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(backdrop);
    document.getElementById("customAlertBtn").focus();
    document.getElementById("customAlertBtn").addEventListener("click", () => {
        backdrop.remove();
        if (callback) callback();
    });
}

function showCustomConfirm(title, message, isDanger, onConfirm) {
    const backdrop = document.createElement("div");
    backdrop.className = "custom-modal-backdrop";
    backdrop.innerHTML = `
        <div class="custom-modal-card">
            <div class="custom-modal-title">${title}</div>
            <div class="custom-modal-body">${message}</div>
            <div class="custom-modal-actions">
                <button class="custom-modal-btn custom-modal-btn-secondary" id="customConfirmCancel">Cancel</button>
                <button class="custom-modal-btn ${isDanger ? 'custom-modal-btn-danger' : 'custom-modal-btn-primary'}" id="customConfirmOk">Confirm</button>
            </div>
        </div>
    `;
    document.body.appendChild(backdrop);
    document.getElementById("customConfirmCancel").addEventListener("click", () => backdrop.remove());
    document.getElementById("customConfirmOk").addEventListener("click", () => {
        backdrop.remove();
        onConfirm();
    });
}

function showCustomPrompt(title, message, defaultValue, onSubmit) {
    const backdrop = document.createElement("div");
    backdrop.className = "custom-modal-backdrop";
    backdrop.innerHTML = `
        <div class="custom-modal-card">
            <div class="custom-modal-title">${title}</div>
            <div class="custom-modal-body">${message}</div>
            <input type="text" id="customPromptInput" class="custom-modal-input" value="${defaultValue || ''}">
            <div class="custom-modal-actions">
                <button class="custom-modal-btn custom-modal-btn-secondary" id="customPromptCancel">Cancel</button>
                <button class="custom-modal-btn custom-modal-btn-primary" id="customPromptSubmit">Submit</button>
            </div>
        </div>
    `;
    document.body.appendChild(backdrop);
    const input = document.getElementById("customPromptInput");
    input.focus();
    input.select();
    
    document.getElementById("customPromptCancel").addEventListener("click", () => backdrop.remove());
    document.getElementById("customPromptSubmit").addEventListener("click", () => {
        const val = input.value;
        backdrop.remove();
        onSubmit(val);
    });
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const accountId = await getAccountIdFromUid(user.uid);
        if (accountId && adminAccounts.includes(accountId)) {
            document.getElementById("adminShield").style.display = "none";
            document.getElementById("adminInterface").style.display = "block";
            initializeDashboardData();
            setupSearchListeners();
            return;
        }
    }
    document.getElementById("adminShield").innerHTML = "RESTRICTED ACCESS: Your structural criteria parameters mismatch Samson clearance flags.";
});

async function initializeDashboardData() {
    document.getElementById("stAdmins").textContent = adminAccounts.length.toString();

    const usersSnap = await getDocs(collection(db, "users"));
    const recipesSnap = await getDocs(collection(db, "recipes"));

    document.getElementById("stUsers").textContent = usersSnap.size.toString();
    document.getElementById("stRecipes").textContent = recipesSnap.size.toString();

    allUsersCached = [];
    usersSnap.forEach(docSnap => {
        allUsersCached.push({ id: docSnap.id, ...docSnap.data() });
    });

    allRecipesCached = [];
    recipesSnap.forEach(docSnap => {
        allRecipesCached.push({ id: docSnap.id, ...docSnap.data() });
    });

    renderUsersTable(allUsersCached);
    renderRecipesTable(allRecipesCached);
}

function setupSearchListeners() {
    document.getElementById("userSearchInput").addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filteredUsers = allUsersCached.filter(user => {
            const name = (user.name || "").toLowerCase();
            const accId = (user.accountId || "").toLowerCase();
            return name.includes(query) || accId.includes(query);
        });
        renderUsersTable(filteredUsers);
    });

    document.getElementById("recipeSearchInput").addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filteredRecipes = allRecipesCached.filter(rec => {
            const rId = (rec.id || "").toLowerCase();
            const ownerId = (rec.ownerId || "").toLowerCase();
            const innerData = rec.recipeData?.recipe || rec.recipeData || {};
            const title = (innerData.title || "").toLowerCase();
            return rId.includes(query) || ownerId.includes(query) || title.includes(query);
        });
        renderRecipesTable(filteredRecipes);
    });
}

function renderUsersTable(usersArray) {
    const tbody = document.getElementById("tblUsersBody");
    tbody.innerHTML = "";

    if (usersArray.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="no-results">No profiles match the search query.</td></tr>`;
        return;
    }

    usersArray.forEach(user => {
        const oldDocId = user.id; 
        
        let isBlocked = user.isChatDisabled === true;
        let statusText = "Active";
        let statusColor = "#10b981";

        if (isBlocked) {
            if (user.blockedAt && user.blockDuration) {
                const elapsedMs = Date.now() - user.blockedAt;
                const durationMs = user.blockDuration * 60 * 1000;
                if (elapsedMs >= durationMs) {
                    isBlocked = false;
                    statusText = "Active (Expired)";
                } else {
                    const remainingMin = Math.ceil((durationMs - elapsedMs) / (60 * 1000));
                    statusText = `Blocked (${formatMinutes(remainingMin)} left)`;
                    statusColor = "#dc2626";
                }
            } else {
                statusText = "Blocked (Indefinite)";
                statusColor = "#dc2626";
            }
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><a href="profile.html?${user.accountId}" style="color:#e67e22; font-weight:bold;">${user.accountId}</a></td>
            <td>${user.name || "N/A"}</td>
            <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Legacy"}</td>
            <td>
                <span style="color: ${statusColor}; font-weight: bold;">
                    ${statusText}
                </span>
            </td>
            <td>
                <button class="action-btn btn-change" data-docid="${oldDocId}" data-uid="${user.uidReference || ''}">Change User ID</button>
                <button class="action-btn btn-block" style="background: ${isBlocked ? '#10b981' : '#f59e0b'}; color: white; border: none;" data-docid="${oldDocId}">
                    ${isBlocked ? "Unblock Chat" : "Block Chat"}
                </button>
                <button class="action-btn btn-del" data-accid="${user.accountId}">Delete Profile</button>
            </td>
        `;

        tr.querySelector(".btn-change").addEventListener("click", (e) => {
            const oldId = e.target.getAttribute("data-docid");
            const uidRef = e.target.getAttribute("data-uid");
            
            showCustomPrompt("Modify User Identifier Key", `Enter a new Account ID for user (Current ID: ${oldId}):`, oldId, async (newAccountId) => {
                if (newAccountId && newAccountId.trim() !== "" && newAccountId.trim() !== oldId) {
                    const targetNewId = newAccountId.trim();
                    try {
                        const { id, ...cleanUserData } = user;
                        const updatedUserData = { ...cleanUserData, accountId: targetNewId };

                        await setDoc(doc(db, "users", targetNewId), updatedUserData);

                        if (uidRef) {
                            await setDoc(doc(db, "authMappings", uidRef), { accountId: targetNewId }, { merge: true });
                        }

                        await deleteDoc(doc(db, "users", oldId));

                        showCustomAlert("System Update Complete", `Successfully migrated document keys to [${targetNewId}] across database entities.`, () => {
                            window.location.reload();
                        });
                    } catch (error) {
                        console.error("Migration Error: ", error);
                        showCustomAlert("System Execution Fault", "Structural ID migration failed. Reference standard console records.");
                    }
                }
            });
        });

        tr.querySelector(".btn-block").addEventListener("click", (e) => {
            const docId = e.target.getAttribute("data-docid");
            const willBlock = !isBlocked;

            if (willBlock) {
                showCustomPrompt("System Lockout Control", `Enter block duration in MINUTES (leave blank or enter 0 for permanent indefinite block):`, "0", async (durationInput) => {
                    if (durationInput === null) return;
                    
                    const minutes = parseInt(durationInput, 10);
                    const isTimed = !isNaN(minutes) && minutes > 0;

                    try {
                        const { id, ...cleanUserData } = user;
                        const updatedUserData = {
                            ...cleanUserData,
                            isChatDisabled: true,
                            blockedAt: Date.now(),
                            blockDuration: isTimed ? minutes : null
                        };

                        await setDoc(doc(db, "users", docId), updatedUserData);
                        showCustomAlert("Access State Changed", `Chat permissions successfully revoked for [${docId}] (${isTimed ? formatMinutes(minutes) : 'Indefinite'}).`, () => {
                            window.location.reload();
                        });
                    } catch (error) {
                        console.error("Failed to update block status:", error);
                        showCustomAlert("System Execution Fault", "Failed to update chat parameters inside the operational index.");
                    }
                });
            } else {
                showCustomConfirm("System Clearance Control", `Are you sure you want to restore chat access metrics for ${user.name || docId}?`, false, async () => {
                    try {
                        const { id, ...cleanUserData } = user;
                        const updatedUserData = {
                            ...cleanUserData,
                            isChatDisabled: false,
                            blockedAt: null,
                            blockDuration: null
                        };

                        await setDoc(doc(db, "users", docId), updatedUserData);
                        showCustomAlert("Access State Restored", `Chat permissions successfully restored for [${docId}].`, () => {
                            window.location.reload();
                        });
                    } catch (error) {
                        console.error("Failed to alter chat status:", error);
                        showCustomAlert("System Execution Fault", "Failed to clear restricted tags within operational storage.");
                    }
                });
            }
        });

        tr.querySelector(".btn-del").addEventListener("click", (e) => {
            const targetId = e.target.getAttribute("data-accid");
            showCustomConfirm("Destructive Clearance Action", `Are you absolutely certain you want to purge profile document [${targetId}] and all its associated recipe mappings?`, true, async () => {
                try {
                    await deleteDoc(doc(db, "users", targetId));
                    showCustomAlert("Purge Operations Complete", `Profile [${targetId}] deleted from data stores successfully.`, () => {
                        window.location.reload();
                    });
                } catch(error) {
                    console.error("Purge operations failure:", error);
                    showCustomAlert("System Execution Fault", "Destructive clearance failed inside data persistence matrix.");
                }
            });
        });

        tbody.appendChild(tr);
    });
}

function renderRecipesTable(recipesArray) {
    const tbody = document.getElementById("tblRecipesBody");
    tbody.innerHTML = "";

    if (recipesArray.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="no-results">No recipes match the search query.</td></tr>`;
        return;
    }

    recipesArray.forEach(rec => {
        const rId = rec.id;
        const innerData = rec.recipeData?.recipe || rec.recipeData || {};

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${rId}</strong></td>
            <td>${innerData.title || "Untitled Document"}</td>
            <td><a href="profile.html?${rec.ownerId}" style="color:#2c3e50;">${rec.ownerId}</a></td>
            <td>
                <button class="action-btn" style="background:#3498db; color:white;" onclick="window.location.href='recipe-creator.html?edit=${rId}'">Edit</button>
                <button class="action-btn btn-del" data-recid="${rId}">Delete</button>
            </td>
        `;

        tr.querySelector(".btn-del").addEventListener("click", (e) => {
            const targetId = e.target.getAttribute("data-recid");
            showCustomConfirm("Destructive Data Action", `Confirm deletion of recipe entry document: ${targetId}`, true, async () => {
                try {
                    await deleteDoc(doc(db, "recipes", targetId));
                    showCustomAlert("Data Management Success", "Recipe purged from active index.", () => {
                        window.location.reload();
                    });
                } catch(error) {
                    console.error("Recipe purge error:", error);
                    showCustomAlert("System Execution Fault", "Data purge operation encountered problems within live stores.");
                }
            });
        });

        tbody.appendChild(tr);
    });
}