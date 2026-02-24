import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
// import { format } from "date-fns";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
// Interface for column definitions
interface Column {
  key: string;
  header: string;
  formatter?: (value: any, record: any) => string;
}

// Interface for export configuration
interface ExportConfig {
  columns: Column[];
  title: string;
  filename?: string;
}

// Print function
export const printRecords = (records: any[], config: ExportConfig) => {
  const { columns, title } = config;

  const printContent = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td {  padding-left: 1.5rem;   
  padding-right: 1.5rem;  
  padding-top: 1.75rem;   
  padding-bottom: 1.75rem;
  border-top: 1px solid #f1f1f1; 
  border-bottom: 1px solid #f1f1f1; 
  margin-top: 0.5rem;     
  margin-bottom: 0.5rem;  
  white-space: nowrap;text-align:center;}
          th {
  padding-left: 1.5rem;  
  padding-right: 1.5rem; 
  padding-top: 1rem;    
  padding-bottom: 1rem; 
  background-color: #f1f1f1; 
  border-bottom-width: 1px;
  border-bottom-color: #d9d9d9; 
  border-bottom-style: solid; }
          .status-present { background-color: #10b981; color: white; padding: 4px 8px; border-radius: 4px; }
          .status-leave { background-color: #f59e0b; color: white; padding: 4px 8px; border-radius: 4px; }
          .status-absent { background-color: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; }
          .total-hours { background-color: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>
              ${columns.map((col) => `<th>${col.header}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${records
              .map(
                (record) => `
                  <tr>
                    ${columns
                      .map((col) => {
                        const value = col.formatter
                          ? col.formatter(record[col.key], record)
                          : record[col.key] ?? "N/A";
                        return `<td>${value}</td>`;
                      })
                      .join("")}
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  }
};

// PDF function
export const generatePdf = (records: any[], config: ExportConfig) => {
  const doc = new jsPDF();
  autoTable(doc, {});

  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.text(config.title, 20, 20);

  const tableColumn = config.columns.map((col) => col.header);
  const tableRows = records.map((record) =>
    config.columns.map((col) =>
      col.formatter
        ? col.formatter(record[col.key], record)
        : record[col.key] ?? "N/A"
    )
  );

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 30,
    theme: "grid",
    headStyles: {
      fillColor: [241, 241, 241],
      textColor: [2, 36, 64],
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [6, 56, 74],
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: config.columns.reduce(
      (acc, _, index) => ({
        ...acc,
        [index]: { cellWidth: 180 / config.columns.length }, // Dynamic width
      }),
      {}
    ),
  });

  doc.save(
    config.filename || `${config.title.toLowerCase().replace(/\s/g, "_")}.pdf`
  );
};

// DOCX function
export const generateDocx = async (records: any[], config: ExportConfig) => {
  // Log records to debug missing values
  console.log("Records for DOCX:", records);

  // Create table rows
  const tableRows = [
    new TableRow({
      children: config.columns.map(
        (col) =>
          new TableCell({
            children: [
              new Paragraph({
                text: col.header,
                // bold: true,
                alignment: "center",
                spacing: { before: 100, after: 100 },
              }),
            ],
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            shading: { fill: "F1F1F1" },
          })
      ),
    }),
    ...records.map((record, index) => {
      // Log each record to debug
      console.log(`Processing record ${index + 1}:`, record);
      return new TableRow({
        children: config.columns.map((col) => {
          const value = col.formatter
            ? col.formatter(record[col.key], record)
            : String(record[col.key] ?? "N/A"); // Convert to string, handle null/undefined
          return new TableCell({
            children: [
              new Paragraph({
                text: value,
                alignment: "left",
                spacing: { before: 100, after: 100 },
              }),
            ],
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
          });
        }),
      });
    }),
  ];

  // Log the final table rows array
  console.log("Table rows created:", tableRows.length, tableRows);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: [
          new Paragraph({
            text: config.title,
            heading: "Heading1",
            alignment: "center",
            spacing: { after: 200 },
          }),
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            columnWidths: config.columns.map(() => 9000 / config.columns.length), // Equal width in DXA (1/20th pt)
            borders: {
              top: { style: BorderStyle.SINGLE, size: 8, color: "D9D9D9" },
              bottom: { style: BorderStyle.SINGLE, size: 8, color: "D9D9D9" },
              left: { style: BorderStyle.SINGLE, size: 8, color: "D9D9D9" },
              right: { style: BorderStyle.SINGLE, size: 8, color: "D9D9D9" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 8, color: "D9D9D9" },
              insideVertical: { style: BorderStyle.SINGLE, size: 8, color: "D9D9D9" },
            },
            rows: tableRows,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, config.filename || `${config.title.toLowerCase().replace(/\s/g, "_")}.docx`);
};
// export const generateDocx = async (records: any[], config: ExportConfig) => {
//   // Prepare data for Excel
//   const headers = config.columns.map((col) => col.header);
//   const data = records.map((record) =>
//     config.columns.map((col) =>
//       col.formatter
//         ? col.formatter(record[col.key], record)
//         : record[col.key] ?? "N/A"
//     )
//   );

//   // Create worksheet
//   const ws = XLSX.utils.json_to_sheet([]);

//   // Add header row at A1
//   XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });

//   // Add data rows starting at A2
//   XLSX.utils.sheet_add_json(
//     ws,
//     data.map((row) => {
//       const rowData: { [key: string]: any } = {};
//       headers.forEach((header, i) => {
//         rowData[header] = row[i];
//       });
//       return rowData;
//     }),
//     { origin: "A2", skipHeader: true } // skipHeader prevents extra header row
//   );

//   // Set column widths (approximate, in characters)
//   ws["!cols"] = config.columns.map(() => ({ wch: 20 }));

//   // Create workbook and append worksheet
//   const wb = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

//   // Ensure filename is a valid string
//   const filename = config.filename?.replace(/\.docx$/i, ".xlsx");

//   // Generate Excel buffer
//   const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

//   // Save the file
//   const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
//   saveAs(blob, filename);

// }
// Excel function
export const generateExcel = (records: any[], config: ExportConfig) => {
  // Prepare data for Excel
  const headers = config.columns.map((col) => col.header);
  const data = records.map((record) =>
    config.columns.map((col) =>
      col.formatter
        ? col.formatter(record[col.key], record)
        : record[col.key] ?? "N/A"
    )
  );

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet([]);

  // Add header row at A1
  XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });

  // Add data rows starting at A2
  XLSX.utils.sheet_add_json(
    ws,
    data.map((row) => {
      const rowData: { [key: string]: any } = {};
      headers.forEach((header, i) => {
        rowData[header] = row[i];
      });
      return rowData;
    }),
    { origin: "A2", skipHeader: true } // skipHeader prevents extra header row
  );

  // Set column widths (approximate, in characters)
  ws["!cols"] = config.columns.map(() => ({ wch: 20 }));

  // Create workbook and append worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  // Ensure filename is a valid string
  const filename = config.filename || `${config.title.toLowerCase().replace(/\s/g, "_")}.xlsx`;

  // Generate Excel buffer
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

  // Save the file
  const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, filename);
};