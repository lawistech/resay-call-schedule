// src/app/features/ecommerce/ecommerce.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { EcommerceService } from './ecommerce.service';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-ecommerce',
  templateUrl: './ecommerce.component.html',
  styleUrls: ['./ecommerce.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  providers: [EcommerceService]
})
export class EcommerceComponent implements OnInit {
  isLoading = true;
  websites = [
    {
      id: 'resay',
      name: 'Resay',
      url: 'https://resay.co.uk',
      logo: 'assets/images/resay-logo.png',
      productCount: 0,
      recentOrders: 0,
      revenue: 0
    }
  ];

  selectedWebsite: string | null = null;

  constructor(private ecommerceService: EcommerceService) {}

  ngOnInit(): void {
    this.loadWebsiteData();
  }

  loadWebsiteData(): void {
    this.isLoading = true;

    // Create an array of observables for each website's stats
    const statsRequests = this.websites.map(website =>
      this.ecommerceService.getWebsiteStats(website.id).pipe(
        map(stats => {
          // Update the website object with the stats
          website.productCount = stats.productCount;
          website.recentOrders = stats.recentOrders;
          website.revenue = stats.revenue;
          return website;
        })
      )
    );

    // Execute all requests in parallel
    forkJoin(statsRequests)
      .pipe(
        catchError(error => {
          console.error('Error loading website data:', error);
          // In case of error, we'll still hide the loading indicator
          this.isLoading = false;
          return of(this.websites);
        })
      )
      .subscribe({
        next: () => {
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  selectWebsite(websiteId: string): void {
    this.selectedWebsite = websiteId;
  }

  getTotalProducts(): number {
    return this.websites.reduce((total, website) => total + website.productCount, 0);
  }

  getTotalOrders(): number {
    return this.websites.reduce((total, website) => total + website.recentOrders, 0);
  }

  getTotalRevenue(): number {
    return this.websites.reduce((total, website) => total + website.revenue, 0);
  }

  getWebsiteById(id: string | null): any {
    if (!id) return null;
    return this.websites.find(w => w.id === id);
  }

  testApiConnections(): void {
    // Test API connection for Resay website
    const site = 'resay';

    this.ecommerceService.testApiConnection(site).subscribe({
      next: (response) => {
        // Show the result
        const result = `${site}: ${response.success ? '✅ Connected' : '❌ Failed'} - ${response.message}`;
        alert(`API Connection Test Result:\n\n${result}`);
      },
      error: (error) => {
        console.error('Error testing API connection:', error);
        alert('Error testing API connection. Check console for details.');
      }
    });
  }
}
