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

// API Endpoint for Hotels
app.get('/api/hotels', async (req, res) => {
  try {
    const { checkin, checkout, city, state } = req.query;
    console.log('API params:', { checkin, checkout, city, state });
    if (!checkin || !checkout || !city || !state) {
      return res.status(400).json({
        error: 'Missing parameters',
        required: ['checkin (DD-MM-YYYY)', 'checkout (DD-MM-YYYY)', 'city', 'state']
      });
    }

    //SerpAPI URL
    const apiUrl = new URL('https://serpapi.com/search');
    apiUrl.searchParams.set('engine', 'google_hotels');
    apiUrl.searchParams.set('api_key', process.env.SERPAPI_KEY);
    apiUrl.searchParams.set('q', `${city}, ${state}`);
    apiUrl.searchParams.set('check_in_date', convertDate(checkin));
    apiUrl.searchParams.set('check_out_date', convertDate(checkout));
    apiUrl.searchParams.set('adults', '2');

    // Fetch from SerpAPI
    const response = await fetch(apiUrl.toString());
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SerpAPI Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const hotels = data.properties || data.hotels_results || [];

    console.log('Sample hotel data:', {
        name: hotels[0]?.name,
        thumbnail: hotels[0]?.thumbnail,
        photos: hotels[0]?.photos,
        main_photo: hotels[0]?.main_photo,
        photo: hotels[0]?.photo
    });

    const processedHotels = hotels.map(hotel => {
        const photoUrls = [];
        
        if (hotel.photos && Array.isArray(hotel.photos)) {
            photoUrls.push(...hotel.photos);
        }
        if (hotel.thumbnail) {
            photoUrls.push(hotel.thumbnail);
        }
        if (hotel.main_photo?.url) {
            photoUrls.push(hotel.main_photo.url);
        }
        if (hotel.photo?.url) {
            photoUrls.push(hotel.photo.url);
        }
        
        console.log('Processed photo URLs for hotel:', {
            name: hotel.name,
            photoUrls: photoUrls
        });

        return {
            ...hotel,
            photos: photoUrls.length > 0 ? photoUrls : ['https://placehold.co/200x150?text=Hotel']
        };
    });

    res.json(processedHotels);

  } catch (err) {
    console.error('API Error:', err.message);
    res.status(500).json({
      error: 'Failed to fetch hotels',
      details: err.message
    });
  }
});

function convertDate(ddmmyyyy) {
  const [dd, mm, yyyy] = ddmmyyyy.split('-');
  return `${yyyy}-${mm}-${dd}`;
}

// Serve static files
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
