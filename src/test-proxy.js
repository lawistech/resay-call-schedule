// src/test-proxy.js
const http = require('http');

// URL to test
const testUrl = 'http://localhost:3000/api/proxy?url=https://resay.co.uk/product/product-1/';

console.log(`Testing proxy with URL: ${testUrl}`);

// Make a request to the proxy
http.get(testUrl, (res) => {
  let data = '';
  
  // Log response details
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  // Collect data chunks
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  // Process the complete response
  res.on('end', () => {
    console.log('Response length:', data.length);
    console.log('First 500 characters of response:');
    console.log(data.substring(0, 500));
    
    // Check if it looks like HTML
    if (data.includes('<!DOCTYPE html>') || data.includes('<html')) {
      console.log('Response appears to be HTML');
    } else {
      console.log('Response does not appear to be HTML');
    }
  });
}).on('error', (err) => {
  console.error('Error making request:', err.message);
});
