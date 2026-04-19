/**
 * Creates and injects a CSS rule to hide elements with the 'no-print' class
 * during the printing process.
 */
function createNoPrintRule() {
  // Check if the rule has already been added to avoid duplicates
  if (document.getElementById('no-print-style')) {
    return;
  }

  // Create a new <style> element
  const style = document.createElement('style');
  style.id = 'no-print-style'; // Give it an ID for easy identification

  // Define the CSS rule
  style.textContent = `
    @media print {
      .no-print {
        display: none !important;
      }
    }
  `;

  // Append the <style> element to the document's head
  document.head.appendChild(style);
}

// Call the function to create the rule when the script loads
createNoPrintRule();
