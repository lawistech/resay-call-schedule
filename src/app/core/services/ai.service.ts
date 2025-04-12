// src/app/core/services/ai.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  constructor(
    private http: HttpClient
  ) {}

  /**
   * Extract structured product information from HTML content
   * Uses DeepSeek AI to extract product information from HTML
   */
  extractProductInfo(html: string, url: string): Observable<any> {
    console.log('AiService: Extracting product info from HTML, URL:', url);

    // Check if we have a DeepSeek API key
    if (!environment.deepseekApiKey || environment.deepseekApiKey === 'YOUR_DEEPSEEK_API_KEY') {
      console.warn('DeepSeek API key not configured. Falling back to basic extraction.');
      return this.extractProductInfoBasic(html, url);
    }

    console.log('AiService: Using DeepSeek API for extraction');
    // Use DeepSeek API to extract product information
    return this.extractProductInfoWithDeepSeek(html, url).pipe(
      catchError(error => {
        console.error('Error using DeepSeek API:', error);
        // Fall back to basic extraction if DeepSeek fails
        console.log('AiService: DeepSeek API failed, falling back to basic extraction');
        return this.extractProductInfoBasic(html, url);
      })
    );
  }

  /**
   * Extract product information using DeepSeek AI
   */
  private extractProductInfoWithDeepSeek(html: string, url: string): Observable<any> {
    console.log('AiService: Preparing DeepSeek prompt');
    // Prepare the prompt for DeepSeek
    const prompt = `
      Extract product information from the following HTML content.
      The product is from the URL: ${url}

      I need the following information in JSON format:
      - name: The product name
      - sku: The product SKU or ID
      - description: A brief description of the product
      - price: The product price (numeric value only)
      - imageUrl: The URL of the product image
      - category: The product category
      - tags: An array of product tags

      HTML content:
      ${html.substring(0, 8000)}... (truncated)
    `;

    console.log('AiService: Calling DeepSeek API');
    // Call DeepSeek API
    return this.http.post<any>('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a product information extraction assistant. Extract structured product data from HTML content.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 1000
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${environment.deepseekApiKey}`
      }
    }).pipe(
      map(response => {
        console.log('AiService: Received response from DeepSeek API:', response);
        try {
          // Parse the JSON response from DeepSeek
          const content = response.choices[0].message.content;
          console.log('AiService: DeepSeek response content:', content);
          const jsonMatch = content.match(/\{[\s\S]*\}/); // Extract JSON object from response

          if (jsonMatch) {
            console.log('AiService: Found JSON in DeepSeek response');
            const productData = JSON.parse(jsonMatch[0]);
            console.log('AiService: Parsed product data:', productData);

            // Ensure all required fields are present
            const result = {
              name: productData.name || '',
              sku: productData.sku || this.generateSku(productData.name || ''),
              description: productData.description || '',
              price: this.extractPrice(productData.price),
              imageUrl: productData.imageUrl || '',
              category: productData.category || '',
              tags: Array.isArray(productData.tags) ? productData.tags : []
            };

            console.log('AiService: Final extracted product data:', result);
            return result;
          } else {
            console.error('AiService: Could not extract JSON from DeepSeek response');
            throw new Error('Could not extract JSON from DeepSeek response');
          }
        } catch (error: any) {
          console.error('Error parsing DeepSeek response:', error);
          throw new Error(`DeepSeek parsing error: ${error?.message || 'Unknown error'}`);
        }
      })
    );
  }

  /**
   * Basic extraction of product information from HTML content
   * This is used as a fallback when DeepSeek is not available
   */
  private extractProductInfoBasic(html: string, url: string): Observable<any> {
    console.log('AiService: Using basic extraction logic');
    // Basic extraction logic

    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    console.log('AiService: HTML parsed into DOM');

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

    // Extract product category
    let category = '';
    const categoryElements = doc.querySelectorAll('.product-category, .posted_in');
    if (categoryElements.length > 0) {
      category = categoryElements[0].textContent?.trim() || '';
      // Clean up category text
      category = category.replace('Category:', '').replace('Categories:', '').trim();
    }

    // Extract product tags
    let tags: string[] = [];
    const tagElements = doc.querySelectorAll('.product-tags, .tagged_as');
    if (tagElements.length > 0) {
      const tagText = tagElements[0].textContent?.trim() || '';
      // Clean up tag text
      const cleanTagText = tagText.replace('Tags:', '').trim();
      tags = cleanTagText.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    // Generate SKU if not found
    let sku = '';
    const skuElements = doc.querySelectorAll('.sku, [itemprop="sku"]');
    if (skuElements.length > 0) {
      sku = skuElements[0].textContent?.trim() || '';
    } else {
      sku = this.generateSku(name);
    }

    const result = {
      name,
      sku,
      description,
      price,
      imageUrl,
      category,
      tags
    };

    console.log('AiService: Basic extraction result:', result);
    return of(result);
  }

  /**
   * Extract price from a string
   */
  private extractPrice(priceStr: string): number {
    if (!priceStr) return 0;

    // Remove currency symbols, commas, and spaces
    const cleanedStr = priceStr.replace(/[£$€,\s]/g, '');

    // Parse the clean string to a float
    const price = parseFloat(cleanedStr);

    // Return the price if valid, otherwise 0
    return !isNaN(price) ? price : 0;
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
}
