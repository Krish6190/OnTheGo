document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const hotelContainer = document.getElementById('hotelContainer');

  async function fetchHotels() {
    hotelContainer.innerHTML = '<div class="loading">Loading hotels...</div>';
    
    try {
      const response = await fetch(`/api/hotels?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      const hotels = (data.results || []).map(hotel => {
        if (typeof hotel === 'string') {
          try {
            const hotelStr = hotel.startsWith('@{') ? hotel.substring(1) : hotel;
            
            const cleanedStr = hotelStr
              .replace(/^@{/, '{')
              .replace(/\\u0026/g, '&')
              .replace(/(\w+)=([^;]+);?/g, (match, key, value) => {
                if (value.trim() === 'System.Object[]') {
                  return `"${key}":[]`;
                }
                return `"${key}":"${value.trim()}"`;
              })
              .replace(/;\s*}/g, '}');
            
            try {
              const hotelObj = JSON.parse(cleanedStr);
              
              hotelObj.name = hotelObj.name || 'Unnamed Hotel';
              hotelObj.amenities = Array.isArray(hotelObj.amenities) ? hotelObj.amenities : [];
              hotelObj.photos = Array.isArray(hotelObj.photos) ? hotelObj.photos : [];
              hotelObj.thumbnail = hotelObj.thumbnail || '';
              
              
              return hotelObj;
            } catch (e) {
              
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
              
              return fallbackHotel;
            }
          } catch (e) {
            return { 
              name: 'Hotel', 
              description: 'Details being fetched...',
              parseFailed: true
            };
          }
        }
        return hotel;
      }).filter(hotel => hotel && hotel.name);
      
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

async function fetchHotelDetails(propertyToken, hotelCard) {
  try {
    const response = await fetch(`/api/hotels/details?property_token=${propertyToken}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    
    if (data.images && data.images.length > 0) {
      const imgElement = hotelCard.querySelector('.hotel-image img');
      imgElement.src = data.images[0];
      hotelCard.dataset.images = JSON.stringify(data.images);
    }
  } catch (error) {
  }
}

function showHotels(hotels) {
  hotels.forEach((hotel, index) => {
    const photoUrls = [];
    
    if (hotel.images && Array.isArray(hotel.images)) {
        hotel.images.forEach(img => {
            if (img.original_image) {
                photoUrls.push(img.original_image);
            } else if (img.thumbnail) {
                photoUrls.push(img.thumbnail);
            }
        });
    }
    
    if (hotel.property_thumbnail) {
        photoUrls.push(hotel.property_thumbnail);
    }
    
    if (hotel.main_photo_url) {
        photoUrls.push(hotel.main_photo_url);
    }
    
    if (hotel.serpapi_hotel_thumbnails && Array.isArray(hotel.serpapi_hotel_thumbnails)) {
        hotel.serpapi_hotel_thumbnails.forEach(url => {
            if (typeof url === 'string' && url.startsWith('http')) {
                photoUrls.push(url);
            }
        });
    }
    
    const validUrls = [...new Set(photoUrls.filter(url => 
        url && 
        typeof url === 'string' && 
        url.startsWith('http') &&
        !url.includes('placehold.co') &&
        !url.includes('googleusercontent.com/proxy')
    ))];

    hotel.extractedPhotos = validUrls;
    hotel.extractedThumbnail = validUrls[0] || '';
    
  });
  
  hotelContainer.innerHTML = '';

  if (!hotels || !hotels.length) {
    hotelContainer.innerHTML = '<div class="error">No hotels found for your search criteria.</div>';
    return;
  }

  const USD_TO_INR = 83;

  const hotelsWithINR = hotels.map(hotel => {
    let priceUSD = hotel.rate_per_night?.lowest || 
                 hotel.price_per_night || 
                 hotel.price || 
                 hotel.rates?.rate || 
                 hotel.rates?.default || 
                 hotel.price_range?.from ||
                 '';
    
    
    if (typeof priceUSD === 'string') {
      const priceMatch = priceUSD.match(/\d+(\.\d+)?/);
      priceUSD = priceMatch ? priceMatch[0] : '';
    } else if (typeof priceUSD === 'object' && priceUSD !== null) {
      priceUSD = Object.values(priceUSD).find(val => 
        typeof val === 'number' || (typeof val === 'string' && /\d/.test(val))
      ) || '';
    }
    
    let priceINR = 'Price on request';
    let priceRaw = 0;
    if (priceUSD) {
      priceRaw = Math.round(Number(priceUSD) * USD_TO_INR);
      if (!isNaN(priceRaw) && priceRaw > 0) {
        priceINR = '₹' + priceRaw.toLocaleString('en-IN') + '/night';
      }
    }
    
    if (hotel.deal) {
      priceINR += ` (${hotel.deal})`;
    }
    const photos = (hotel.extractedPhotos && hotel.extractedPhotos.length > 0) ? 
                   hotel.extractedPhotos : 
                   (Array.isArray(hotel.photos) && hotel.photos.length > 0) ? 
                   hotel.photos : 
                   ['https://placehold.co/200x150?text=Hotel'];

    const thumbnail = hotel.extractedThumbnail || 
                      (photos.length > 0 ? photos[0] : null) || 
                      hotel.thumbnail || 
                      'https://placehold.co/200x150?text=Hotel';
    
    return { 
      ...hotel, 
      priceINR, 
      priceRaw, 
      photos,
      thumbnail,
      location: (params.get('city') && params.get('state')) 
        ? `${params.get('city')}, ${params.get('state')}` 
        : 'Location not available',
      checkin: params.get('checkin'),
      checkout: params.get('checkout')
    };
  }).filter(hotel => hotel && hotel.name);


  if (!hotelsWithINR.length) {
    hotelContainer.innerHTML = '<div class="error">No hotels found for your search criteria.</div>';
    return;
  }

  hotelsWithINR.sort((a, b) => {
    if (a.priceINR !== 'Price on request' && b.priceINR === 'Price on request') return -1;
    if (a.priceINR === 'Price on request' && b.priceINR !== 'Price on request') return 1;
    return (parseFloat(b.overall_rating) || 0) - (parseFloat(a.overall_rating) || 0);
  });

  hotelsWithINR.forEach(hotel => {
    const card = document.createElement('div');
    card.className = 'hotel-card';
    
    const propertyToken = hotel.property_token || 
      (hotel.serpapi_property_details_link && 
       hotel.serpapi_property_details_link.match(/property_token=([^&]+)/)?.[1]);
    
    if (propertyToken) {
      card.dataset.propertyToken = propertyToken;
    }
    
    card.innerHTML = `
      <div class="hotel-card-content">
        <div class="hotel-image">
          <img src="${hotel.thumbnail}" 
               alt="${hotel.name || 'Hotel image'}"
               onerror="this.src='https://placehold.co/200x150?text=Hotel'"
               loading="lazy" />
        </div>
        
        <div class="hotel-content-right">
          <div class="hotel-name-container">
            <h3>${hotel.name || 'Unnamed Hotel'}</h3>
          </div>
          
          <div class="hotel-details">
            <div class="hotel-rating">★ ${hotel.overall_rating || 'N/A'}</div>
            <div class="hotel-price">${hotel.priceINR}</div>
            
            ${hotel.description ? `<p class="description">${hotel.description}</p>` : ''}
            
            ${hotel.amenities?.length ? `
              <div class="amenities">
                ${hotel.amenities.map(a => `<span class="amenity">${a}</span>`).join('')}
              </div>` : ''}
          </div>
          
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
