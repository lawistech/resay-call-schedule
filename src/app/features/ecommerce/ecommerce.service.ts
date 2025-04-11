// src/app/features/ecommerce/ecommerce.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Product } from './models/product.model';
import { environment } from '../../../environments/environment';

interface WooCommerceCredentials {
  consumerKey: string;
  consumerSecret: string;
}

@Injectable()
export class EcommerceService {
  // WooCommerce API endpoints
  private apiUrls: { [key: string]: string } = {
    resay: 'https://resay.co.uk/wp-json/wc/v3',
    androidEpos: 'https://android-epos.co.uk/wp-json/wc/v3',
    barcode: 'https://barcodeforbusiness.co.uk/wp-json/wc/v3'
  };

  // WooCommerce API credentials from environment
  private credentials: { [key: string]: WooCommerceCredentials } = environment.woocommerceCredentials;

  constructor(private http: HttpClient) {}

  /**
   * Get products from a specific site or all sites
   * @param site Optional site ID to filter by
   * @param page Page number for pagination
   * @param perPage Number of items per page
   * @param category Optional category to filter by
   * @param stockStatus Optional stock status to filter by ('instock', 'outofstock', etc.)
   */
  getProducts(
    site?: string,
    page: number = 1,
    perPage: number = 10,
    category?: string,
    stockStatus?: string
  ): Observable<Product[]> {
    if (site) {
      return this.getProductsFromSite(site, page, perPage, category, stockStatus);
    } else {
      // Get products from all sites
      const requests = Object.keys(this.apiUrls).map(siteKey =>
        this.getProductsFromSite(siteKey, page, perPage, category, stockStatus)
      );

      return forkJoin(requests).pipe(
        map(results => {
          // Flatten the array of arrays
          return results.reduce((acc, products) => [...acc, ...products], []);
        }),
        catchError(error => {
          console.error('Error fetching products from all sites:', error);
          return throwError(() => new Error('Failed to fetch products from all sites'));
        })
      );
    }
  }

  /**
   * Get products from a specific site
   * @param site Site ID
   * @param page Page number for pagination
   * @param perPage Number of items per page
   * @param category Optional category to filter by
   * @param stockStatus Optional stock status to filter by ('instock', 'outofstock', etc.)
   */
  private getProductsFromSite(
    site: string,
    page: number = 1,
    perPage: number = 10,
    category?: string,
    stockStatus?: string
  ): Observable<Product[]> {
    const url = `${this.apiUrls[site]}/products`;
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString())
      .set('consumer_key', this.credentials[site].consumerKey)
      .set('consumer_secret', this.credentials[site].consumerSecret);

    // Add category filter if provided
    if (category) {
      params = params.set('category', category);
    }

    // Add stock status filter if provided
    if (stockStatus) {
      params = params.set('stock_status', stockStatus);
    }

