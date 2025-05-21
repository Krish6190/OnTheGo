require('dotenv').config();

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT;

app.use(cors({
  origin: 'https://onthego-jiti.onrender.com',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: false
}));

app.use(express.json());

app.get('/api/hotels', async (req, res) => {
  try {
    if (!process.env.SERPAPI_KEY) {
      console.error('SERPAPI_KEY is not set in environment variables');
      return res.status(500).json({
          error: 'Server configuration error',
          message: 'API key is not configured'
      });
    }

    console.log('SERPAPI_KEY is configured:', process.env.SERPAPI_KEY ? 'Yes' : 'No');
    const { checkin, checkout, city, state } = req.query;
    console.log('API params:', { checkin, checkout, city, state });
    if (!checkin || !checkout || !city || !state) {
      return res.status(400).json({
        error: 'Missing parameters',
        required: ['checkin (DD-MM-YYYY)', 'checkout (DD-MM-YYYY)', 'city', 'state']
      });
    }

    const apiUrl = new URL('https://serpapi.com/search');
    apiUrl.searchParams.set('engine', 'google_hotels');
    apiUrl.searchParams.set('api_key', process.env.SERPAPI_KEY);
    apiUrl.searchParams.set('q', `${city}, ${state}`);
    apiUrl.searchParams.set('check_in_date', convertDate(checkin));
    apiUrl.searchParams.set('check_out_date', convertDate(checkout));
    apiUrl.searchParams.set('adults', '2');

    console.log('Fetching from SerpAPI:', apiUrl.toString().replace(/(api_key=)[^&]+/, '$1[REDACTED]'));
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SerpAPI Error: Status ${response.status}`, errorText);
      
      if (response.status === 401) {
        throw new Error('SerpAPI Error: Unauthorized. Please check your API key.');
      } else if (response.status === 429) {
        throw new Error('SerpAPI Error: Rate limit exceeded. Please try again later.');
      } else if (response.status >= 500) {
        throw new Error('SerpAPI Error: Server error. The service might be temporarily unavailable.');
      } else {
        throw new Error(`SerpAPI Error: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    
    if (!data) {
      throw new Error('SerpAPI Error: Empty response received');
    }
    console.log('SerpAPI raw response structure:', Object.keys(data));
    
    if (data.search_metadata) {
        console.log('Search metadata:', {
            id: data.search_metadata.id,
            status: data.search_metadata.status,
            json_endpoint: data.search_metadata.json_endpoint,
            created_at: data.search_metadata.created_at,
            processed_at: data.search_metadata.processed_at,
            engine: data.search_metadata.google_hotels_url
        });
    }
    
    if (data.search_parameters) {
        console.log('Search parameters:', data.search_parameters);
    }
    
    if (data.serpapi_pagination) {
        console.log('Pagination info:', data.serpapi_pagination);
    }
    
    console.log('properties path exists:', !!data.properties);
    console.log('hotels_results path exists:', !!data.hotels_results);
    console.log('hotels path exists:', !!data.hotels);
    console.log('Property count is properties:', data.properties ? data.properties.length : 0);
    console.log('Property count if hotels_results:', data.hotels_results ? data.hotels_results.length : 0);

    const sanitizedData = JSON.parse(JSON.stringify(data));
    if (sanitizedData.search_metadata && sanitizedData.search_metadata.api_key) {
        sanitizedData.search_metadata.api_key = '[REDACTED]';
    }
    
    if (process.env.NODE_ENV !== 'production') {
        console.log('Full SerpAPI response (sanitized):', JSON.stringify(sanitizedData, null, 2));
    }

    if (data.error) {
        console.error('SerpAPI returned an error:', data.error);
        return res.status(422).json({
            error: 'Error in search results',
            details: data.error
        });
    }

    const hotels = data.properties || data.hotels_results || data.hotels || [];
    if (hotels.length === 0) {
        console.log('No hotels found in response. Available top-level keys:', Object.keys(data));
        
        if (data.search_metadata && data.search_metadata.status === "Success") {
            console.log('Search was successful but returned no hotels');
            return res.json({
                message: 'No hotels found for your search criteria',
                results: []
            });
        }
        
        return res.json([]);
    }
    

    if (hotels.length > 0) {
        console.log('Complete first hotel data:', JSON.stringify(hotels[0], null, 2));
        console.log('Hotel data types:', Object.keys(hotels[0]).map(key => ({ 
            key, 
            type: typeof hotels[0][key],
            isArray: Array.isArray(hotels[0][key]),
            length: Array.isArray(hotels[0][key]) ? hotels[0][key].length : undefined
        })));
    }

    const processedHotels = hotels.map(hotel => {
        const photoUrls = [];

        console.log('Processing hotel data for:', hotel.name, {
            has_property_thumbnail: !!hotel.property_thumbnail,
            has_gallery_photos: !!(hotel.gallery_photos && hotel.gallery_photos.length),
            has_main_photo_url: !!hotel.main_photo_url,
            has_room_photos: !!(hotel.room_photos && hotel.room_photos.length),
            has_photos: !!(hotel.photos && hotel.photos.length),
            has_thumbnail: !!hotel.thumbnail,
            has_serpapi_hotel_thumbnails: !!(hotel.serpapi_hotel_thumbnails && hotel.serpapi_hotel_thumbnails.length),
            has_images: !!(hotel.images && hotel.images.length),
            has_featured_image: !!hotel.featured_image
        });

        if (hotel.property_thumbnail) {
            photoUrls.push(hotel.property_thumbnail);
        }

        if (hotel.gallery_photos && Array.isArray(hotel.gallery_photos)) {
            hotel.gallery_photos.forEach(photo => {
                if (photo.url) {
                    photoUrls.push(photo.url);
                }
            });
        }

        if (hotel.main_photo_url) {
            photoUrls.push(hotel.main_photo_url);
        }

        if (hotel.room_photos && Array.isArray(hotel.room_photos)) {
            hotel.room_photos.forEach(photo => {
                if (photo.url) {
                    photoUrls.push(photo.url);
                }
            });
        }

        if (hotel.photos && Array.isArray(hotel.photos)) {
            hotel.photos.forEach(photo => {
                const url = photo.url || photo.link || (typeof photo === 'string' ? photo : null);
                if (url) {
                    photoUrls.push(url);
                }
            });
        }

        if (hotel.thumbnail) {
            const url = typeof hotel.thumbnail === 'string' ? 
                hotel.thumbnail : (hotel.thumbnail.link || hotel.thumbnail.url);
            if (url) {
                photoUrls.push(url);
            }
        }

        if (hotel.serpapi_hotel_thumbnails && Array.isArray(hotel.serpapi_hotel_thumbnails)) {
            hotel.serpapi_hotel_thumbnails.forEach(thumb => {
                if (typeof thumb === 'string') {
                    photoUrls.push(thumb);
                } else if (thumb && thumb.url) {
                    photoUrls.push(thumb.url);
                }
            });
        }

        if (hotel.images && Array.isArray(hotel.images)) {
            hotel.images.forEach(img => {
                if (typeof img === 'string') {
                    photoUrls.push(img);
                } else if (img && img.url) {
                    photoUrls.push(img.url);
                }
            });
        }

        if (hotel.featured_image) {
            if (typeof hotel.featured_image === 'string') {
                photoUrls.push(hotel.featured_image);
            } else if (hotel.featured_image.url) {
                photoUrls.push(hotel.featured_image.url);
            }
        }

        console.log('Found photo URLs for', hotel.name, photoUrls);

        const validUrls = [...new Set(photoUrls.filter(url => 
            url && 
            typeof url === 'string' && 
            (url.startsWith('http://') || url.startsWith('https://'))
        ))];

        console.log('Valid photo URLs for', hotel.name, ':', validUrls);

        if (validUrls.length === 0) {
            console.log(`No valid image URLs found for hotel: ${hotel.name}, using placeholder instead`);
        }
        
        return {
            ...hotel,
            photos: validUrls.length > 0 ? validUrls : ['https://placehold.co/200x150?text=Hotel'],
            thumbnail: validUrls[0] || 'https://placehold.co/200x150?text=Hotel'
        };
    });

    if (hotels.length > 0) {
        console.log('Raw API data for first hotel:', {
            name: hotels[0].name,
            property_thumbnail: hotels[0].property_thumbnail,
            gallery_photos: hotels[0].gallery_photos,
            main_photo_url: hotels[0].main_photo_url,
            room_photos: hotels[0].room_photos,
            photos: hotels[0].photos,
            serpapi_hotel_thumbnails: hotels[0].serpapi_hotel_thumbnails,
            images: hotels[0].images,
            featured_image: hotels[0].featured_image,
            thumbnail: hotels[0].thumbnail
        });
    }
    
    console.log(`Successfully processed ${processedHotels.length} hotels`);
    console.log(`Hotels with images: ${processedHotels.filter(h => h.photos[0] !== 'https://placehold.co/200x150?text=Hotel').length}`);
    console.log(`Hotels without images (using placeholder): ${processedHotels.filter(h => h.photos[0] === 'https://placehold.co/200x150?text=Hotel').length}`);

    const apiResponse = {
        timestamp: new Date().toISOString(),
        results: processedHotels,
        total: processedHotels.length
    };

    res.json(apiResponse);

  } catch (err) {
    console.error('API Error:', err.message);
    console.error('Error stack:', err.stack);
    
    let statusCode = 500;
    if (err.message.includes('Unauthorized')) {
      statusCode = 401;
    } else if (err.message.includes('Rate limit')) {
      statusCode = 429;
    } else if (err.message.includes('not found') || err.message.includes('Invalid parameters')) {
      statusCode = 400;
    }
    
    res.status(statusCode).json({
      error: 'Failed to fetch hotels',
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/hotels/details', async (req, res) => {
  try {
    const propertyToken = req.query.property_token;
    if (!propertyToken) {
      return res.status(400).json({ error: 'Property token is required' });
    }

    if (!process.env.SERPAPI_KEY) {
      console.error('SERPAPI_KEY is not set in environment variables');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'API key is not configured'
      });
    }

    console.log('Fetching hotel details for property token:', propertyToken);
    const response = await fetch(
      `https://serpapi.com/search.json?engine=google_hotels&property_token=${propertyToken}&api_key=${process.env.SERPAPI_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`SerpAPI Error: Status ${response.status}`);
    }
    
    const data = await response.json();
    
    const images = [];
    if (data.gallery_images && Array.isArray(data.gallery_images)) {
      data.gallery_images.forEach(img => {
        if (img.image) {
          images.push(img.image);
        }
      });
    }
    
    if (data.main_image) {
      images.unshift(data.main_image);
    }

    res.json({
      images,
      name: data.name,
      description: data.description
    });
  } catch (error) {
    console.error('API Error (hotel details):', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch hotel details',
      details: error.message
    });
  }
});

function convertDate(ddmmyyyy) {
  const [dd, mm, yyyy] = ddmmyyyy.split('-');
  return `${yyyy}-${mm}-${dd}`;
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/bookings', (req, res) => {
  const hotel = req.query.hotel;
  if (!hotel) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'booking.html'));
});

app.get(/^\/(?!api\/|bookings).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
