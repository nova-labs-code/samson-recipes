import { isAuthorized } from "/js/security.js";
(() => {

    const STATE = {
        enabled: false,
        status: "minor",
        overrideEnabled: false
    };

    // -----------------------------
    // 1. PAGE STATUS
    // -----------------------------
    const pageStatus = (document.body?.dataset?.maintenance || "")
        .toLowerCase()
        .trim();

    if (pageStatus === "deleted") {
        return render("deleted");
    }

    // -----------------------------
    // 2. OVERRIDE
    // -----------------------------
    if (STATE.overrideEnabled === true) {

        const o = (STATE.status || "none").toLowerCase();

        if (["minor", "major", "down"].includes(o)) {
            return render(o);
        }
    }

    // -----------------------------
    // 3. NORMAL STATUS
    // -----------------------------
    let status = "none";

    if (pageStatus && pageStatus !== "none") {
        status = pageStatus;
    }

    // -----------------------------
    // 4. FALLBACK
    // -----------------------------
    if (status === "none" && STATE.enabled === true) {

        const s = (STATE.status || "none").toLowerCase();

        if (["minor", "major", "down"].includes(s)) {
            status = s;
        }
    }

    if (status === "none") return;

    render(status);

    // -----------------------------
    // RENDER ENGINE
    // -----------------------------
    function render(status) {

        const UI = {
            minor: {
                color: "#ff8a3d",
                title: "SYSTEM UPDATE",
                text: "A Minor System Update Is In Progress (Site Will Be Back Soon)"
            },
            major: {
                color: "#ff4d4d",
                title: "SYSTEM UPDATE",
                text: "A major system update is in progress"
            },
            down: {
                color: "#7a0b0b",
                title: "SYSTEM INCIDENT",
                text: "We are currently experiencing system issues"
            },
            deleted: {
                color: "#3a3a3a",
                title: "PAGE DELETED",
                text: "This page has been permanently removed"
            }
        };

        const { color, title, text } = UI[status];

        // 🔒 lock scroll
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";

        // -----------------------------
        // build overlay FIRST
        // -----------------------------
        const overlay = document.createElement("div");
        overlay.id = "sr-maintenance-overlay";

        overlay.innerHTML = `
<style>

#sr-maintenance-overlay{
    position:fixed;
    inset:0;
    z-index:999999999;

    display:flex;
    justify-content:center;
    align-items:center;

    font-family:system-ui,-apple-system,Segoe UI,sans-serif;

    background:
        radial-gradient(circle at 20% 20%, rgba(255,255,255,0.03), transparent 40%),
        radial-gradient(circle at 80% 30%, ${color}22, transparent 45%),
        #070707;
}

#sr-maintenance-overlay::before{
    content:"";
    position:fixed;
    inset:0;
    background-image:
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size:42px 42px;
    opacity:0.2;
    pointer-events:none;
}

.sr-card{
    position:relative;
    width:min(92%,820px);

    padding:64px 52px;
    border-radius:28px;

    background:rgba(18,18,18,0.75);
    border:1px solid rgba(255,255,255,0.08);

    backdrop-filter:blur(16px);
    text-align:center;
    box-shadow:0 30px 100px rgba(0,0,0,0.65);
}

.sr-orb{
    position:absolute;
    width:340px;
    height:340px;
    border-radius:50%;
    background:${color};
    filter:blur(120px);
    opacity:0.25;
    top:-160px;
    right:-160px;
}

.sr-badge{
    display:inline-flex;
    align-items:center;
    gap:10px;

    padding:10px 16px;
    border-radius:999px;

    background:rgba(255,255,255,0.06);
    border:1px solid rgba(255,255,255,0.1);

    color:#ddd;
    font-size:0.82rem;
    letter-spacing:0.12em;
    text-transform:uppercase;

    margin-bottom:26px;
}

.sr-dot{
    width:10px;
    height:10px;
    border-radius:50%;
    background:${color};
    box-shadow:0 0 18px ${color};
    animation:pulse 1.4s infinite;
}

@keyframes pulse{
    0%,100%{transform:scale(1);opacity:1;}
    50%{transform:scale(1.6);opacity:0.4;}
}

.sr-title{
    color:#fff;
    font-size:2.6rem;
    font-weight:900;
    letter-spacing:0.14em;
    text-transform:uppercase;
    margin-bottom:14px;
}

.sr-sub{
    color:#b9b9b9;
    font-size:1.05rem;
    line-height:1.7;
    max-width:600px;
    margin:0 auto;
}

.sr-alert{
    display:${status === "down" ? "block" : "none"};
    margin-top:22px;
    padding:14px 18px;

    border-radius:12px;
    background:rgba(255,0,0,0.08);
    border:1px solid rgba(255,0,0,0.25);

    color:#ffb3b3;
    font-size:0.85rem;
    letter-spacing:0.08em;
    text-transform:uppercase;
}

</style>

<div class="sr-card">

    <div class="sr-orb"></div>

    <div class="sr-badge">
        <div class="sr-dot"></div>
        SYSTEM STATUS
    </div>

    <div class="sr-title">${title}</div>
    <div class="sr-sub">${text}</div>

    <div class="sr-alert">
        SERVICE INTERRUPTION DETECTED
    </div>

</div>
`;

        // -----------------------------
        // SAFE WIPE (NO BREAKING DOM ROOT)
        // -----------------------------
        requestAnimationFrame(() => {
            document.body.replaceChildren(overlay);
        });
    }

})();