document.addEventListener('DOMContentLoaded', () => {
  const bottomBar = document.createElement("div");
  bottomBar.id = "trustpilot-bottom-bar";
  bottomBar.classList.add("no-print");

  Object.assign(bottomBar.style, {
  position: "relative",
  width: "100%",

  // Mostly transparent glass
  background: "rgba(255, 255, 255, 0)",

  borderTop: "2px solid rgba(209, 213, 219, 0)",

  padding: "15px 0",
  textAlign: "center",
  boxSizing: "border-box",
  fontFamily: "Arial, sans-serif",
  marginTop: "30px",

  backdropFilter: "blur(5px)",
  WebkitBackdropFilter: "blur(5px)",

  boxShadow: "0 -4px 15px rgba(0, 0, 0, 0.15)",

  opacity: "0",
  transform: "translateY(20px)",
  transition: "opacity 0.6s ease, transform 0.6s ease"
});

  const link = document.createElement("a");
  link.href = "https://www.trustpilot.com/evaluate/samson-recipes.neocities.org";
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "Leave a Review on Trustpilot";

  Object.assign(link.style, {
    display: "inline-block",
    padding: "10px 18px",

    // Uses amethyst if available, otherwise lighter grey colors
    background: `
      linear-gradient(
        145deg,
        var(--amethyst-light, #f3f4f6),
        var(--amethyst-mid, #9ca3af),
        var(--amethyst-base, #4b5563)
      )
    `,

    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",

    fontWeight: "bold",
    textDecoration: "none",
    fontSize: "16px",

    cursor: "pointer",

    transition: "transform 0.2s ease, text-shadow 0.2s ease"
  });

  // Hover glow
  link.addEventListener("mouseenter", () => {
    link.style.transform = "translateY(-3px) scale(1.05)";
    link.style.textShadow =
      "0 0 14px var(--amethyst-base, rgba(156, 163, 175, 0.5))";
  });

  // Reset
  link.addEventListener("mouseleave", () => {
    link.style.transform = "translateY(0) scale(1)";
    link.style.textShadow = "none";
  });

  // Click press
  link.addEventListener("mousedown", () => {
    link.style.transform = "scale(0.97)";
  });

  link.addEventListener("mouseup", () => {
    link.style.transform = "translateY(-3px) scale(1.05)";
  });

  bottomBar.appendChild(link);
  document.body.appendChild(bottomBar);

  // Entrance animation
  requestAnimationFrame(() => {
    bottomBar.style.opacity = "1";
    bottomBar.style.transform = "translateY(0)";
  });

  // Floating motion
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