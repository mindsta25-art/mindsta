import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { siteConfig } from '@/config/siteConfig';

interface ReportHeader {
  title: string;
  period: string;
  generatedBy?: string;
}

interface ReportData {
  summary?: Record<string, any>;
  data?: any[];
  [key: string]: any;
}

interface CompanyInfo {
  name: string;
  tagline: string;
  email: string;
  phone: string;
}

// Generate PDF with company header
export const generatePDFReport = (
  header: ReportHeader,
  reportData: ReportData,
  filename: string,
  orientation: 'portrait' | 'landscape' = 'portrait',
  companyInfo?: CompanyInfo
) => {
  const company = companyInfo || {
    name: siteConfig.company.name,
    tagline: siteConfig.company.tagline,
    email: 'info@mindsta.com',
    phone: '+234 815 244 8471'
  };
  
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4'
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Company Header with Logo
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(company.name, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(company.tagline, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  doc.text(`Email: ${company.email}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  doc.text(`Phone: ${company.phone}`, pageWidth / 2, yPos, { align: 'center' });
  
  // Separator Line
  yPos += 8;
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  
  // Report Title
  yPos += 10;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(header.title, pageWidth / 2, yPos, { align: 'center' });
  
  // Report Period
  yPos += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${header.period}`, pageWidth / 2, yPos, { align: 'center' });
  
  // Generated Date and By
  yPos += 6;
  doc.setFontSize(9);
  doc.text(
    `Generated: ${new Date().toLocaleString()} ${header.generatedBy ? `by ${header.generatedBy}` : ''}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );
  
  yPos += 10;

  // Summary Section
  if (reportData.summary) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 15, yPos);
    yPos += 8;
    
    const summaryData = Object.entries(reportData.summary).map(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
      const capitalizedKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
      return [capitalizedKey, String(value)];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 15, right: 15 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Detailed Data Table
  if (reportData.data && Array.isArray(reportData.data) && reportData.data.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.text('Detailed Data', 15, yPos);
    yPos += 8;
    
    const firstItem = reportData.data[0];
    if (firstItem && typeof firstItem === 'object') {
      const headers = Object.keys(firstItem).map(key => {
        const formatted = key.replace(/([A-Z])/g, ' $1').trim();
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
      });
      
      const rows = reportData.data.map(item => 
        Object.values(item).map(val => String(val || 'N/A'))
      );
      
      autoTable(doc, {
        startY: yPos,
        head: [headers],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 15, right: 15 },
        styles: { fontSize: 8 },
      });
    }
  } else {
    // No data available message
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('No detailed data available for this report.', 15, yPos);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${pageCount} | ${company.name} - Confidential`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(filename);
};

// Generate PDF preview (returns data URL instead of downloading)
export const generatePDFPreview = (
  header: ReportHeader,
  reportData: ReportData,
  orientation: 'portrait' | 'landscape' = 'portrait',
  companyInfo?: CompanyInfo
): string => {
  const company = companyInfo || {
    name: siteConfig.company.name,
    tagline: siteConfig.company.tagline,
    email: 'info@mindsta.com',
    phone: '+234 815 244 8471'
  };
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4'
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Company Header with Logo
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(company.name, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(company.tagline, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  doc.text(`Email: ${company.email}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  doc.text(`Phone: ${company.phone}`, pageWidth / 2, yPos, { align: 'center' });
  
  // Separator Line
  yPos += 8;
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  
  // Report Title
  yPos += 10;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(header.title, pageWidth / 2, yPos, { align: 'center' });
  
  // Report Period
  yPos += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${header.period}`, pageWidth / 2, yPos, { align: 'center' });
  
  // Generated Date and By
  yPos += 6;
  doc.setFontSize(9);
  doc.text(
    `Generated: ${new Date().toLocaleString()} ${header.generatedBy ? `by ${header.generatedBy}` : ''}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );
  
  yPos += 10;

  // Summary Section
  if (reportData.summary) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 15, yPos);
    yPos += 8;
    
    const summaryData = Object.entries(reportData.summary).map(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
      const capitalizedKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
      return [capitalizedKey, String(value)];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 15, right: 15 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Detailed Data Table (limit to first 10 rows for preview)
  if (reportData.data && Array.isArray(reportData.data) && reportData.data.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.text(`Detailed Data (Preview - First 10 of ${reportData.data.length} rows)`, 15, yPos);
    yPos += 8;
    
    const firstItem = reportData.data[0];
    if (firstItem && typeof firstItem === 'object') {
      const headers = Object.keys(firstItem).map(key => {
        const formatted = key.replace(/([A-Z])/g, ' $1').trim();
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
      });
      
      const previewRows = reportData.data.slice(0, 10).map(item => 
        Object.values(item).map(val => String(val || 'N/A'))
      );
      
      autoTable(doc, {
        startY: yPos,
        head: [headers],
        body: previewRows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 15, right: 15 },
        styles: { fontSize: 8 },
      });
    }
  } else {
    // No data available message
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('No detailed data available for this report.', 15, yPos);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${pageCount} | ${company.name} - Confidential`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Return data URL for preview
  return doc.output('dataurlstring');
};

// Generate Excel-compatible CSV with header
export const generateCSVReport = (
  header: ReportHeader,
  reportData: ReportData,
  filename: string,
  companyInfo?: CompanyInfo
) => {
  const company = companyInfo || {
    name: siteConfig.company.name,
    tagline: siteConfig.company.tagline,
    email: 'info@mindsta.com',
    phone: '+234 815 244 8471'
  };
  const rows: string[] = [];
  
  // Company Header
  rows.push(`${company.name}`);
  rows.push(`${company.tagline}`);
  rows.push(`Email: ${company.email} | Phone: ${company.phone}`);
  rows.push('');
  
  // Report Title
  rows.push(header.title);
  rows.push(`Period: ${header.period}`);
  rows.push(`Generated: ${new Date().toLocaleString()} ${header.generatedBy ? `by ${header.generatedBy}` : ''}`);
  rows.push('');
  rows.push('---');
  rows.push('');

  // Summary Section
  if (reportData.summary) {
    rows.push('SUMMARY');
    rows.push('Metric,Value');
    Object.entries(reportData.summary).forEach(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
      const capitalizedKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
      rows.push(`${capitalizedKey},${value}`);
    });
    rows.push('');
  }

  // Detailed Data
  if (reportData.data && Array.isArray(reportData.data) && reportData.data.length > 0) {
    rows.push('DETAILED DATA');
    
    const firstItem = reportData.data[0];
    if (firstItem && typeof firstItem === 'object') {
      const headers = Object.keys(firstItem).map(key => {
        const formatted = key.replace(/([A-Z])/g, ' $1').trim();
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
      });
      
      rows.push(headers.join(','));
      
      reportData.data.forEach(item => {
        const values = Object.values(item).map(val => {
          const stringVal = String(val || '');
          // Escape commas and quotes in CSV
          if (stringVal.includes(',') || stringVal.includes('"')) {
            return `"${stringVal.replace(/"/g, '""')}"`;
          }
          return stringVal;
        });
        rows.push(values.join(','));
      });
    }
  } else {
    rows.push('No detailed data available for this report');
  }

  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

// Generate JSON with metadata
export const generateJSONReport = (
  header: ReportHeader,
  reportData: ReportData,
  filename: string
) => {
  const jsonData = {
    metadata: {
      company: siteConfig.company.name,
      email: siteConfig.company.email,
      phone: siteConfig.company.phone,
      reportTitle: header.title,
      period: header.period,
      generatedAt: new Date().toISOString(),
      generatedBy: header.generatedBy || 'System',
    },
    ...reportData,
  };

  const jsonString = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

// Generate Excel-compatible XLSX (using CSV with UTF-8 BOM)
export const generateExcelReport = (
  header: ReportHeader,
  reportData: ReportData,
  filename: string,
  companyInfo?: CompanyInfo
) => {
  const company = companyInfo || {
    name: siteConfig.company.name,
    tagline: siteConfig.company.tagline,
    email: 'info@mindsta.com',
    phone: '+234 815 244 8471'
  };
  
  const rows: string[] = [];
  
  // Company Header
  rows.push(`${company.name}`);
  rows.push(`${company.tagline}`);
  rows.push(`Email: ${company.email}`);
  rows.push(`Phone: ${company.phone}`);
  rows.push('');
  
  // Report Info
  rows.push(header.title);
  rows.push(`Period: ${header.period}`);
  rows.push(`Generated: ${new Date().toLocaleString()}`);
  rows.push('');

  // Summary
  if (reportData.summary) {
    rows.push('SUMMARY');
    rows.push('Metric\tValue');
    Object.entries(reportData.summary).forEach(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
      rows.push(`${formattedKey}\t${value}`);
    });
    rows.push('');
  }

  // Data
  if (reportData.data && reportData.data.length > 0) {
    rows.push('DETAILED DATA');
    
    const headers = Object.keys(reportData.data[0]);
    rows.push(headers.join('\t'));
    
    reportData.data.forEach(item => {
      rows.push(Object.values(item).join('\t'));
    });
  }

  // Add UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const csvContent = BOM + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};
