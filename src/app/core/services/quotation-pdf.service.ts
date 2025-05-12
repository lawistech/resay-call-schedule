// src/app/core/services/quotation-pdf.service.ts
import { Injectable } from '@angular/core';
import { Quotation, QuotationItem } from '../models/quotation.model';
import { Contact } from '../models/contact.model';
import { Company } from '../models/company.model';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatDate } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class QuotationPdfService {
  constructor() {}

  /**
   * Generate a PDF for a quotation
   * @param quotation The quotation to generate a PDF for
   * @param contact The contact associated with the quotation
   * @param company The company associated with the quotation
   */
  async generatePdf(quotation: Quotation, contact?: Contact, company?: Company): Promise<void> {
    // Create a new PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Set default font
    pdf.setFont('helvetica');
    
    // Add company logo and header
    this.addHeader(pdf, pageWidth, margin);
    
    // Add quotation title and information
    this.addQuotationInfo(pdf, quotation, pageWidth, margin);
    
    // Add customer information
    this.addCustomerInfo(pdf, quotation, contact, company, pageWidth, margin);
    
    // Add items table
    const yPos = this.addItemsTable(pdf, quotation, pageWidth, margin);
    
    // Add footer with terms and conditions
    this.addFooter(pdf, yPos, pageWidth, margin);
    
    // Add page numbers
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(100);
      pdf.text(`Quotation: ${quotation.id}`, margin, pageHeight - 10);
      pdf.text(`©${new Date().getFullYear()} ResayTec`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }
    
    // Save the PDF
    pdf.save(`Quotation-${quotation.id}.pdf`);
  }
  
  /**
   * Add header with company logo and contact information
   */
  private addHeader(pdf: jsPDF, pageWidth: number, margin: number): void {
    // Add logo
    // Note: In a real implementation, you would load the actual logo
    pdf.setFillColor(255, 80, 80);
    pdf.rect(margin, margin, 40, 15, 'F');
    pdf.setTextColor(255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RESAY', margin + 5, margin + 8);
    pdf.setFontSize(8);
    pdf.text('TECHNOLOGIES', margin + 5, margin + 13);
    
    // Add company information
    pdf.setTextColor(0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const companyInfo = [
      'ResayTec',
      'Unit 9, Davies Close',
      'Stevendon',
      'Oxfordshire',
      'OX13 6SZ'
    ];
    
    const contactInfo = [
      'Telephone      01344 304143',
      'E-mail            sales@resaytec.co.uk',
      'Web               www.resay.co.uk'
    ];
    
    // Position company info on the right
    let yPos = margin;
    companyInfo.forEach(line => {
      pdf.text(line, pageWidth - margin, yPos, { align: 'right' });
      yPos += 5;
    });
    
    // Add a small gap
    yPos += 2;
    
    // Position contact info on the right
    contactInfo.forEach(line => {
      pdf.text(line, pageWidth - margin, yPos, { align: 'right' });
      yPos += 5;
    });
  }
  
  /**
   * Add quotation title and information
   */
  private addQuotationInfo(pdf: jsPDF, quotation: Quotation, pageWidth: number, margin: number): void {
    const titleY = margin + 30;
    
    // Add quotation title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Quotation No. ${quotation.id}`, pageWidth / 2, titleY, { align: 'center' });
    
    // Add subtitle if available
    if (quotation.title) {
      pdf.setFontSize(14);
      pdf.text(`for ${quotation.title}`, pageWidth / 2, titleY + 8, { align: 'center' });
    }
    
    // Add horizontal line
    pdf.setDrawColor(200);
    pdf.line(margin, titleY + 15, pageWidth - margin, titleY + 15);
  }
  
  /**
   * Add customer information
   */
  private addCustomerInfo(pdf: jsPDF, quotation: Quotation, contact?: Contact, company?: Company, pageWidth?: number, margin?: number): void {
    if (!pageWidth) pageWidth = pdf.internal.pageSize.getWidth();
    if (!margin) margin = 20;
    
    const startY = margin + 50;
    
    // Set font for labels
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    
    // Add quotation details on the left
    pdf.text('Quotation No.', margin, startY);
    pdf.text('Date', margin, startY + 7);
    pdf.text('Company', margin, startY + 14);
    pdf.text('Contact', margin, startY + 21);
    pdf.text('E-mail', margin, startY + 28);
    
    // Set font for values
    pdf.setFont('helvetica', 'normal');
    
    // Add quotation details values
    pdf.text(quotation.id, margin + 30, startY);
    pdf.text(formatDate(quotation.createdAt || new Date(), 'dd MMM yyyy', 'en-US'), margin + 30, startY + 7);
    pdf.text(quotation.company?.name || 'N/A', margin + 30, startY + 14);
    
    // Add contact details if available
    if (contact) {
      pdf.text(`${contact.first_name} ${contact.last_name}`, margin + 30, startY + 21);
      pdf.text(contact.email || 'N/A', margin + 30, startY + 28);
    } else {
      pdf.text('N/A', margin + 30, startY + 21);
      pdf.text('N/A', margin + 30, startY + 28);
    }
    
    // Add quote validity on the right
    pdf.setFont('helvetica', 'bold');
    pdf.text('Quote Valid Until:', pageWidth - margin - 50, startY);
    
    pdf.setFont('helvetica', 'normal');
    if (quotation.validUntil) {
      pdf.text(formatDate(quotation.validUntil, 'dd MMM yyyy', 'en-US'), pageWidth - margin, startY, { align: 'right' });
    } else {
      // Default to 30 days if not specified
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      pdf.text(formatDate(defaultDate, 'dd MMM yyyy', 'en-US'), pageWidth - margin, startY, { align: 'right' });
    }
    
    // Add horizontal line
    pdf.setDrawColor(200);
    pdf.line(margin, startY + 35, pageWidth - margin, startY + 35);
  }
  
  /**
   * Add items table
   * @returns The Y position after the table
   */
  private addItemsTable(pdf: jsPDF, quotation: Quotation, pageWidth: number, margin: number): number {
    const startY = margin + 95;
    const colWidths = {
      product: 60,
      description: 60,
      qty: 15,
      unitPrice: 25,
      total: 25
    };
    
    // Table headers
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, startY, pageWidth - (margin * 2), 10, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Product', margin + 5, startY + 7);
    pdf.text('Description', margin + colWidths.product + 5, startY + 7);
    pdf.text('Qty', margin + colWidths.product + colWidths.description + 5, startY + 7);
    pdf.text('Unit Price £', margin + colWidths.product + colWidths.description + colWidths.qty + 5, startY + 7);
    pdf.text('Total £', margin + colWidths.product + colWidths.description + colWidths.qty + colWidths.unitPrice + 5, startY + 7);
    
    // Table rows
    let yPos = startY + 15;
    pdf.setFont('helvetica', 'normal');
    
    // Add items if available
    if (quotation.items && quotation.items.length > 0) {
      quotation.items.forEach((item, index) => {
        // Check if we need a new page
        if (yPos > pdf.internal.pageSize.getHeight() - 50) {
          pdf.addPage();
          yPos = margin + 20;
        }
        
        // Add row background for alternating rows
        if (index % 2 === 1) {
          pdf.setFillColor(248, 248, 248);
          pdf.rect(margin, yPos - 5, pageWidth - (margin * 2), 10, 'F');
        }
        
        // Add item details
        pdf.text(item.product?.name || 'Unknown Product', margin + 5, yPos);
        
        // Add description (truncate if too long)
        const description = item.product?.description || '';
        if (description.length > 50) {
          pdf.text(description.substring(0, 47) + '...', margin + colWidths.product + 5, yPos);
        } else {
          pdf.text(description, margin + colWidths.product + 5, yPos);
        }
        
        // Add quantity, price and total
        pdf.text(item.quantity.toString(), margin + colWidths.product + colWidths.description + 5, yPos);
        pdf.text(item.price.toFixed(2), margin + colWidths.product + colWidths.description + colWidths.qty + 5, yPos);
        pdf.text(item.total.toFixed(2), margin + colWidths.product + colWidths.description + colWidths.qty + colWidths.unitPrice + 5, yPos);
        
        yPos += 10;
      });
    } else {
      pdf.text('No items in this quotation', margin + 5, yPos);
      yPos += 10;
    }
    
    // Add totals
    yPos += 5;
    pdf.setDrawColor(200);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    
    // Subtotal
    pdf.setFont('helvetica', 'normal');
    pdf.text('Subtotal', pageWidth - margin - 70, yPos);
    pdf.text(quotation.total.toFixed(2), pageWidth - margin, yPos, { align: 'right' });
    
    // VAT
    yPos += 7;
    pdf.text('VAT', pageWidth - margin - 70, yPos);
    const vat = quotation.total * 0.2; // Assuming 20% VAT
    pdf.text(vat.toFixed(2), pageWidth - margin, yPos, { align: 'right' });
    
    // Total
    yPos += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total', pageWidth - margin - 70, yPos);
    pdf.text((quotation.total + vat).toFixed(2), pageWidth - margin, yPos, { align: 'right' });
    
    return yPos + 20;
  }
  
  /**
   * Add footer with terms and conditions
   */
  private addFooter(pdf: jsPDF, yPos: number, pageWidth: number, margin: number): void {
    // Check if we need a new page
    if (yPos > pdf.internal.pageSize.getHeight() - 100) {
      pdf.addPage();
      yPos = margin + 20;
    }
    
    // Add thank you message
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text('Dear Customer,', margin, yPos);
    
    yPos += 10;
    const message = 'Thank you very much for considering ResayTec for this requirement. In the interests of strengthening our long term relationship I have tried to make my quotation as attractive as possible. Please check it carefully to make sure I have understood your requirements correctly, and if you find we are uncompetitive in any way I would appreciate an opportunity to address those areas of concern.';
    
    // Split the message into multiple lines
    const splitMessage = pdf.splitTextToSize(message, pageWidth - (margin * 2));
    pdf.text(splitMessage, margin, yPos);
    
    yPos += splitMessage.length * 7;
    pdf.text('Should you choose to go ahead with the order, please send it to me by email or fax quoting the above quotation number.', margin, yPos);
    
    yPos += 10;
    pdf.text('I look forward to talking with you again soon.', margin, yPos);
    
    yPos += 10;
    pdf.text('Yours sincerely,', margin, yPos);
    pdf.text('For and on behalf of ResayTec,', margin, yPos + 7);
    
    yPos += 25;
    pdf.text('Rhianna Jones', margin, yPos);
    
    // Add terms and conditions
    yPos += 20;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Important Information:', margin, yPos);
    
    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    const terms = [
      'All orders are subject to ResayTec terms and conditions of sale.',
      'Prices quoted do not include VAT unless clearly stated.',
      'Prices quoted are subject to change if all items are not purchased or the full stated quantities are not purchased.',
      'All trademarks are acknowledged.',
      'We do not accept responsibility for any consequences arising from late delivery.',
      'Sort Code: 40-19-35, Account No: 31335987'
    ];
    
    terms.forEach(term => {
      pdf.text(term, margin, yPos);
      yPos += 5;
    });
  }
}
