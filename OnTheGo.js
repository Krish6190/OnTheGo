// --- State/City Data (alphabetical) ---
const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal"
];

const stateCities = {
  "Andhra Pradesh": ["Guntur", "Kurnool", "Nellore", "Vijayawada", "Visakhapatnam"].sort(),
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat"].sort(),
  "Assam": ["Dibrugarh", "Guwahati", "Silchar"].sort(),
  "Bihar": ["Bhagalpur", "Gaya", "Patna"].sort(),
  "Chhattisgarh": ["Bhilai", "Bilaspur", "Raipur"].sort(),
  "Delhi": ["Dwarka", "New Delhi", "Rohini"].sort(),
  "Goa": ["Margao", "Panaji", "Vasco da Gama"].sort(),
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara"].sort(),
  "Haryana": ["Faridabad", "Gurugram", "Panipat"].sort(),
  "Himachal Pradesh": ["Mandi", "Shimla", "Solan"].sort(),
  "Jharkhand": ["Dhanbad", "Jamshedpur", "Ranchi"].sort(),
  "Karnataka": ["Bengaluru", "Hubballi–Dharwad", "Mysuru"].sort(),
  "Kerala": ["Kochi", "Kozhikode", "Thiruvananthapuram"].sort(),
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur"].sort(),
  "Maharashtra": ["Mumbai", "Nagpur", "Pune"].sort(),
  "Manipur": ["Bishnupur", "Imphal", "Thoubal"].sort(),
  "Meghalaya": ["Nongstoin", "Shillong", "Tura"].sort(),
  "Mizoram": ["Aizawl", "Lunglei", "Saiha"].sort(),
  "Nagaland": ["Dimapur", "Kohima", "Mokokchung"].sort(),
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela"].sort(),
  "Punjab": ["Amritsar", "Jalandhar", "Ludhiana"].sort(),
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota"].sort(),
  "Sikkim": ["Gangtok", "Geyzing", "Namchi"].sort(),
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"].sort(),
  "Telangana": ["Hyderabad", "Nizamabad", "Warangal"].sort(),
  "Tripura": ["Agartala", "Dharmanagar", "Udaipur"].sort(),
  "Uttar Pradesh": ["Ghaziabad", "Kanpur", "Lucknow"].sort(),
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee"].sort(),
  "West Bengal": ["Durgapur", "Howrah", "Kolkata"].sort()
};

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
function clampDateToRange(dateStr) {
  const [dd, mm, yyyy] = dateStr.split('-').map(Number);
  if (!dd || !mm || !yyyy) return getTomorrowDDMMYYYY();
  let inputDate = new Date(yyyy, mm - 1, dd);
  inputDate.setHours(0,0,0,0);
  const tomorrow = new Date();
  tomorrow.setHours(0,0,0,0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxDate = new Date((new Date().getFullYear() + 2), 11, 31);
  if (inputDate < tomorrow) return getTomorrowDDMMYYYY();
  if (inputDate > maxDate) return getMaxDDMMYYYY();
  let day = Math.max(1, Math.min(dd, 31));
  let month = Math.max(1, Math.min(mm, 12));
  let year = Math.max(tomorrow.getFullYear(), Math.min(yyyy, maxDate.getFullYear()));
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) day = daysInMonth;
  return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
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
  input.addEventListener('input', function() {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    let formatted = '';
    if (value.length >= 2) {
      formatted += value.slice(0, 2) + '-';
    } else {
      formatted += value;
    }
    if (value.length >= 4) {
      formatted += value.slice(2, 4) + '-';
      formatted += value.slice(4);
    } else if (value.length > 2) {
      formatted += value.slice(2);
    }
    input.value = formatted;
    if (value.length === 8) {
      const corrected = clampDateToRange(formatted);
      input.value = corrected;
      input.blur();
      if (otherInput) clampCheckoutToCheckin();
    }
  });
  input.addEventListener('keydown', function(e) {
    if (
      e.ctrlKey || e.metaKey ||
      ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(e.key)
    ) {
      return;
    }
    if (!/\d/.test(e.key)) {
      e.preventDefault();
    }
  });
  input.addEventListener('blur', function() {
    if (input.value.length === 10) {
      input.value = clampDateToRange(input.value);
      if (otherInput) clampCheckoutToCheckin();
    }
  });
}
const checkinInput = document.getElementById('checkin-date');
const checkoutInput = document.getElementById('checkout-date');
setupDateAutoFormat(checkinInput, checkoutInput);
setupDateAutoFormat(checkoutInput, null);

function clampCheckoutToCheckin() {
  const checkinVal = checkinInput.value;
  const checkoutVal = checkoutInput.value;
  if (checkinVal.length === 10) {
    const checkinDate = parseDDMMYYYY(checkinVal);
    let minCheckout = new Date(checkinDate.getTime());
    minCheckout.setDate(minCheckout.getDate() + 1);
    if (checkoutVal.length === 10) {
      const checkoutDate = parseDDMMYYYY(checkoutVal);
      if (checkoutDate < minCheckout) {
        checkoutInput.value = formatDDMMYYYY(minCheckout);
      }
    } else {
      checkoutInput.value = formatDDMMYYYY(minCheckout);
    }
  }
}
checkoutInput.addEventListener('blur', clampCheckoutToCheckin);
checkinInput.addEventListener('blur', clampCheckoutToCheckin);

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
