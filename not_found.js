import { isAuthorized } from "/js/security.js";
(function () {

  const messages = [
    "A recipe once lived here, but it was erased from the pantry archives long ago.",
    "You found a burned page where instructions used to be written in ink and steam.",
    "This dish was never finished — only the echo of measurements remains.",
    "The cookbook remembers this page, but refuses to show it again.",
    "Something tried to bake here… the oven never agreed.",
    "A recipe card was torn out mid-sentence and never replaced.",
    "You’re standing where flavor used to exist before it faded out.",
    "This page dissolved into broth before it could be served.",
    "The kitchen lights went out before this recipe could form.",
    "A forgotten dish lingers here like smoke in an empty pot.",
    "The instructions were written, then washed away under boiling water.",
    "This recipe broke apart while still being measured.",
    "The page was removed from the recipe index without explanation.",
    "What you see is the aftertaste of something that never finished cooking.",
    "A dish tried to exist here, but the timeline skipped the timer.",
    "This recipe exists only as a stain on the cookbook’s memory.",
    "You reached a shelf where recipes go to be forgotten.",
    "The ingredients assembled, but the meaning never arrived.",
    "A half-written recipe still hums in the background of this page.",
    "This page is what remains after the last spoon was put down."
  ];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // -----------------------------
  // GUARD: is the maintenance/site-down overlay already showing?
  // -----------------------------
  function maintenanceActive() {
    return !!document.getElementById("sr-maintenance-overlay");
  }

  function injectCSS() {
    if (document.getElementById("nf-style")) return;

    const style = document.createElement("style");
    style.id = "nf-style";
    style.textContent = `
:root{
  --bg1:#07070a;
  --bg2:#0e0b12;
  --accent:#ff3b3b;
}

*{box-sizing:border-box;}

body{
  margin:0;
  height:100vh;
  overflow:hidden;
  font-family:system-ui, Arial, sans-serif;
  color:#e6e6e6;
  z-index: 100;

  perspective:1000px;

  background:
    radial-gradient(circle at 20% 20%, #1a0f14 0%, transparent 40%),
    radial-gradient(circle at 80% 70%, #120a18 0%, transparent 45%),
    linear-gradient(120deg,var(--bg1),var(--bg2));
}

/* ===== SCENE ===== */
.scene{
  position:fixed;
  inset:0;
  transform-style:preserve-3d;
  transform:rotateX(14deg) rotateY(-12deg);
}

.fog{
  position:absolute;
  inset:-30%;
  background:radial-gradient(circle at 50% 50%,
    rgba(255,60,60,0.06),
    transparent 65%);
  transform:translateZ(-300px);
}

.center{
  position:absolute;
  inset:0;
  display:flex;
  justify-content:center;
  align-items:center;
  transform:translateZ(80px);
}

/* ===== CARD ===== */
.card{
  width:90%;
  max-width:520px;

  padding:28px 22px;
  border-radius:16px;

  background:rgba(10,10,14,0.75);
  border:1px solid rgba(255,255,255,0.08);

  box-shadow:
    0 40px 100px rgba(0,0,0,0.8),
    0 0 60px rgba(255,40,40,0.12);

  backdrop-filter:blur(8px);
}

/* text */
h1{
  margin:0;
  font-size:88px;
  color:var(--accent);
  text-shadow:0 25px 50px rgba(0,0,0,0.6);
  transform:translateZ(40px);
}

p{
  margin:12px 0 18px;
  line-height:1.6;
  color:#d6d6d6;
  transform:translateZ(20px);
}

/* ===== 3D BUTTON SYSTEM ===== */
a,
button{
  display:inline-block;
  padding:10px 16px;
  border-radius:12px;
  text-decoration:none;
  font-weight:700;
  color:white;
  border:none;
  cursor:pointer;

  background:linear-gradient(135deg,#ff3b3b,#8f001f);

  /* 3D body */
  box-shadow:
    0 6px 0 #5c0014,
    0 12px 25px rgba(0,0,0,0.35);

  transform:translateZ(50px);
  transition:transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
}

/* hover lift */
a:hover,
button:hover{
  transform:translateZ(50px) translateY(-2px);
  filter:brightness(1.05);
  box-shadow:
    0 8px 0 #5c0014,
    0 16px 28px rgba(0,0,0,0.4);
}

/* press down */
a:active,
button:active{
  transform:translateZ(50px) translateY(4px);
  box-shadow:
    0 2px 0 #5c0014,
    0 8px 18px rgba(0,0,0,0.3);
}

/* reduce motion safety */
@media (prefers-reduced-motion: reduce){
  *{animation:none !important;}
}
    `;
    document.head.appendChild(style);
  }

  function injectHTML() {
    document.body.innerHTML = `
<div class="scene">
  <div class="fog"></div>

  <div class="center">
    <div class="card">
      <h1>404</h1>
      <p id="msg"></p>

      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <a href="/">← Return</a>
        <button id="retryBtn">Retry</button>
      </div>
    </div>
  </div>
</div>
    `;
  }

  function tagOriginal(root = document.body) {
    const all = root.querySelectorAll("*");
    all.forEach(el => el.classList.add("original"));
  }

  function NotFound() {

    // -----------------------------
    // Bail out entirely if the site-down / maintenance overlay
    // is already rendered — never overwrite it with the 404 page.
    // -----------------------------
    if (maintenanceActive()) {
      return;
    }

    injectCSS();
    injectHTML();

    // If the overlay got injected asynchronously between our check
    // and now (e.g. race with requestAnimationFrame in the status
    // script), restore it instead of leaving the 404 page in place.
    if (maintenanceActive() === false) {
      tagOriginal();

      const el = document.getElementById("msg");
      if (el) el.textContent = pick(messages);

      const retry = document.getElementById("retryBtn");
      if (retry) {
        retry.addEventListener("click", () => {
          location.reload();
        });
      }
    }
  }

  // -----------------------------
  // Also guard against the maintenance script running AFTER
  // NotFound() has already wiped the body: watch for it being
  // injected later and let it take over cleanly.
  // -----------------------------
  const observer = new MutationObserver(() => {
    if (maintenanceActive()) {
      observer.disconnect();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.NotFound = NotFound;

})();