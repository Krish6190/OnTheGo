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

  hotels.forEach(hotel => {
    // Get price as a number or string, remove $ if present, and format as INR
    let price = hotel.rate_per_night?.lowest || hotel.price_per_night || hotel.price || '';
    if (typeof price === 'string') {
      price = price.replace(/[^0-9.]/g, ''); // Remove any $ or non-numeric
    }
    if (price) {
      // Format as Indian Rupees with commas
      price = '₹' + Number(price).toLocaleString('en-IN') + '/night';
    } else {
      price = '₹N/A/night';
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
        <div class="hotel-price">${price}</div>
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
