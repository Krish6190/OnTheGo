require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for hotels
app.get('/api/hotels', async (req, res) => {
  try {
    const { checkin, checkout, city, state } = req.query;
    if (!checkin || !checkout || !city || !state) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    const url = new URL('https://serpapi.com/search');
    url.searchParams.set('engine', 'google_hotels');
    url.searchParams.set('api_key', process.env.SERPAPI_KEY);
    url.searchParams.set('q', `${city}, ${state}`);
    url.searchParams.set('check_in_date', convertDate(checkin));
    url.searchParams.set('check_out_date', convertDate(checkout));
    url.searchParams.set('adults', '2');
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    const hotels = data.properties || data.hotels_results || [];
    res.json(hotels);
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Failed to fetch hotels', details: err.message });
  }
});

function convertDate(ddmmyyyy) {
  const [dd, mm, yyyy] = ddmmyyyy.split('-');
  return `${yyyy}-${mm}-${dd}`;
}

// "Catch-all" handler: for any request that doesn't match /api/hotels, send back index.html
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
