# Product Knowledge Base

The Product Knowledge Base is a centralized repository of information about your electronic products that helps your sales team quickly access accurate details when talking to customers.

## Features

1. **Technical Specifications**
   - Detailed specs organized by product category
   - Searchable database of all technical parameters
   - Comparison tables between similar models

2. **Usage Scenarios & Solutions**
   - Common business problems each product solves
   - Industry-specific applications
   - Case studies of successful implementations

3. **FAQ Section**
   - Common customer questions with expert answers
   - Objection handling scripts for sales staff
   - Troubleshooting guides for common issues

4. **Competitive Analysis**
   - Side-by-side comparisons with competitor products
   - Unique selling points highlighted
   - Pricing strategy guidance

5. **File Attachments**
   - Attach product manuals, datasheets, and other documents
   - Track download counts for analytics
   - Support for various file types (PDF, Word, Excel, images, etc.)

6. **Version History**
   - Track changes to knowledge base entries
   - Compare different versions
   - Restore previous versions if needed
   - Add manual versions with change summaries

7. **Feedback & Ratings**
   - Allow users to rate knowledge base entries
   - Collect feedback on content helpfulness
   - Respond to user feedback
   - Track average ratings and helpful/not helpful counts

8. **Analytics Dashboard**
   - Track views, searches, and downloads
   - Identify popular content
   - Monitor user engagement
   - Manage user feedback

## Database Setup

Before using the knowledge base, you need to set up the database tables. The SQL scripts are provided in the `database` directory:

1. Run `product_knowledge_base.sql` to create the main knowledge base tables
2. Run `product_kb_attachments.sql` to create the file attachments tables
3. Run `product_kb_history.sql` to create the version history tables
4. Run `product_kb_analytics.sql` to create the analytics tables
5. Run `product_kb_feedback.sql` to create the feedback and ratings tables

You can run these scripts in the Supabase SQL Editor.

## Usage

### Accessing the Knowledge Base

1. Navigate to Ecommerce > Knowledge Base
2. Select a product from the dropdown
3. Browse through the different tabs (Technical Specs, Usage Scenarios, FAQ, Competitive Analysis)
4. Use the search box to find specific information
5. View file attachments, provide feedback, and see version history for each entry
6. Check out the "Popular Content" section to see frequently accessed information

### Managing Knowledge Base Entries

1. Navigate to Ecommerce > Knowledge Base
2. Click on "Manage Knowledge Base" in the top right corner
3. Use the "Add Entry" button to create a new knowledge base entry
4. Fill in the required fields:
   - Product: Select the product this entry relates to
   - Category: Choose the type of information (Technical Specs, Usage Scenarios, etc.)
   - Title: A descriptive title for the entry
   - Content: The detailed information
   - Tags: Optional keywords to help with searching
5. Click "Create" to save the entry
6. Use the "Edit" and "Delete" buttons to manage existing entries

### Working with File Attachments

1. In the knowledge base viewer, find the "Attachments" section for any entry
2. Click "Add File" to upload a new attachment
3. Enter an optional description for the file
4. Click "Upload" to save the attachment
5. Use the "Download" button to access the file
6. Use the "Delete" button to remove attachments

### Using Version History

1. In the knowledge base viewer, find the "Version History" section for any entry
2. View the list of previous versions
3. Select two versions and click "Compare Selected" to see differences
4. Click "Restore" to revert to a previous version
5. Click "Create Version" to manually save the current state with a change summary

### Providing Feedback

1. In the knowledge base viewer, find the "Feedback & Ratings" section for any entry
2. Click "Leave Feedback" to open the feedback form
3. Rate the content (1-5 stars)
4. Indicate if the content was helpful
5. Leave additional comments if needed
6. Click "Submit Feedback" to save your input

### Using Analytics

1. Navigate to Ecommerce > Knowledge Base
2. Click on "Analytics" in the top right corner
3. View the overview dashboard with key metrics
4. Check the "Feedback" tab to respond to user feedback
5. Use the "Popular Content" tab to see the most accessed entries

## Benefits for Sales Team

- Reduces training time for new sales staff
- Ensures consistent, accurate information delivery
- Increases conversion rates through better product positioning
- Speeds up the sales process by having answers readily available

## Customization

You can further customize the knowledge base by:

1. Adding additional fields to the knowledge base entries
2. Creating custom categories for different types of information
3. Implementing additional file preview functionality
4. Creating custom reports and dashboards
5. Setting up email notifications for new feedback
6. Implementing user permissions for different roles
7. Adding integration with other systems (CRM, ERP, etc.)
8. Creating a public-facing version for customers

## Troubleshooting

If you encounter issues:

1. Check that all database tables are created correctly
2. Verify that the Supabase connection is working
3. Check the browser console for any error messages
4. Ensure you have the necessary permissions to access the knowledge base
5. Verify that file storage is properly configured for attachments
6. Check that the triggers for version history are working correctly
7. Make sure the analytics data is being collected properly
8. Ensure the feedback submission process is functioning

### Common Issues

1. **File uploads fail**: Check that the Supabase storage bucket is properly configured and accessible
2. **Version history not updating**: Verify that the database triggers are correctly installed
3. **Analytics not showing data**: Make sure the tracking functions are being called correctly
4. **Feedback not appearing**: Check that the feedback table has the correct permissions
