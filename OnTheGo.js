// OnTheGo.js

let states = [];
let stateCities = {};

// Fetch states and cities from the JSON file
fetch('indianStatesCities.json')
  .then(response => response.json())
  .then(data => {
    states = data.states;
    stateCities = data.stateCities;
    initializeDropdowns();
  })
  .catch(err => {
    alert("Failed to load states and cities data.");
    console.error(err);
  });

function filterList(list, query) {
  query = query.trim().toLowerCase();
  return list.filter(item => item.toLowerCase().includes(query));
}

function createDropdown(dropdownEl, options, onSelect, selectedValue = "") {
  dropdownEl.innerHTML = "";
  options.forEach(option => {
    const div = document.createElement("div");
    div.className = "dropdown-option" + (option === selectedValue ? " selected" : "");
    div.textContent = option;
    div.addEventListener("mousedown", e => {
      e.preventDefault();
      onSelect(option);
    });
    dropdownEl.appendChild(div);
  });
}

function initializeDropdowns() {
  // --- State Dropdown ---
  const stateInput = document.getElementById('state-input');
  const stateDropdown = document.getElementById('state-dropdown');
  stateDropdown.classList.add('state-dropdown');
  let stateDropdownActive = false;

  stateInput.addEventListener('focus', () => {
    stateDropdown.classList.add('active');
    updateStateDropdown();
    stateDropdownActive = true;
  });

  stateInput.addEventListener('input', () => {
    updateStateDropdown();
  });

  stateInput.addEventListener('blur', () => {
    setTimeout(() => {
      stateDropdown.classList.remove('active');
      stateDropdownActive = false;
    }, 120);
  });

  function updateStateDropdown() {
    const filtered = filterList(states, stateInput.value);
    createDropdown(stateDropdown, filtered, (state) => {
      stateInput.value = state;
      stateDropdown.classList.remove('active');
      stateDropdownActive = false;
      enableCityInput(state);
    }, stateInput.value);
  }

  function enableCityInput(state) {
    const cityInput = document.getElementById('city-input');
    cityInput.disabled = false;
    cityInput.value = "";
    updateCityDropdown(state, "");
  }

  // --- City Dropdown ---
  const cityInput = document.getElementById('city-input');
  const cityDropdown = document.getElementById('city-dropdown');
  cityDropdown.classList.add('city-dropdown');
  let cityDropdownActive = false;

  cityInput.addEventListener('focus', () => {
    if (cityInput.disabled) return;
    cityDropdown.classList.add('active');
    updateCityDropdown(stateInput.value, cityInput.value);
    cityDropdownActive = true;
  });

  cityInput.addEventListener('input', () => {
    updateCityDropdown(stateInput.value, cityInput.value);
  });

  cityInput.addEventListener('blur', () => {
    setTimeout(() => {
      cityDropdown.classList.remove('active');
      cityDropdownActive = false;
    }, 120);
  });

  function updateCityDropdown(state, query) {
    const cities = stateCities[state] || [];
    const filtered = filterList(cities, query);
    createDropdown(cityDropdown, filtered, (city) => {
      cityInput.value = city;
      cityDropdown.classList.remove('active');
      cityDropdownActive = false;
    }, cityInput.value);
  }

  // --- Apply Button ---
  const applyBtn = document.getElementById('apply-btn');
  applyBtn.addEventListener('click', () => {
    applyBtn.textContent = "Applied!";
    setTimeout(() => {
      applyBtn.textContent = "Apply";
    }, 1000);
  });

  // --- Dismiss dropdowns on outside click ---
  document.addEventListener('mousedown', (e) => {
    if (!stateInput.contains(e.target) && !stateDropdown.contains(e.target)) {
      stateDropdown.classList.remove('active');
    }
    if (!cityInput.contains(e.target) && !cityDropdown.contains(e.target)) {
      cityDropdown.classList.remove('active');
    }
  });
}
