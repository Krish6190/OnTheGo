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

// API endpoint for hotels (must come before static/catch-all)
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
    const apiUrl = new URL('https://serpapi.com/search');
    apiUrl.searchParams.set('engine', 'google_hotels');
    apiUrl.searchParams.set('api_key', process.env.SERPAPI_KEY);
    apiUrl.searchParams.set('q', `${city}, ${state}`);
    apiUrl.searchParams.set('check_in_date', convertDate(checkin));
    apiUrl.searchParams.set('check_out_date', convertDate(checkout));
    apiUrl.searchParams.set('adults', '2');
    const response = await fetch(apiUrl);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'SerpAPI request failed');
    }
    const data = await response.json();
    const hotels = data.properties || data.hotels_results || [];
    res.json(hotels);
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

// Catch-all for SPA (must be last)
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
