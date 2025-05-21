document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const hotelName = params.get('hotel');
  
  if (!hotelName) {
    window.location.href = '/';
    return;
  }
  
  let hotelData = JSON.parse(sessionStorage.getItem('hotelData'));
  if (!hotelData) {
    console.warn('No hotel data found in sessionStorage. Using minimal data from URL.');
    hotelData = {
      name: decodeURIComponent(hotelName),
      overall_rating: 'N/A',
      priceINR: 'Price not available',
      priceRaw: 0,
      description: 'No detailed information available for this hotel.',
      amenities: []
    };
  }
  
  document.getElementById('hotelName').textContent = hotelData.name;
  document.getElementById('hotelRating').textContent = `★ ${hotelData.overall_rating}`;
  document.getElementById('hotelPrice').textContent = hotelData.priceINR;
  document.getElementById('hotelDescription').textContent = hotelData.description || 'No description available';
  document.getElementById('summaryRate').textContent = hotelData.priceINR;
  
  const amenitiesList = document.getElementById('amenitiesList');
  if (hotelData.amenities && hotelData.amenities.length > 0) {
    amenitiesList.innerHTML = hotelData.amenities
      .map(amenity => `<span class="amenity">${amenity}</span>`)
      .join('');
  } else {
    amenitiesList.innerHTML = '<span class="amenity">Information not available</span>';
  }
  const checkInDateInput = document.getElementById('checkInDate');
  const checkOutDateInput = document.getElementById('checkOutDate');
  const guestsInput = document.getElementById('guests');
  
  checkInDateInput.value = hotelData.checkin || '';
  checkOutDateInput.value = hotelData.checkout || '';
  guestsInput.value = '2 Guests'; 
  
  [checkInDateInput, checkOutDateInput, guestsInput].forEach(input => {
    const tooltipText = "This field is set from your search and cannot be modified. Please go back to search to change these details.";
    input.title = tooltipText;
    
    const inputParent = input.parentElement;
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-with-icon';
    inputWrapper.style.display = 'flex';
    inputWrapper.style.alignItems = 'center';
    inputWrapper.style.position = 'relative';
    input.parentNode.insertBefore(inputWrapper, input);
    inputWrapper.appendChild(input);
    
    const infoIcon = document.createElement('i');
    infoIcon.className = 'fas fa-info-circle info-tooltip';
    infoIcon.style.marginLeft = '8px';
    infoIcon.style.color = '#4a6da7';
    infoIcon.style.cursor = 'pointer';
    infoIcon.style.fontSize = '16px';
    infoIcon.style.transition = 'color 0.2s ease';
    infoIcon.addEventListener('mouseenter', () => infoIcon.style.color = '#2c5ae9');
    infoIcon.addEventListener('mouseleave', () => infoIcon.style.color = '#4a6da7');
    let tooltipTimeout;
    
    infoIcon.addEventListener('mouseover', function() {
      if (tooltipTimeout) clearTimeout(tooltipTimeout);
      
      tooltipTimeout = setTimeout(() => {
        let tooltip = document.getElementById('custom-tooltip');
        if (!tooltip) {
          tooltip = document.createElement('div');
          tooltip.id = 'custom-tooltip';
          tooltip.style.position = 'fixed';
          tooltip.style.backgroundColor = '#000000';
          tooltip.style.color = 'white';
          tooltip.style.padding = '10px 14px';
          tooltip.style.borderRadius = '6px';
          tooltip.style.fontSize = '14px';
          tooltip.style.fontWeight = '400';
          tooltip.style.lineHeight = '1.5';
          tooltip.style.zIndex = '1000';
          tooltip.style.maxWidth = '280px';
          tooltip.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
          tooltip.style.border = '1px solid rgba(255,255,255,0.1)';
          tooltip.style.opacity = '0';
          tooltip.style.transition = 'opacity 0.2s ease-in-out';
          tooltip.style.pointerEvents = 'none';
          tooltip.style.whiteSpace = 'normal';
          tooltip.style.wordBreak = 'break-word';
          document.body.appendChild(tooltip);
        }
        tooltip.textContent = tooltipText;
        
        const rect = this.getBoundingClientRect();
        const iconCenterX = rect.left + rect.width / 2 + window.scrollX;
        
        tooltip.style.display = 'block';
        const tooltipWidth = tooltip.offsetWidth;
        
        tooltip.style.left = (iconCenterX - tooltipWidth / 2) + 'px';
        
        tooltip.style.top = (rect.bottom + window.scrollY + 8) + 'px';
        
        tooltip.style.setProperty('--tooltip-arrow', '8px');
        tooltip.style.setProperty('--tooltip-color', '#2c3e50');
        
        setTimeout(() => {
          tooltip.style.opacity = '1';
        }, 10);
      }, 150);
    });
    infoIcon.addEventListener('mouseout', function() {
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }
      
      const tooltip = document.getElementById('custom-tooltip');
      if (tooltip) {
        tooltip.style.opacity = '0';
        setTimeout(() => {
          tooltip.style.display = 'none';
        }, 200);
      }
    });
    
    inputWrapper.appendChild(infoIcon);
  });
  
  const formNote = document.createElement('div');
  formNote.className = 'form-note';
  formNote.innerHTML = `
    <i class="fas fa-info-circle"></i>
    Check-in date, check-out date, and number of guests are set from your search. 
    <a href="/" class="text-link">Return to search</a> to modify these details.
  `;
  document.querySelector('.booking-form').insertBefore(
    formNote, 
    document.querySelector('.form-row')
  );
  
  updateBookingSummary();

  function validateForm() {
    const requiredFields = {
      'fullName': 'Full Name',
      'email': 'Email',
      'phone': 'Phone Number'
    };

    let isValid = true;
    let firstInvalidField = null;
    const errorMessages = [];
    for (const [fieldId, fieldName] of Object.entries(requiredFields)) {
      const field = document.getElementById(fieldId);
      const isFieldValid = field.value.trim() !== '';
      
      field.classList.toggle('invalid-input', !isFieldValid);
      
      if (!isFieldValid) {
        errorMessages.push(`${fieldName} is required`);
        isValid = false;
        if (!firstInvalidField) firstInvalidField = field;
      }
    }
    const emailField = document.getElementById('email');
    if (emailField.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailField.value.trim())) {
        errorMessages.push('Please enter a valid email address (e.g., example@domain.com)');
        emailField.classList.add('invalid-input');
        isValid = false;
        if (!firstInvalidField) firstInvalidField = emailField;
      }
    }

    const phoneField = document.getElementById('phone');
    if (phoneField.value.trim()) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phoneField.value.trim())) {
        errorMessages.push('Phone number must be exactly 10 digits');
        phoneField.classList.add('invalid-input');
        isValid = false;
        if (!firstInvalidField) firstInvalidField = phoneField;
      }
    }

    if (!isValid && errorMessages.length > 0) {
      alert('Please correct the following:\n\n' + errorMessages.join('\n'));
    }

    if (firstInvalidField) {
      firstInvalidField.focus();
    }

    return isValid;
  }
  document.getElementById('bookingForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fill in all required fields correctly.');
      return;
    }
    
    const bookingData = {
      hotel: hotelData.name,
      guest: document.getElementById('fullName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      guests: guestsInput.value,
      checkIn: checkInDateInput.value,
      checkOut: checkOutDateInput.value,
      specialRequests: document.getElementById('specialRequests')?.value.trim() || '',
      totalAmount: document.getElementById('summaryTotal').textContent
    };

    if (confirm(
      `Please confirm your booking details:\n
  Hotel: ${bookingData.hotel}
  Guest Name: ${bookingData.guest}
  Check-in: ${bookingData.checkIn}
  Check-out: ${bookingData.checkOut}
  Number of Guests: ${bookingData.guests}
  Total Amount: ${bookingData.totalAmount}
  
  Click OK to confirm your booking.`
    )) {
      console.log('Booking Data:', bookingData);
      alert('Booking confirmed!\n\nThank you for choosing ' + hotelData.name + '\nA confirmation email will be sent shortly.');
      sessionStorage.removeItem('hotelData');  
      window.location.href = '/';
    }
  });

  const formInputs = document.querySelectorAll('.form-input:not([readonly])');
  formInputs.forEach(input => {
    input.addEventListener('blur', function() {
      if (this.value.trim() === '') {
        this.classList.add('invalid-input');
      } else {
        if (this.id === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const value = this.value.trim();
          
          if (value.length > 0) {
            if (!emailRegex.test(value)) {
              this.classList.add('invalid-input');
              this.title = "Please enter a valid email (e.g., name@example.com)";
            } else {
              this.classList.remove('invalid-input');
              this.title = "";
            }
          }
        }
        else if (this.id === 'phone') {
          const phoneRegex = /^\d{10}$/;
          const value = this.value.trim();
          
          if (value.length > 0) {
            if (!/^\d*$/.test(value)) {
              this.classList.add('invalid-input');
              this.title = "Please enter numbers only";
            } else if (value.length !== 10) {
              this.classList.add('invalid-input');
              this.title = `Phone number must be 10 digits (currently ${value.length} digits)`;
            } else {
              this.classList.remove('invalid-input');
              this.title = "";
            }
          }
        }
        else {
          this.classList.remove('invalid-input');
        }
      }
    });
    input.addEventListener('input', function() {
      this.classList.remove('invalid-input');
    });
  });
  
  function calculateNights(checkInDate, checkOutDate) {
    try {
      const [checkInDay, checkInMonth, checkInYear] = checkInDate.split('-').map(Number);
      const [checkOutDay, checkOutMonth, checkOutYear] = checkOutDate.split('-').map(Number);
      
      if (!checkInDay || !checkInMonth || !checkInYear || 
          !checkOutDay || !checkOutMonth || !checkOutYear) {
        console.error('Invalid date format');
        return 0;
      }
      
      const checkIn = new Date(checkInYear, checkInMonth - 1, checkInDay);
      const checkOut = new Date(checkOutYear, checkOutMonth - 1, checkOutDay);
      
      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        console.error('Invalid date objects');
        return 0;
      }
      
      const timeDiff = checkOut.getTime() - checkIn.getTime();
      const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return nights > 0 ? nights : 0;
    } catch (error) {
      console.error('Error calculating nights:', error);
      return 0;
    }
  }
  
  function updateBookingSummary() {
    try {
      if (!checkInDateInput.value || !checkOutDateInput.value) {
        document.getElementById('summaryNights').textContent = '0';
        document.getElementById('summaryTotal').textContent = '₹0';
        return;
      }

      const nights = calculateNights(checkInDateInput.value, checkOutDateInput.value);
      document.getElementById('summaryNights').textContent = nights;
      const totalAmount = hotelData.priceRaw * nights;
      document.getElementById('summaryTotal').textContent = 
        '₹' + totalAmount.toLocaleString('en-IN');
    } catch (error) {
      console.error('Error updating booking summary:', error);
      document.getElementById('summaryNights').textContent = '0';
      document.getElementById('summaryTotal').textContent = '₹0';
    }
  }
});
