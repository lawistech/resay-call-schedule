// src/basic-proxy.js
const express = require('express');
const http = require('http');
const https = require('https');
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
app.get('/api/proxy', (req, res) => {
  try {
    const url = req.query.url;
    
    if (!url) {
      return res.status(400).send('URL parameter is required');
    }
    
    console.log(`Proxying request to: ${url}`);
    
    // Determine if we need http or https
    const httpModule = url.startsWith('https') ? https : http;
    
    // Make the request
    const proxyReq = httpModule.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.google.com/'
      }
    }, (proxyRes) => {
      // Log response details
      console.log(`Response received from ${url}:`, {
        status: proxyRes.statusCode,
        contentType: proxyRes.headers['content-type'],
      });
      
      // Set response headers
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      
      // Pipe the response data
      proxyRes.pipe(res);
    });
    
    // Handle errors
    proxyReq.on('error', (error) => {
      console.error('Proxy request error:', error.message);
      res.status(500).send(`Proxy error: ${error.message}`);
    });
    
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).send(`Proxy error: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Basic proxy server running at http://localhost:${port}`);
});
