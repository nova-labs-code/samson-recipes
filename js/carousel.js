// Automatically attach carousel.css
(function(){
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/css/carousel.css"; // Make sure carousel.css exists
  document.head.appendChild(link);
})();

document.addEventListener("DOMContentLoaded", () => {
  // Select the single div that contains multiple images
  const wrapper = document.querySelector("div");
  if (!wrapper) return;

  const images = Array.from(wrapper.querySelectorAll("img"));
  if (images.length <= 1) return; // only carousel if more than 1 image

  // Prevent multiple dots from being appended
  if (wrapper.querySelector(".carousel-dots")) return;

  // Create dots container
  const dotsContainer = document.createElement("div");
  dotsContainer.className = "carousel-dots";

  images.forEach((img, i) => {
    // Only first image active
    img.classList.toggle("active", i === 0);

    // Create a dot
    const dot = document.createElement("span");
    dot.className = "carousel-dot" + (i === 0 ? " active" : "");

    // Clicking a dot changes active image
    dot.addEventListener("click", () => {
      images.forEach(img => img.classList.remove("active"));
      Array.from(dotsContainer.children).forEach(d => d.classList.remove("active"));

      images[i].classList.add("active");
      dot.classList.add("active");
    });

    dotsContainer.appendChild(dot);
  });

  wrapper.appendChild(dotsContainer);
});