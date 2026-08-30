// Excel export for the salary calculator result.
//
// FIX (audit 2026-08-11): `xlsx` was already installed (package.json) but had zero imports
// anywhere in the codebase — PDF export existed (lib/pdf-export.js), Excel didn't, despite the
// dependency being paid for in bundle size either way. HR/accounting users specifically want
// tabular, reusable data (formulas, pivoting) rather than a flat PDF — this fills that gap.
//
// `xlsx` is dynamically imported (not a static top-level import) — measured impact of a static
// import was +~93KB on the first-load JS of every single calculator page visit, for a feature
// only a fraction of visitors ever click. Loaded on demand instead, right when the button is
// pressed — everyone else's page stays exactly as fast as before this feature existed.

const round = (n) => Math.round((n || 0) * 100) / 100;

export const generateSalaryExcel = async (result, year = 2026, exchangeRate = 4.98) => {
  if (!result) return null;
  const XLSX = await import('xlsx');

  const toEur = (ron) => round(ron / (exchangeRate || 1));

  const rows = [
    ['eCalc.ro — Fluturaș de Salariu', '', ''],
    [`Anul ${year}`, '', ''],
    [`1 Euro = ${exchangeRate} lei`, '', ''],
    [],
    ['ANGAJAT', 'RON', 'EUR'],
    ['Salariu Brut', round(result.gross), toEur(result.gross)],
  ];

  if (result.untaxedAmount > 0) {
    rows.push(['Sumă Netaxabilă', round(result.untaxedAmount), toEur(result.untaxedAmount)]);
  }
  rows.push(
    ['CAS (pensie)', round(result.cas), toEur(result.cas)],
    ['CASS (sănătate)', round(result.cass), toEur(result.cass)],
  );
  if (result.personalDeduction > 0) {
    rows.push(['Deducere Personală', round(result.personalDeduction), toEur(result.personalDeduction)]);
  }
  rows.push(
    ['Impozit pe Venit', round(result.incomeTax), toEur(result.incomeTax)],
    ['Salariu Net', round(result.net), toEur(result.net)],
    [],
    ['ANGAJATOR', 'RON', 'EUR'],
    ['CAM (contribuție asiguratorie muncă)', round(result.cam), toEur(result.cam)],
    ['Cost Total Angajator', round(result.totalCost), toEur(result.totalCost)],
  );

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 34 }, { wch: 14 }, { wch: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Salariu');

  const filename = `ecalc-salariu-${year}-${round(result.gross)}-RON.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
};
