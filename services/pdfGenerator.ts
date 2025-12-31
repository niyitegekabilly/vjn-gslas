
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { User, GSLAGroup, Cycle } from "../types";

// --- Types ---
interface ReportContext {
  reportType: string;
  reportTitle: string;
  group: GSLAGroup;
  user: User | null;
  cycle: Cycle | null;
  data: any;
  filters?: any;
}

// --- Layout Constants ---
const MARGIN = 15;
const HEADER_HEIGHT = 40;
const FOOTER_HEIGHT = 20;
const COLORS = {
  text: [40, 40, 40] as [number, number, number],
  secondary: [100, 100, 100] as [number, number, number],
  accent: [22, 163, 74] as [number, number, number], // Green-600
  headerBg: [240, 240, 240] as [number, number, number],
  alternateRow: [250, 250, 250] as [number, number, number]
};

// --- Helper Functions ---

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-RW', { style: 'decimal', minimumFractionDigits: 0 }).format(amount) + ' RWF';
};

const formatDate = (dateStr: string) => {
  return new Date().toLocaleDateString();
};

const prepareTableData = (type: string, data: any) => {
  let head: string[][] = [];
  let body: any[][] = [];
  let summary: any[] = [];

  if (!data) return { head, body, summary };

  if (type === 'CASH_FLOW' && data.inflows) {
    head = [['Category', 'Type', 'Amount (RWF)']];
    // Inflows
    Object.entries(data.inflows).forEach(([k, v]) => body.push([k, 'Inflow', formatCurrency(v as number)]));
    // Outflows
    Object.entries(data.outflows).forEach(([k, v]) => body.push([k, 'Outflow', formatCurrency(v as number)]));
    
    // Summary row
    body.push([{ content: 'Net Cash Position', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 248, 255] } }, { content: formatCurrency(data.netCash), styles: { fontStyle: 'bold', textColor: COLORS.accent } }]);
  } 
  else if (type === 'SHARE_OUT' && data.members) {
    head = [['Member Name', 'Shares', 'Invested', 'Profit', 'Total Payout']];
    body = data.members.map((m: any) => [
      m.name,
      m.shares,
      formatCurrency(m.invested),
      formatCurrency(m.profit),
      { content: formatCurrency(m.currentValue), styles: { fontStyle: 'bold' } }
    ]);
    
    if (data.summary) {
        summary = [
            `Total Net Worth: ${formatCurrency(data.summary.netWorth)}`,
            `Value Per Share: ${formatCurrency(data.summary.valuePerShare)}`,
            `Cash on Hand: ${formatCurrency(data.summary.cashOnHand)}`,
            `Outstanding Loans: ${formatCurrency(data.summary.outstandingLoans)}`
        ];
    }
  } 
  else if (Array.isArray(data) && data.length > 0) {
    // Generic List Report
    const firstRow = data[0];
    const keys = Object.keys(firstRow).filter(k => k !== 'id'); // Exclude internal IDs
    head = [keys.map(k => k.replace(/([A-Z])/g, ' $1').trim())]; // CamelCase to Title Case
    
    body = data.map((row: any) => keys.map(k => {
      const val = row[k];
      if (typeof val === 'number' && (k.toLowerCase().includes('amount') || k.toLowerCase().includes('balance') || k.toLowerCase().includes('savings'))) {
        return formatCurrency(val);
      }
      return val;
    }));

    // Simple Total for common numerical columns
    const totalCols = keys.filter(k => k.includes('Total') || k.includes('Amount') || k.includes('Balance'));
    if (totalCols.length > 0) {
        // Just show record count in summary for generic lists
        summary = [`Total Records: ${data.length}`];
    }
  }

  return { head, body, summary };
};

// --- Main Generator ---

