# ARHITECTURA FINALĂ A SISTEMULUI (Single Source of Truth)

> [!IMPORTANT]
> Acest document este AUTORITATEA SUPREMĂ pentru logica de calcul eCalc.ro. Orice alt fișier de documentație (.md) din proiect este considerat ARHIVĂ (vezi folderul `_ARCHIVE_LOGIC_`).

## 1. Audit Executiv: Algoritmul Matematic Real
Calcul validat pentru **Brut 4050 RON** (Salariul Minim 2026).

| Pas | Valoare | Formulă / Explicație | Sursă Cod (`lib/salary-engine.js`) |
| :--- | :--- | :--- | :--- |
| **Venit Brut** | **4.050 RON** | Input utilizator / Prag Minim Legal | `grossSalary` |
| (-) Sumă Netaxabilă | 300 RON | Facilitate fiscală pentru salarii ≤ Minim | `untaxedAmount` (din `calculateStandard`) |
| **Baza Calcul Contribuții** | 3.750 RON | `4050 - 300` | `Baza_Contributii` |
| (-) CAS (25%) | 938 RON | `3750 * 0.25` (rotunjit) | `cas` |
| (-) CASS (10%) | 375 RON | `3750 * 0.10` (rotunjit) | `cass` |
| (-) Deducere Personală | 810 RON | Deducere de bază integrală (Brut ≤ Minim) | `calculatePersonalDeduction` |
| **Baza Impozit** | 1.627 RON | `4050 - 300 - 938 - 375 - 810` | `Baza_Impozit` |
| (-) Impozit (10%) | 163 RON | `1627 * 0.10` (rotunjit) | `incomeTax` |
| **SALARIU NET** | **2.574 RON** | `4050 - 938 - 375 - 163` | `netSalary` |

### ✅ Rezultat Final: 2.574 RON
Acest rezultat confirmă aplicarea corectă a tuturor mecanismelor fiscale: 
1. Scutirea de 300 RON la bazele de calcul.
2. Deducerea personală completă (810 RON).
3. Rotunjirile contabile standard.

---

## 2. Harta de Implementare & Trasabilitate

### Motorul de Calcul (`lib/salary-engine.js`)
Acesta este **UNICUL** motor de calcul activ. Fișierul paralel `salary-calculator.js` a fost eliminat.

#### Mapare Variabile Admin -> Cod
Toate variabilele sunt încărcate dinamic din baza de date (`rules` object).

| Variabilă Admin (DB) | Variabilă Cod | Linie Cod (aprox) | Rol |
| :--- | :--- | :--- | :--- |
| `minimum_salary` | `minWage` | L49, L68 | Declanșează facilitatea de 300 RON și Deducerea Personală |
| `personal_deduction_base` | `deductionBase` | L54 | *Prioritate: Valoare absolută (810) > Procent (fallback)* |
| `untaxed_amount` | `non_taxable_amount_admin` | L69 | Suma scutită (300 RON) |
| `cas_rate` | `cas_percentage` | L70 | Cota CAS (25%) |
| `income_tax_rate` | `tax_percentage` | L72 | Cota Impozit (10%) |

> **Nota Bene:** Nu există "fallback-uri" hardcodate pentru valori critice (ex: 4050 sau 300). Dacă API-ul nu returnează regulile, calculul va eșua, semnalând imediat problema, conform principiului "Fail Fast".

---

## 3. Fluxul Datelor (End-to-End)

Cum ajunge o modificare din Admin în Calculatorul User-ului:

1.  **ADMIN**: Modifică `minimum_salary` la **5000** în panoul de configurare.
2.  **DATABASE**: Valoarea se salvează în colecția `fiscal_rules` pentru anul curent.
3.  **API**: Endpoint-ul `/api/fiscal-rules/2026` returnează noul obiect JSON:
    ```json
    { "salary": { "minimum_salary": 5000, ... } }
    ```
4.  **FRONTEND (`[slug]/page.js`)**:
    - Componenta `SalaryCalculatorContent`  apelează `loadFiscalRules()`.
    - `setFiscalRules(data)` actualizează state-ul React.
5.  **MOTOR (`salary-engine.js`)**:
    - Funcția `calculateStandard(gross, options)` este re-apelată.
    - `this.getRule('minimum_salary')` returnează acum **5000**.
    - Condiția `if (grossSalary <= 5000)` devine `true` pentru un salariu de 4800 RON.
    - Se activează automat Scutirea 300 RON și Deducerea Maximă.

---

## 4. Manual de Diagnostic și Funcționare

### Structura API `SalaryCalculator`
Clasa `SalaryCalculator` din `lib/salary-engine.js` expune următoarele metode publice:

- `new SalaryCalculator(fiscalRules)`: Inițializează calculatorul cu regulile fiscale (fără reguli = fallback la 0/defaults).
- `calculateStandard(grossSalary, options)`: Returnează obiectul complet de calcul pentru un salariu brut.
  - **Inputs**: `grossSalary` (number), `options` (object: { children, dependents, ... }).
  - **Outputs**:
    ```javascript
    {
       gross: number,
       net: number,
       cas: number,
       cass: number,
       incomeTax: number,
       personalDeduction: number,
       taxableIncome: number,
       untaxedAmount: number,
       cam: number,
       totalCost: number
    }
    ```
- `calculateIT(grossSalary, options)`: Similar standard, dar aplică regulile de scutire impozit și reducere CAS opțională.
- `calculateConstruction(...)` / `calculateAgriculture(...)`: Aplică facilitățile sectoriale specifice.
- `calculateNetToGross(netTarget, sector, options)`: Inversează calculul (Net -> Brut) folosind algoritm de căutare binară.

### Procedura de Rezolvare a Erorilor (Troubleshooting)

#### Caz: Ecran Alb / Eroare 500 la accesare
1. **Verificare Import**: Asigurați-vă că nu se importă din `salary-calculator.js` (fișier șters). Importul corect este `import { SalaryCalculator } from '@/lib/salary-engine';`.
2. **Context Client/Server**: Dacă eroarea este "ReferenceError" sau 500 în consolă, verificați dacă clasa este instanțiată corect.
   - Corect: `const calc = new SalaryCalculator(rules || {});` (se asigură fallback).
   - Incorect: `const calc = new SalaryCalculator();` (dacă constructorul crapă la undefined).
3. **Cache Next.js**: Dacă codul este corect dar eroarea persistă, ștergeți folderul `.next`.

#### Caz: Calcul Greșit
1. Verificați regulile returnate de API (Network Tab -> `/api/fiscal-rules/...`).
2. Dacă API returnează regulile corecte, problema este în `salary-engine.js`.
3. Folosiți `lib/test-salary-calc.js` pentru a izola problema. Rulați `node lib/test-salary-calc.js` local.

---

## 5. Arhivă și Curățenie
Următoarele fișiere/foldere au fost mutate în `_ARCHIVE_LOGIC_` pentru a nu polua proiectul activ:
- `SALARY_ALGORITHM_FIX.md`
- `IMPLEMENTATION_PLAN_100.md`
- `_unused_path` (Ruta redundantă care cauza conflicte)
- `layout.js.broken`
- `salary-calculator.js` (Cod vechi)

**Acest document este acum singura sursă de adevăr.**
