# Ecommerce Module - Product Catalog

This module provides a product catalog feature for the ecommerce sidebar with CRUD functionality. It allows you to manage products from suppliers and attach them to quotations and emails.

## Features

1. **Supplier Management**
   - Add, edit, and delete suppliers
   - Track supplier contact information
   - Manage supplier status (active/inactive)

2. **Product Catalog**
   - Add, edit, and delete products
   - Associate products with suppliers
   - Track product details (price, cost, stock, etc.)
   - Categorize and tag products

3. **Product Attachments**
   - Attach products to quotations
   - Attach products to emails
   - Specify quantity and price for each attachment
   - Calculate totals automatically

## Database Setup

Before using the module, you need to set up the database tables. The SQL scripts are provided in the `database` directory:

1. Run `suppliers.sql` to create the suppliers table
2. Run `product_catalog.sql` to create the product catalog table
3. Run `product_attachments.sql` to create the product attachments table

You can run these scripts in the Supabase SQL Editor.

## Usage

### Managing Suppliers

1. Navigate to Ecommerce > Suppliers
2. Use the "Add Supplier" button to create a new supplier
3. Fill in the supplier details (name, contact info, etc.)
4. Click "Create" to save the supplier
5. Use the "Edit" and "Delete" buttons to manage existing suppliers

### Managing Products

1. Navigate to Ecommerce > Product Catalog
2. Use the "Add Product" button to create a new product
3. Select a supplier from the dropdown
4. Fill in the product details (name, SKU, price, etc.)
5. Click "Create" to save the product
6. Use the "Edit" and "Delete" buttons to manage existing products

### Attaching Products to Quotations/Emails

You can attach products to quotations and emails using the ProductAttachmentService:

```typescript
// Attach a product to a quotation
this.productAttachmentService.attachProductToQuotation(
  productId,
  quotationId,
  quantity,
  price
).subscribe({
  next: (attachment) => {
    console.log('Product attached successfully:', attachment);
  },
  error: (error) => {
    console.error('Error attaching product:', error);
  }
});

// Attach a product to an email
this.productAttachmentService.attachProductToEmail(
  productId,
  emailId,
  quantity,
  price
).subscribe({
  next: (attachment) => {
    console.log('Product attached successfully:', attachment);
  },
  error: (error) => {
    console.error('Error attaching product:', error);
  }
});
```



## Customization

You can customize the module by:

1. Adding additional fields to the supplier or product models
2. Creating custom views for specific product categories
3. Implementing additional features like product import/export
4. Adding reporting functionality for product sales and inventory

## Troubleshooting

If you encounter issues:

1. Check that the database tables are created correctly
2. Verify that the Supabase connection is working
3. Check the browser console for any error messages
