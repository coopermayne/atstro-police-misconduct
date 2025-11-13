// Client-side search and filter functionality for cases
let allCases = [];
let filteredCases = [];

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Get all case data from the page
  const casesContainer = document.getElementById('cases-container');
  if (!casesContainer) return;

  const caseCards = casesContainer.querySelectorAll('[data-case]');
  allCases = Array.from(caseCards).map(card => ({
    element: card,
    data: JSON.parse(card.dataset.case)
  }));

  filteredCases = [...allCases];

  // Set up event listeners
  setupSearchListeners();
  setupFilterListeners();
  
  // Initialize filter counts
  updateFilterCounts();
});

function setupSearchListeners() {
  const searchInput = document.getElementById('case-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', debounce(() => {
    applyFilters();
  }, 300));
}

function setupFilterListeners() {
  // County filter (radio buttons)
  const countyRadios = document.querySelectorAll('[name="county-filter"]');
  countyRadios.forEach(radio => radio.addEventListener('change', applyFilters));

  // Agency filter (radio buttons)
  const agencyRadios = document.querySelectorAll('[name="agency-filter"]');
  agencyRadios.forEach(radio => radio.addEventListener('change', applyFilters));

  // Body cam filter
  const bodycamCheckbox = document.getElementById('bodycam-filter');
  if (bodycamCheckbox) bodycamCheckbox.addEventListener('change', applyFilters);

  // Clear filters button
  const clearBtn = document.getElementById('clear-filters');
  if (clearBtn) clearBtn.addEventListener('click', clearFilters);
}

function applyFilters() {
  const searchTerm = document.getElementById('case-search')?.value.toLowerCase() || '';
  const countyFilter = document.querySelector('[name="county-filter"]:checked')?.value || '';
  const agencyFilter = document.querySelector('[name="agency-filter"]:checked')?.value || '';
  const bodycamOnly = document.getElementById('bodycam-filter')?.checked || false;

  filteredCases = allCases.filter(({ data }) => {
    // Search filter (omni-search across multiple fields)
    if (searchTerm) {
      const searchableText = [
        data.victim_name,
        data.city,
        data.county,
        ...(data.agencies || []),
        ...(data.shooting_officers || []),
        data.case_id,
        data.armed_status,
        data.cause_of_death
      ].filter(Boolean).join(' ').toLowerCase();

      if (!searchableText.includes(searchTerm)) {
        return false;
      }
    }

    // County filter
    if (countyFilter && data.county !== countyFilter) return false;

    // Agency filter
    if (agencyFilter && !data.agencies?.includes(agencyFilter)) return false;

    // Body cam filter
    if (bodycamOnly && !data.bodycam_available) return false;

    return true;
  });

  // Update the display
  renderFilteredCases();
  updateResultCount();
  
  // Update active filters display (if function exists from inline script)
  if (typeof updateActiveFilters === 'function') {
    updateActiveFilters();
  }
}

function renderFilteredCases() {
  allCases.forEach(({ element }) => {
    element.style.display = 'none';
  });

  filteredCases.forEach(({ element }) => {
    element.style.display = '';
  });

  // Show "no results" message if needed
  const noResults = document.getElementById('no-results');
  if (noResults) {
    noResults.style.display = filteredCases.length === 0 ? 'block' : 'none';
  }
}

function updateResultCount() {
  const countElement = document.getElementById('result-count');
  if (countElement) {
    countElement.textContent = `${filteredCases.length} case${filteredCases.length !== 1 ? 's' : ''}`;
  }
}

function updateFilterCounts() {
  // This could show counts for each filter option
  // Implementation depends on UI requirements
}

function clearFilters() {
  // Clear search
  const searchInput = document.getElementById('case-search');
  if (searchInput) searchInput.value = '';

  // Clear county radios
  const countyRadios = document.querySelectorAll('[name="county-filter"]');
  countyRadios.forEach(radio => radio.checked = false);

  // Clear agency radios
  const agencyRadios = document.querySelectorAll('[name="agency-filter"]');
  agencyRadios.forEach(radio => radio.checked = false);

  // Clear body cam checkbox and button styling
  const bodycamCheckbox = document.getElementById('bodycam-filter');
  const bodycamBtn = document.getElementById('bodycam-filter-btn');
  if (bodycamCheckbox) bodycamCheckbox.checked = false;
  if (bodycamBtn) {
    bodycamBtn.classList.remove('bg-green-100', 'dark:bg-green-900/30', 'border-green-500', 'dark:border-green-400', 'text-green-700', 'dark:text-green-300');
    bodycamBtn.classList.add('bg-white', 'dark:bg-gray-700', 'border-gray-200', 'dark:border-gray-600', 'text-gray-700', 'dark:text-gray-300');
  }

  // Reapply (will show all)
  applyFilters();
}

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
