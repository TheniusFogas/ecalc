# 🚀 PLAN DE IMPLEMENTARE 100% - eCalc RO

**Versiune:** 2.0 Complete  
**Data:** 6 Februarie 2026  
**Status:** ⏳ ÎN PROGRES  

---

## 📋 LISTĂ COMPLETĂ SARCINI

### ✅ FAZA 1: ADMIN DASHBOARD CONECTAT LA FISCAL RULES [PRIORITATE CRITICĂ]
**Status:** 🔨 În lucru  
**Fișiere afectate:** 
- `/app/app/admin-pro/page.js`
- `/app/app/api/[[...path]]/route.js`

**Sarcini:**
- [⏳] Adaugă selector de an în Admin (2025, 2026, 2027...)
- [⏳] Conectează Settings Fiscale la `/api/fiscal-rules/:year` în loc de `/api/settings`
- [⏳] Adaugă secțiune separată pentru fiecare modul fiscal:
  - Salarii (CAS, CASS, Impozit, Deducere, CAM, Salariu Minim, Prag IT)
  - PFA (Rate, Plafoane CAS/CASS, Prag TVA EUR)
  - Concediu Medical (Coduri și procente editabile)
  - Impozit Auto (Coeficienți per grupă cilindree, reduceri)
  - Imobiliare (Impozit chirii, CASS chirii, Vacancy rate, Fond rezervă)
  - e-Factura (Termene, zile lucrătoare)
  - Zboruri (Sume compensații EUR)
- [⏳] Adaugă "Surse de Date" pentru fiecare câmp cu link-uri utile
- [⏳] Salvare separată per modul cu validare

### ✅ FAZA 2: BREAK-EVEN POINT CALCULATOR
**Status:** ⏸️ Neînceput  
**Fișiere afectate:** 
- `/app/app/decision-maker/[year]/page.js`
- `/app/lib/decision-maker-calculator.js` (NOU)

**Sarcini:**
- [ ] Creare algoritm break-even pentru tranziții
- [ ] Tabel afișare praguri critnce:
  - "La venit X RON, PFA Real devine mai avantajos decât Salariu"
  - "La venit Y RON, SRL devine mai avantajos decât PFA"
- [ ] Grafic vizual break-even points
- [ ] Export PDF cu analiză break-even

### ✅ FAZA 3: COMPLETARE CALCULATOR IMPOZIT AUTO
**Status:** ⏸️ Neînceput  
**Fișiere afectate:** 
- `/app/app/impozit-auto/[year]/page.js`
- `/app/lib/car-tax-calculator.js`
- `/app/app/api/[[...path]]/route.js` (colecție cities în MongoDB)

**Sarcini:**
- [ ] Adaugă categorii vehicule: Autoutilitare, Camioane sub 12t, Remorci
- [ ] Bază date orașe România cu multiplicatori locali
- [ ] Import listă orașe din sursă oficială (INS)
- [ ] Dropdown orașe în calculator cu search
- [ ] Admin: Tabel orașe editabil cu multiplicatori
- [ ] Admin: Surse pentru actualizare coeficienți (link ANAF)
- [ ] Reducere hibrid configurabilă per an

### ✅ FAZA 4: SEPARARE E-FACTURA ȘI COMPENSAȚII ZBORURI
**Status:** ⏸️ Neînceput  
**Fișiere afectate:** 
- `/app/app/calculator-efactura/[year]/page.js` (NOU)
- `/app/app/calculator-compensatii-zboruri/[year]/page.js` (NOU)
- `/app/lib/efactura-calculator.js` (NOU)
- `/app/lib/flight-compensation-calculator.js` (NOU)
- DELETE: `/app/app/zboruri/` și `/app/app/drepturi/`

**Sarcini:**
- [ ] Creare Calculator e-Factura separat:
  - Calcul termene 5 zile lucrătoare
  - Calendar sărbători automat
  - Avertizare termen depășit
  - Verificare B2B vs B2C
