(() => {
  'use strict';

  const CONTENT_ID = 'content';
  const contentSelector = document.getElementById(CONTENT_ID);

  setInterval(() => {
    contentSelector.textContent = `Have fun! Lucky Number: ${Math.floor(Math.random() * 100)}`;
  }, 1000);
})();
