import { isAuthorized } from "/js/security.js";
// gold.js – Full version with popup completely disabled
document.addEventListener('DOMContentLoaded', () => {

  // Dynamically load the gold CSS
  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = '/css/Tier.css';
  document.head.appendChild(cssLink);

  // ----------------------------
  // Popup functionality is fully removed
  // .gold-popup-overlay and .gold-popup-box are hidden in CSS
  // No popups, no exit confirmations, nothing will trigger
  // ----------------------------

  // Example placeholder for future gold-related JS (optional)
  // e.g., button hover effects, animations, etc.
  // All styling is handled via CSS; JS here can be expanded if needed

});