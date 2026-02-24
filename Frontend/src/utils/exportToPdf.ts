// src/utils/exportToPDF.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface ColumnDefinition {
  title: string;
  dataKey: string;
  align?: 'left' | 'center' | 'right';
  width?: number;
  format?: (value: any, row?: any) => string;
}

interface BranchInfo {
  name?: string;
  address?: string;
  reference_num?: string;
}

interface PDFExportConfig<T> {
  title: string;
  subtitle?: string;
  filenamePrefix: string;
  columns: ColumnDefinition[];
  data: T[];
  branchInfo?: BranchInfo | null;
  getRowData?: (item: T) => Record<string, any>;
  dateRange?: { from?: Date | string; to?: Date | string } | undefined;
  footerCallback?: (doc: jsPDF, finalY: number) => void;
}

export function exportToPDF<T>({
  title,
  subtitle = '',
  filenamePrefix,
  columns,
  data,
  branchInfo = null,
  getRowData = (item) => item as any,
  dateRange,
  footerCallback,
}: PDFExportConfig<T>) {
  if (!data?.length) return;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const leftMargin = 12;
  const rightMargin = pageWidth - 12;

  const drawFullHeader = () => {
    const today = new Date();
    const printDate = `${today.getDate()}-${today.toLocaleString('default', { month: 'short' })}-${today.getFullYear().toString().slice(-2)}`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`${branchInfo?.name || 'All Branches'}`, leftMargin, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    if (branchInfo?.address) {
      doc.text(branchInfo.address, leftMargin, 22);
    }

    const printDateText = `Print Date: ${printDate}`;
    const printDateWidth = doc.getTextWidth(printDateText);
    doc.text(printDateText, pageWidth - 14 - printDateWidth, 22);

    doc.setTextColor(139, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(title, pageWidth / 2, 38, { align: 'center' });
    doc.setTextColor(0);

    let currentY = 46;
    if (subtitle) {
      doc.setFontSize(11);
      doc.text(subtitle, pageWidth / 2, currentY, { align: 'center' });
      currentY += 8;
    }

    if (dateRange?.from && dateRange?.to) {
      const fromStr = format(new Date(dateRange.from), 'dd MMM yyyy');
      const toStr = format(new Date(dateRange.to), 'dd MMM yyyy');
      const rangeText = `Period: ${fromStr} – ${toStr}`;
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'italic');
      doc.text(rangeText, pageWidth / 2, currentY, { align: 'center' });
      currentY += 8;
    }

    return currentY + 12;
  };

  const drawMinimalHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, leftMargin, 12);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text(`.`, pageWidth - 40, 12);

    return 22;
  };

  let tableStartY = drawFullHeader();

  autoTable(doc, {
    startY: tableStartY,
    head: [columns.map((c) => c.title)],
    body: data.map((item) => {
      const row = getRowData(item);
      return columns.map((col) => {
        const value = row[col.dataKey];
        return col.format ? col.format(value, row) : (value ?? '—');
      });
    }),

    styles: {
      fontSize: 9.8,
      cellPadding: 3,
      lineColor: [44, 62, 80],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 10.2,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: columns.reduce((acc, col, i) => {
      if (col.width) acc[i] = { cellWidth: col.width };
      if (col.align) acc[i] = { ...acc[i], halign: col.align };
      return acc;
    }, {} as any),

    margin: { left: leftMargin, right: rightMargin },

    didDrawPage: (data) => {
      doc.setFontSize(9);
      doc.text(
        `Page ${doc.internal.getCurrentPageInfo().pageNumber}`,
        pageWidth - 18,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      );
    },

    willDrawPage: (data) => {
      if (data.pageNumber > 1) {
        const newStartY = drawMinimalHeader();
        data.settings.startY = newStartY;
      }
    },
  });

  if (footerCallback) {
    const totalPages = doc.internal.getNumberOfPages();
    doc.setPage(totalPages);

    const finalY = (doc as any).lastAutoTable?.finalY || 140;
    footerCallback(doc, finalY + 12);
  }

  const today = new Date();
  const safeFilename = `${filenamePrefix}_${today.toISOString().slice(0, 10)}.pdf`;
  doc.save(safeFilename);
}