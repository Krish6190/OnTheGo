document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const hotelContainer = document.getElementById('hotelContainer');

  async function fetchHotels() {
    hotelContainer.innerHTML = '<div class="loading">Loading hotels...</div>';
    
    try {
      const response = await fetch(`/api/hotels?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const hotels = await response.json();
      showHotels(hotels);
    } catch (error) {
      console.error('Fetch Error:', error);
      hotelContainer.innerHTML = `
        <div class="error">
          Error loading hotels: ${error.message}<br>
          Please try again later.
        </div>
      `;
    }
  }

function showHotels(hotels) {
  hotelContainer.innerHTML = '';

  if (!hotels.length) {
    hotelContainer.innerHTML = '<div class="error">No hotels found for your search criteria.</div>';
    return;
  }

  const USD_TO_INR = 83; // Update this rate 

  const hotelsWithINR = hotels.map(hotel => {
    let priceUSD = hotel.rate_per_night?.lowest || hotel.price_per_night || hotel.price || '';
    if (typeof priceUSD === 'string') {
      priceUSD = priceUSD.replace(/[^0-9.]/g, '');
    }
    let priceINR = 'N/A';
    let priceRaw = 0;
    if (priceUSD) {
      priceRaw = Math.round(Number(priceUSD) * USD_TO_INR);
      priceINR = '₹' + priceRaw.toLocaleString('en-IN') + '/night';
    }
    return { 
      ...hotel, 
      priceINR, 
      priceRaw, 
      location: params.get('city') + ', ' + params.get('state') || 'India',
      checkin: params.get('checkin'),
      checkout: params.get('checkout')
    };
  }).filter(hotel => hotel.priceINR !== 'N/A'); // Filter out unavailabe hotels

  if (!hotelsWithINR.length) {
    hotelContainer.innerHTML = '<div class="error">No hotels with valid price found for your search criteria.</div>';
    return;
  }

  hotelsWithINR.forEach(hotel => {
    const card = document.createElement('div');
    card.className = 'hotel-card';
    card.innerHTML = `
      <div class="hotel-info">
        <h3>${hotel.name || 'Unnamed Hotel'}</h3>
        <div class="hotel-rating">★ ${hotel.overall_rating || 'N/A'}</div>
        <div class="hotel-price">${hotel.priceINR}</div>
        ${hotel.description ? `<p class="description">${hotel.description}</p>` : ''}
        ${hotel.amenities?.length ? `
          <div class="amenities">
            ${hotel.amenities.map(a => `<span class="amenity">${a}</span>`).join('')}
          </div>` : ''}
        <a href="#" class="primary-cta hotel-booking-btn">Book Now</a>
      </div>
      <br>
    `;
    hotelContainer.appendChild(card);

    const bookNowBtn = card.querySelector('.hotel-booking-btn');
    bookNowBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const hotelData = {
        name: hotel.name || 'Unnamed Hotel',
        overall_rating: hotel.overall_rating || 'N/A',
        priceINR: hotel.priceINR,
        priceRaw: hotel.priceRaw,
        description: hotel.description || 'No description available',
        amenities: hotel.amenities || [],
        location: hotel.location,
        checkin: hotel.checkin,
        checkout: hotel.checkout
      };

      sessionStorage.setItem('hotelData', JSON.stringify(hotelData));

      window.location.href = `/bookings?hotel=${encodeURIComponent(hotel.name || 'Unnamed Hotel')}`;
    });
  });
}


  fetchHotels();
});