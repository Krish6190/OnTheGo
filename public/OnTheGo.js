let states = [];
let stateCities = {};
let allLocations = [];
fetch('india-states-cities.json')
  .then(response => response.json())
  .then(data => {
    states = data.states.sort((a, b) => a.localeCompare(b));
    stateCities = data.stateCities;
    
    states.forEach(state => {
      allLocations.push({ text: state, value: state, type: 'state' });
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
    const maxDate = new Date((new Date().getFullYear() + 2), 11, 31);
    if (inputDate < tomorrow) return getTomorrowDDMMYYYY();
    if (inputDate > maxDate) return getMaxDDMMYYYY();
  }
  
  return dateStr;
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
    let value = input.value.replace(/\D/g, '');
    if (value.length > 8) {
      value = value.slice(0, 8);
    }

    if (value.length > 0) {
      let day = value.slice(0, 2);
      if (value.length > 2 && day.length === 1) {
        day = '0' + day;
      }
      if (day.length === 2) {
        let dayNum = parseInt(day);
        if (dayNum > 31) day = '31';
        if (dayNum === 0) day = '01';
      }

      if (value.length > 2) {
        let month = value.slice(2, 4);
        let monthNum = parseInt(month);
        let yearPart = value.length > 4 ? value.slice(4) : '';
        
        if (value.length > 4 && month.length === 1) {
          month = '0' + month;
        } else if (month.length === 2) {
          if (monthNum > 12) {
            if (month[0] <= '9' && month[0] >= '1') {
              yearPart = month[1] + yearPart;
              month = '0' + month[0];
            } else {
              month = '12';
            }
          }
          if (monthNum === 0) month = '01';
        }

        value = day + month + yearPart;
      } else {
        value = day;
      }
    }

    if (value.length >= 4) {
      value = value.slice(0, 2) + '-' + value.slice(2, 4) + '-' + value.slice(4);
    } else if (value.length >= 2) {
      value = value.slice(0, 2) + '-' + value.slice(2);
    }

    input.value = value;
    const cursorPosition = input.selectionStart;
    if (value.length > previousLength && (value.length === 3 || value.length === 6)) {
      input.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
    }
    
    previousLength = value.length;

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
    
    if (e.ctrlKey || e.metaKey || ['Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      return;
    }

    if (e.key === 'Backspace' && input.value[cursorPos - 1] === '-') {
      e.preventDefault();
      const beforeDash = input.value.slice(0, cursorPos - 2);
      const afterDash = input.value.slice(cursorPos);
      input.value = beforeDash + afterDash;
      input.setSelectionRange(cursorPos - 2, cursorPos - 2);
      return;
    }

    if (e.key === 'Delete' && input.value[cursorPos] === '-') {
      e.preventDefault();
      const beforeDash = input.value.slice(0, cursorPos);
      const afterDash = input.value.slice(cursorPos + 2);
      input.value = beforeDash + afterDash;
      input.setSelectionRange(cursorPos, cursorPos);
      return;
    }

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

document.addEventListener('DOMContentLoaded', () => {
  const stateSelect = document.getElementById('state-select');
  const citySelect = document.getElementById('city-select');
  states.forEach(state => {
    const option = new Option(state, state);
    stateSelect.add(option);
  });

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

  function updateDropdown(searchText = '', forcedState = null) {
    dropdownList.innerHTML = '';
    const searchLower = searchText.toLowerCase();
    
    const stateGroups = new Map();
    
    if (forcedState) {
      const cities = stateCities[forcedState].sort((a, b) => a.localeCompare(b));
      stateGroups.set(forcedState, cities);
    } else if (searchText.length < 2) {
      states.forEach(state => {
        const cities = stateCities[state].slice(0, 3);
        stateGroups.set(state, cities);
      });
    } else {
      allLocations.forEach(location => {
        if (location.text.toLowerCase().includes(searchLower)) {
          if (location.type === 'city') {
            if (!stateGroups.has(location.state)) {
              stateGroups.set(location.state, []);
            }
            stateGroups.get(location.state).push(location.city);
          } else {
            const cities = stateCities[location.text].slice(0, 3);
            stateGroups.set(location.text, cities);
          }
        }
      });
    }

    Array.from(stateGroups.entries())
      .sort(([stateA], [stateB]) => stateA.localeCompare(stateB))
      .slice(0, 8)
      .forEach(([state, cities]) => {
        if (!forcedState) {
          const stateItem = document.createElement('li');
          stateItem.className = 'location-item state';
          stateItem.textContent = state;
          stateItem.addEventListener('click', () => {
            selectedState = state;
            searchInput.value = ''; 
            searchInput.placeholder = `Select a city in ${state}`; 
            updateDropdown('', state);
            dropdownList.style.display = 'block'; 
            positionDropdownAboveIfNeeded(searchInput, dropdownList);
          });
          dropdownList.appendChild(stateItem);
        } else {
          const backItem = document.createElement('li');
          backItem.className = 'location-item back';
          backItem.textContent = `← Back to all states`;
          backItem.addEventListener('click', () => {
            selectedState = null;
            searchInput.placeholder = 'Search for a place';
            searchInput.value = '';
            updateDropdown('');
            dropdownList.style.display = 'block';
            positionDropdownAboveIfNeeded(searchInput, dropdownList);
          });
          dropdownList.appendChild(backItem);
        }

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

  function positionDropdownAboveIfNeeded(inputElem, dropdownElem, dropdownHeight = 320) {
    dropdownElem.classList.remove('above');
    dropdownElem.style.top = '';
    dropdownElem.style.bottom = '';

    const inputRect = inputElem.getBoundingClientRect();
    const spaceBelow = window.innerHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;

    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      dropdownElem.classList.add('above');
    }
  }

  searchInput.addEventListener('focus', function() {
    dropdownList.style.display = 'block';
    updateDropdown(this.value, selectedState);
    positionDropdownAboveIfNeeded(searchInput, dropdownList);
  });
  
  searchInput.addEventListener('input', function() {
    dropdownList.style.display = 'block';
    if (selectedState && this.value) {
      selectedState = null;
      searchInput.placeholder = 'Search for a place';
    }
    updateDropdown(this.value, selectedState);
    positionDropdownAboveIfNeeded(searchInput, dropdownList);
  });
  
  document.addEventListener('click', function(e) {
    if (!searchContainer.contains(e.target)) {
      dropdownList.style.display = 'none';
    }
  });
  
  function validateForm() {
    const allFilled =
      checkinInput.value.length === 10 &&
      checkoutInput.value.length === 10 &&
      selectedLocation !== null &&
      selectedLocation.type === 'city'; 
    document.getElementById('apply-btn').disabled = !allFilled;
  }
  
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
  
  checkinInput.addEventListener('input', validateForm);
  checkoutInput.addEventListener('input', validateForm);
  searchInput.addEventListener('input', validateForm);
}
