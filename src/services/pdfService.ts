import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { Ingredient, Recipe, Transaction, Employee, ShiftType, Attendance } from "../types";
import { formatCurrency } from "../lib/utils";
import { JOBDESK_MARKDOWN } from "../constants";
import { SHIFT_CONFIGS } from "../schedulerConstants";

const FONT_FAMILY = 'helvetica';

// ─── UI Loading Feedback ───────────────────────────────────────────────────
const showLoadingOverlay = () => {
  const overlayId = 'pdf-loading-overlay';
  let overlay = document.getElementById(overlayId);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = overlayId;
    Object.assign(overlay.style, {
      position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.8)', color: 'white', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: '10000', fontFamily: 'sans-serif'
    });
    overlay.innerHTML = `
      <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin-pdf 1s linear infinite;"></div>
      <style>@keyframes spin-pdf { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
      <h2 style="font-size: 20px; font-weight: bold; margin-top: 20px;">MENYUSUN LAPORAN...</h2>
      <p style="font-size: 14px; margin-top: 8px; color: #cbd5e1;">Mohon tunggu sebentar</p>
    `;
    document.body.appendChild(overlay);
  }
  return overlay;
};

const hideLoadingOverlay = (overlay: HTMLElement | null) => {
  if (overlay && document.body.contains(overlay)) {
    document.body.removeChild(overlay);
  }
};

// ─── RGB Color Forcing Fix (Prevents oklch errors) ──────────────────────────
const rgbForceFix = (clonedDoc: Document) => {
  const elements = clonedDoc.querySelectorAll('*');
  elements.forEach((el) => {
    const HTMLElement = el as HTMLElement;
    const style = window.getComputedStyle(el);
    HTMLElement.style.color = style.color;
    HTMLElement.style.backgroundColor = style.backgroundColor;
    HTMLElement.style.borderColor = style.borderColor;
  });
};

const getFormattedFilename = (baseName: string) => {
  const date = new Date();
  const dateString = date.toISOString().split('T')[0].replace(/-/g, '');
  return `EngineStation_${baseName}_${dateString}.pdf`;
};

// ─── Printer Browser Method ────────────────────────────────────────────────
const saveBlob = (doc: jsPDF, filename: string) => {
  const finalFilename = getFormattedFilename(filename.replace('.pdf', ''));
  // Standard robust save method directly from jsPDF
  doc.save(finalFilename);
};

// ─── Standardized Footer ───────────────────────────────────────────────────
const addSimpleFooter = (doc: jsPDF, data: any) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
  
  doc.setFontSize(7);
  doc.setFont(FONT_FAMILY, 'normal');
  doc.setTextColor(148, 163, 184);
  
  const footerY = pageHeight - 10;
  const timestamp = `Dicetak: ${new Date().toLocaleString('id-ID')}`;
  const brand = 'ENGINE STATION - POS & ERP System';
  const pageLabel = `Halaman ${currentPage}`;
  
  doc.text(timestamp, data.settings.margin.left, footerY);
  doc.text(brand, pageWidth / 2, footerY, { align: 'center' });
  doc.text(pageLabel, pageWidth - data.settings.margin.right - doc.getTextWidth(pageLabel), footerY);
  doc.line(data.settings.margin.left, footerY - 3, pageWidth - data.settings.margin.right, footerY - 3);
};

