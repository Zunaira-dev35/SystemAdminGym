import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import jsPDF from 'jspdf';

interface ExportControlsProps {
  data: any[];
  filename: string;
  columns?: { key: string; label: string }[];
  selectedData?: any[];
}

export function ExportControls({ data, filename, columns, selectedData }: ExportControlsProps) {
  const { toast } = useToast();
  const exportData = selectedData && selectedData.length > 0 ? selectedData : data;

  const prepareData = () => {
    if (!columns) return exportData;
    
    return exportData.map((item) =>
      columns.reduce((acc, col) => {
        acc[col.label] = item[col.key];
        return acc;
      }, {} as Record<string, any>)
    );
  };

  const exportToCSV = () => {
    try {
      const preparedData = prepareData();
      const csv = Papa.unparse(preparedData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export successful',
        description: 'CSV file downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export CSV file',
        variant: 'destructive',
      });
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const preparedData = prepareData();
      
      doc.setFontSize(16);
      doc.text(filename, 14, 20);
      
      doc.setFontSize(10);
      let yPosition = 35;
      
      if (columns) {
        const headers = columns.map((col) => col.label).join(' | ');
        doc.text(headers, 14, yPosition);
        yPosition += 10;
        
        preparedData.forEach((item, index) => {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          const row = columns.map((col) => item[col.label] || '').join(' | ');
          doc.text(row, 14, yPosition);
          yPosition += 7;
        });
      } else {
        doc.text(JSON.stringify(preparedData, null, 2), 14, yPosition);
      }
      
      doc.save(`${filename}.pdf`);
      
      toast({
        title: 'Export successful',
        description: 'PDF file downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export PDF file',
        variant: 'destructive',
      });
    }
  };

  const hasSelectedData = selectedData && selectedData.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-export">
          <Download className="h-4 w-4 mr-2" />
          {hasSelectedData ? `Export ${selectedData.length} Selected` : 'Export All'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV} data-testid="menu-export-csv">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} data-testid="menu-export-pdf">
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