- [ ] Creare Calculator Compensații Zboruri (EU261) separat:
  - Calcul distanță zbor (API sau bază aeroporturi)
  - Verificare elegibilitate
  - Calcul sumă compensație
  - Generator cerere PDF
- [ ] Eliminare amenzi e-Factura
- [ ] Update navigație homepage

### ✅ FAZA 5: BAZĂ DATE ORAȘE ȘI PREȚURI IMOBILIARE
**Status:** ⏸️ Neînceput  
**Fișiere afectate:** 
- `/app/app/calculator-imobiliare-pro/[year]/page.js`
- `/app/lib/real-estate-calculator.js`
- MongoDB colecție `cities_real_estate`

**Sarcini:**
- [ ] Import listă completă orașe România (INS - 320 orașe)
- [ ] Structură date: {city, county, avgPricePerSqm, rentYield, updateDate, sources[]}
- [ ] Preț mediu/mp administrabil per oraș în Admin
- [ ] Dropdown orașe în calculator cu autocomplete
- [ ] Estimare randament bazat pe oraș
- [ ] Admin: Tabel orașe cu surse actualizare:
  - "Verifică prețuri pe www.imobiliare.ro"
  - "Date INS: www.insse.ro"
  - "Rapoarte imobiliare: www.storia.ro/analiza-piata"
- [ ] Actualizare automată sugerată (notificare dacă >6 luni)

### ✅ FAZA 6: NORME PFA PE JUDEȚ/CAEN ÎN MONGODB
**Status:** ⏸️ Neînceput  
**Fișiere afectate:** 
- `/app/lib/pfa-calculator.js`
- MongoDB colecție `pfa_norms`
- `/app/app/admin-pro/page.js` (tab NOU)

**Sarcini:**
- [ ] Structură date: {year, county, locality, caenCode, caenName, normValue, sources[]}
- [ ] Migrare norme hardcodate în MongoDB
- [ ] Expand cu toate județele (41 + București)
- [ ] Admin: Tabel norme editabil cu filtre (județ, CAEN)
- [ ] Admin: Import bulk CSV pentru actualizare anuală
- [ ] Admin: Surse oficiale:
  - "Anexa HG Norme de Venit: www.anaf.ro"
  - "Verifică CAEN actualizat: www.onrc.ro"
- [ ] Calculator: Dropdown județ + localitate + CAEN cu autocomplete

### ✅ FAZA 7: CALENDAR SĂRBĂTORI AUTOMAT
**Status:** ⏸️ Neînceput  
**Fișiere afectate:** 
- `/app/lib/holidays-calculator.js` (NOU)
- `/app/lib/efactura-calculator.js`
- MongoDB colecție `holidays`

**Sarcini:**
- [ ] Algoritm calcul Paște (formula Gauss pentru data Paștelui)
- [ ] Lista sărbători fixe România (1 ian, 24 ian, 1 mai, etc.)
- [ ] Lista sărbători mobile (Paște, Rusalii, etc.)
- [ ] MongoDB: Salvare pentru fiecare an
- [ ] Admin: Override manual sărbători (pentru cazuri speciale)
- [ ] Admin: Surse:
  - "Verifică sărbători legale: www.legislatie.just.ro"
- [ ] Funcție `getWorkingDaysBetween(startDate, endDate, year)`

### ✅ FAZA 8: SEO ARCHITECTURE COMPLETĂ
**Status:** ⏸️ Neînceput  
**Fișiere afectate:** 
- Rute NOI pentru fiecare sector/domeniu
- MongoDB colecție `seo_content`
- `/app/app/admin-pro/page.js` (tab NOU "SEO Content")

**Sarcini:**
- [ ] Rute dedicate:
  - `/calculator-salarii/it/[year]`
  - `/calculator-salarii/constructii/[year]`
  - `/calculator-salarii/agricultura/[year]`
  - `/calculator-pfa/bucuresti/[year]`
  - `/calculator-pfa/cluj/[year]`
  - `/impozit-auto/bucuresti/[year]`
  - `/impozit-auto/hibrid/[year]`
  - `/rentabilitate-imobiliara/bucuresti/[year]`
  - etc.
