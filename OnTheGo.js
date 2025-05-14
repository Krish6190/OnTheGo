// OnTheGo.js

// --- Date Input Formatting and Validation ---
function setupDateAutoFormat(input) {
  input.addEventListener('input', function(e) {
    let value = input.value.replace(/[^0-9]/g, '');
    let day = value.substr(0, 2);
    let month = value.substr(2, 2);
    let year = value.substr(4, 4);

    // Restrict day and month as you type
    if (day.length === 2) {
      if (parseInt(day, 10) > 31) day = "31";
      if (parseInt(day, 10) < 1 && day !== "") day = "01";
    }
    if (month.length === 2) {
      if (parseInt(month, 10) > 12) month = "12";
      if (parseInt(month, 10) < 1 && month !== "") month = "01";
    }

    let formatted = "";
    if (day) formatted += day;
    if (month) formatted += "-" + month;
    if (year) formatted += "-" + year;

    input.value = formatted;

    // Validate full date
    let isValid = true;
    if (value.length >= 2) {
      const d = parseInt(day, 10);
      if (isNaN(d) || d < 1 || d > 31) isValid = false;
    }
    if (value.length >= 4) {
      const m = parseInt(month, 10);
      if (isNaN(m) || m < 1 || m > 12) isValid = false;
    }
    if (value.length === 8) {
      const y = parseInt(year, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(y) || y < 1900 || y > currentYear + 2) isValid = false;
    }
    input.classList.toggle('invalid', !isValid);
  });

  // Prevent non-numeric input
  input.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey || e.key === "Backspace" || e.key === "Tab" || e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Delete") {
      return;
    }
    if (e.key.length === 1 && !/\d/.test(e.key)) {
      e.preventDefault();
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // --- Date Picker (Flatpickr) Integration ---
  const checkinInput = document.getElementById('checkin-date');
  const checkoutInput = document.getElementById('checkout-date');
  const checkinCalendarIcon = checkinInput.parentElement.querySelector('.icon-calendar');
  const checkoutCalendarIcon = checkoutInput.parentElement.querySelector('.icon-calendar');

  // Attach auto-formatting
  setupDateAutoFormat(checkinInput);
  setupDateAutoFormat(checkoutInput);

  // Flatpickr instances
  const checkinPicker = flatpickr(checkinInput, {
    dateFormat: "d-m-Y",
    minDate: "today",
    allowInput: true,
    clickOpens: false, // We'll open it manually
    onChange: function(selectedDates, dateStr) {
      checkinInput.value = dateStr;
      checkinInput.classList.remove('invalid');
    }
  });
  const checkoutPicker = flatpickr(checkoutInput, {
    dateFormat: "d-m-Y",
    minDate: "today",
    allowInput: true,
    clickOpens: false,
    onChange: function(selectedDates, dateStr) {
      checkoutInput.value = dateStr;
      checkoutInput.classList.remove('invalid');
    }
  });

  // Calendar icon opens the picker
  checkinCalendarIcon.addEventListener('click', () => {
    checkinPicker.open();
  });
  checkoutCalendarIcon.addEventListener('click', () => {
    checkoutPicker.open();
  });

  // Prevent input from losing focus when clicking the icon
  checkinCalendarIcon.addEventListener('mousedown', e => e.preventDefault());
  checkoutCalendarIcon.addEventListener('mousedown', e => e.preventDefault());

  // --- State/City Dropdown Logic ---
  let states = [];
  let stateCities = {};

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

  function initializeDropdowns(states, stateCities) {
    const stateInput = document.getElementById('state-input');
    const stateDropdown = document.querySelector('.state-dropdown');
    const cityInput = document.getElementById('city-input');
    const cityDropdown = document.querySelector('.city-dropdown');

    function filterList(list, query) {
      query = query.trim().toLowerCase();
      return list.filter(item => item.toLowerCase().includes(query));
    }

    function renderDropdown(dropdown, items, maxVisible) {
      dropdown.innerHTML = '';
      items.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'dropdown-option';
        div.textContent = item;
        dropdown.appendChild(div);
      });
      dropdown.style.display = items.length ? 'block' : 'none';
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

    // --- Dropdowns close if you click anywhere except their respective input/dropdown ---
    document.addEventListener('mousedown', (e) => {
      if (!stateInput.contains(e.target) && !stateDropdown.contains(e.target)) {
        stateDropdown.classList.remove('active');
      }
      if (!cityInput.contains(e.target) && !cityDropdown.contains(e.target)) {
        cityDropdown.classList.remove('active');
      }
    });
  }

  // --- Apply button animation ---
  document.getElementById('apply-btn').addEventListener('click', function() {
    this.classList.add('clicked');
    setTimeout(() => this.classList.remove('clicked'), 200);
  });
});
