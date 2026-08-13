import { isAuthorized } from "/js/security.js";
document.addEventListener("DOMContentLoaded", function () {
  const isApp = navigator.userAgent === "APP";

  const links = [
    { text: "Home", url: "/index.html" },
    { text: "About", url: "/Pages/about.html" },
    { text: "Staff", url: "/Pages/staff.html" },
    { text: "Information", url: "/Pages/info.html" },
    { text: "Samson Blogs", url: "/Pages/blogs.html" },
    { text: "Stats", url: "/Pages/sitedata.html" },
    { text: "Status", url: "/Pages/monitor.html" },
    { text: "Updates", url: "/Pages/updates.html" },
  ];

  const bottomBar = document.createElement("div");
  bottomBar.id = "bottom-bar";
  bottomBar.classList.add("no-print");

  const inner = document.createElement("div");
  inner.className = "bottom-bar-inner";

  links.forEach((link) => {
    if (isApp && ["Downloads", "Status", "Sponsors"].includes(link.text)) return;
    if (!isApp && link.appOnly) return;

    if (inner.children.length > 0) {
     const sep = document.createElement("span");
sep.className = "sep";
sep.textContent = "•";
inner.appendChild(sep);
    }

    const a = document.createElement("a");
    a.href = link.url;
    a.textContent = link.text;
    inner.appendChild(a);
  });

  bottomBar.appendChild(inner);
  document.body.appendChild(bottomBar);

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

  /* Mostly transparent glass */
  background: rgba(255, 255, 255, 0);

  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);

  border-top: 1px solid rgba(209, 213, 219, 0);
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.15);

  box-sizing: border-box;
  z-index: 999;
}

.bottom-bar-inner {
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
}

/* Links */
.bottom-bar-inner a {
  margin: 0 10px;

  background: linear-gradient(
    145deg,
    var(--amethyst-light, #f3f4f6),
    var(--amethyst-mid, #9ca3af),
    var(--amethyst-base, #4b5563)
  );

  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  font-weight: 600;
  text-decoration: none;

  display: inline-block;
  position: relative;

  transition:
    transform 0.18s ease,
    filter 0.18s ease,
    text-shadow 0.18s ease;
}

/* Hover */
.bottom-bar-inner a:hover {
  transform: translateY(-3px) scale(1.05);
  filter: brightness(1.15);

  text-shadow:
    0 0 14px var(--amethyst-base, rgba(156, 163, 175, 0.5));

  animation: amethystPulse 1.2s ease-in-out infinite;
}

/* Click */
.bottom-bar-inner a:active {
  transform: translateY(1px) scale(0.97);
  filter: brightness(0.95);

  text-shadow:
    0 0 6px var(--amethyst-mid, rgba(156, 163, 175, 0.3));
}

/* Separators */
#bottom-bar .sep {
  margin: 0 4px;

  color: var(--amethyst-mid, #9ca3af);

  opacity: 0.7;
  user-select: none;
}

/* Glow */
@keyframes amethystPulse {
  0% {
    text-shadow: 0 0 10px rgba(156, 163, 175, 0.35);
  }

  50% {
    text-shadow: 0 0 18px rgba(243, 244, 246, 0.6);
  }

  100% {
    text-shadow: 0 0 10px rgba(156, 163, 175, 0.35);
  }
}
`;

  document.head.appendChild(style);
});