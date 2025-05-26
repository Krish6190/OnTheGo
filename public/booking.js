document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const hotelName = params.get('hotel');
  
  if (!hotelName) {
    window.location.href = '/';
    return;
  }
  
  let hotelData = JSON.parse(sessionStorage.getItem('hotelData'));
  const guestsParam = params.get('guests');
  
  if (!hotelData) {
    hotelData = {
      name: decodeURIComponent(hotelName),
      overall_rating: 'N/A',
      priceINR: 'Price not available',
      priceRaw: 0,
      description: 'No detailed information available for this hotel.',
      amenities: [],
      guests: guestsParam ? parseInt(guestsParam) : 2
    };
  } else {
    if (guestsParam) {
      hotelData.guests = parseInt(guestsParam);
    } else if (!hotelData.guests) {
      hotelData.guests = 2;
    }
  }
  
  document.getElementById('summaryRate').textContent = hotelData.priceINR;


  const imageUrl = hotelData.photos?.[0] || hotelData.thumbnail || 'https://placehold.co/800x400?text=Hotel';

  const imageAndRatingHTML = `
      <div class="image-rating-row">
          <div class="hotel-image-large">
              <img src="${imageUrl}" 
                   alt="${hotelData.name}" 
                   onerror="this.src='https://placehold.co/800x400?text=Hotel'"
                   style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div class="hotel-rating-container">
              <div class="hotel-rating" id="hotelRating">★ ${hotelData.overall_rating}</div>
              <div class="hotel-price" id="hotelPrice">${hotelData.priceINR}</div>
              <button class="primary-cta quick-book-btn">Scroll to Booking</button>
          </div>
      </div>
      <div class="section-divider"></div>
  `;
  
  const descriptionAmenitiesHTML = `
      <div class="description-amenities-section">
          <div id="hotelDescription" class="description-full">${hotelData.description || 'No description available'}</div>
          <div class="amenities-container">
              <h3>Amenities</h3>
              <div id="amenitiesList" class="amenities">
                  ${hotelData.amenities && hotelData.amenities.length > 0 
                      ? hotelData.amenities.map(amenity => `<span class="amenity">${amenity}</span>`).join('')
                      : '<span class="amenity">Information not available</span>'}
              </div>
          </div>
      </div>
      <div class="section-divider"></div>
  `;
  
  const informationHTML = `
      <div class="hotel-information-section">
          <h3>Location Information</h3>
          <p>${hotelData.location || 'Location information not available'}</p>
          ${hotelData.checkin && hotelData.checkout ? 
            `<p><strong>Stay Dates:</strong> ${hotelData.checkin} to ${hotelData.checkout}</p>` : ''}
      </div>
      <div class="section-divider"></div>
  `;
  
  document.getElementById('hotelName').innerHTML = hotelData.name;
  
  document.querySelector('.hotel-info-booking').innerHTML = 
      imageAndRatingHTML + descriptionAmenitiesHTML + informationHTML;
  const img = document.querySelector('.hotel-image-large img');
  img.addEventListener('error', function() {
      this.src = 'https://placehold.co/800x400?text=Hotel';
  });
  
  document.querySelector('.quick-book-btn').addEventListener('click', function() {
      document.getElementById('bookNowBtn').scrollIntoView({ behavior: 'smooth' });
  });
  
  const checkInDateInput = document.getElementById('checkInDate');
  const checkOutDateInput = document.getElementById('checkOutDate');
  const guestsInput = document.getElementById('guests');

  function formatDate(dateStr) {
    if (!dateStr) return '';
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}-${month}-${year}`;
    }
    return dateStr;
  }

  checkInDateInput.value = formatDate(hotelData.checkin) || '';
  checkOutDateInput.value = formatDate(hotelData.checkout) || '';
  const guestCount = parseInt(hotelData.guests) || 2;
  guestsInput.value = `${guestCount} guests`;

  checkInDateInput.title = "This field is set from your search and cannot be modified. Please go back to search to change these details.";
  checkOutDateInput.title = "This field is set from your search and cannot be modified. Please go back to search to change these details.";
  guestsInput.title = "This field is set from your search and cannot be modified. Please go back to search to change these details.";
  
  updateBookingSummary();
  
  [checkInDateInput, checkOutDateInput, guestsInput].forEach(input => {
    const tooltipText = "This field is set from your search and cannot be modified. Please go back to search to change these details.";
    
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
          tooltip.style.zIndex = '10000'; 
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
        tooltip.textContent = input.title;
        
        const rect = this.getBoundingClientRect();
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

        tooltip.style.display = 'block';
        const tooltipWidth = tooltip.offsetWidth;

        tooltip.style.position = 'fixed';
        tooltip.style.left = (rect.left + (rect.width / 2) - (tooltipWidth / 2)) + 'px';
        tooltip.style.top = (rect.bottom + 8) + 'px';
        
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
      guests: guestCount,
      checkIn: checkInDateInput.value,
      checkOut: checkOutDateInput.value,
      specialRequests: document.getElementById('specialRequests')?.value.trim() || '',
      totalAmount: document.getElementById('summaryTotal').textContent
    };

    let guestCount;
    if (guestsInput && guestsInput.value) {
      guestCount = parseInt(guestsInput.value) || parseInt(hotelData.guests) || 2;
    } else {
      guestCount = parseInt(hotelData.guests) || 2;
    }
    const roomsNeeded = Math.ceil(guestCount / 2);
    
    if (confirm(
      `Please confirm your booking details:\n
  Hotel: ${bookingData.hotel}
  Guest Name: ${bookingData.guest}
  Check-in: ${bookingData.checkIn}
  Check-out: ${bookingData.checkOut}
  Number of Guests: ${bookingData.guests} guest${bookingData.guests > 1 ? 's' : ''}
  Number of Rooms: ${roomsNeeded}
  Total Amount: ${bookingData.totalAmount}
  
  Click OK to confirm your booking.`
    )) {
      alert('Booking confirmed!\n\nThank you for choosing ' + hotelData.name + '\nA confirmation email will be sent shortly.');
      

      window.location.href = '/';
      sessionStorage.removeItem('hotelData');
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
    const [checkInDay, checkInMonth, checkInYear] = checkInDate.split('-').map(Number);
    const [checkOutDay, checkOutMonth, checkOutYear] = checkOutDate.split('-').map(Number);
    
    if (!checkInDay || !checkInMonth || !checkInYear || 
        !checkOutDay || !checkOutMonth || !checkOutYear) {
      return 0;
    }
    
    const checkIn = new Date(checkInYear, checkInMonth - 1, checkInDay);
    const checkOut = new Date(checkOutYear, checkOutMonth - 1, checkOutDay);
    
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return 0;
    }
    
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return nights > 0 ? nights : 0;
  }
  
  function updateBookingSummary() {
    const nights = calculateNights(checkInDateInput.value, checkOutDateInput.value);
    
    document.getElementById('summaryNights').textContent = nights || '--';

    let guestCount;
    if (guestsInput && guestsInput.value) {
      guestCount = parseInt(guestsInput.value) || parseInt(hotelData.guests) || 2;
    } else {
      guestCount = parseInt(hotelData.guests) || 2;
    }
    const roomsNeeded = Math.ceil(guestCount / 2);
    
    const summaryTable = document.querySelector('.booking-summary');
    
    let roomRow = document.getElementById('summaryRooms');
    if (!roomRow) {
      roomRow = document.createElement('div');
      roomRow.id = 'summaryRooms';
      roomRow.className = 'summary-row';
      roomRow.innerHTML = `
        <span>Number of Rooms:</span>
        <span>${roomsNeeded} room${roomsNeeded > 1 ? 's' : ''} (${guestCount} guest${guestCount > 1 ? 's' : ''}, max 2 per room)</span>
      `;
      
      const totalRow = summaryTable.querySelector('.summary-row.total');
      if (totalRow) {
        summaryTable.insertBefore(roomRow, totalRow);
      } else {
        summaryTable.appendChild(roomRow);
      }
    } else {
      roomRow.querySelector('span:last-child').textContent = 
        `${roomsNeeded} room${roomsNeeded > 1 ? 's' : ''} (${guestCount} guest${guestCount > 1 ? 's' : ''}, max 2 per room)`;
    }

    let price = 0;
    if (hotelData.priceRaw) {
        price = parseFloat(hotelData.priceRaw);
    } else if (hotelData.priceINR) {
        const priceStr = hotelData.priceINR.replace(/[₹,]/g, '');
        const matches = priceStr.match(/\d+/);
        if (matches) {
            price = parseFloat(matches[0]);
        }
    }

    if (nights > 0 && price > 0) {
        const totalAmount = price * nights * roomsNeeded;
        document.getElementById('summaryTotal').textContent = 
            '₹' + totalAmount.toLocaleString('en-IN');
    } else {
        document.getElementById('summaryTotal').textContent = '--';
    }
  }  
});   
