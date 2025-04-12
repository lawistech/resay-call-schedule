# Resay Call Schedule - Deployment Guide

This guide provides step-by-step instructions for building the Resay Call Schedule application and deploying it to Hostinger's hPanel.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Building the Application](#building-the-application)
3. [Deploying to Hostinger](#deploying-to-hostinger)
4. [Setting Up the Proxy Server](#setting-up-the-proxy-server)
5. [Configuring Angular Routing](#configuring-angular-routing)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following:
- Node.js (v14 or later) and npm installed on your development machine
- Angular CLI installed (`npm install -g @angular/cli`)
- A Hostinger account with hPanel access
- Your domain or subdomain configured in Hostinger
- (Optional) DeepSeek API key for the product scraping feature

## Building the Application

1. **Configure environment variables**

   Update the production environment file at `src/environments/environment.prod.ts`:

   ```typescript
   export const environment = {
     production: true,
     supabaseUrl: 'https://mpadnohtgurnpsiyrkta.supabase.co',
     supabaseKey: 'your-supabase-key',
     apiUrl: 'https://mpadnohtgurnpsiyrkta.supabase.co/rest/v1',
     deepseekApiKey: 'your-deepseek-api-key' // Optional, for product scraping
   };
   ```

2. **Build the application for production**

   Run the following command in your project directory:

   ```bash
   ng build --configuration production
   ```

   This will create a `dist/` folder containing the compiled application.

3. **Prepare the proxy server**

   Create a PHP proxy script for the product scraping feature. Save this as `proxy.php`:

   ```php
   <?php
   // proxy.php
   header('Access-Control-Allow-Origin: *');
   header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
   header('Access-Control-Allow-Headers: Content-Type');

   // Handle preflight OPTIONS request
   if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
       exit(0);
   }

   $url = $_GET['url'];
   if (!$url) {
       http_response_code(400);
       echo json_encode(['error' => 'URL parameter is required']);
       exit;
   }

   $ch = curl_init();
   curl_setopt($ch, CURLOPT_URL, $url);
   curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
   curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
   curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
   curl_setopt($ch, CURLOPT_HTTPHEADER, [
       'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
       'Accept-Language: en-US,en;q=0.5',
       'Referer: https://www.google.com/'
   ]);
   
   $response = curl_exec($ch);
   $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
   $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
   curl_close($ch);

   http_response_code($httpCode);
   header("Content-Type: $contentType");
   echo $response;
   ?>
   ```

4. **Create an .htaccess file**

   Create a file named `.htaccess` with the following content:

   ```
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

## Deploying to Hostinger

1. **Log in to Hostinger hPanel**
   - Go to your Hostinger account and log in
   - Access the hPanel dashboard

2. **Navigate to File Manager**
   - In hPanel, click on "File Manager"
   - Go to the `public_html` directory (or the directory associated with your domain/subdomain)

3. **Upload your application files**
   - Upload the contents of your Angular application's `dist/` folder
   - Upload the `proxy.php` file
   - Upload the `.htaccess` file

   You can either:
   - Use the File Manager's upload functionality
   - Use FTP (FileZilla or similar) to upload the files

4. **Set file permissions**
   - Set the permissions for the `proxy.php` file to 644
   - Set the permissions for the `.htaccess` file to 644

## Setting Up the Proxy Server

For the product scraping feature to work, you need to update the proxy URL in your application:

1. **Before deployment, update the ProductScraperService**

   In `src/app/features/ecommerce/services/product-scraper.service.ts`, update the proxy URLs:

   ```typescript
   // Change this:
   const proxyUrl = `http://localhost:3000/api/proxy?url=${encodeURIComponent(url)}`;
   
   // To this:
   const proxyUrl = `/proxy.php?url=${encodeURIComponent(url)}`;
   ```

   Make sure to rebuild the application after this change.

## Configuring Angular Routing

The `.htaccess` file you created earlier handles Angular routing. This ensures that when users navigate directly to a route (like `/ecommerce/test-import`), the server correctly serves your Angular application.

## Troubleshooting

### 404 Errors on Routes
If you get 404 errors when navigating to routes directly:
- Check that your `.htaccess` file is properly uploaded
- Ensure mod_rewrite is enabled on your Hostinger server
- Contact Hostinger support if the issue persists

### CORS Issues
If you encounter CORS issues with your proxy:
- Check that your `proxy.php` file is correctly handling CORS headers
- Ensure the proxy is accessible from your application

### Product Scraping Not Working
If the product scraping feature is not working:
- Check the browser console for errors
- Verify that the proxy URL is correctly updated in your services
- Test the proxy directly by accessing it in your browser with a URL parameter

### DeepSeek API Issues
If you're using DeepSeek and encountering issues:
- Verify your API key is correctly set in the environment file
- Check if you have sufficient credits/quota on your DeepSeek account
- Try using the application without DeepSeek (it will fall back to basic extraction)

## Additional Resources

- [Angular Deployment Guide](https://angular.io/guide/deployment)
- [Hostinger hPanel Documentation](https://www.hostinger.com/tutorials/hpanel)
- [Setting Up .htaccess on Hostinger](https://www.hostinger.com/tutorials/htaccess)

---

For any questions or issues, please contact the development team.