- [ ] Admin: Pagină SEO Content cu:
  - Selector rută
  - Meta Title editabil
  - Meta Description editabil
  - Canonical URL
  - Rich Text Editor pentru conținut (FAQ, ghiduri)
  - Schema.org FAQ generator
- [ ] Generare automată sugerate meta tags pe bază de rută
- [ ] Previzualizare Google SERP

### ✅ FAZA 9: CONTEXTUAL TOOLTIPS SISTEMATICE
**Status:** ⏸️ Neînceput  
**Fișiere afectate:** 
- Toate calculatoarele
- `/app/components/ui/tooltip.jsx` (îmbunătățit)
- MongoDB colecție `tooltips`

**Sarcini:**
- [ ] Structură tooltip: {key, title, explanation, legalBasis, sources[]}
- [ ] Tooltips pentru:
  - Toate procentele (CAS 25% → "Art. 138 Cod Fiscal...")
  - Toate pragurile (Salariu minim → "HG xxx/2025...")
  - Toate facilitățile (IT scutire → "OUG 115/2023...")
- [ ] Admin: Tabel tooltips editabil
- [ ] Icon (i) la fiecare cifră din calculatoare
- [ ] Hover tooltip cu explicație + bază legală

### ✅ FAZA 10: CANONICAL TAGS & SITEMAP DINAMIC
**Status:** ⏸️ Neînceput  
**Fișiere afectate:** 
- `/app/app/layout.js`
- `/app/app/sitemap.xml/route.js` (NOU)
- `/app/app/robots.txt/route.js` (NOU)

**Sarcini:**
- [ ] Generare automată `<link rel="canonical">` pentru fiecare pagină
- [ ] Canonical pentru year-specific pointează spre latest year
- [ ] Sitemap.xml dinamic cu:
  - Toate rutele calculatoare × ani disponibili
  - Toate rutele SEO dedicate
  - Priority și changefreq
- [ ] robots.txt cu link către sitemap

### ✅ FAZA 11: COMPLETĂRI ȘI FINISAJE
**Status:** ⏸️ Neînceput  

**Sarcini:**
- [ ] Vacancy Rate și Fond Rezervă configurabile în Admin pentru Imobiliare
- [ ] Pro-rata PFA pentru deschidere/închidere mid-year
- [ ] Validator salariu minim cu excepții elevi/studenți/pensionari
- [ ] API BNR backup (în caz că API-ul pică)
- [ ] Export PDF pentru toate calculatoarele
- [ ] Loading states îmbunătățite
- [ ] Error handling complet
- [ ] Mobile responsive verificat pe toate paginile

---

## 🎯 PROGRES GLOBAL

**Total sarcini:** 120+  
**Completate:** 0  
**Procent:** 0%  

**Estimare timp:** 15-20 ore muncă intensă  

---

## 📝 NOTE IMPLEMENTARE

### Principii:
1. ⚠️ **NU STRICA NIMIC EXISTENT** - Testează după fiecare modificare
2. 📦 **Backup Înainte** - Git commit după fiecare fază
3. 🧪 **Testare Continuă** - Verifică că vechile funcționalități merg
4. 📊 **Date Reale** - Folosește surse oficiale pentru toate datele
5. 🔧 **Admin Everything** - Tot ce e configurabil trebuie în Admin

### Surse Date Oficiale:
- **ANAF:** www.anaf.ro (Cod Fiscal, Norme PFA, e-Factura)
- **INS:** www.insse.ro (Liste orașe, date economice)
- **BNR:** www.bnr.ro (Curs valutar)
- **ONRC:** www.onrc.ro (Coduri CAEN)
- **Legislație:** www.legislatie.just.ro (Legi, OUG, HG)
- **EU:** eur-lex.europa.eu (Regulament 261/2004)

---

**Status:** 🚀 READY TO START  
**Next:** Începe cu FAZA 1 - Admin Dashboard
