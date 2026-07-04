function createNoPrintRule() {
if (document.getElementById("no-print-style")) return;

const style = document.createElement("style");
style.id = "no-print-style";

style.textContent = `
@media print {

  /* 🚫 hide UI */
  .no-print {
    display: none !important;
  }

  /* 📄 base page */
  html,
  body {
    background: #fff !important;
    color: #000 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* 💥 NUCLEAR RESET */
  * {
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
    background: none !important;
    background-image: none !important;
    text-shadow: none !important;
    box-shadow: none !important;
    filter: none !important;
    opacity: 1 !important;
  }

  /* 🧨 FORCE TEXT CLEANING */
  *:not(svg):not(path) {
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
  }

  /* 🖼️ reset images */
  img {
    border: none !important;
    box-shadow: none !important;
    filter: none !important;
    opacity: 1 !important;
    background: none !important;
    mix-blend-mode: normal !important;
  }

  /* 📋 reset lists */
  ul,
  ol {
    margin: 1em 0 !important;
    padding-left: 2em !important;
    color: #000 !important;
    background: none !important;
  }

  li {
    color: #000 !important;
    background: none !important;
    list-style: inherit !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* • bullets and numbers */
  ul li::marker,
  ol li::marker,
  li::marker {
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
  }

  /* 🧨 force EVERYTHING inside lists black */
  ul *,
  ol *,
  li *,
  ul *::before,
  ul *::after,
  ol *::before,
  ol *::after,
  li *::before,
  li *::after {
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
    background: none !important;
    background-image: none !important;
    text-shadow: none !important;
    box-shadow: none !important;
  }

  /* remove generated content */
  ul::before,
  ul::after,
  ol::before,
  ol::after,
  li::before,
  li::after,
  img::before,
  img::after {
    content: none !important;
  }

  /* 🔗 links */
  a {
    color: #000 !important;
    text-decoration: none !important;
  }

  /* ➖ hr styling FOR PRINT ONLY */
  hr {
    border: none !important;
    height: 1px !important;
    background: #A3A3A3 !important;
    margin: 28px 0 !important;
  }
}

`;

document.head.appendChild(style);
}

createNoPrintRule();
