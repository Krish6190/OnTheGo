// OnTheGo.js

// Wait for DOM and fetch data
document.addEventListener('DOMContentLoaded', function() {
  let states = [];
  let stateCities = {};

  // Fetch the JSON data for states and cities
  fetch('indianStatesCities.json')
    .then(response => response.json())
    .then(data => {
      states = data.states;
      stateCities = data.stateCities;
      initializeDropdowns(states, stateCities);
    })
    .catch(err => {
      alert("Failed to load states and cities data.");
      console.error(err);
    });

  // Initialize Flatpickr for date pickers
  flatpickr("#checkin-date", {
    dateFormat: "d-m-Y",
    minDate: "today",
    allowInput: true
  });

  flatpickr("#checkout-date", {
    dateFormat: "d-m-Y",
    minDate: "today",
    allowInput: true
  });

  // Dropdown logic
  function initializeDropdowns(states, stateCities) {
    const stateInput = document.getElementById('state-input');
    const stateDropdown = document.querySelector('.state-dropdown');
    const cityInput = document.getElementById('city-input');
    const cityDropdown = document.querySelector('.city-dropdown');

    // Helper to filter list
    function filterList(list, query) {
      query = query.trim().toLowerCase();
      return list.filter(item => item.toLowerCase().includes(query));
    }

    // Helper to render dropdown
    function renderDropdown(dropdown, items, maxVisible) {
      dropdown.innerHTML = '';
      items.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'dropdown-option';
        div.textContent = item;
        dropdown.appendChild(div);
      });
      dropdown.style.display = items.length ? 'block' : 'none';
      // Set max-height for scroll
      dropdown.style.maxHeight = (maxVisible * 44) + "px";
    }

    // State dropdown events
    stateInput.addEventListener('focus', () => {
      const filtered = filterList(states, stateInput.value);
      renderDropdown(stateDropdown, filtered, 8);
      stateDropdown.classList.add('active');
    });

    stateInput.addEventListener('input', () => {
      const filtered = filterList(states, stateInput.value);
      renderDropdown(stateDropdown, filtered, 8);
      stateDropdown.classList.add('active');
    });

    stateInput.addEventListener('blur', () => {
      setTimeout(() => stateDropdown.classList.remove('active'), 150);
    });

    stateDropdown.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('dropdown-option')) {
        stateInput.value = e.target.textContent;
        stateDropdown.classList.remove('active');
        // Enable city input and clear previous value
        cityInput.disabled = false;
        cityInput.value = '';
        cityDropdown.innerHTML = '';
      }
    });

    // City dropdown events
    cityInput.addEventListener('focus', () => {
      if (cityInput.disabled) return;
      const state = stateInput.value;
      const cities = stateCities[state] || [];
      const filtered = filterList(cities, cityInput.value);
      renderDropdown(cityDropdown, filtered, 20);
      cityDropdown.classList.add('active');
    });

    cityInput.addEventListener('input', () => {
      if (cityInput.disabled) return;
      const state = stateInput.value;
      const cities = stateCities[state] || [];
      const filtered = filterList(cities, cityInput.value);
      renderDropdown(cityDropdown, filtered, 20);
      cityDropdown.classList.add('active');
    });

    cityInput.addEventListener('blur', () => {
      setTimeout(() => cityDropdown.classList.remove('active'), 150);
    });

    cityDropdown.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('dropdown-option')) {
        cityInput.value = e.target.textContent;
        cityDropdown.classList.remove('active');
      }
    });

    // Click outside to close dropdowns
    document.addEventListener('mousedown', (e) => {
      if (!stateInput.contains(e.target) && !stateDropdown.contains(e.target)) {
        stateDropdown.classList.remove('active');
      }
      if (!cityInput.contains(e.target) && !cityDropdown.contains(e.target)) {
        cityDropdown.classList.remove('active');
      }
    });
  }

  // Apply button animation
  document.getElementById('apply-btn').addEventListener('click', function() {
    this.classList.add('clicked');
    setTimeout(() => this.classList.remove('clicked'), 200);
  });
});
