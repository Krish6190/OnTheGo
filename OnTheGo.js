const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Delhi"
];
const stateCities = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kakinada", "Kadapa", "Anantapur", "Eluru", "Ongole", "Nandyal", "Machilipatnam", "Adoni", "Tenali", "Chittoor", "Proddatur", "Hindupur", "Srikakulam"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Bomdila", "Roing", "Tezu", "Aalo", "Daporijo", "Changlang", "Khonsa", "Seppa", "Yingkiong", "Namsai", "Anini", "Along", "Dirang", "Pangin", "Ruksin"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Karimganj", "Golaghat", "Dhubri", "Bongaigaon", "Sivasagar", "North Lakhimpur", "Goalpara", "Barpeta", "Lanka", "Diphu", "Hailakandi", "Mangaldoi", "Dhekiajuli"],
  // ... Add other states similarly (for brevity, not all are filled here)
  "Delhi": ["New Delhi", "Dwarka", "Rohini", "Pitampura", "Saket", "Karol Bagh", "Janakpuri", "Lajpat Nagar", "Vasant Kunj", "Connaught Place", "Mayur Vihar", "Shahdara", "Narela", "Okhla", "Greater Kailash", "Chandni Chowk", "Rajouri Garden", "Tilak Nagar", "Vikaspuri", "Preet Vihar"],
};

function filterList(list, query) {
  query = query.trim().toLowerCase();
  return list.filter(item => item.toLowerCase().includes(query));
}

function createDropdown(dropdownEl, options, maxVisible, onSelect, selectedValue = "") {
  dropdownEl.innerHTML = "";
  options.slice(0, maxVisible).forEach(option => {
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

// --- State Dropdown ---
const stateInput = document.getElementById('state-input');
const stateDropdown = document.getElementById('state-dropdown');
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
  createDropdown(stateDropdown, filtered, 6, (state) => {
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
  createDropdown(cityDropdown, filtered, 20, (city) => {
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
