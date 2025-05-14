document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const checkin = params.get('checkin');
  const checkout = params.get('checkout');
  const state = params.get('state');
  const city = params.get('city');
  const hotelContainer = document.getElementById('hotelContainer');

  // Helper to convert DD-MM-YYYY to YYYY-MM-DD
  function toSerpApiDate(ddmmyyyy) {
    const [dd, mm, yyyy] = ddmmyyyy.split('-');
    return `${yyyy}-${mm}-${dd}`;
  }

  const SERPAPI_KEY = 'eadef4549d21740eaae31ce0a8a59680324694c17e613fb4d37aa08f6507d9d7';

  async function fetchHotels() {
    hotelContainer.innerHTML = '<div class="loading">Loading hotels...</div>';
    const url = `https://serpapi.com/search?engine=google_hotels` +
      `&api_key=${SERPAPI_KEY}` +
      `&q=${encodeURIComponent(city + ', ' + state)}` +
      `&check_in_date=${toSerpApiDate(checkin)}` +
      `&check_out_date=${toSerpApiDate(checkout)}` +
      `&adults=2`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      // The hotels are usually in data.properties or data.hotels_results
      const hotels = data.properties || data.hotels_results || [];
      showHotels(hotels);
    } catch (error) {
      hotelContainer.innerHTML = '<div class="error">Error loading hotels. Please try again later.</div>';
    }
  }

  function showHotels(hotels) {
    hotelContainer.innerHTML = '';
    if (!hotels.length) {
      hotelContainer.innerHTML = '<div class="error">No hotels found for your search.</div>';
      return;
    }
    hotels.forEach(hotel => {
      const price = hotel.rate_per_night?.lowest || hotel.price_per_night || hotel.price || 'N/A';
      const rating = hotel.overall_rating || hotel.rating || 'N/A';
      const desc = hotel.description || '';
      const name = hotel.name || hotel.title || 'Unnamed Hotel';
      const img = hotel.images && hotel.images.length ? hotel.images[0] : '';
      const card = document.createElement('div');
      card.className = 'hotel-card';
      card.innerHTML = `
        ${img ? `<img src="${img}" alt="${name}" style="width:100%;max-width:320px;border-radius:8px;margin-bottom:8px;">` : ''}
        <h3>${name}</h3>
        <div class="hotel-price">₹${price}/night</div>
        <div class="hotel-rating">★ ${rating}</div>
        <p>${desc}</p>
      `;
      hotelContainer.appendChild(card);
    });
  }

  fetchHotels();
});
