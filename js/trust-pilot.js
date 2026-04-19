document.addEventListener('DOMContentLoaded', () => {
  // Create bottom bar
  const bottomBar = document.createElement("div");
  bottomBar.id = "trustpilot-bottom-bar";

  Object.assign(bottomBar.style, {
    position: "relative",   // not fixed
    width: "100%",
    background: "#4D4543",
    borderTop: "3px solid #00b67a",
    padding: "15px 0",
    textAlign: "center",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
    marginTop: "30px",
  });

  // Create the link
  const link = document.createElement("a");
  link.href = "https://www.trustpilot.com/evaluate/samson-recipes.neocities.org";
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "Leave a Review on Trustpilot";

  Object.assign(link.style, {
    display: "inline-block",
    padding: "12px 24px",
    backgroundColor: "#00b67a",
    color: "#fff",
    fontWeight: "bold",
    textDecoration: "none",
    borderRadius: "6px",
    fontSize: "16px",
    cursor: "pointer",
  });

  link.addEventListener("mouseenter", () => link.style.backgroundColor = "#008f5c");
  link.addEventListener("mouseleave", () => link.style.backgroundColor = "#00b67a");

  bottomBar.appendChild(link);

  // Append bottom bar to the end of body
  document.body.appendChild(bottomBar);
});