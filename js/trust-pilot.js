document.addEventListener('DOMContentLoaded', () => {
  const bottomBar = document.createElement("div");
  bottomBar.id = "trustpilot-bottom-bar";
  bottomBar.classList.add("no-print");

  Object.assign(bottomBar.style, {
    position: "relative",
    width: "100%",

    background: "transparent",
    borderTop: "2px solid rgba(216, 180, 254, 0.35)",

    padding: "15px 0",
    textAlign: "center",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
    marginTop: "30px",

    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",

    boxShadow: "0 -6px 18px rgba(168, 85, 247, 0.12)",

    opacity: "0",
    transform: "translateY(20px)",
    transition: "opacity 0.6s ease, transform 0.6s ease"
  });

  // Create the link (TEXT ONLY — no background)
  const link = document.createElement("a");
  link.href = "https://www.trustpilot.com/evaluate/samson-recipes.neocities.org";
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "Leave a Review on Trustpilot";

  Object.assign(link.style, {
    display: "inline-block",
    padding: "10px 18px",

    /* ✨ PURE TEXT GRADIENT ONLY */
    background: "linear-gradient(145deg, #f3e8ff, #a855f7, #6b21a8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",

    fontWeight: "bold",
    textDecoration: "none",
    fontSize: "16px",

    cursor: "pointer",

    transition: "transform 0.2s ease, text-shadow 0.2s ease"
  });

  // Hover (no background, only glow)
  link.addEventListener("mouseenter", () => {
    link.style.transform = "translateY(-3px) scale(1.05)";
    link.style.textShadow = "0 0 14px rgba(168, 85, 247, 0.5)";
  });

  link.addEventListener("mouseleave", () => {
    link.style.transform = "translateY(0) scale(1)";
    link.style.textShadow = "none";
  });

  // Click press feel
  link.addEventListener("mousedown", () => {
    link.style.transform = "scale(0.97)";
  });

  link.addEventListener("mouseup", () => {
    link.style.transform = "translateY(-3px) scale(1.05)";
  });

  bottomBar.appendChild(link);
  document.body.appendChild(bottomBar);

  // entrance animation
  requestAnimationFrame(() => {
    bottomBar.style.opacity = "1";
    bottomBar.style.transform = "translateY(0)";
  });

  // floating motion
  bottomBar.animate(
    [
      { transform: "translateY(0px)" },
      { transform: "translateY(-3px)" },
      { transform: "translateY(0px)" }
    ],
    {
      duration: 4000,
      iterations: Infinity,
      easing: "ease-in-out"
    }
  );
});