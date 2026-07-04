document.addEventListener("DOMContentLoaded", function () {
  const isApp = navigator.userAgent === "APP";

  // Redirect if not in app and trying to access app-only page
  if (!isApp && window.location.pathname.includes("app-info.html")) {
    window.location.href = "index.html";
  }

  const links = [
    { text: "Home", url: "/index.html" },
    { text: "Meal Planner", url: "/Pages/meal-plan.html" },
    { text: "About", url: "/Pages/about.html" },
    { text: "Staff", url: "/Pages/staff.html" },
    { text: "Information", url: "/Pages/info.html" },
    { text: "Contact Us", url: "/Pages/contact-us.html" },
    { text: "Samson Blogs", url: "/Pages/blogs" },
    { text: "Stats", url: "/Pages/sitedata.html" },
    { text: "Status", url: "https://stats.uptimerobot.com/yyyK0XGlqJ" },
    { text: "Updates", url: "/Pages/updates.html" },
    { text: "Sponsors", url: "/Pages/sponsors.html" },
    { text: "App Info", url: "/Pages/app-info.html", appOnly: true }
  ];

  const bottomBar = document.createElement("div");
  bottomBar.id = "bottom-bar";
  bottomBar.classList.add("no-print");

  const inner = document.createElement("div");
  inner.className = "bottom-bar-inner";

  links.forEach((link, index) => {
    // Hide links depending on app state
    if (isApp && ["Downloads", "Status", "Sponsors"].includes(link.text)) return;
    if (!isApp && link.appOnly) return;

    if (inner.children.length > 0) {
      const sep = document.createElement("span");
      sep.className = "sep";
      sep.textContent = "✦";
      inner.appendChild(sep);
    }

    const a = document.createElement("a");
    a.href = link.url;
    a.textContent = link.text;
    inner.appendChild(a);
  });

  bottomBar.appendChild(inner);
  document.body.appendChild(bottomBar);

  // --------------------------
  // AMETHYST THEMED STYLES
  // --------------------------
  const style = document.createElement("style");
  style.textContent = `
#bottom-bar {
  width: 100%;
  margin-top: 40px;
  padding: 14px 0;

  overflow-x: auto;
  white-space: nowrap;

  text-align: center;
  font-size: 18px;

  background: transparent;

  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  border-top: 1px solid rgba(216, 180, 254, 0.25);
  box-shadow: 0 -6px 20px rgba(0,0,0,0.35);

  box-sizing: border-box;
  z-index: 999;
}

.bottom-bar-inner {
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
}

/* spacing */
.bottom-bar-inner a {
  margin: 0 10px;

  background: linear-gradient(
    145deg,
    var(--amethyst-light),
    var(--amethyst-mid),
    var(--amethyst-base)
  );

  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  font-weight: 600;
  text-decoration: none;

  display: inline-block;
  position: relative;

  transition: transform 0.18s ease, filter 0.18s ease, text-shadow 0.18s ease;
}

/* ✨ hover = float + glow + pulse */
.bottom-bar-inner a:hover {
  transform: translateY(-3px) scale(1.05);
  filter: brightness(1.15);
  text-shadow: 0 0 14px rgba(168, 85, 247, 0.5);
  animation: amethystPulse 1.2s ease-in-out infinite;
}

/* 👇 click = press down feel */
.bottom-bar-inner a:active {
  transform: translateY(1px) scale(0.97);
  filter: brightness(0.95);
  text-shadow: 0 0 6px rgba(168, 85, 247, 0.3);
}

/* separators */
#bottom-bar .sep {
  margin: 0 4px;
  color: var(--amethyst-mid);
  opacity: 0.6;
  user-select: none;
}

/* 💜 glow breathing animation */
@keyframes amethystPulse {
  0% {
    text-shadow: 0 0 10px rgba(168, 85, 247, 0.35);
  }
  50% {
    text-shadow: 0 0 18px rgba(216, 180, 254, 0.6);
  }
  100% {
    text-shadow: 0 0 10px rgba(168, 85, 247, 0.35);
  }
}
`;

  document.head.appendChild(style);
});