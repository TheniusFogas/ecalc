# 🚀 eCalc RO - Ghid Rapid de Utilizare

## 📱 Accesare Aplicație

**URL Principal:** https://dynamic-payroll-calc.preview.emergentagent.com

### Pagini Disponibile:
- **Homepage:** `/` - Lista cu toate calculatoarele
- **Calculator Salarii:** `/salarii`
- **Concediu Medical:** `/concediu-medical`
- **e-Factura:** `/e-factura`
- **Impozit Auto:** `/impozit-auto`
- **Compensații Zboruri:** `/zboruri`
- **Randament Imobiliar:** `/imobiliare`
- **Admin Dashboard:** `/admin`

---

## 👤 Admin Access

### Credențiale Implicite:
```
Email: admin@ecalc.ro
Parolă: Admin2026!
```

### Ce Poți Face în Admin:

#### 1️⃣ Tab "Setări"
- **Ad Slots:** Editează HTML pentru AdSense (Header + Sidebar)
- **Valori Fiscale 2026:**
  - CAS: 25%
  - CASS: 10%
  - Impozit Venit: 10%
  - Deducere Personală: 510 RON

#### 2️⃣ Tab "Affiliate Links"
Configurează pentru fiecare calculator:
- **Text Buton:** ex: "Obține ofertă acum!"
- **Link:** URL-ul tău de afiliere

**Calculatoare disponibile:**
- Salarii → Card salariu
- Concediu → Asigurare medicală
- e-Factura → Software contabilitate
- Impozit Auto → RCA/Casco
- Zboruri → Compensații zbor
- Imobiliare → Credite ipotecare

#### 3️⃣ Tab "Lead-uri"
- **Vizualizare:** Tabel cu toate lead-urile
- **Export CSV:** Buton pentru download
- **Date colectate:** Nume, Email, Telefon, Calculator, Dată

---

## 💼 Cum Funcționează Monetizarea

### 1. Global Ads (AdSense)
```html
<!-- În Admin → Setări -->
<div>
  <script async src="https://pagead2.googlesyndication.com/..."></script>
  <!-- Ad code here -->
</div>
```

### 2. Affiliate Buttons
- Apar **imediat sub rezultatul calculului**
- Text + Link editabile din Admin
- Design agresiv pentru conversie (butoane colorate mari)

### 3. Sticky Mobile CTA
- **Mobil only:** Bară fixă în footer
- Conține același buton affiliate
- **Desktop:** Ascuns automat

### 4. Lead Generation
- **Trigger:** După ce userul calculează
- **Formular:** Nume, Email, Telefon
- **Storage:** MongoDB (export CSV disponibil)
- **Use case:** Email marketing, retargeting

---

## 🔧 Configurare Inițială (Pentru Tine)

### Pas 1: Actualizează Affiliate Links
1. Intră în `/admin`
2. Mergi la tab "Affiliate Links"
3. Pentru fiecare calculator, adaugă:
   - Text CTA convingător
   - Link-ul tău de afiliere
4. Salvează

### Pas 2: Adaugă Google AdSense
1. Obține codul AdSense
2. Intră în Admin → Setări
3. Lipește codul în:
   - Ad Header (apare sus pe toate paginile)
   - Ad Sidebar (poate fi folosit în viitor)
4. Salvează

### Pas 3: Testează Totul
- Accesează fiecare calculator
- Efectuează un calcul de test
- Verifică dacă butonul affiliate apare
- Testează formularul de lead

---

## 📊 Monitorizare & Analytics

### Leads Colectate
```
Admin → Tab "Lead-uri"
- Vezi toate lead-urile în timp real
- Export CSV pentru procesare
```

### Tracking Recomandat (TODO)
Adaugă în `layout.js`:
```javascript
// Google Analytics
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>

// Meta Pixel
<script>!function(f,b,e,v,n,t,s) { /* Meta Pixel Code */ }</script>
```

---

## 🎯 Strategii de Optimizare Conversie

### Teste A/B pentru CTA
În Admin, încearcă diferite formulări:

**Variante Text:**
- ❌ Slab: "Click aici"
- ✅ Puternic: "Obține oferta exclusivă acum!"
- ✅ Urgență: "Ofertă limitată - Solicită acum!"
- ✅ Beneficiu: "Economisește până la 50% - Vezi oferta"

### Culori CTA
Fiecare calculator are culoarea sa:
- Salarii: Verde (#16a34a)
- e-Factura: Purple (#9333ea)
- Impozit Auto: Orange (#ea580c)
- Etc.

---

## 🔐 Securitate & Backup

### Schimbare Parolă Admin
Conectează-te la MongoDB și run:
```javascript
use ecalc_ro
db.adminUsers.updateOne(
  { email: "admin@ecalc.ro" },
  { $set: { password: "<bcrypt_hash_nou>" } }
)
```

### Backup Lead-uri
Două metode:
1. **Manual:** Admin → Export CSV (săptămânal)
2. **Automatic:** MongoDB Atlas Backup (configurabil în cloud)

---

## 📈 Raportare & KPI-uri

### Metrici Cheie de Urmărit:

**Trafic:**
- Vizite totale / calculator
- Bounce rate per pagină
- Timp petrecut

**Conversii:**
- Lead-uri colectate / zi
- CTR affiliate buttons
- Revenue per calculator

**Technical:**
- Uptime (target: 99.9%)
- Page load time (<2s)
- API response time (<100ms)

---

## 🐛 Troubleshooting

### Problema: Butonul affiliate nu apare
**Soluție:** Verifică în Admin → Affiliate Links dacă ai salvat link-ul

### Problema: Lead-urile nu se salvează
**Soluție:** Verifică conexiunea MongoDB în `.env`

### Problema: Calculele sunt greșite
**Soluție:** Actualizează valorile fiscale în Admin → Setări

### Problema: Admin login nu funcționează
**Soluție:** Verifică credențialele în `.env`:
```
ADMIN_EMAIL=admin@ecalc.ro
ADMIN_PASSWORD=Admin2026!
```

---

## 🚀 Next Steps (Recomandări)

### Săptămâna 1:
- [ ] Configurează toate affiliate links
- [ ] Adaugă Google Analytics
- [ ] Testează fiecare calculator
- [ ] Exportă primul CSV de leads

### Luna 1:
- [ ] Optimizează textele CTA (A/B testing)
- [ ] Adaugă politică GDPR
- [ ] Creează landing pages dedicate
- [ ] Start SEO optimization

### Trimestrul 1:
- [ ] Blog cu 10+ articole SEO
- [ ] Email automation pentru leads
- [ ] Extindere cu noi calculatoare
- [ ] Partnership programs

---

## 📞 Support

**Probleme Tehnice:**
- Email: admin@ecalc.ro
- Check logs: `/var/log/supervisor/nextjs.out.log`

**Database:**
- MongoDB Atlas Dashboard
- Connection string în `.env`

**Deployment:**
- URL: https://dynamic-payroll-calc.preview.emergentagent.com
- Supervisor: `sudo supervisorctl restart nextjs`

---

## ✅ Checklist Final

Înainte de a lansa public, asigură-te că:

- [ ] Toate affiliate links sunt actualizate
- [ ] Google AdSense e configurat
- [ ] Admin password e schimbat (dacă vrei)
- [ ] Testezi pe mobil + desktop
- [ ] Privacy policy e adăugată
- [ ] Google Analytics e activ
- [ ] Email-ul pentru support e funcțional
- [ ] Database backup e configurat

---

**Succes cu eCalc RO! 🎉**

Pentru întrebări sau sugestii, accesează Admin Dashboard sau contactează echipa de support.
