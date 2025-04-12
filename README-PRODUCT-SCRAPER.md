# Product Scraper with DeepSeek AI Integration

This feature allows you to automatically import product information by pasting a URL. It uses a combination of DOM parsing and DeepSeek AI to extract product details from any e-commerce website.

## Setup Instructions

### 1. Get a DeepSeek API Key

1. Sign up for an account at [DeepSeek](https://deepseek.ai/)
2. Navigate to your account settings or API section
3. Generate a new API key
4. Copy the API key

### 2. Add the API Key to Your Environment

1. Open `src/environments/environment.ts` (for development)
2. Replace `YOUR_DEEPSEEK_API_KEY` with your actual DeepSeek API key:

```typescript
export const environment = {
  // other environment variables...
  deepseekApiKey: 'your-actual-deepseek-api-key-here'
};
```

3. For production, also update `src/environments/environment.prod.ts` with the same API key.

### 3. Install Dependencies

Run the following command to install the required dependencies:

```bash
npm install
```

### 4. Start the Application with Proxy Server

To handle CORS issues when scraping external websites, use the proxy server:

```bash
npm run start:proxy
```

This will start both the Angular application and the proxy server.

## How to Use

1. Navigate to the Product Catalog page
2. Click "Add Product" to open the product form
3. Paste a URL from any e-commerce website into the "Product URL" field
4. Click the "Import" button
5. The form will be automatically populated with the product information extracted from the URL
6. Review and edit the information as needed
7. Click "Create" to save the product

## How It Works

1. When you paste a URL and click "Import", the application sends a request to fetch the HTML content of the page
2. If the DeepSeek API key is configured, it sends the HTML content to DeepSeek AI with a prompt to extract product information
3. DeepSeek analyzes the HTML and returns structured product data (name, price, description, etc.)
4. If DeepSeek is not available or fails, the application falls back to a basic DOM parsing approach
5. The extracted information is used to populate the product form

## Troubleshooting

### CORS Issues

If you encounter CORS issues when scraping external websites, make sure:
- The proxy server is running (`npm run start:proxy`)
- The URL is properly formatted (including http:// or https://)

### DeepSeek API Issues

If the DeepSeek integration is not working:
- Check that your API key is correctly configured in the environment files
- Verify that your DeepSeek account has sufficient credits/quota
- Check the browser console for any error messages

## Extending the Integration

You can enhance the DeepSeek integration by:

1. Improving the prompt in `extractProductInfoWithDeepSeek()` method in `ai.service.ts`
2. Adding support for more specific e-commerce platforms
3. Implementing image downloading and storage
4. Adding batch import functionality
