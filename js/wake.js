// Wake.js
// Auto enable screen wake after any user interaction

let wakeLock = null;
let enabled = false;

async function keepScreenAwake() {

  if (!("wakeLock" in navigator)) {
    console.log("Wake Lock not supported");
    return;
  }

  try {
    wakeLock = await navigator.wakeLock.request("screen");
    enabled = true;

    console.log("Screen will stay awake");

    wakeLock.addEventListener("release", () => {
      console.log("Wake lock released");

      if (enabled) {
        keepScreenAwake();
      }
    });

  } catch (err) {
    console.log("Wake Lock error:", err);
  }
}


// Any tap/click starts it
function activateWakeLock() {
  if (!enabled) {
    keepScreenAwake();
  }
}

document.addEventListener("click", activateWakeLock, {
  once: true
});

document.addEventListener("touchstart", activateWakeLock, {
  once: true,
  passive: true
});


// Restore when Safari returns to the page
document.addEventListener("visibilitychange", () => {

  if (
    document.visibilityState === "visible" &&
    enabled
  ) {
    keepScreenAwake();
  }

});