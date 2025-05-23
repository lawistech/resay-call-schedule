# MVP Tasks

## Completed Tasks
- [x] **PDF Generation for Quotations**: Added functionality to generate professional PDF documents for quotations using the provided template format. Implemented using jsPDF and html2canvas libraries.
- [x] **Quotation Products List Fix**:
  - Fixed the issue where products list on quotation details page wasn't working when navigating directly to the quotation URL.
  - Implemented proper route parameter handling to load quotation details with products.
  - Enhanced the quotation service to always include product items in all quotation queries.

## Pending Tasks
- [ ] **Currency Updates**: Replace dollar signs with UK pound symbols in the codebase.
- [ ] **CRM System Enhancements**: Add a Product Knowledge Base feature to the CRM system with technical specifications, usage scenarios, FAQs, and competitive analysis components.
- [ ] **Dashboard Updates**:
  - [ ] Make the classic view the default view in the dashboard.
  - [ ] Fix the Communication Timeline in the dashboard to enable saving notes, emails, and meetings, and integrate with call history.
  - [ ] When clicking a company in the 'Companies with Scheduled Calls' section on the dashboard, navigate to company details and open the schedule tab.
- [ ] **Company Details Page Updates**:
  - [ ] Display all communication types (email, note, meeting, call) together under a single communication tab on company details page.
  - [ ] When clicking on a scheduled call in the company details page, the summary call popup should appear on the company details page instead of the dashboard.
  - [x] When clicking on a product in a quotation's product list on the company details page, the product should be clickable.
- [x] **UI Improvements**:
  - [x] Enhanced the Create Quotation button with modern styling, animations, and improved visual appeal.
  - [ ] Continue improving other UI elements to make the application more user-friendly.