export const handleExportJobdeskPDF = (selectedTasks: string[], reportTitle: string) => {
  const overlay = showLoadingOverlay();
  try {
    const doc = new jsPDF({ compress: true, orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Legacy support for manual text header until Hybrid Header migration is complete
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.text('SPO OPERASIONAL ENGINE STATION', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont(FONT_FAMILY, 'normal');
    doc.text(reportTitle, pageWidth / 2, 26, { align: 'center' });
    
    // Data preparation
    const lines = JOBDESK_MARKDOWN.split('\n');
    const tableData: any[] = [];
    let currentSection = "";
    let currentSubSection = "";

    lines.forEach(line => {
      if (line.startsWith('## ')) {
        currentSection = line.replace('## ', '').trim();
        currentSubSection = "";
      } else if (line.startsWith('### ')) {
        currentSubSection = line.replace('### ', '').trim();
      } else if (line.includes('* [ ]')) {
        const taskName = line.replace('* [ ]', '').trim();
        if (selectedTasks.length === 0 || selectedTasks.includes(taskName)) {
          tableData.push([currentSection, currentSubSection, taskName, "[ ]"]);
        }
      }
    });

    autoTable(doc, {
      startY: 35,
      head: [['Kategori', 'Sub-Kategori', 'Tugas', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
      columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 40 }, 3: { cellWidth: 20, halign: 'center' } },
      didDrawPage: (data) => addSimpleFooter(doc, data)
    });

    saveBlob(doc, `${reportTitle.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error("PDF Export Error:", error);
    alert("Gagal mengekspor laporan.");
  } finally {
    hideLoadingOverlay(overlay);
  }
};

export const handleExportInventoryPDF = (ingredients: Ingredient[], recipes: Recipe[]) => {
  const overlay = showLoadingOverlay();
  try {
    const doc = new jsPDF({ compress: true, orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.text('LAPORAN KONTROL STOK & PENGGUNAAN BAHAN', pageWidth / 2, 20, { align: 'center' });
    
    const tableData = ingredients.map(ing => {
      const usedInMenus = recipes
        .filter(r => r.items.some(item => item.ingredientId === ing.id))
        .map(r => r.name)
        .join(', ');

      return [
        ing.name,
        ing.category || 'Makanan',
        usedInMenus || '-',
        `${ing.stockQuantity / ing.conversionValue} ${ing.purchaseUnit}`,
        ing.lowStockThreshold ? `${ing.lowStockThreshold / ing.conversionValue} ${ing.purchaseUnit}` : '-',
        ing.stockQuantity <= (ing.lowStockThreshold || 0) ? 'Stok Rendah' : 'Aman'
      ];
    });

    autoTable(doc, {
      startY: 30,
      head: [['Nama Bahan', 'Kategori', 'Digunakan Pada Menu', 'Stok Saat Ini', 'Min. Stok', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
      didDrawPage: (data) => addSimpleFooter(doc, data)
    });

    saveBlob(doc, 'Inventori.pdf');
  } catch (error) {
    console.error("PDF Export Error:", error);
    alert("Gagal mengekspor laporan.");
  } finally {
    hideLoadingOverlay(overlay);
  }
};

export const handleExportRecipePDF = (recipe: Recipe, ingredients: Ingredient[]) => {
  const overlay = showLoadingOverlay();
  try {
    const doc = new jsPDF({ compress: true, orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.text('BILL OF MATERIALS (BOM) & KALKULASI HPP', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Resep : ${recipe.name}`, pageWidth / 2, 26, { align: 'center' });
    
    const bahanBakuCost = recipe.items.reduce((acc, item) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      return acc + (ing ? (ing.purchasePrice / ing.conversionValue) * item.quantityNeeded : 0);
    }, 0);

    const tableData = recipe.items.map((item, index) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      const cost = ing ? (ing.purchasePrice / ing.conversionValue) * item.quantityNeeded : 0;
      return [index + 1, ing?.name || 'Unknown', `${item.quantityNeeded} ${ing?.useUnit || ''}`, `Rp ${cost.toLocaleString('id-ID')}`];
    });

    autoTable(doc, {
      startY: 35,
      head: [['No.', 'Bahan Baku', 'Jumlah', 'Biaya']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 3: { halign: 'right' } },
      didDrawPage: (data) => addSimpleFooter(doc, data)
    });

    saveBlob(doc, `Resep_${recipe.name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error("PDF Export Error:", error);
    alert("Gagal mengekspor laporan.");
  } finally {
    hideLoadingOverlay(overlay);
  }
};

export const handleExportClosingPDF = async (reportRef: React.RefObject<HTMLDivElement>) => {
  if (!reportRef.current) return;
  const overlay = showLoadingOverlay();
  try {
    // Standardizing closing report as 80mm receipt format but searchable via canvas hybrid logic if possible
    // For receipts, we often capture the whole element
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      onclone: (cloned) => rgbForceFix(cloned)
    });
    
    const parentWidth = reportRef.current.offsetWidth;
    const parentHeight = reportRef.current.offsetHeight;
    const pdfHeight = (parentHeight * 80) / parentWidth;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, pdfHeight],
      compress: true
    });
    
    doc.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 80, pdfHeight);
    saveBlob(doc, 'Closing.pdf');
  } catch (error) {
    console.error("PDF Export Error:", error);
    alert("Gagal mengekspor closing.");
  } finally {
    hideLoadingOverlay(overlay);
  }
};

export const handleExportShiftPDF = (
  employees: Employee[], 
  shifts: Record<string, Record<string, ShiftType>>, 
  dates: { dateStr: string; dayName: string; dayNum: string }[], 
  currentDate: Date
) => {
  if (!employees.length) return;
  const overlay = showLoadingOverlay();
  try {
    const doc = new jsPDF({ compress: true, orientation: 'l', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const periodString = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.text(`JADWAL SHIFT KARYAWAN PSRESTO - ${periodString.toUpperCase()}`, pageWidth / 2, 15, { align: 'center' });
    
    const headRow = ['Karyawan', ...dates.map(d => `${d.dayNum}`)];
    const bodyRows = employees.map(emp => {
      const row = [emp.name.toUpperCase()];
      dates.forEach(day => {
        const shiftType = shifts[emp.id]?.[day.dateStr] || ShiftType.LIBUR;
        row.push(SHIFT_CONFIGS[shiftType]?.code || 'O');
      });
      return row;
    });

    autoTable(doc, {
      startY: 22,
      head: [headRow],
      body: bodyRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 7 },
      bodyStyles: { halign: 'center', fontSize: 6.5, fontStyle: 'bold' },
      columnStyles: { 0: { halign: 'left', cellWidth: 35 } },
      didDrawPage: (data) => addSimpleFooter(doc, data)
    });

    saveBlob(doc, 'Shift.pdf');
  } catch (error) {
    console.error("PDF Export Error:", error);
    alert("Gagal mengekspor shift.");
  } finally {
    hideLoadingOverlay(overlay);
  }
};

export const handleExportPatternPDF = (employees: Employee[], weeklyPattern: Record<string, ShiftType[]>, currentDate: Date = new Date()) => {
  const overlay = showLoadingOverlay();
  try {
    const doc = new jsPDF({ compress: true, orientation: 'l', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title: POLA JADWAL SHIFT MINGGUAN
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.text("POLA JADWAL SHIFT MINGGUAN", pageWidth / 2, 15, { align: 'center' });

    // Subtitle: PAWON SALAM RESTO
    doc.setFontSize(11);
    doc.setFont(FONT_FAMILY, 'normal');
    doc.text("Pawon Salam Resto", pageWidth / 2, 21, { align: 'center' });

    // Berlaku Mulai Tanggal dd/mm/yy
    const dd = String(currentDate.getDate()).padStart(2, '0');
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const yy = String(currentDate.getFullYear()).slice(-2);
    doc.setFontSize(10);
    doc.text(`Berlaku Mulai Tanggal ${dd}/${mm}/${yy}`, pageWidth / 2, 27, { align: 'center' });
    
    // Shift color mapping: P=blue, M=green, O=red
    const shiftCellColors: Record<string, [number, number, number]> = {
      'P': [66, 133, 244],   // Blue
      'M': [52, 168, 83],    // Green
      'O': [234, 67, 53],    // Red
    };

    const headRow = ['Nama Karyawan', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const bodyRows = employees.map(emp => {
      // Name + role (jabatan) underneath
      const nameWithRole = emp.role ? `${emp.name.toUpperCase()}\n${emp.role}` : emp.name.toUpperCase();
      const row = [nameWithRole];
      const empPattern = weeklyPattern[emp.id] || weeklyPattern['default'] || Array(7).fill(ShiftType.LIBUR);
      [1, 2, 3, 4, 5, 6, 0].forEach(idx => {
         row.push(SHIFT_CONFIGS[empPattern[idx] || ShiftType.LIBUR]?.code || 'O');
      });
      return row;
    });

    autoTable(doc, {
      startY: 33,
      head: [headRow],
      body: bodyRows,
      theme: 'grid',
      styles: { lineColor: [180, 180, 180], lineWidth: 0.4 },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], halign: 'center', fontStyle: 'bold', lineColor: [180, 180, 180], lineWidth: 0.4 },
      bodyStyles: { halign: 'center', fontSize: 9, fontStyle: 'bold', textColor: [0, 0, 0] },
      columnStyles: { 0: { halign: 'left', cellWidth: 55, fontSize: 8 } },
      didDrawCell: (data) => {
        // Color shift cells (columns 1-7, body rows only)
        if (data.section === 'body' && data.column.index >= 1) {
          const cellText = data.cell.text[0]?.trim();
          const bgColor = shiftCellColors[cellText];
          if (bgColor) {
            // Fill background with shift color, leaving border visible
            const inset = 0.2;
            doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
            doc.rect(data.cell.x + inset, data.cell.y + inset, data.cell.width - inset * 2, data.cell.height - inset * 2, 'F');
            // Redraw gray border on top
            doc.setDrawColor(180, 180, 180);
            doc.setLineWidth(0.4);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'S');
            // Redraw text in black
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            doc.setFont(FONT_FAMILY, 'bold');
            doc.text(cellText, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' });
          }
        }
      },
      didDrawPage: (data) => addSimpleFooter(doc, data)
    });

    saveBlob(doc, 'PolaMingguan.pdf');
  } catch (error) {
    console.error("PDF Export Error:", error);
    alert("Gagal mengekspor pola mingguan.");
  } finally {
    hideLoadingOverlay(overlay);
  }
};

export const handleExportSlipPDF = (employee: Employee | null, attendances: Attendance[]) => {
  if (!employee) return;
  const overlay = showLoadingOverlay();
  try {
    const doc = new jsPDF({ compress: true, orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const currentMonth = new Date().toISOString().substring(0, 7);
    const periodString = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });

    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.text('SLIP GAJI KARYAWAN', pageWidth / 2, 28, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Periode: ${periodString}`, pageWidth / 2, 34, { align: 'center' });

    // Attendance stats for current month
    const empAtt = attendances.filter(a => a.employeeId === employee.id && a.date.startsWith(currentMonth));
    const hadirCount = empAtt.filter(a => a.status === 'Hadir').length;
    const alphaCount = empAtt.filter(a => a.status === 'Alpha').length;
    const izinCount = empAtt.filter(a => a.status === 'Izin').length;

    const dailyRate = employee.salary / 26;
    const deductionAlpha = alphaCount * dailyRate;
    const netSalary = Math.max(0, employee.salary - deductionAlpha);

    autoTable(doc, {
      startY: 45,
      head: [['Informasi Karyawan', '']],
      body: [
        ['Nama', employee.name.toUpperCase()],
        ['Jabatan', employee.role.toUpperCase()],
        ['ID Karyawan', `#ELV-${employee.id.split('-')[0].toUpperCase()}`],
        ['Total Kehadiran', `${hadirCount} Hari`],
        ['Alpha / Tanpa Alasan', `${alphaCount} Hari`]
      ],
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Deskripsi Komponen', 'Nilai (IDR)']],
      body: [
        ['Gaji Pokok Dasar', formatCurrency(employee.salary)],
        ['Potongan Kedisiplinan (Alpha)', `-${formatCurrency(deductionAlpha)}`],
        ['Bonus & Tunjangan', 'Rp 0'],
        ['NET TAKE HOME PAY', formatCurrency(netSalary)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === 3) {
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.textColor = [79, 70, 229];
        }
        if (data.section === 'body' && data.row.index === 1) {
          data.cell.styles.textColor = [225, 29, 72];
        }
      },
      didDrawPage: (data) => addSimpleFooter(doc, data)
    });

    saveBlob(doc, `SlipGaji_${employee.name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error("PDF Export Error:", error);
    alert("Gagal mengekspor slip gaji.");
  } finally {
    hideLoadingOverlay(overlay);
  }
};

export interface SavePDFParams {
  headerSelector?: string;
  tableData: any[][];
  tableHeaders: string[];
  reportTitle: string;
}

export const savePDF = async ({ headerSelector = '#header', tableData, tableHeaders, reportTitle }: SavePDFParams) => {
  const overlay = showLoadingOverlay();
  try {
    const doc = new jsPDF({ compress: true, orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let startY = 15;

    const headerEl = document.querySelector(headerSelector) as HTMLElement;
    if (headerEl) {
      const canvas = await html2canvas(headerEl, {
        scale: 3, // High-fidelity
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (cloned) => {
          const header = cloned.getElementById('header');
          if (header) {
            header.style.backgroundColor = '#ffffff';
            // Hide "Install App", "Notifications", and any buttons in the PDF capture
            const uiElements = header.querySelectorAll('button, .flex.items-center:last-child');
            uiElements.forEach((el) => {
              (el as HTMLElement).style.display = 'none';
            });
            // Ensure title/logo text is dark
            const brandingText = header.querySelectorAll('h1, span, p');
            brandingText.forEach((el) => {
              (el as HTMLElement).style.color = '#0f172a';
            });
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 20; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      startY = 10 + imgHeight + 10;
    } else {
      doc.setFontSize(14);
      doc.setFont(FONT_FAMILY, 'bold');
      doc.text(reportTitle, pageWidth / 2, startY, { align: 'center' });
      startY += 15;
    }

    autoTable(doc, {
      startY,
      head: [tableHeaders],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3, textColor: [30, 41, 59] },
      didDrawPage: (data) => addSimpleFooter(doc, data)
    });

    saveBlob(doc, 'Laporan.pdf');
  } catch (err: any) {
    console.error("PDF Export Error:", err);
    alert("Gagal mengekspor laporan.");
  } finally {
    hideLoadingOverlay(overlay);
  }
};
