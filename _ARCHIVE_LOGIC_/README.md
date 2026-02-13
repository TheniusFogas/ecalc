# eCalc RO - Calculatoare Fiscale România 2026

Platformă completă de calculatoare fiscale și utilitare pentru România, cu sistem de monetizare hibrid (Ads + Affiliate + Leads).

## 🚀 Funcționalități Implementate

### 6 Calculatoare Fiscale Complete:

1. **Calculator Salariu Brut/Net**
   - Calcul bidirecțional (Brut → Net sau Net → Brut)
   - Contribuții: CAS (25%), CASS (10%), Impozit (10%)
   - Deducere personală: 510 RON
   - URL: `/salarii`

2. **Concediu Medical**
   - Calcul indemnizație conform OUG 2026
   - Formula: 75% din salariul mediu brut
   - URL: `/concediu-medical`

3. **e-Factura - Termene & Amenzi**
   - Verificare termene raportare (5 zile)
   - Calcul amenzi pentru întârziere
   - URL: `/e-factura`

4. **Impozit Auto**
   - Calcul impozit pe baza capacității cilindrice
   - Tarife progresive 2026
   - URL: `/impozit-auto`

5. **Compensații Zboruri EU261**
   - Verificare eligibilitate compensație
   - Calcul sume: €250/€400/€600
   - URL: `/zboruri`

6. **Calculator Randament Imobiliar**
   - Yield brut și net
   - Incluziune cheltuieli
   - URL: `/imobiliare`

### Admin Dashboard (`/admin`)

**Credențiale implicite:**
- Email: `admin@ecalc.ro`
- Parolă: `Admin2026!`

**Funcționalități:**

1. **Gestionare Setări**
   - Configurare Ad Slots (Header + Sidebar)
   - Editare valori fiscale (CAS, CASS, Impozit, Deducere)

2. **Affiliate Links Management**
   - Text personalizabil pentru fiecare calculator
   - Link affiliate unic per calculator
   - Editare bulk sau individuală

3. **Lead Management**
   - Vizualizare toate lead-urile colectate
   - Export CSV pentru procesare externă
   - Filtre și căutare

### Sistem de Monetizare

1. **Global Ads**
   - Header Ad Slot (configurabil din Admin)
   - Sidebar Ad Slot (configurabil din Admin)

2. **Contextual Affiliate**
   - Buton affiliate imediat sub rezultatul calculului
   - Text și link editabile din Admin pentru fiecare calculator
   - Design agresiv pentru conversie

3. **Sticky Mobile CTA**
   - Bară fixă în partea de jos (mobil)
   - Conține butonul affiliate contextual
   - Auto-hide pe desktop

4. **Lead Generation**
   - Formular modal după calcul
   - Câmpuri: Nume, Email, Telefon
   - Salvare în MongoDB pentru follow-up

## 🛠️ Stack Tehnologic

- **Frontend:** Next.js 14.2.3 (App Router), React 18
- **Backend:** Next.js API Routes
- **Database:** MongoDB Atlas (Cloud)
- **Styling:** Tailwind CSS + Shadcn/UI
- **Icons:** Lucide React
- **Notifications:** Sonner (Toast)

## 📦 API Endpoints

### Authentication
```
POST /api/auth/login
Body: { email, password }
Response: { success, token, email }
```

### Settings
```
GET /api/settings
Response: { ...allSettings }

PUT /api/settings
Body: { key: value, ... }
Response: { success, message }
```

### Leads
```
GET /api/leads
Response: [{ id, name, email, phone, calculatorType, data, createdAt }]

POST /api/leads
Body: { name, email, phone, calculatorType, data }
Response: { success, message }

GET /api/leads/export
Response: CSV file download
```

## 🗄️ MongoDB Collections

### `settings`
```javascript
{
  key: String,
  value: Any
}
```

