document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const hotelName = params.get('hotel');
  
  if (!hotelName) {
    // If no hotel name is provided, redirect to home page
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
  
  if (hotelData.checkin && hotelData.checkout) {
    checkInDateInput.value = hotelData.checkin;
    checkOutDateInput.value = hotelData.checkout;
  } else {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = formatDate(tomorrow);
    checkInDateInput.value = tomorrowFormatted;
    
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const dayAfterTomorrowFormatted = formatDate(dayAfterTomorrow);
    checkOutDateInput.value = dayAfterTomorrowFormatted;
  }
  
  updateBookingSummary();
  
  checkInDateInput.addEventListener('change', updateBookingSummary);
  checkOutDateInput.addEventListener('change', updateBookingSummary);
  
  document.getElementById('bookingForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const bookingData = {
      hotel: hotelData.name,
      guest: document.getElementById('fullName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      guests: document.getElementById('guests').value,
      checkIn: checkInDateInput.value,
      checkOut: checkOutDateInput.value,
      specialRequests: document.getElementById('specialRequests')?.value || '',
      totalAmount: document.getElementById('summaryTotal').textContent
    };

    console.log('Booking Data:', bookingData);
    
    alert('Booking confirmed! Thank you for choosing ' + hotelData.name);
    
    window.location.href = '/';
  });
  
  function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  
  function calculateNights(checkInDate, checkOutDate) {
    const checkIn = parseDate(checkInDate);
    const checkOut = parseDate(checkOutDate);
    
    if (!checkIn || !checkOut) return 0;
    
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return nights > 0 ? nights : 0;
  }
  
  function parseDate(dateString) {
    const [day, month, year] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  function updateBookingSummary() {
    const nights = calculateNights(checkInDateInput.value, checkOutDateInput.value);
    const totalAmount = hotelData.priceRaw * nights;
    
    document.getElementById('summaryNights').textContent = nights;
    document.getElementById('summaryTotal').textContent = '₹' + totalAmount.toLocaleString('en-IN');
    
    const bookNowBtn = document.getElementById('bookNowBtn');
    if (bookNowBtn) {
      bookNowBtn.disabled = nights <= 0;
    }
  }
});
