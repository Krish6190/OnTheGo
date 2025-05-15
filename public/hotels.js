document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const hotelContainer = document.getElementById('hotelContainer');
  // No need for backendUrl if frontend and backend are on same domain

  async function fetchHotels() {
    hotelContainer.innerHTML = '<div class="loading">Loading hotels...</div>';
    
    try {
      // FIX: Use the correct endpoint!
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

  const USD_TO_INR = 83; // Update this rate as needed

  hotels.forEach(hotel => {
    // Extract the price as a number from possible formats
    let priceUSD = hotel.rate_per_night?.lowest || hotel.price_per_night || hotel.price || '';
    if (typeof priceUSD === 'string') {
      priceUSD = priceUSD.replace(/[^0-9.]/g, ''); // Remove any non-numeric
    }
    let priceINR = 'N/A';
    if (priceUSD) {
      priceINR = '₹' + Math.round(Number(priceUSD) * USD_TO_INR).toLocaleString('en-IN') + '/night';
    }

    const card = document.createElement('div');
    card.className = 'hotel-card';
    card.innerHTML = `
      ${hotel.images?.length ? `
        <img src="${hotel.images[0]}" alt="${hotel.name}" 
             class="hotel-image" loading="lazy">` : ''}
      <div class="hotel-info">
        <h3>${hotel.name || 'Unnamed Hotel'}</h3>
        <div class="hotel-rating">★ ${hotel.overall_rating || 'N/A'}</div>
        <div class="hotel-price">${priceINR}</div>
        ${hotel.description ? `<p class="description">${hotel.description}</p>` : ''}
        ${hotel.amenities?.length ? `
          <div class="amenities">
            ${hotel.amenities.map(a => `<span class="amenity">${a}</span>`).join('')}
          </div>` : ''}
      </div>
    `;
    hotelContainer.appendChild(card);
  });
}


  fetchHotels();
});
