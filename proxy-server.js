// proxy-server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());

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
    
    // Forward the response
    res.send(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).send(`Proxy error: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
});
