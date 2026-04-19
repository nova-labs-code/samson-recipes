document.addEventListener('DOMContentLoaded', () => {
  const title = document.getElementById('Title');
  const recipeBy = document.getElementById('recipeBy');

  if (!title || !recipeBy) return;

  // Create button
  const button = document.createElement('button');
  button.textContent = 'Back to start';
  button.id = 'back-to-start';

  Object.assign(button.style, {
    padding: '10px 20px',
    backgroundColor: '#00b67a',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    display: 'none', // hidden initially
    zIndex: '10000',
  });

  // Scroll to top of Title
  button.addEventListener('click', () => {
    window.scrollTo({
      top: title.offsetTop,
      behavior: 'smooth',
    });
  });

  document.body.appendChild(button);

  // Check if element is visible in viewport
  function elementVisible(el) {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  function updateButton() {
    const scrollY = window.scrollY || window.pageYOffset;
    const titleBottom = title.offsetTop + title.offsetHeight + 100; // 100px past title

    // Hide until 100px past Title
    if (scrollY < titleBottom) {
      button.style.display = 'none';
      return;
    }

    button.style.display = 'block';

    if (elementVisible(recipeBy)) {
      // Move inline under recipeBy
      if (button.parentNode !== recipeBy.parentNode) {
        button.remove();
        recipeBy.insertAdjacentElement('afterend', button);
      }
      button.style.position = 'static';
      button.style.margin = '16px auto';
    } else {
      // Fixed bottom-right
      if (button.parentNode !== document.body) {
        button.remove();
        document.body.appendChild(button);
      }
      button.style.position = 'fixed';
      button.style.bottom = '20px';
      button.style.right = '20px';
      button.style.margin = '';
    }
  }

  window.addEventListener('scroll', updateButton);
  window.addEventListener('resize', updateButton);
  window.addEventListener('load', updateButton);
  updateButton();
});