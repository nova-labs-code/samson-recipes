import { isAuthorized } from "/js/security.js";
// disable-zoom-absolute.js
// Completely disables all zooming behaviors

(function () {
  // ===== Lock viewport =====
  const lockViewport = () => {
    let meta = document.querySelector("meta[name=viewport]");
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no"
    );
  };
  lockViewport();

  // ===== Block pinch & multi-touch zoom =====
  const blockTouchZoom = e => e.touches && e.touches.length > 1 && e.preventDefault();
  document.addEventListener("touchstart", blockTouchZoom, { passive: false });
  document.addEventListener("touchmove", blockTouchZoom, { passive: false });
  document.addEventListener("touchend", blockTouchZoom, { passive: false });

  // ===== Block gesture zoom (iOS) =====
  ["gesturestart", "gesturechange", "gestureend"].forEach(evt =>
    document.addEventListener(evt, e => e.preventDefault(), { passive: false })
  );

  // ===== Block double-tap zoom =====
  let lastTouchEnd = 0;
  document.addEventListener(
    "touchend",
    e => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    },
    { passive: false }
  );

  // ===== Block input auto-zoom =====
  const fixInputs = () => {
    document.querySelectorAll("input, textarea, select").forEach(el => {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 16) el.style.fontSize = "16px"; // iOS auto-zoom prevention
      el.addEventListener("focus", lockViewport);
      el.addEventListener("blur", lockViewport);
      el.style.caretColor = "auto"; // ensure caret visibility
    });
  };
  fixInputs();

  // Observe dynamically added inputs
  new MutationObserver(fixInputs).observe(document.body, { childList: true, subtree: true });

  // ===== Prevent wheel / ctrl / cmd zoom (desktop) =====
  const blockWheelZoom = e => (e.ctrlKey || e.metaKey) && e.preventDefault();
  window.addEventListener("wheel", blockWheelZoom, { passive: false });
  window.addEventListener("mousewheel", blockWheelZoom, { passive: false });
  window.addEventListener("keydown", e => {
    // Ctrl/Cmd + +/- or 0
    if ((e.ctrlKey || e.metaKey) && ["+", "-", "=","0"].includes(e.key)) e.preventDefault();
  });

  // ===== CSS fixes =====
  const style = document.createElement("style");
  style.textContent = `
    html {
      -webkit-text-size-adjust: 100% !important;
      -ms-text-size-adjust: 100% !important;
      touch-action: pan-x pan-y !important;
      user-select: auto !important;
    }
    body {
      overscroll-behavior: none !important;
    }
    input, textarea, select {
      font-size: 16px !important;
    }
  `;
  document.head.appendChild(style);

  // ===== Observe head for viewport changes =====
  new MutationObserver(lockViewport).observe(document.head, { childList: true, subtree: true });
})();