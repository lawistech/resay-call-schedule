// src/app/features/ecommerce/ecommerce.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { EcommerceService } from './ecommerce.service';

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
    },
    {
      id: 'android-epos',
      name: 'Android EPOS',
      url: 'https://android-epos.co.uk',
      logo: 'assets/images/android-epos-logo.png',
      productCount: 0,
      recentOrders: 0,
      revenue: 0
    },
    {
      id: 'barcode',
      name: 'BarcodeForBusiness',
      url: 'https://barcodeforbusiness.co.uk',
      logo: 'assets/images/barcode-logo.png',
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

    // Simulate loading data for each website
    // In a real implementation, you would call your WooCommerce API
    setTimeout(() => {
      this.websites[0].productCount = 42;
      this.websites[0].recentOrders = 8;
      this.websites[0].revenue = 1250;

      this.websites[1].productCount = 36;
      this.websites[1].recentOrders = 5;
      this.websites[1].revenue = 980;

      this.websites[2].productCount = 28;
      this.websites[2].recentOrders = 3;
      this.websites[2].revenue = 750;

      this.isLoading = false;
    }, 1000);
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
}
