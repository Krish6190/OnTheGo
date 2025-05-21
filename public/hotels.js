document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const hotelContainer = document.getElementById('hotelContainer');

  async function fetchHotels() {
    hotelContainer.innerHTML = '<div class="loading">Loading hotels...</div>';
    
    try {
      const response = await fetch(`/api/hotels?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      console.log('API response:', data);
      
      // Parse the stringified hotel objects
      const hotels = (data.results || []).map(hotel => {
        if (typeof hotel === 'string') {
          try {
            // Remove '@' from the start if present and parse
            const hotelStr = hotel.startsWith('@{') ? hotel.substring(1) : hotel;
            
            // Clean up the string to make it valid JSON
            const cleanedStr = hotelStr
              .replace(/^@{/, '{')  // Remove leading @{ if present
              .replace(/\\u0026/g, '&')  // Replace encoded ampersands
              .replace(/(\w+)=([^;]+);?/g, (match, key, value) => {
                // Handle array values marked as System.Object[]
                if (value.trim() === 'System.Object[]') {
                  return `"${key}":[]`;
                }
                // Handle normal string values
                return `"${key}":"${value.trim()}"`;
              })
              .replace(/;\s*}/g, '}');  // Clean up trailing semicolons
            
            try {
              // Parse the cleaned string as JSON
              const hotelObj = JSON.parse(cleanedStr);
              
              // Ensure required fields exist
              hotelObj.name = hotelObj.name || 'Unnamed Hotel';
              hotelObj.amenities = Array.isArray(hotelObj.amenities) ? hotelObj.amenities : [];
              hotelObj.photos = Array.isArray(hotelObj.photos) ? hotelObj.photos : [];
              hotelObj.thumbnail = hotelObj.thumbnail || '';
              
              // Add debug logging
              console.log('Successfully parsed hotel:', {
                name: hotelObj.name,
                photos: Array.isArray(hotelObj.photos) ? hotelObj.photos.length : 0,
                thumbnail: hotelObj.thumbnail ? 'Yes' : 'No'
              });
              
              return hotelObj;
            } catch (e) {
              console.error('JSON parsing failed:', e);
              console.log('Failed string sample:', cleanedStr.substring(0, 100) + '...');
              
              // Return minimal valid hotel object with data extracted via regex
              const fallbackHotel = {
                name: hotelStr.match(/name=([^;]+)/)?.[1] || 'Unnamed Hotel',
                description: hotelStr.match(/description=([^;]+)/)?.[1] || '',
                thumbnail: hotelStr.match(/thumbnail=([^;]+)/)?.[1] || '',
                overall_rating: hotelStr.match(/overall_rating=([^;]+)/)?.[1] || 'N/A',
                deal: hotelStr.match(/deal=([^;]+)/)?.[1] || '',
                photos: [],
                amenities: [],
                parseFailed: true
              };
              
              console.log('Using fallback hotel data:', fallbackHotel);
              return fallbackHotel;
            }
          } catch (e) {
            console.error('Error parsing hotel data:', e, hotel);
            // Return a minimal valid hotel object instead of null
            return { 
              name: 'Hotel', 
              description: 'Details being fetched...',
              parseFailed: true
            };
          }
        }
        return hotel;
      }).filter(hotel => hotel && hotel.name);
      
      console.log('Parsed hotels count:', hotels.length);
      console.log('Sample hotel data:', hotels.length > 0 ? hotels[0] : 'No hotels found');
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
  console.log('Starting showHotels with', hotels.length, 'hotels');
  hotels.forEach((hotel, index) => {
    console.log(`Hotel ${index + 1}:`, {
      name: hotel.name,
      hasDescription: !!hotel.description,
      hasPhotos: Array.isArray(hotel.photos) && hotel.photos.length > 0,
      hasThumbnail: !!hotel.thumbnail,
      parseFailed: !!hotel.parseFailed
    });
  });
  
  hotelContainer.innerHTML = '';

  if (!hotels || !hotels.length) {
    hotelContainer.innerHTML = '<div class="error">No hotels found for your search criteria.</div>';
    return;
  }

  const USD_TO_INR = 83;
  console.log('Processing hotels for price conversion, count:', hotels.length);

  const hotelsWithINR = hotels.map(hotel => {
    // Update price extraction logic to handle more formats
    let priceUSD = hotel.rate_per_night?.lowest || 
                 hotel.price_per_night || 
                 hotel.price || 
                 hotel.rates?.rate || 
                 hotel.rates?.default || 
                 hotel.price_range?.from ||
                 '';
    
    console.log('Hotel price data:', {
      name: hotel.name,
      price: priceUSD,
      rate_per_night: hotel.rate_per_night,
      price_per_night: hotel.price_per_night,
      rawPrice: hotel.price,
      rates: hotel.rates,
      price_range: hotel.price_range,
      deal: hotel.deal
    });
    
    // Handle different price string formats
    if (typeof priceUSD === 'string') {
      // Extract first number sequence from the string
      const priceMatch = priceUSD.match(/\d+(\.\d+)?/);
      priceUSD = priceMatch ? priceMatch[0] : '';
    } else if (typeof priceUSD === 'object' && priceUSD !== null) {
      // If it's an object, try to extract a numeric value
      priceUSD = Object.values(priceUSD).find(val => 
        typeof val === 'number' || (typeof val === 'string' && /\d/.test(val))
      ) || '';
    }
    
    // More lenient price handling
    let priceINR = 'Price on request';
    let priceRaw = 0;
    if (priceUSD) {
      priceRaw = Math.round(Number(priceUSD) * USD_TO_INR);
      if (!isNaN(priceRaw) && priceRaw > 0) {
        priceINR = '₹' + priceRaw.toLocaleString('en-IN') + '/night';
      }
    }
    
    // Add deal information if available
    if (hotel.deal) {
      priceINR += ` (${hotel.deal})`;
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
  }).filter(hotel => hotel && hotel.name); // Only filter out invalid hotels

  console.log('Hotels after processing:', {
    total: hotelsWithINR.length,
    withPrice: hotelsWithINR.filter(h => h.priceINR !== 'Price on request').length,
    withPhotos: hotelsWithINR.filter(h => h.photos && h.photos.length > 0).length,
    withAmenities: hotelsWithINR.filter(h => h.amenities && h.amenities.length > 0).length
  });

  if (!hotelsWithINR.length) {
    hotelContainer.innerHTML = '<div class="error">No hotels found for your search criteria.</div>';
    return;
  }

  // Sort hotels: those with prices first, then by rating
  hotelsWithINR.sort((a, b) => {
    if (a.priceINR !== 'Price on request' && b.priceINR === 'Price on request') return -1;
    if (a.priceINR === 'Price on request' && b.priceINR !== 'Price on request') return 1;
    return (parseFloat(b.overall_rating) || 0) - (parseFloat(a.overall_rating) || 0);
  });

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