**Keys importante:**
- `ad_header`, `ad_sidebar` - HTML pentru ads
- `affiliate_[calculator]_text` - Text buton affiliate
- `affiliate_[calculator]_link` - URL affiliate
- `cas_rate`, `cass_rate`, `income_tax_rate` - Rate fiscale
- `deduction_personal` - Deducere personală

### `leads`
```javascript
{
  id: UUID,
  name: String,
  email: String,
  phone: String,
  calculatorType: String,
  data: Object,
  createdAt: Date
}
```

### `adminUsers`
```javascript
{
  email: String,
  password: String (hashed),
  createdAt: Date
}
```

## 🚀 Deployment

### Environment Variables
```bash
MONGO_URL=mongodb+srv://ecalc_db_user:tQOflzPxU5TLOUB9@admin-ecalc.piefwf2.mongodb.net/?appName=admin-ecalc
DB_NAME=ecalc_ro
NEXT_PUBLIC_BASE_URL=https://dynamic-payroll-calc.preview.emergentagent.com
ADMIN_EMAIL=admin@ecalc.ro
ADMIN_PASSWORD=Admin2026!
```

### Local Development
```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Server runs on http://localhost:3000
```

### Production Build
```bash
yarn build
yarn start
```

## 📱 SEO & Schema.org

### Implemented:
- **Schema.org SoftwareApplication** - Pentru SEO rich snippets
- **Meta Tags** - Title, Description, Keywords
- **Open Graph** - Ready pentru social sharing
- **Structured Data** - Rating, Pricing (Free)

### TODO pentru SEO complet:
- FAQ Schema pentru fiecare calculator
- Dynamic OG Images
- Internal linking între calculatoare
- Sitemap.xml
- robots.txt

## 🎨 Design System

**Culori:**
- Primary: Blue (#2563eb)
- Background: Slate gradients
- Cards: White cu shadow subtle
- CTA Buttons: Culori contextuale (Green, Purple, Orange, etc.)

**Typography:**
- Font: Inter (Google Fonts)
- Heading: Bold, 2xl-5xl
- Body: Regular, base-xl

**Components:**
- Shadcn/UI pentru consistență
- Responsive breakpoints: sm, md, lg
- Mobile-first approach

## 🔐 Securitate

**Implemented:**
- Password hashing cu bcryptjs
- Environment variables pentru credențiale
- CORS configuration
- Input validation

**TODO:**
- Rate limiting pentru API
- CSRF protection
- Session management
- 2FA pentru admin

## 📊 Analytics & Tracking

**Ready pentru integrare:**
- Google Analytics 4
- Meta Pixel
- Affiliate tracking pixels
- Conversion tracking

**Puncte de tracking recomandate:**
- Page views pentru fiecare calculator
- Form submissions (leads)
- CTA clicks (affiliate buttons)
- Export CSV events (admin)

## 🚧 Roadmap Viitor

### Phase 1 - MVP (✅ COMPLET)
- [x] 6 Calculatoare funcționale
- [x] Admin Dashboard complet
- [x] Lead Management
- [x] Affiliate System
- [x] MongoDB integration

### Phase 2 - Enhancement
- [ ] PDF Export pentru rezultate
- [ ] Email automation pentru leads
- [ ] A/B testing pentru CTA
- [ ] Analytics dashboard în admin
- [ ] Multi-admin support

### Phase 3 - Scale
- [ ] Blog pentru SEO
- [ ] Calculator API public
- [ ] White-label solution
- [ ] Mobile app (React Native)

## 📞 Support

Pentru întrebări sau probleme:
- Admin Dashboard: `/admin`
- Database: MongoDB Atlas
- Email: admin@ecalc.ro

## 📄 License

© 2026 eCalc RO - Toate drepturile rezervate

---

**Note:** Această platformă este un MVP complet funcțional. Toate calculele sunt aproximative și ar trebui verificate cu un consultant fiscal pentru situații specifice.
