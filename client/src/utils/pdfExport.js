import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a professional PDF report from pinned charts.
 * @param {Array} pinnedCharts - Array of pinned chart config objects.
 * @param {string} datasetName - The name of the active dataset.
 */
export async function generatePDFReport(pinnedCharts, datasetName = 'LuminaBI') {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 15;

  // --- Cover Page ---
  pdf.setFillColor(10, 14, 33);
  pdf.rect(0, 0, pageW, pageH, 'F');

  // Gradient bar
  pdf.setFillColor(37, 99, 235);
  pdf.rect(0, 0, pageW, 2, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LuminaBI', margin, 55);
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(148, 163, 184);
  pdf.text('Executive Dashboard Report', margin, 65);

  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(datasetName, margin, 90);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 100);
  pdf.text(`Total Insights: ${pinnedCharts.length}`, margin, 108);

  // Footer
  pdf.setDrawColor(37, 99, 235);
  pdf.setLineWidth(0.5);
  pdf.line(margin, pageH - 20, pageW - margin, pageH - 20);
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(9);
  pdf.text('Powered by LuminaBI · Conversational AI Analytics', margin, pageH - 13);

  // --- Chart Pages ---
  for (let i = 0; i < pinnedCharts.length; i++) {
    pdf.addPage();

    // Page bg
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageW, pageH, 'F');
    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageW, 1.5, 'F');

    // Chart number tag
    pdf.setFillColor(37, 99, 235, 0.15);
    pdf.setTextColor(96, 165, 250);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`INSIGHT ${String(i + 1).padStart(2, '0')} / ${String(pinnedCharts.length).padStart(2, '0')}`, margin, 20);

    // Chart type badge
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text((pinnedCharts[i].chart_type || 'chart').toUpperCase() + ' CHART', pageW - margin, 20, { align: 'right' });

    // Explanation
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    const lines = pdf.splitTextToSize(pinnedCharts[i].explanation || 'Chart Insight', pageW - margin * 2);
    pdf.text(lines, margin, 30);

    // Capture the chart element
    const el = document.getElementById(`pinned-chart-${pinnedCharts[i].id}`);
    if (el) {
      try {
        const canvas = await html2canvas(el, { backgroundColor: '#0f172a', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgW = pageW - margin * 2;
        const imgH = (canvas.height / canvas.width) * imgW;
        const yOffset = 40 + lines.length * 6;
        pdf.addImage(imgData, 'PNG', margin, yOffset, imgW, Math.min(imgH, pageH - yOffset - 30));
      } catch (e) {
        pdf.setTextColor(100, 116, 139);
        pdf.setFontSize(10);
        pdf.text('[Chart could not be rendered]', margin, 55);
      }
    }

    // SQL used
    if (pinnedCharts[i].sql_used) {
      pdf.setTextColor(71, 85, 105);
      pdf.setFontSize(7);
      pdf.setFont('courier', 'normal');
      const sqlLines = pdf.splitTextToSize(`SQL: ${pinnedCharts[i].sql_used}`, pageW - margin * 2);
      pdf.text(sqlLines.slice(0, 3), margin, pageH - 18);
    }

    // Page footer
    pdf.setDrawColor(37, 99, 235);
    pdf.setLineWidth(0.3);
    pdf.line(margin, pageH - 10, pageW - margin, pageH - 10);
    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(8);
    pdf.text('LuminaBI Analytics Report', margin, pageH - 5);
    pdf.text(`Page ${i + 2}`, pageW - margin, pageH - 5, { align: 'right' });
  }

  pdf.save(`LuminaBI_Report_${datasetName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
}
