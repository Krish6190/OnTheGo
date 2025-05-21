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

  const USD_TO_INR = 83;

  const hotelsWithINR = hotels.map(hotel => {
    let priceUSD = hotel.rate_per_night?.lowest || hotel.price_per_night || hotel.price || '';
    if (typeof priceUSD === 'string') {
      priceUSD = priceUSD.replace(/[^0-9.]/g, '');
    }
    let priceINR = 'N/A';
    let priceRaw = 0;
    if (priceUSD) {
      priceRaw = Math.round(Number(priceUSD) * USD_TO_INR);
      if (isNaN(priceRaw) || priceRaw <= 0) {
        priceRaw = 0;
        priceINR = 'Price on request';
      } else {
        priceINR = '₹' + priceRaw.toLocaleString('en-IN') + '/night';
      }
    }
    return { 
      ...hotel, 
      priceINR, 
      priceRaw, 
      location: (params.get('city') && params.get('state')) 
        ? `${params.get('city')}, ${params.get('state')}` 
        : 'Location not available',
      checkin: params.get('checkin'),
      checkout: params.get('checkout')
    };
  }).filter(hotel => hotel.priceINR !== 'N/A');

  if (!hotelsWithINR.length) {
    hotelContainer.innerHTML = '<div class="error">No hotels with valid price found for your search criteria.</div>';
    return;
  }

  hotelsWithINR.forEach(hotel => {
    const card = document.createElement('div');
    card.className = 'hotel-card';
    card.innerHTML = `
      <div class="hotel-card-content">
        <div class="hotel-image">
          <img src="${hotel.thumbnail || hotel.photos?.[0] || 'https://placehold.co/200x150?text=Hotel'}" 
               alt="${hotel.name || 'Hotel image'}"
               onerror="this.src='https://placehold.co/200x150?text=Hotel'">
        </div>
        <div class="hotel-info">
          <h3>${hotel.name || 'Unnamed Hotel'}</h3>
          <div class="hotel-rating">★ ${hotel.overall_rating || 'N/A'}</div>
          <div class="hotel-price">${hotel.priceINR}</div>
          ${hotel.description ? `<p class="description">${hotel.description}</p>` : ''}
          ${hotel.amenities?.length ? `
            <div class="amenities">
              ${hotel.amenities.map(a => `<span class="amenity">${a}</span>`).join('')}
            </div>` : ''}
          <div class="booking-actions">
            <a href="#" class="primary-cta hotel-booking-btn">
              <span class="btn-text">Book Now</span>
              <span class="btn-loading" style="display: none;">
                <i class="fas fa-spinner fa-spin"></i> Processing...
              </span>
            </a>
          </div>
        </div>
      </div>
    `;
    console.log('Hotel image data:', {
        name: hotel.name,
        thumbnail: hotel.thumbnail,
        photos: hotel.photos
    });
    
    hotelContainer.appendChild(card);

    const bookNowBtn = card.querySelector('.hotel-booking-btn');
    bookNowBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const btnText = bookNowBtn.querySelector('.btn-text');
      const btnLoading = bookNowBtn.querySelector('.btn-loading');
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline-block';
      bookNowBtn.disabled = true;
      
      try {
        if (!hotel.checkin || !hotel.checkout) {
          throw new Error('Invalid booking dates');
        }
        
        const hotelData = {
          name: hotel.name || 'Unnamed Hotel',
          overall_rating: hotel.overall_rating || 'N/A',
          priceINR: hotel.priceINR,
          priceRaw: hotel.priceRaw || 0,
          description: hotel.description || 'No description available',
          amenities: hotel.amenities || [],
          location: hotel.location || 'Location not specified',
          checkin: hotel.checkin,
          checkout: hotel.checkout,
          photos: hotel.photos || [],
          guests: '2 Guests',
          booking_time: new Date().toISOString(),
          search_params: {
            city: params.get('city'),
            state: params.get('state')
          }
        };

        sessionStorage.setItem('hotelData', JSON.stringify(hotelData));
        window.location.href = `/bookings?hotel=${encodeURIComponent(hotelData.name)}`;
      } catch (error) {

        btnText.style.display = 'inline-block';
        btnLoading.style.display = 'none';
        bookNowBtn.disabled = false;
        
        if (error.message === 'Invalid booking dates') {
          alert('Invalid booking dates. Please return to search and select valid dates.');
          window.location.href = '/';
        } else {
          alert('There was an error processing your booking. Please try again.');
        }
      }
    });
  });
} 

fetchHotels();
}); 
