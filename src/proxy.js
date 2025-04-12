// src/proxy.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Proxy middleware for external URLs
app.use('/api/proxy', (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).send('URL parameter is required');
  }
  
  console.log(`Proxying request to: ${url}`);
  
  // Create a one-time proxy for this specific URL
  const proxy = createProxyMiddleware({
    target: url,
    changeOrigin: true,
    pathRewrite: () => '',
    router: () => url,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://www.google.com/'
    }
  });
  
  proxy(req, res, (err) => {
    if (err) {
      console.error('Proxy error:', err);
      res.status(500).send(`Proxy error: ${err.message}`);
    }
  });
});

app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
});
