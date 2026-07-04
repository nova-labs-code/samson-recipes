(() => {
  let button = null;

  function findTitle() {
    return document.querySelector("#Title");
  }

  function ensureButton() {
    const existing = document.getElementById("back-to-start");
    if (existing) {
      button = existing;
      return;
    }

    if (!document.documentElement) return;

    button = document.createElement("button");
    button.textContent = "Back To Top";
    button.id = "back-to-start";
    button.className = "no-print";

    Object.assign(button.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",

      zIndex: "2147483647", // max safe z-index (top of reality stack)
      isolation: "isolate",

      padding: "10px 20px",
      backgroundColor: "#a855f7",
      color: "#fff",
      border: "none",
      borderRadius: "10px",
      cursor: "pointer",
      fontWeight: "bold",

      boxShadow: "0 0 18px rgba(168, 85, 247, 0.5)",
      transition: "transform 0.15s ease, opacity 0.2s ease",

      opacity: "0",
      pointerEvents: "none",

      // 🧠 prevents weird CSS overrides from JSON themes
      fontFamily: "inherit",
      fontSize: "14px"
    });

    button.addEventListener("click", () => {
      const t = findTitle();
      if (!t) return;

      window.scrollTo({
        top: t.getBoundingClientRect().top + window.scrollY,
        behavior: "smooth"
      });
    });

    // 🚀 attach to documentElement (more stable than body in JSON rebuilds)
    document.documentElement.appendChild(button);
  }

  function update() {
    ensureButton();

    const t = findTitle();
    if (!t || !button) return;

    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const showAfter = t.offsetTop + t.offsetHeight + 100;

    if (scrollY > showAfter) {
      button.style.opacity = "1";
      button.style.pointerEvents = "auto";
      button.style.transform = "translateY(0) scale(1)";
    } else {
      button.style.opacity = "0";
      button.style.pointerEvents = "none";
      button.style.transform = "translateY(10px) scale(0.95)";
    }
  }

  function loop() {
    update();
    requestAnimationFrame(loop);
  }

  // 🔁 catches ANY JSON DOM rewrite
  const observer = new MutationObserver(() => {
    ensureButton();
    update();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true
  });

  window.addEventListener("scroll", update);
  window.addEventListener("resize", update);

  // start engine
  loop();
})();