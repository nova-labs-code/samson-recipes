import { isAuthorized } from "/js/security.js";
(function () {

  // inject css once
  (function () {
    if (!document.getElementById("carousel-css")) {
      const link = document.createElement("link");
      link.id = "carousel-css";
      link.rel = "stylesheet";
      link.href = "/css/carousel.css";
      document.head.appendChild(link);
    }
  })();

  function initCarousel() {

    const wrapper = document.querySelector("#imageGallery");
    if (!wrapper) return;

    const images = Array.from(wrapper.querySelectorAll("img"));
    if (images.length <= 1) return;

    if (wrapper.querySelector(".carousel-container")) return;

    // reset state
    images.forEach(img => img.classList.remove("active"));
    images[0].classList.add("active");

    // DOTS
    const dotsContainer = document.createElement("div");
    dotsContainer.className = "carousel-dots no-print";

    // IMAGE WRAPPER
    const imagesWrapper = document.createElement("div");
    imagesWrapper.className = "carousel-images";

    const setActive = (index) => {

      images.forEach(img => img.classList.remove("active"));

      dotsContainer.querySelectorAll(".carousel-dot")
        .forEach(d => d.classList.remove("active"));

      images[index].classList.add("active");

      const dots = dotsContainer.querySelectorAll(".carousel-dot");
      if (dots[index]) dots[index].classList.add("active");
    };

    images.forEach((img, i) => {

      imagesWrapper.appendChild(img);

      // 🎯 CLICK IMAGE → CHANGE SLIDE
      img.addEventListener("click", () => {
        setActive(i);
      });

      const dot = document.createElement("span");
      dot.className = "carousel-dot" + (i === 0 ? " active" : "");

      dot.addEventListener("click", () => {
        setActive(i);
      });

      dotsContainer.appendChild(dot);
    });

    // BUILD STRUCTURE
    const container = document.createElement("div");
    container.className = "carousel-container";

    container.appendChild(imagesWrapper);
    container.appendChild(dotsContainer);

    wrapper.innerHTML = "";
    wrapper.appendChild(container);
  }

  function safeInit() {

    const tryRun = () => {
      const wrapper = document.querySelector("#imageGallery");
      if (!wrapper) return;

      const imgs = wrapper.querySelectorAll("img");

      if (imgs.length > 0) {
        initCarousel();
      }
    };

    setTimeout(tryRun, 0);
    setTimeout(tryRun, 50);
    setTimeout(tryRun, 150);
  }

  window.initCarousel = initCarousel;

  document.addEventListener("DOMContentLoaded", safeInit);
  window.addEventListener("load", safeInit);

})();