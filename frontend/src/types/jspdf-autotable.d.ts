declare module 'jspdf-autotable' {
  import jsPDF from 'jspdf';
  
  interface AutoTableOptions {
    startY?: number;
    head?: any[][];
    body?: any[][];
    theme?: 'striped' | 'grid' | 'plain';
    headStyles?: any;
    styles?: any;
    margin?: { left?: number; right?: number; top?: number; bottom?: number };
  }
  
  export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: {
      finalY: number;
    };
  }
}
