require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch'); // Critical fix for Node.js
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for hotels (must come before catch-all route)
app.get('/api/hotels', async (req, res) => {
  try {
    const { checkin, checkout, city, state } = req.query;
    
    // Validate parameters
    if (!checkin || !checkout || !city || !state) {
      return res.status(400).json({ 
        error: 'Missing parameters',
        required: ['checkin (DD-MM-YYYY)', 'checkout (DD-MM-YYYY)', 'city', 'state']
      });
    }

    // Build SerpAPI URL
    const apiUrl = new URL('https://serpapi.com/search');
    apiUrl.searchParams.set('engine', 'google_hotels');
    apiUrl.searchParams.set('api_key', process.env.SERPAPI_KEY);
    apiUrl.searchParams.set('q', `${city}, ${state}`);
    apiUrl.searchParams.set('check_in_date', convertDate(checkin));
    apiUrl.searchParams.set('check_out_date', convertDate(checkout));
    apiUrl.searchParams.set('adults', '2');

    // Fetch from SerpAPI
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

// Helper function for date conversion
function convertDate(ddmmyyyy) {
  const [dd, mm, yyyy] = ddmmyyyy.split('-');
  return `${yyyy}-${mm}-${dd}`; // Convert to YYYY-MM-DD
}

// Catch-all route for SPA (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
