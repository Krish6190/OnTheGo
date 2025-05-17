// --- State/City Data (alphabetical) ---
let states = [];
let stateCities = {};
let allLocations = [];

// Load states and cities data
fetch('india-states-cities.json')
  .then(response => response.json())
  .then(data => {
    // Sort states alphabetically
    states = data.states.sort((a, b) => a.localeCompare(b));
    stateCities = data.stateCities;
    
    // Create combined locations array with format "City, State" and "State"
    states.forEach(state => {
      allLocations.push({ text: state, value: state, type: 'state' });
      // Sort cities alphabetically within each state
      const sortedCities = stateCities[state].sort((a, b) => a.localeCompare(b));
      sortedCities.forEach(city => {
        allLocations.push({ 
          text: `${city}, ${state}`, 
          value: `${city},${state}`, 
          type: 'city',
          city: city,
          state: state
        });
      });
    });

    setupLocationSearch();
  })
  .catch(error => console.error('Error loading states and cities:', error));

// --- Date Input Formatting and Validation ---
function getTomorrowDDMMYYYY() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dd = String(tomorrow.getDate()).padStart(2, '0');
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const yyyy = tomorrow.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}
function getMaxDDMMYYYY() {
  const maxYear = new Date().getFullYear() + 2;
  return `31-12-${maxYear}`;
}
function clampDateToRange(dateStr, isCheckout = false, checkinDate = null) {
  const [dd, mm, yyyy] = dateStr.split('-').map(Number);
  if (!dd || !mm || !yyyy) return getTomorrowDDMMYYYY();
  
  let inputDate = new Date(yyyy, mm - 1, dd);
  inputDate.setHours(0,0,0,0);
  
  const tomorrow = new Date();
  tomorrow.setHours(0,0,0,0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (isCheckout && checkinDate) {
    // For checkout, ensure it's between checkin+1 and checkin+30
    const minCheckout = new Date(checkinDate);
    minCheckout.setDate(minCheckout.getDate() + 1);
    
    const maxCheckout = new Date(checkinDate);
    maxCheckout.setDate(maxCheckout.getDate() + 30);
    
    if (inputDate < minCheckout) {
      return formatDDMMYYYY(minCheckout);
    }
    if (inputDate > maxCheckout) {
      return formatDDMMYYYY(maxCheckout);
    }
  } else {
    // For checkin, ensure it's not in the past and not too far in future
    const maxDate = new Date((new Date().getFullYear() + 2), 11, 31);
    if (inputDate < tomorrow) return getTomorrowDDMMYYYY();
    if (inputDate > maxDate) return getMaxDDMMYYYY();
  }
  
  return dateStr; // Return the original string if it's valid
}
function parseDDMMYYYY(str) {
  const [dd, mm, yyyy] = str.split('-').map(Number);
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd);
}
function formatDDMMYYYY(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}
function setupDateAutoFormat(input, otherInput) {
  let previousLength = 0;

  input.addEventListener('input', function(e) {
    // Remove any non-digits first
    let value = input.value.replace(/\D/g, '');
    
    // Limit to 8 digits
    if (value.length > 8) {
      value = value.slice(0, 8);
    }

    // Add leading zeros and validate day/month
    if (value.length > 0) {
      // Handle day (first 2 digits)
      let day = value.slice(0, 2);
      if (value.length > 2 && day.length === 1) {
        day = '0' + day;
      }
      // Only validate day when user has entered both digits
      if (day.length === 2) {
        let dayNum = parseInt(day);
        if (dayNum > 31) day = '31';
        if (dayNum === 0) day = '01';
      }

      // Handle month (next 2 digits)
      if (value.length > 2) {
        let month = value.slice(2, 4);
        let monthNum = parseInt(month);
        let yearPart = value.length > 4 ? value.slice(4) : '';
        
        // If starting to type year (5th digit) and month is single digit
        if (value.length > 4 && month.length === 1) {
          month = '0' + month;
        } else if (month.length === 2) {
          // Only validate complete months
          if (monthNum > 12) {
            // If first digit is valid (1-9), treat second digit as start of year
            if (month[0] <= '9' && month[0] >= '1') {
              yearPart = month[1] + yearPart;
              month = '0' + month[0];
            } else {
              month = '12';
            }
          }
          if (monthNum === 0) month = '01';
        }

        // Reconstruct value with all parts
        value = day + month + yearPart;
      } else {
        value = day;
      }
    }

    // Format with dashes
    if (value.length >= 4) {
      value = value.slice(0, 2) + '-' + value.slice(2, 4) + '-' + value.slice(4);
    } else if (value.length >= 2) {
      value = value.slice(0, 2) + '-' + value.slice(2);
    }

    // Update the input value
    input.value = value;

    // Move cursor position after dash when needed
    const cursorPosition = input.selectionStart;
    if (value.length > previousLength && (value.length === 3 || value.length === 6)) {
      input.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
    }
    
    previousLength = value.length;

    // Only validate complete dates
    if (value.length === 10) {
      const isCheckout = input === checkoutInput;
      const checkinDate = isCheckout ? parseDDMMYYYY(checkinInput.value) : null;
      const corrected = clampDateToRange(value, isCheckout, checkinDate);
      if (corrected !== value) {
        input.value = corrected;
      }
    }
  });

  input.addEventListener('keydown', function(e) {
    const cursorPos = input.selectionStart;
    
    // Allow navigation keys
    if (e.ctrlKey || e.metaKey || ['Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      return;
    }

    // Handle backspace at dash positions
    if (e.key === 'Backspace' && input.value[cursorPos - 1] === '-') {
      e.preventDefault();
      const beforeDash = input.value.slice(0, cursorPos - 2);
      const afterDash = input.value.slice(cursorPos);
      input.value = beforeDash + afterDash;
      input.setSelectionRange(cursorPos - 2, cursorPos - 2);
      return;
    }

    // Handle delete at dash positions
    if (e.key === 'Delete' && input.value[cursorPos] === '-') {
      e.preventDefault();
      const beforeDash = input.value.slice(0, cursorPos);
      const afterDash = input.value.slice(cursorPos + 2);
      input.value = beforeDash + afterDash;
      input.setSelectionRange(cursorPos, cursorPos);
      return;
    }

    // Block non-numeric keys except for control keys
    if (!/^\d$/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  });

  input.addEventListener('blur', function() {
    if (input.value.length === 10) {
      const isCheckout = input === checkoutInput;
      const checkinDate = isCheckout ? parseDDMMYYYY(checkinInput.value) : null;
      input.value = clampDateToRange(input.value, isCheckout, checkinDate);
    }
  });
}

function isValidDate(date) {
  return date instanceof Date && !isNaN(date);
}

const checkinInput = document.getElementById('checkin-date');
const checkoutInput = document.getElementById('checkout-date');
setupDateAutoFormat(checkinInput, checkoutInput);
setupDateAutoFormat(checkoutInput, null);

// --- Native Select Dropdown Logic and Form Validation ---
document.addEventListener('DOMContentLoaded', () => {
  // Populate State Dropdown
  const stateSelect = document.getElementById('state-select');
  const citySelect = document.getElementById('city-select');
  states.forEach(state => {
    const option = new Option(state, state);
    stateSelect.add(option);
  });

  // City Dropdown Logic
  stateSelect.addEventListener('change', () => {
    citySelect.innerHTML = '<option value="">Select City</option>';
    citySelect.disabled = !stateSelect.value;
    if (stateSelect.value && stateCities[stateSelect.value]) {
      stateCities[stateSelect.value].forEach(city => {
        const option = new Option(city, city);
        citySelect.add(option);
      });
    }
    validateForm();
  });

  citySelect.addEventListener('change', validateForm);

  // Date input validation
  checkinInput.addEventListener('input', validateForm);
  checkoutInput.addEventListener('input', validateForm);

  function validateForm() {
    const allFilled =
      checkinInput.value.length === 10 &&
      checkoutInput.value.length === 10 &&
      stateSelect.value &&
      citySelect.value;
    document.getElementById('apply-btn').disabled = !allFilled;
  }

  // Submit Handler
  document.getElementById('apply-btn').addEventListener('click', function() {
    const params = new URLSearchParams({
      checkin: checkinInput.value,
      checkout: checkoutInput.value,
      state: stateSelect.value,
      city: citySelect.value
    });
    window.location.href = `hotels.html?${params.toString()}`;
  });
});

checkoutInput.addEventListener('blur', function() {
  if (checkoutInput.value.length === 10 && checkinInput.value.length === 10) {
    const checkinDate = parseDDMMYYYY(checkinInput.value);
    if (checkinDate) {
      checkoutInput.value = clampDateToRange(checkoutInput.value, true, checkinDate);
    }
  }
});

function setupLocationSearch() {
  const searchContainer = document.createElement('div');
  searchContainer.className = 'search-container';
  
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'location-search';
  searchInput.placeholder = 'Search for a place';
  
  const dropdownList = document.createElement('ul');
  dropdownList.className = 'location-dropdown';
  
  // Replace the existing state and city selects with the new search
  const stateSelect = document.getElementById('state-select');
  const citySelect = document.getElementById('city-select');
  const locationInputs = document.createElement('div');
  locationInputs.className = 'location-inputs';
  
  stateSelect.parentNode.replaceChild(locationInputs, stateSelect);
  if (citySelect && citySelect.parentNode) {
    citySelect.parentNode.removeChild(citySelect);
  }
  
  locationInputs.appendChild(searchContainer);
  searchContainer.appendChild(searchInput);
  searchContainer.appendChild(dropdownList);
  
  let selectedLocation = null;
  let selectedState = null;

  // Function to update dropdown with filtered locations
  function updateDropdown(searchText = '', forcedState = null) {
    dropdownList.innerHTML = '';
    const searchLower = searchText.toLowerCase();
    
    // Create a map to group cities by state
    const stateGroups = new Map();
    
    if (forcedState) {
      // When a state is selected, show only its cities
      const cities = stateCities[forcedState].sort((a, b) => a.localeCompare(b));
      stateGroups.set(forcedState, cities);
    } else if (searchText.length < 2) {
      // When no search, show all states with their first few cities
      states.forEach(state => {
        const cities = stateCities[state].slice(0, 3); // Show first 3 cities per state
        stateGroups.set(state, cities);
      });
    } else {
      // When searching, filter states and cities
      allLocations.forEach(location => {
        if (location.text.toLowerCase().includes(searchLower)) {
          if (location.type === 'city') {
            // If we find a matching city, add it to its state group
            if (!stateGroups.has(location.state)) {
              stateGroups.set(location.state, []);
            }
            stateGroups.get(location.state).push(location.city);
          } else {
            // If we find a matching state, add it with its cities
            const cities = stateCities[location.text].slice(0, 3);
            stateGroups.set(location.text, cities);
          }
        }
      });
    }

    // Sort states and create the dropdown items
    Array.from(stateGroups.entries())
      .sort(([stateA], [stateB]) => stateA.localeCompare(stateB))
      .slice(0, 8) // Limit to 8 state groups for scrolling
      .forEach(([state, cities]) => {
        // Create state item if not in forced state mode
        if (!forcedState) {
          const stateItem = document.createElement('li');
          stateItem.className = 'location-item state';
          stateItem.textContent = state;
          stateItem.addEventListener('click', () => {
            selectedState = state;
            searchInput.value = ''; // Clear the input
            searchInput.placeholder = `Select a city in ${state}`; // Update placeholder
            updateDropdown('', state); // Show only cities of this state
            dropdownList.style.display = 'block'; // Keep dropdown open
          });
          dropdownList.appendChild(stateItem);
        } else {
          // Add a "back" button when showing cities of a state
          const backItem = document.createElement('li');
          backItem.className = 'location-item back';
          backItem.textContent = `← Back to all states`;
          backItem.addEventListener('click', () => {
            selectedState = null;
            searchInput.placeholder = 'Search for a place';
            searchInput.value = '';
            updateDropdown('');
            dropdownList.style.display = 'block';
          });
          dropdownList.appendChild(backItem);
        }

        // Create city items
        cities.forEach(city => {
          const cityItem = document.createElement('li');
          cityItem.className = 'location-item city';
          cityItem.textContent = `${city}, ${state}`;
          cityItem.addEventListener('click', () => {
            searchInput.value = `${city}, ${state}`;
            searchInput.placeholder = 'Search for a place';
            selectedLocation = {
              text: `${city}, ${state}`,
              value: `${city},${state}`,
              type: 'city',
              city: city,
              state: state
            };
            selectedState = null;
            dropdownList.style.display = 'none';
            validateForm();
          });
          dropdownList.appendChild(cityItem);
        });
      });
  }
  
  // Show dropdown on click/focus
  searchInput.addEventListener('focus', function() {
    dropdownList.style.display = 'block';
    updateDropdown(this.value, selectedState);
  });
  
  // Update dropdown on input
  searchInput.addEventListener('input', function() {
    dropdownList.style.display = 'block';
    // If in state selection mode and user types, go back to general search
    if (selectedState && this.value) {
      selectedState = null;
      searchInput.placeholder = 'Search for a place';
    }
    updateDropdown(this.value, selectedState);
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!searchContainer.contains(e.target)) {
      dropdownList.style.display = 'none';
    }
  });
  
  // Update form validation
  function validateForm() {
    const allFilled =
      checkinInput.value.length === 10 &&
      checkoutInput.value.length === 10 &&
      selectedLocation !== null &&
      selectedLocation.type === 'city'; // Only allow city selections
    document.getElementById('apply-btn').disabled = !allFilled;
  }
  
  // Update submit handler
  document.getElementById('apply-btn').addEventListener('click', function() {
    if (!selectedLocation || selectedLocation.type !== 'city') return;
    
    const params = new URLSearchParams({
      checkin: checkinInput.value,
      checkout: checkoutInput.value,
      state: selectedLocation.state,
      city: selectedLocation.city
    });
    window.location.href = `hotels.html?${params.toString()}`;
  });
  
  // Add validation listeners
  checkinInput.addEventListener('input', validateForm);
  checkoutInput.addEventListener('input', validateForm);
  searchInput.addEventListener('input', validateForm);
}

// Update the CSS styles
const style = document.createElement('style');
style.textContent = `
.search-container {
  position: relative;
  width: 100%;
}

.location-search {
  width: 100%;
  padding: 14px 16px;
  font-size: 15px;
  border: 1.5px solid #d3dbe3;
  border-radius: 6px;
  background: #f7fafd;
  outline: none;
}

.location-search:focus {
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 2px rgba(26, 182, 79, 0.1);
}

.location-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  height: 320px;
  overflow-y: auto;
  background: white;
  border: 1px solid #d3dbe3;
  border-radius: 6px;
  margin-top: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 9999;
  display: none;
  padding: 0;
}

/* Add container styles to handle dropdown positioning */
.booking-container {
  position: relative;
  z-index: 1;
}

.booking-card {
  position: relative;
  z-index: 1;
}

.input-row {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr) auto;
  gap: 20px;
  align-items: end;
  z-index: 1;
}

.input-group {
  position: relative;
  z-index: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
}

/* Label styling */
.input-group label {
  margin-bottom: 8px;
  font-weight: 500;
}

/* Specific styling for the location input group */
.input-group:nth-child(3) {
  position: relative;
  z-index: 9999;
}

/* When dropdown is open, maintain high z-index */
.input-group:focus-within {
  z-index: 9999;
}

/* Style for the button container */
.primary-cta {
  position: relative;
  z-index: 1;
  height: 51px; /* Match input height exactly */
  padding: 14px 24px;
  border-radius: 6px;
  align-self: flex-end;
  margin-bottom: 1.5px; /* Adjust for input border */
}

.location-item {
  padding: 12px 16px;
  height: 40px;
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.location-item:hover {
  background: #f5f7fa;
}

.location-item.state {
  font-weight: 600;
  color: var(--primary-blue);
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.location-item.back {
  font-weight: 500;
  color: #666;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.location-item.city {
  padding-left: 32px;
  color: var(--text-dark);
  font-size: 14px;
}

.location-dropdown::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.location-dropdown::-webkit-scrollbar-track {
  background: transparent;
}

.location-dropdown::-webkit-scrollbar-thumb {
  background-color: rgba(155, 155, 155, 0.5);
  border-radius: 20px;
  border: 2px solid transparent;
}

.location-dropdown::-webkit-scrollbar-thumb:hover {
  background-color: rgba(155, 155, 155, 0.8);
}

/* Media query for smaller screens */
@media (max-width: 1200px) {
  .input-row {
    grid-template-columns: 1fr 1fr;
  }
  
  .input-group:nth-child(3) {
    grid-column: 1 / -1;
  }
  
  .primary-cta {
    grid-column: 1 / -1;
    margin-top: 20px;
    width: 100%;
    margin-bottom: 0;
  }
}

@media (max-width: 768px) {
  .input-row {
    grid-template-columns: 1fr;
  }
  
  .input-group {
    grid-column: 1 / -1;
  }
}
`;

document.head.appendChild(style);
