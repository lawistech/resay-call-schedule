// src/app/features/ecommerce/services/product-scraper.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { NotificationService } from '../../../core/services/notification.service';
import { AiService } from '../../../core/services/ai.service';
import { ProductCatalog } from '../models/product-catalog.model';
import { environment } from '../../../../environments/environment';

export interface ScrapedProduct {
  name: string;
  sku: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  tags?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductScraperService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private aiService: AiService
  ) {}

  /**
   * Scrape product information from a URL
   * This uses a combination of direct scraping and AI to extract product data
   */
  scrapeProductFromUrl(url: string): Observable<ScrapedProduct> {
    console.log('ProductScraperService: Scraping URL:', url);

    // First, validate the URL
    if (!this.isValidUrl(url)) {
      console.error('ProductScraperService: Invalid URL format');
      this.notificationService.error('Please enter a valid URL');
      return throwError(() => new Error('Invalid URL'));
    }

    // For WordPress/WooCommerce sites, we can use a more direct approach
    if (url.includes('resay.co.uk')) {
      console.log('ProductScraperService: Detected WooCommerce site, using specialized scraper');
      return this.scrapeWooCommerceProduct(url);
    }

    // For other sites, we'll use a more generic approach with AI assistance
    console.log('ProductScraperService: Using generic scraper with AI assistance');
    return this.scrapeGenericProduct(url);
  }

  /**
   * Scrape product from WooCommerce site
   * This uses WooCommerce's structured data to extract product information
   */
  private scrapeWooCommerceProduct(url: string): Observable<ScrapedProduct> {
    // Use a proxy to avoid CORS issues
    const proxyUrl = `http://localhost:3000/api/proxy?url=${encodeURIComponent(url)}`;
    console.log('ProductScraperService: Using proxy URL:', proxyUrl);

    // First, fetch the HTML content of the page
    return this.http.get(proxyUrl, { responseType: 'text' }).pipe(
      map(html => {
        console.log('ProductScraperService: Received HTML content, length:', html.length);
        try {
          // Extract product data from the HTML
          // WooCommerce sites typically have structured data in JSON-LD format
          const jsonLdMatch = html.match(/<script type="application\/ld\\+json">(.+?)<\/script>/s);

          if (jsonLdMatch && jsonLdMatch[1]) {
            console.log('ProductScraperService: Found JSON-LD data');
            const jsonLd = JSON.parse(jsonLdMatch[1]);
            console.log('ProductScraperService: Parsed JSON-LD:', jsonLd);

            // Check if it's a product
            if (jsonLd['@type'] === 'Product') {
              console.log('ProductScraperService: JSON-LD contains product data');
              const product: ScrapedProduct = {
                name: jsonLd.name,
                sku: jsonLd.sku || this.generateSku(jsonLd.name),
                description: jsonLd.description,
                price: this.extractPrice(jsonLd.offers?.price),
                imageUrl: jsonLd.image,
                category: '',
                tags: []
              };

              console.log('ProductScraperService: Extracted product from JSON-LD:', product);
              return product;
            }
          }

          console.log('ProductScraperService: JSON-LD parsing failed, falling back to HTML extraction');
          // If JSON-LD parsing fails, try extracting data from HTML elements
          return this.extractProductFromHtml(html, url);
        } catch (error: any) {
          console.error('Error parsing WooCommerce product:', error);
          // Fall back to generic scraping
          return this.extractProductFromHtml(html, url);
        }
      }),
      catchError((error: any) => {
        console.error('Error fetching WooCommerce product:', error);
        this.notificationService.error(`Failed to fetch product information: ${error?.message || 'Unknown error'}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Scrape product from any generic website
   * This uses AI to extract product information from the HTML
   */
  private scrapeGenericProduct(url: string): Observable<ScrapedProduct> {
    // Use a proxy to avoid CORS issues
    const proxyUrl = `http://localhost:3000/api/proxy?url=${encodeURIComponent(url)}`;
    console.log('ProductScraperService: Using proxy URL for generic scraper:', proxyUrl);

    // First, fetch the HTML content of the page
    return this.http.get(proxyUrl, { responseType: 'text' }).pipe(
      switchMap(html => {
        console.log('ProductScraperService: Received HTML content for generic scraper, length:', html.length);
        try {
          // Use AI service to extract product data from the HTML
          console.log('ProductScraperService: Calling AI service to extract product info');
          return this.aiService.extractProductInfo(html, url);
        } catch (error: any) {
          console.error('Error parsing generic product:', error);
          this.notificationService.error(`Failed to parse product information: ${error?.message || 'Unknown error'}`);
          // Fall back to basic extraction if AI fails
          console.log('ProductScraperService: Falling back to basic extraction');
          return of(this.extractProductFromHtml(html, url));
        }
      }),
      catchError((error: any) => {
        console.error('Error fetching generic product:', error);
        this.notificationService.error(`Failed to fetch product information: ${error?.message || 'Unknown error'}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Extract product information from HTML content
   * This uses a combination of DOM parsing and AI to extract product data
   */
  private extractProductFromHtml(html: string, url: string): ScrapedProduct {
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract product name
    let name = '';
    const h1 = doc.querySelector('h1');
    if (h1) {
      name = h1.textContent?.trim() || '';
    }

    // Extract product price
    let price = 0;
    const priceElements = doc.querySelectorAll('.price, .product-price, [itemprop="price"]');
    if (priceElements.length > 0) {
      const priceText = priceElements[0].textContent || '';
      price = this.extractPrice(priceText);
    }

    // Extract product description
    let description = '';
    const descriptionElements = doc.querySelectorAll('.description, .product-description, [itemprop="description"]');
    if (descriptionElements.length > 0) {
      description = descriptionElements[0].textContent?.trim() || '';
    }

    // Extract product image
    let imageUrl = '';
    const imageElements = doc.querySelectorAll('.product-image img, .woocommerce-product-gallery img');
    if (imageElements.length > 0) {
      const imgSrc = imageElements[0].getAttribute('src') || '';
      if (imgSrc) {
        // Convert relative URLs to absolute
        imageUrl = new URL(imgSrc, url).href;
      }
    }

    // Generate SKU if not found
    const sku = this.generateSku(name);

    return {
      name,
      sku,
      description,
      price,
      imageUrl,
      category: '',
      tags: []
    };
  }

  /**
   * Extract price from a string
   * Handles different currency formats and removes non-numeric characters
   */
  private extractPrice(priceStr: string | number | undefined): number {
    if (priceStr === undefined || priceStr === null) return 0;

    // If it's already a number, return it
    if (typeof priceStr === 'number') return priceStr;

    if (typeof priceStr === 'string') {
      // Remove currency symbols, commas, and spaces
      const cleanedStr = priceStr.replace(/[£€,\s]/g, '');

      // Parse the clean string to a float
      const price = parseFloat(cleanedStr);

      // Return the price if valid, otherwise 0
      return !isNaN(price) ? price : 0;
    }

    return 0;
  }

  /**
   * Generate a SKU from a product name
   */
  private generateSku(name: string): string {
    if (!name) return 'SKU' + Math.floor(Math.random() * 10000);

    // Convert name to uppercase, remove special characters, and take first 3 characters
    const prefix = name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);

    // Add a random number
    const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    return prefix + suffix;
  }

  /**
   * Validate a URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }
}
