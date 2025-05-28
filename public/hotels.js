document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const guests=params.get('guests');
  const hotelContainer = document.getElementById('hotelContainer');

  async function fetchHotels() {
    hotelContainer.innerHTML = '<div class="loading">Loading hotels...</div>';
    
    try {
      const response = await fetch(`https://onthego-jiti.onrender.com/api/hotels?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      console.log("API Response received:", data.success, "message:", data.message);
      console.log("Full API response:", data);
      console.log("Number of hotels in response:", data.data?.results?.length || 0);
      console.log("Sample hotel data:", data.data?.results?.[0] || "No hotel data");
      
      if (!data || !data.data || !Array.isArray(data.data.results)) {
        console.error("Invalid API response structure:", data);
        throw new Error("Invalid API response format");
      }
      
      const hotelsData = data.data.results || [];
      console.log("Extracted hotels data:", hotelsData, "Count:", hotelsData.length);
      
      if (!hotelsData.length) {
          console.error("Empty hotels data array from API");
          hotelContainer.innerHTML = `
              <div class="error">
                  <p>No hotels available for the selected dates in ${params.get('city')}, ${params.get('state')}.</p>
                  <p>Please try different dates or location.</p>
              </div>`;
          return;
      }
      console.log("Processing hotels data:", hotelsData.length, "hotels found");
      
      const hotels = (hotelsData || []).map(hotel => {
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
      console.error("Error fetching hotels:", error);
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
    const response = await fetch(`https://onthego-jiti.onrender.com/api/hotels/details?property_token=${propertyToken}`);
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

let originalHotels = [];

function showHotels(hotels) {
  originalHotels = [...hotels];
  
  hotels.forEach((hotel, index) => {
    const photoUrls = [];
    
    if (hotel.images && Array.isArray(hotel.images)) {
        hotel.images.forEach(img => {
            if (typeof img === 'string') {
                photoUrls.push(img);
            } else if (img.original_image) {
                photoUrls.push(img.original_image);
            } else if (img.thumbnail) {
                photoUrls.push(img.thumbnail);
            } else if (img.url) {
                photoUrls.push(img.url);
            } else if (img.link) {
                photoUrls.push(img.link);
            }
        });
        console.log("Processed images array:", photoUrls.length);
    }
    
    if (hotel.photos && Array.isArray(hotel.photos)) {
        hotel.photos.forEach(photo => {
            if (typeof photo === 'string') {
                photoUrls.push(photo);
            } else if (photo && photo.url) {
                photoUrls.push(photo.url);
            }
        });
    }
    
    if (hotel.property_thumbnail) {
        photoUrls.push(hotel.property_thumbnail);
    }
    
    if (hotel.thumbnail && typeof hotel.thumbnail === 'string') {
        photoUrls.push(hotel.thumbnail);
    }
    
    if (hotel.main_photo_url) {
        photoUrls.push(hotel.main_photo_url);
    }
    
    if (hotel.gallery_photos && Array.isArray(hotel.gallery_photos)) {
        hotel.gallery_photos.forEach(photo => {
            if (photo.url) photoUrls.push(photo.url);
        });
    }
    
    if (hotel.serpapi_hotel_thumbnails && Array.isArray(hotel.serpapi_hotel_thumbnails)) {
        hotel.serpapi_hotel_thumbnails.forEach(url => {
            if (typeof url === 'string') {
                photoUrls.push(url);
            } else if (url && url.url) {
                photoUrls.push(url.url);
            }
        });
    }
    
    const validUrls = [...new Set(photoUrls.filter(url => {
        if (!url) return false;
        try {
            return typeof url === 'string' && 
                (url.startsWith('http') || url.startsWith('https') || url.startsWith('//') || 
                 url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg'));
        } catch (e) {
            console.log("Error validating URL:", url);
            return false;
        }
    }))];
    
    if (validUrls.length === 0 && hotel.images) {
        hotel.images.forEach(img => {
            if (img && img.thumbnail) validUrls.push(img.thumbnail);
        });
    }
    
    console.log(`Hotel ${hotel.name}: Found ${validUrls.length} valid URLs out of ${photoUrls.length} total URLs`);

    hotel.extractedPhotos = validUrls.length > 0 ? validUrls : ['https://placehold.co/200x150?text=' + encodeURIComponent(hotel.name || 'Hotel')];
    hotel.extractedThumbnail = validUrls[0] || 'https://placehold.co/200x150?text=' + encodeURIComponent(hotel.name || 'Hotel');
    console.log(`Hotel ${hotel.name}: Found ${validUrls.length} valid image URLs`);
    
  });
  
  const hotelsWithINR = processHotelsForDisplay(hotels);

  hotelContainer.innerHTML = '';

  if (!hotelsWithINR.length) {
    hotelContainer.innerHTML = `
        <div class="error">
            <p>No hotels found for your search criteria.</p>
            <p>Try searching for a different city or different dates.</p>
        </div>`;
    console.error("No hotels found in the response. Hotels array:", hotels);
    return;
  }
  console.log(`Processing ${hotels.length} hotels from API response`);

  const heading = document.createElement('h2');
  heading.textContent = `Total ${hotels.length} Hotels found in ${params.get('city')}, ${params.get('state')}`;
  heading.style.marginBottom = '20px';
  hotelContainer.appendChild(heading);

  const layoutContainer = document.createElement('div');
  layoutContainer.className = 'hotel-layout-container';
  
  const searchSidebar = document.createElement('div');
  searchSidebar.className = 'hotel-search-sidebar';
  searchSidebar.innerHTML = `
    <div class="search-input-container">
      <span class="search-icon">🔍</span>
      <input type="text" id="hotelSearchInput" class="hotel-search-input" placeholder="Search by hotel name..." />
    </div>
  `;
  
  const hotelCardsContainer = document.createElement('div');
  hotelCardsContainer.id = 'hotelCardsContainer';
  hotelCardsContainer.className = 'hotel-cards-container';
  
  layoutContainer.appendChild(searchSidebar);
  layoutContainer.appendChild(hotelCardsContainer);
  
  hotelContainer.appendChild(layoutContainer);

  const searchInput = searchSidebar.querySelector('#hotelSearchInput');
  searchInput.addEventListener('input', (e) => {
    const searchValue = e.target.value.toLowerCase().trim();
    filterHotels(searchValue);
  });

  displayHotelCards(hotelsWithINR, hotelCardsContainer);
}

function filterHotels(searchTerm) {
  const hotelCardsContainer = document.getElementById('hotelCardsContainer');
  
  if (!searchTerm) {
    const hotelsWithINR = processHotelsForDisplay(originalHotels);
    displayHotelCards(hotelsWithINR, hotelCardsContainer);
    return;
  }

  const filteredHotels = originalHotels.filter(hotel => 
    hotel.name && hotel.name.toLowerCase().includes(searchTerm)
  );

  const filteredHotelsWithINR = processHotelsForDisplay(filteredHotels);
  
  displayHotelCards(filteredHotelsWithINR, hotelCardsContainer);
}

function processHotelsForDisplay(hotels) {
  const USD_TO_INR = 83;

  return hotels.map(hotel => {
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
                   ['https://placehold.co/200x150?text=Hotel+' + encodeURIComponent(hotel.name || 'Unnamed')];
    
    console.log(`Hotel ${hotel.name}: Final photos array length: ${photos.length}`);

    const thumbnail = hotel.extractedThumbnail || 
                      (photos.length > 0 ? photos[0] : null) || 
                      hotel.thumbnail || 
                      'https://placehold.co/200x150?text=Hotel+' + encodeURIComponent(hotel.name || 'Unnamed');
    
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
}

function displayHotelCards(hotels, container) {
  container.innerHTML = '';
  
  hotels.sort((a, b) => {
    if (a.priceINR !== 'Price on request' && b.priceINR === 'Price on request') return -1;
    if (a.priceINR === 'Price on request' && b.priceINR !== 'Price on request') return 1;
    return (parseFloat(b.overall_rating) || 0) - (parseFloat(a.overall_rating) || 0);
  });
  
  if (!hotels.length) {
    container.innerHTML = `
      <div class="error">
        <p>No hotels match your search.</p>
        <p>Try a different search term or clear the search field to see all hotels.</p>
      </div>`;
    return;
  }


  hotels.forEach(hotel => {
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
          <img src="${hotel.extractedThumbnail || hotel.thumbnail || hotel.images?.[0]?.thumbnail || 'https://placehold.co/220x165?text=' + encodeURIComponent(hotel.name || 'Hotel')}" 
               alt="${hotel.name || 'Hotel image'}"
               onerror="this.onerror=null; this.src='https://placehold.co/220x165?text=' + encodeURIComponent('${hotel.name || 'Hotel'}')"
               loading="lazy" />
          <div class="hotel-loading-overlay" style="display:none;">
            <div class="loading-spinner"></div>
          </div>
        </div>
        
        <div class="hotel-content-right">
          <div class="hotel-name-container">
            <h3>${hotel.name || 'Unnamed Hotel'}</h3>
          </div>
          
          <div class="hotel-details">
            <div class="hotel-rating">★ ${hotel.overall_rating || 'N/A'}</div>
            <div class="hotel-price">${hotel.priceINR}</div>
            <p class="description">${hotel.description || 'No description for this Hotel'}</div>
            
            ${hotel.amenities?.length ? `
              <div class="amenities">
                ${hotel.amenities.map(a => `<span class="amenity">${a}</span>`).join('')}
              </div>` : ''}
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(card);

    card.addEventListener('click', async (e) => {
      const loadingOverlay = card.querySelector('.hotel-loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
      }
      
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
          guests: guests || 2,
          booking_time: new Date().toISOString(),
          search_params: {
            city: params.get('city'),
            state: params.get('state')
          }
        };

        sessionStorage.setItem('hotelData', JSON.stringify(hotelData));
        window.location.href = `/bookings?hotel=${encodeURIComponent(hotelData.name)}`;
      } catch (error) {
        const loadingOverlay = card.querySelector('.hotel-loading-overlay');
        if (loadingOverlay) {
          loadingOverlay.style.display = 'none';
        }
        
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
