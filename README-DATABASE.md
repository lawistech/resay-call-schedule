# Database Setup Instructions

This document provides instructions on how to set up and update the database for the Resay Call Tracker application.

## Running SQL Scripts in Supabase

The application uses Supabase as its database backend. To run SQL scripts:

1. Log in to your Supabase account at [https://app.supabase.io/](https://app.supabase.io/)
2. Select your project
3. Navigate to the SQL Editor in the left sidebar
4. Click "New Query" to create a new SQL query
5. Copy and paste the content of the SQL file you want to run
6. Click "Run" to execute the script

## Required SQL Scripts

The following SQL scripts need to be run in the Supabase SQL Editor:

1. `database/opportunity_products.sql` - Creates the opportunity_products table
2. `database/opportunity_history.sql` - Creates the opportunity_history table
3. `database/orders.sql` - Creates the orders and order_items tables
4. `database/suppliers.sql` - Creates the suppliers table
5. `database/product_catalog.sql` - Creates the product_catalog table
6. `database/product_attachments.sql` - Creates the product_attachments table
7. `database/quotations.sql` - Creates the quotations and quotation_items tables

## Troubleshooting

If you encounter errors like "relation does not exist", it means the required table hasn't been created yet. Run the corresponding SQL script to create the missing table.

For example, if you see an error like:
```
relation "public.opportunity_products" does not exist
```

You need to run the `database/opportunity_products.sql` script in the Supabase SQL Editor.

## Database Schema Updates

When making changes to the database schema:

1. Create a new SQL file in the `database` directory
2. Write the SQL commands to create or alter the tables
3. Run the SQL script in the Supabase SQL Editor
4. Update the corresponding TypeScript interfaces in the application code

## Verifying Table Creation

After running a SQL script, you can verify that the table was created by:

1. Going to the "Table Editor" in the Supabase dashboard
2. Looking for the newly created table in the list
3. Checking that the table has the expected columns and relationships