export const generatePDFReport = (context: ReportContext) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // --- 1. Header (Repeated via autoTable hooks or static for single page reports, we'll do static first page + function for others if needed, but simple is usually just first page header)
  // Actually, standard is header on every page. AutoTable supports `didDrawPage`.
  
  const drawHeader = (data: any) => {
    // Logo Placeholder
    doc.setFillColor(20, 20, 20);
    doc.rect(MARGIN, 10, 10, 10, 'F'); // Square logo placeholder
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("VJN", MARGIN + 2, 16);

    // Organization Name
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Vision Jeunesse Nouvelle", MARGIN + 15, 17);

    // Report Title (Right Aligned)
    doc.setFontSize(16);
    doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
    doc.text(context.reportTitle.toUpperCase(), pageWidth - MARGIN, 17, { align: "right" });

    // Separator Line
    doc.setDrawColor(200, 200, 200);
    doc.line(MARGIN, 25, pageWidth - MARGIN, 25);
  };

  const drawFooter = (data: any) => {
    const pageNumber = data.pageNumber; // AutoTable provides this
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.line(MARGIN, pageHeight - 15, pageWidth - MARGIN, pageHeight - 15);
    
    doc.text("VJN GSLA Management System", MARGIN, pageHeight - 10);
    doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    doc.text(`Page ${pageNumber}`, pageWidth - MARGIN, pageHeight - 10, { align: "right" });
  };

  // --- 2. Metadata Block (Page 1 Only) ---
  const drawMetadata = () => {
    doc.setFontSize(10);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.setFont("helvetica", "normal");

    const metaY = 35;
    const col2X = pageWidth / 2;

    // Col 1
    doc.setFont("helvetica", "bold");
    doc.text("Group:", MARGIN, metaY);
    doc.setFont("helvetica", "normal");
    doc.text(context.group.name, MARGIN + 25, metaY);

    doc.setFont("helvetica", "bold");
    doc.text("Season:", MARGIN, metaY + 6);
    doc.setFont("helvetica", "normal");
    doc.text(context.cycle ? `${context.cycle.startDate} - ${context.cycle.endDate || 'Active'}` : 'N/A', MARGIN + 25, metaY + 6);

    // Col 2
    doc.setFont("helvetica", "bold");
    doc.text("Generated By:", col2X, metaY);
    doc.setFont("helvetica", "normal");
    doc.text(context.user?.fullName || 'System', col2X + 30, metaY);

    doc.setFont("helvetica", "bold");
    doc.text("Currency:", col2X, metaY + 6);
    doc.setFont("helvetica", "normal");
    doc.text("RWF", col2X + 30, metaY + 6);
  };

  // --- 3. Body (Table) ---
  const { head, body, summary } = prepareTableData(context.reportType, context.data);

  autoTable(doc, {
    startY: 55,
    head: head,
    body: body,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: COLORS.text,
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: COLORS.text,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
        // Basic heuristic: last few columns usually numbers in these reports
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { top: HEADER_HEIGHT, bottom: FOOTER_HEIGHT, left: MARGIN, right: MARGIN },
    didDrawPage: (data) => {
      drawHeader(data);
      drawFooter(data);
    },
  });

  // --- 4. Post-Table Content (Signatures & Summary) ---
  let finalY = (doc as any).lastAutoTable.finalY + 10;

  // Add Summary if exists
  if (summary && summary.length > 0) {
      // Check space
      if (finalY + (summary.length * 7) > pageHeight - FOOTER_HEIGHT - 40) {
          doc.addPage();
          finalY = MARGIN + 10;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Report Summary:", MARGIN, finalY);
      doc.setFont("helvetica", "normal");
      
      summary.forEach((line, i) => {
          doc.text(`• ${line}`, MARGIN + 5, finalY + 6 + (i * 6));
      });
      finalY += 15 + (summary.length * 6);
  }

  // Add Signatures
  // Ensure enough space for signatures (approx 40 units height)
  if (finalY + 40 > pageHeight - FOOTER_HEIGHT) {
      doc.addPage();
      finalY = MARGIN + 10;
  }

  finalY += 10; // Spacing
  
  const sigWidth = (pageWidth - (MARGIN * 2)) / 3;
  const sigLineY = finalY + 15;

  doc.setLineWidth(0.5);
  doc.setDrawColor(100, 100, 100);
  doc.setFontSize(9);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);

  // Sig 1
  doc.line(MARGIN, sigLineY, MARGIN + sigWidth - 10, sigLineY);
  doc.text("Prepared By", MARGIN, sigLineY + 5);

  // Sig 2
  doc.line(MARGIN + sigWidth, sigLineY, MARGIN + (sigWidth * 2) - 10, sigLineY);
  doc.text("Reviewed By", MARGIN + sigWidth, sigLineY + 5);

  // Sig 3
  doc.line(MARGIN + (sigWidth * 2), sigLineY, MARGIN + (sigWidth * 3), sigLineY);
  doc.text("Approved By", MARGIN + (sigWidth * 2), sigLineY + 5);

  // Draw Metadata only on page 1 (After autotable runs, we go back to page 1)
  doc.setPage(1);
  drawMetadata();

  // --- 5. Output ---
  const cleanGroupName = context.group.name.replace(/[^a-z0-9]/gi, '_').toUpperCase();
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
  const fileName = `VJN_${cleanGroupName}_${context.reportType}_${dateStr}.pdf`;
  
  doc.save(fileName);
};
