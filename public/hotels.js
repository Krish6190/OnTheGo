document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const hotelContainer = document.getElementById('hotelContainer');
  const backendUrl = 'https://onthego-jiti.onrender.com'; // Replace with your Render URL

  async function fetchHotels() {
    hotelContainer.innerHTML = '<div class="loading">Loading hotels...</div>';
    
    try {
      const response = await fetch(`${backendUrl}?${params.toString()}`);
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
      const card = document.createElement('div');
      card.className = 'hotel-card';
      card.innerHTML = `
        ${hotel.images?.length ? `
          <img src="${hotel.images[0]}" alt="${hotel.name}" 
               class="hotel-image" loading="lazy">` : ''}
        <div class="hotel-info">
          <h3>${hotel.name || 'Unnamed Hotel'}</h3>
          <div class="price-rating">
            <span class="hotel-price">₹${hotel.rate_per_night?.lowest || 'N/A'}/night</span>
            <span class="hotel-rating">★ ${hotel.overall_rating || 'N/A'}</span>
          </div>
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
