// Search Modal Functionality
let pagefindInstance = null;
let pagefindLoaded = false;

// Initialize Pagefind
async function initializePagefind() {
  if (pagefindLoaded) return;

  try {
    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/pagefind/pagefind-ui.css';
    document.head.appendChild(link);

    // Load and initialize Pagefind UI
    const script = document.createElement('script');
    script.src = '/pagefind/pagefind-ui.js';
    script.type = 'text/javascript';
    
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    // Initialize PagefindUI
    if (window.PagefindUI) {
      pagefindInstance = new window.PagefindUI({
        element: '#search-container',
        showSubResults: true,
        showImages: false,
        excerptLength: 30,
        resetStyles: false,
      });
      pagefindLoaded = true;
    }
  } catch (error) {
    console.error('Failed to load Pagefind:', error);
    const searchContainer = document.getElementById('search-container');
    if (searchContainer) {
      searchContainer.innerHTML = 
        '<p class="text-gray-600 dark:text-gray-400">Search is not available in development mode. Build the site first with <code class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">npm run build</code></p>';
    }
  }
}

// Open modal
function openSearchModal() {
  const modal = document.getElementById('search-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Initialize Pagefind if not already loaded
    if (!pagefindLoaded) {
      initializePagefind();
    }
    
    // Focus on search input after a brief delay
    setTimeout(() => {
      const searchInput = document.querySelector('#search-container input');
      if (searchInput) {
        searchInput.focus();
      }
    }, 100);
  }
}

// Close modal
function closeSearchModal() {
  const modal = document.getElementById('search-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

// Setup event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Open modal buttons (both mobile and desktop)
  const searchButtons = document.querySelectorAll('[data-search-trigger]');
  searchButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      openSearchModal();
    });
  });

  // Close modal button
  const closeButton = document.getElementById('close-search-modal');
  if (closeButton) {
    closeButton.addEventListener('click', closeSearchModal);
  }

  // Close on backdrop click
  const backdrop = document.getElementById('search-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', closeSearchModal);
  }

  // Close on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('search-modal');
      if (modal && !modal.classList.contains('hidden')) {
        closeSearchModal();
      }
    }
  });

  // Keyboard shortcut: Cmd/Ctrl + K
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearchModal();
    }
  });
});
