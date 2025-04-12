// src/simple-proxy.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Simple route to test if the server is running
app.get('/', (req, res) => {
  res.send('Proxy server is running');
});

// Proxy endpoint
app.get('/api/proxy', async (req, res) => {
  try {
    const url = req.query.url;
    
    if (!url) {
      return res.status(400).send('URL parameter is required');
    }
    
    console.log(`Proxying request to: ${url}`);
    
    // Set user agent to mimic a browser
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.google.com/'
      },
      responseType: 'text'
    });
    
    // Log response details
    console.log(`Response received from ${url}:`, {
      status: response.status,
      contentType: response.headers['content-type'],
      contentLength: response.data.length
    });
    
    // Forward the response
    res.set('Content-Type', response.headers['content-type'] || 'text/html');
    res.send(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).send(`Proxy error: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Simple proxy server running at http://localhost:${port}`);
});
