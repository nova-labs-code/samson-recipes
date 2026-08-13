import { isAuthorized } from "/js/security.js";
(function () {

  function removeInlineStyles() {
    document.querySelectorAll("*").forEach(el => {
      el.removeAttribute("style");
    });
  }

  function injectResetCSS() {
    // avoid duplicates
    const existing = document.getElementById("hard-reset-style");
    if (existing) existing.remove();

    const style = document.createElement("style");
    style.id = "hard-reset-style";

    style.textContent = `
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 0;
        font-family: "Segoe UI", Arial, sans-serif;
        background: #fff;
        color: #111;
      }

      h1, h2, h3, p, ul, ol {
        margin: 0;
        padding: 0;
      }

      img {
        max-width: 100%;
        height: auto;
        display: block;
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      button {
        font-family: inherit;
      }
    `;

    document.head.appendChild(style);
  }

  function resetAllStyles() {
    removeInlineStyles();
    injectResetCSS();
  }

  // auto-run on load
  resetAllStyles();

  // manual trigger
  window.resetStyling = resetAllStyles;

})();