    return this.http.get<any[]>(url, { params }).pipe(
      map(products => products.map(product => this.mapWooCommerceProductToModel(product, site))),
      catchError(error => {
        console.error(`Error fetching products from ${site}:`, error);
        // Log more detailed error information
        console.log(`API URL: ${url}`);
        console.log(`Consumer Key: ${this.credentials[site].consumerKey}`);
        console.log(`Consumer Secret: ${this.credentials[site].consumerSecret.substring(0, 5)}...`);
        return throwError(() => new Error(`Failed to fetch products from ${site}: ${error.message || 'Unknown error'}`));
      })
    );
  }

  /**
   * Get a specific product by ID
   */
  getProductById(site: string, productId: string): Observable<Product | null> {
    const url = `${this.apiUrls[site]}/products/${productId}`;
    const params = new HttpParams()
      .set('consumer_key', this.credentials[site].consumerKey)
      .set('consumer_secret', this.credentials[site].consumerSecret);

    return this.http.get<any>(url, { params }).pipe(
      map(product => this.mapWooCommerceProductToModel(product, site)),
      catchError(error => {
        console.error(`Error fetching product ${productId} from ${site}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Get website statistics (product count, recent orders, revenue)
   */
  getWebsiteStats(site: string): Observable<any> {
    // We'll need to make multiple API calls to get all the stats
    const productsUrl = `${this.apiUrls[site]}/products/count`;
    const ordersUrl = `${this.apiUrls[site]}/orders`;

    const params = new HttpParams()
      .set('consumer_key', this.credentials[site].consumerKey)
      .set('consumer_secret', this.credentials[site].consumerSecret);

    // For orders, we want to filter by date (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const formattedDate = sevenDaysAgo.toISOString();

    const ordersParams = new HttpParams()
      .set('consumer_key', this.credentials[site].consumerKey)
      .set('consumer_secret', this.credentials[site].consumerSecret)
      .set('after', formattedDate)
      .set('per_page', '100'); // Adjust as needed

    const productCount$ = this.http.get<{count: number}>(productsUrl, { params });
    const recentOrders$ = this.http.get<any[]>(ordersUrl, { params: ordersParams });

    return forkJoin({
      productCount: productCount$,
      recentOrders: recentOrders$
    }).pipe(
      map(result => {
        const revenue = result.recentOrders
          .filter(order => order.status === 'completed' || order.status === 'processing')
          .reduce((total, order) => total + parseFloat(order.total), 0);

        return {
          productCount: result.productCount.count,
          recentOrders: result.recentOrders.length,
          revenue: Math.round(revenue)
        };
      }),
      catchError(error => {
        console.error(`Error fetching stats for ${site}:`, error);
        return of({
          productCount: 0,
          recentOrders: 0,
          revenue: 0
        });
      })
    );
  }

  /**
   * Map a WooCommerce product to our Product model
   */
  private mapWooCommerceProductToModel(wcProduct: any, site: string): Product {
    return {
      id: wcProduct.id.toString(),
      site: site,
      name: wcProduct.name,
      sku: wcProduct.sku || '',
      price: parseFloat(wcProduct.price) || 0,
      regularPrice: parseFloat(wcProduct.regular_price) || 0,
      salePrice: wcProduct.sale_price ? parseFloat(wcProduct.sale_price) : null,
      onSale: wcProduct.on_sale,
      stockStatus: wcProduct.stock_status,
      stockQuantity: wcProduct.stock_quantity !== null ? wcProduct.stock_quantity : null,
      categories: wcProduct.categories ? wcProduct.categories.map((cat: any) => cat.name) : [],
      images: wcProduct.images ? wcProduct.images.map((img: any) => img.src) : [],
      description: wcProduct.description || '',
      dateCreated: new Date(wcProduct.date_created),
      dateModified: new Date(wcProduct.date_modified)
    };
  }

  /**
   * Get all categories from a specific site
   */
  getCategories(site: string): Observable<any[]> {
    const url = `${this.apiUrls[site]}/products/categories`;
    const params = new HttpParams()
      .set('consumer_key', this.credentials[site].consumerKey)
      .set('consumer_secret', this.credentials[site].consumerSecret)
      .set('per_page', '100');

    return this.http.get<any[]>(url, { params }).pipe(
      catchError(error => {
        console.error(`Error fetching categories from ${site}:`, error);
        // Log more detailed error information
        console.log(`API URL: ${url}`);
        console.log(`Consumer Key: ${this.credentials[site].consumerKey}`);
        console.log(`Consumer Secret: ${this.credentials[site].consumerSecret.substring(0, 5)}...`);
        return of([]);
      })
    );
  }

  /**
   * Test API connectivity for a specific site
   */
  testApiConnection(site: string): Observable<{success: boolean, message: string}> {
    const url = `${this.apiUrls[site]}/system_status`;
    const params = new HttpParams()
      .set('consumer_key', this.credentials[site].consumerKey)
      .set('consumer_secret', this.credentials[site].consumerSecret);

    return this.http.get<any>(url, { params }).pipe(
      map(response => ({
        success: true,
        message: `Successfully connected to ${site} API`
      })),
      catchError(error => {
        console.error(`Error connecting to ${site} API:`, error);
        return of({
          success: false,
          message: `Failed to connect to ${site} API: ${error.message || 'Unknown error'}`
        });
      })
    );
  }
}
