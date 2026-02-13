// PDF Export pentru Calculator de Salarii
// Genereaza un PDF stilizat in format A4 - Stil Fintech
import { jsPDF } from 'jspdf';

// Helper pentru eliminarea diacriticelor
const removeDiacritics = (str) => {
  const diacriticsMap = {
    'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't',
    'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T',
  };
  return str.replace(/[ăâîșțĂÂÎȘȚ]/g, match => diacriticsMap[match] || match);
};

export const generateSalaryPDF = (result, year = 2026, exchangeRate = 4.98) => {
  // Cream un document A4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Margini ajustate pentru indosariere (Sina/Binder safety)
  // Folosim 30mm stanga si 20mm dreapta pentru un aspect "ingust" si sigur
  const marginL = 30;
  const marginR = 20;
  let y = 20;

  // Culori - Stil MD3 minimalist / Simplist
  const primaryColor = [37, 99, 235]; // blue-600
  const darkColor = [30, 41, 59]; // slate-800
  const grayColor = [71, 85, 105]; // slate-600 (Mai inchis decat slate-500)
  const borderColor = [226, 232, 240]; // slate-200

  // 1. Top Header - Exchange Rate Only
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.text(`1 Euro = ${exchangeRate.toFixed(4)} lei`, pageWidth - marginR, y, { align: 'right' });

  y += 10;

  // 2. Main Title - Centered relative to the printable area
  const printableCenterX = (marginL + (pageWidth - marginR)) / 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...darkColor);
  doc.text(removeDiacritics(`Anul ${year}`), printableCenterX, y, { align: 'center' });

  y += 15;

  const col1X = marginL;
  const col2X = pageWidth - marginR - 35; // Lei
  const col3X = pageWidth - marginR;      // Euro

  // Helper function for table headers
  const renderTableHeader = (title) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkColor);
    doc.text(removeDiacritics(title), col1X, y);
    doc.text('Lei', col2X, y, { align: 'right' });
    doc.text('Euro', col3X, y, { align: 'right' });

    y += 2;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(col1X, y, col3X, y);
    y += 5;
  };

  // Helper function for table rows
  const renderTableRow = (label, ronValue, isBold = false, indent = 0) => {
    if (isBold) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkColor);
      doc.setFontSize(10.5);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...grayColor);
      doc.setFontSize(10);
    }

    doc.text(removeDiacritics(label), col1X + indent, y);
    doc.text(formatNumber(ronValue), col2X, y, { align: 'right' });
    doc.text(formatNumber(ronValue / exchangeRate), col3X, y, { align: 'right' });

    y += 1.5;
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.1);
    doc.line(col1X, y, col3X, y);
    y += 5.5;
  };

  // --- SECTION: ANGAJAT ---
  renderTableHeader('ANGAJAT');
  renderTableRow('Salariu Brut', result.gross, true);

  if (result.untaxedAmount > 0) {
    renderTableRow('Suma Netaxabila', result.untaxedAmount);
  }

  renderTableRow(`Asigurari Sociale (CAS)  ${result.breakdown?.casPercent || 25}%`, result.cas);
  renderTableRow(`Asigurari Sociale de Sanatate (CASS)  ${result.breakdown?.cassPercent || 10}%`, result.cass);

  if (result.personalDeduction > 0) {
    renderTableRow('Deducere personala (DP)', result.personalDeduction);
  }

  if (result.childDeduction > 0) {
    renderTableRow('Deducere copii', result.childDeduction);
  }

  renderTableRow(`Impozit pe venit (IV)  ${result.breakdown?.taxPercent || 10}%`, result.incomeTax);

  renderTableRow('Salariu Net', result.net, true);

  y += 5;

  // --- SECTION: ANGAJATOR ---
  renderTableHeader('ANGAJATOR');
  renderTableRow(`Contributie Asiguratorie pentru Munca (CAM)  ${result.breakdown?.camPercent || 2.25}%`, result.cam);

  if (result.employerExtraCAS > 0) {
    renderTableRow('Extra CAS (part-time)', result.employerExtraCAS);
  }
  if (result.employerExtraCASS > 0) {
    renderTableRow('Extra CASS (part-time)', result.employerExtraCASS);
  }
  if (result.voucherValue > 0) {
    renderTableRow('Tichete masa', result.voucherValue);
  }

  renderTableRow('Salariu Complet (Cost Total)', result.totalCost, true);

  y += 5;

  // --- SECTION: TOTAL TAXE ---
  const employeePay = result.cas + result.cass + result.incomeTax;
  const employerPay = result.cam + (result.employerExtraCAS || 0) + (result.employerExtraCASS || 0);
  const totalTax = employeePay + employerPay;

  renderTableHeader('TOTAL TAXE');
  renderTableRow('Angajatul plateste statului', employeePay);
  renderTableRow('Angajatorul plateste statului', employerPay);
  renderTableRow('Total taxe incasate de stat', totalTax, true);

  y += 8;

  // --- NARRATIVE TEXT ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  const summaryText = `Pentru a plati un salariu net de ${formatNumber(result.net)} lei, angajatorul cheltuie ${formatNumber(result.totalCost)} lei`;
  doc.text(removeDiacritics(summaryText), printableCenterX, y, { align: 'center' });

  // 4. Footer - subtle style from user reference
  y = pageHeight - 25; // Raised to avoid overflow
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.2);
  doc.line(marginL, y, pageWidth - marginR, y);
  y += 6;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('www.ecalc.ro  -  Calculator Salarii PRO   |   contact@ecalc.ro', marginL, y);

  y += 4.5;
  doc.setFontSize(7);
  doc.setTextColor(...grayColor);
  const footerServices = 'Brut -> Net, Net -> Brut   -   IT/Constructii/Agricultura   -   Tichete masa   -   Part-time   -   Zile lucratoare   -   Zile libere   -   Concediu medical';
  doc.text(removeDiacritics(footerServices), marginL, y);

  // Salvam PDF-ul
  const filename = `fluturas_salariu_${result.gross}_RON_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);

  return filename;
};

// Funcție de formatare numere
const formatNumber = (num) => {
  return new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

// Export pentru alte calculatoare
export const generateGenericPDF = (title, data, year = 2026) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // Culori - Fintech Style
  const primaryColor = [37, 99, 235]; // blue-600
  const darkColor = [30, 41, 59]; // slate-800
  const grayColor = [100, 116, 139]; // slate-500
  const tableHeaderBg = [248, 250, 252]; // slate-50
  const alternateRowBg = [249, 250, 251]; // gray-50/50

  // Header - Logo Section
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('eCalc.ro', margin, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(removeDiacritics('Calculatoare Fiscale Profesionale - Raport Detaliat'), margin, 22);

  y = 45;

  // Titlu Raport
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(removeDiacritics(title), margin, y);

  y += 10;

  // Tabel Layout - Cap de Tabel
  doc.setFillColor(...tableHeaderBg);
  doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  doc.line(margin, y + 10, pageWidth - margin, y + 10);

  doc.setTextColor(...grayColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALII / DATA', margin + 5, y + 6.5);
  doc.text('VALOARE / EVENIMENT', margin + 75, y + 6.5);

  y += 10;

  // Populare Date Tabel
  doc.setFontSize(10);

  Object.entries(data).forEach(([key, value], index) => {
    // Verificare depasire pagina
    if (y > pageHeight - 25) {
      doc.addPage();
      y = margin + 10;
    }

    // Rand alternant pentru lizibilitate
    if (index % 2 === 1) {
      doc.setFillColor(...alternateRowBg);
      doc.rect(margin, y, pageWidth - 2 * margin, 9, 'F');
    }

    // Coloana 1: Cheie/Data
    doc.setTextColor(...grayColor);
    doc.setFont('helvetica', 'normal');
    doc.text(removeDiacritics(key), margin + 5, y + 6);

    // Coloana 2: Valoare/Nume Sărbătoare
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'bold');

    // Gestionare text lung pentru a nu depasi pagina
    const valText = removeDiacritics(String(value));
    doc.text(valText, margin + 75, y + 6);

    y += 9;
  });

  // Footer Profesional
  const footerY = pageHeight - 20;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setTextColor(...grayColor);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(removeDiacritics(`Generat pe eCalc.ro la data de ${new Date().toLocaleDateString('ro-RO')}`), margin, footerY + 8);
  doc.text('www.ecalc.ro', pageWidth - margin - 22, footerY + 8);

  // Salvam PDF-ul cu nume sugestiv
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `raport_${safeTitle}_${year}.pdf`;
  doc.save(filename);

  return filename;
};

// Export pentru impozit auto
export const generateCarTaxPDF = (result, year = 2026) => {
  const data = {
    'Capacitate cilindrică': `${result.engineCC} cmc`,
    'Tip vehicul': result.vehicleTypeName,
    'Normă poluare': result.euroNormName,
    'Localitate': result.location,
    'Coeficient localitate': result.locationCoefficient?.toFixed(2),
    'Impozit anual': `${formatNumber(result.finalTax)} RON`,
    'Plată trimestrială': `${formatNumber(result.quarterly)} RON`,
  };

  return generateGenericPDF(`Calculator Impozit Auto ${year}`, data, year);
};

// Export pentru compensații zboruri
export const generateFlightCompensationPDF = (result, year = 2026) => {
  const data = {
    'Aeroport plecare': result.departure?.name || 'N/A',
    'Aeroport sosire': result.arrival?.name || 'N/A',
    'Distanță': `${result.distance} km`,
    'Compensație posibilă': `${result.compensation?.amount || 0} EUR`,
    'Categorie distanță': result.compensation?.category || 'N/A',
  };

  return generateGenericPDF(`Compensație Zbor ${year}`, data, year);
};

// Export pentru Zile Lucrătoare - Stil Premium MD3
export const generateWorkingDaysPDF = (data, year = 2026) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // Culori MD3 si UI
  const primaryColor = [37, 99, 235]; // blue-600
  const grayColor = [100, 116, 139]; // slate-500
  const darkColor = [30, 41, 59]; // slate-800
  const redColor = [220, 38, 38]; // red-600
  const emeraldColor = [22, 163, 74]; // emerald-600

  // Header - Branding
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('eCalc.ro', margin, 15);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(removeDiacritics('Calculatoare Fiscale Profesionale - Raport Detaliat'), margin, 22);

  doc.setFontSize(10);
  doc.text(removeDiacritics(`Anul Fiscal ${year}`), pageWidth - margin - 35, 17);

  y = 45;

  // Titlu Sectiune
  doc.setTextColor(...darkColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(removeDiacritics('Sumar Anual Zile Lucratoare'), margin, y);
  y += 8;

  // Summary Cards - 4 in a row (Matching UI exactly)
  const cardWidth = (pageWidth - 2 * margin - 9) / 4;
  const cards = [
    { label: 'Zile Lucratoare', value: data.totalWorkingDays, color: [29, 78, 216], bg: [239, 246, 255] },
    { label: 'Sarbatori Legale', value: data.totalHolidays, color: [185, 28, 28], bg: [254, 242, 242] },
    { label: 'Zile Weekend', value: data.totalWeekends, color: [51, 65, 85], bg: [248, 250, 252] },
    { label: 'Total Zile', value: data.totalDays, color: [5, 150, 105], bg: [236, 253, 245] }
  ];

  cards.forEach((card, i) => {
    const cardX = margin + (cardWidth + 3) * i;
    doc.setFillColor(...card.bg);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, y, cardWidth, 22, 3, 3, 'F');

    doc.setTextColor(...card.color);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${card.value}`, cardX + cardWidth / 2, y + 11, { align: 'center' });

    doc.setTextColor(...card.color);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(removeDiacritics(card.label).toUpperCase(), cardX + cardWidth / 2, y + 17, { align: 'center' });
  });

  y += 35;

  // Tabel Lunar - 4 coloane ca pe Web (Zile, Zile L., 8h, 4h)
  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(removeDiacritics('Distribuție Detaliată pe Luni'), margin, y);
  y += 6;

  // Header Tabel
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  doc.line(margin, y + 8, pageWidth - margin, y + 8);

  doc.setFontSize(7);
  doc.setTextColor(...grayColor);
  doc.setFont('helvetica', 'bold');
  doc.text('LUNA', margin + 3, y + 5);
  doc.text('ZILE L.', margin + 90, y + 5, { align: 'right' });
  doc.text('8 H', margin + 125, y + 5, { align: 'right' });
  doc.text('4 H', margin + 160, y + 5, { align: 'right' });
  y += 8;

  // Randuri Tabel
  doc.setFontSize(9);
  data.months.forEach((m, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
    }
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'bold');
    doc.text(removeDiacritics(m.name), margin + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(29, 78, 216);
    doc.text(`${m.workingDays}`, margin + 90, y + 5, { align: 'right' });
    doc.setTextColor(...darkColor);
    doc.text(`${m.workingHours}`, margin + 125, y + 5, { align: 'right' });
    doc.text(`${m.workingDays * 4}`, margin + 160, y + 5, { align: 'right' });
    y += 8;
  });

  // Linie Total & Medie (Ca in UI)
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);

  // Total
  y += 7;
  doc.setTextColor(...grayColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL ANUAL', margin + 3, y);
  doc.text(`${data.totalWorkingDays}`, margin + 90, y, { align: 'right' });
  doc.text(`${data.totalWorkingHours}`, margin + 125, y, { align: 'right' });
  doc.text(`${data.totalWorkingDays * 4}`, margin + 160, y, { align: 'right' });

  // Medie
  y += 7;
  doc.setTextColor(...primaryColor);
  doc.text('MEDIE LUNARA', margin + 3, y);
  doc.text(`${(data.totalWorkingDays / 12).toFixed(1)}`, margin + 90, y, { align: 'right' });
  doc.text(`${(data.totalWorkingHours / 12).toFixed(1)}`, margin + 125, y, { align: 'right' });
  doc.text(`${(data.totalWorkingDays * 4 / 12).toFixed(1)}`, margin + 160, y, { align: 'right' });

  y += 15;

  // Grafic Bara Distributie (Identic Web)
  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(removeDiacritics(`Distributie Anuala ${year} - din ${data.totalDays} zile`), margin, y);
  y += 5;

  const barWidth = pageWidth - 2 * margin;
  const workingPct = data.totalWorkingDays / data.totalDays;

  // Fundal bar (Libere)
  doc.setFillColor(203, 213, 225); // slate-300
  doc.roundedRect(margin, y, barWidth, 6, 2, 2, 'F');

  // Progres bar (Lucratoare)
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, y, barWidth * workingPct, 6, 2, 2, 'F');

  y += 12;

  // Legenda
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.setFont('helvetica', 'bold');

  doc.setFillColor(...primaryColor);
  doc.circle(margin + 2, y - 1, 1, 'F');
  doc.text(removeDiacritics(`${data.totalWorkingDays} Zile Lucratoare (${(workingPct * 100).toFixed(1)}%)`), margin + 6, y);

  doc.setFillColor(203, 213, 225);
  doc.circle(pageWidth - margin - 50, y - 1, 1, 'F');
  doc.text(removeDiacritics(`${data.totalDays - data.totalWorkingDays} Zile Libere (${((1 - workingPct) * 100).toFixed(1)}%)`), pageWidth - margin - 46, y);

  // Footer Branding (Solicitat de User)
  const footerY = pageHeight - 15;
  doc.setDrawColor(241, 245, 249);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setTextColor(...grayColor);
  doc.setFont('helvetica', 'normal');
  doc.text(removeDiacritics(`Acest raport a fost generat programatic de eCalc.ro - Simulator Fiscale Profesionale`), margin, footerY);

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('www.ecalc.ro', pageWidth - margin - 20, footerY);

  const filename = `raport_zile_lucratoare_${year}.pdf`;
  doc.save(filename);
  return filename;
};
