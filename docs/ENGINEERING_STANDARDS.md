# SmartQMA — Standarde Tehnice de Dezvoltare

Acest document definește standardele tehnice obligatorii pentru configurarea și utilizarea **stack-ului tehnic** în proiectul **SmartQMA**:
1. **Mediul curent de lucru (Antigravity, Laravel, React, PostgreSQL)**
2. **Ghidul vizual & Design Tokens (Roșu, Portocaliu, Negru, Alb)**
3. **Cerințele de testare unitară (acoperire minimă 80%)**
4. **Cerințele de testare End-to-End (Playwright)**

---

## 1. 💻 Mediul Curent de Lucru

Toată dezvoltarea se realizează exclusiv în **Antigravity**. Nu se utilizează și nu se configurează alte medii de dezvoltare.

### Stack-ul Tehnic
- **Backend**: **PHP 8.2+ / Laravel 11**
- **Frontend**: **React + Vite (TypeScript)**
- **Bază de Date**: **PostgreSQL 16**
- **Autentificare**: **Google OAuth2 / OIDC** via Laravel Socialite

### Calitatea Codului & Lintere Locale
- **PHP / Laravel**:
  - Se folosește **Laravel Pint** pentru formatare automată și respectarea stilului Laravel/PSR-12.
  - Se folosește **PHPStan** pentru verificarea strictă a tipurilor.
  ```bash
  # Verificare stil cod backend fără modificări
  ./vendor/bin/pint --test

  # Corectare automată stil backend
  ./vendor/bin/pint

  # Analiză statică de tipuri
  ./vendor/bin/phpstan analyse
  ```
- **React / TypeScript**:
  - Se folosește **ESLint** (cu reguli stricte TypeScript) și **Prettier**.
  ```bash
  # Verificare și corectare stil frontend
  npm run lint
  npm run lint:fix
  npm run format:check
  ```
- **Configurare Antigravity (`.vscode/`)**:
  - `settings.json`: Formatare automată la salvare (`formatOnSave`).
  - `extensions.json`: Extensii recomandate pentru Laravel Pint, PHP Intelephense, ESLint, Prettier și Playwright.

---

## 2. 🎨 Ghidul Vizual & Design Tokens

Sistemul vizual este configurat prin variabile globale și token-uri de stil, respectând standardul de accesibilitate **WCAG 2.1 AA**.

### Paleta Cromatică Oficială
- ⬛ **Negru (`#09090B`, `#18181B`)**: Fundal principal (Dark Theme), bare de navigare, containere structurale.
- ⬜ **Alb (`#FFFFFF`, `#FAFAFA`)**: Text primar pe fundal dark, suprafețe card în Light Theme.
- 🔴 **Roșu (`#DC2626`, `#991B1B`)**: Erori, alerte critice, stări respinse/eșuate.
- 🟠 **Portocaliu (`#EA580C`, `#F97316`)**: Acțiuni în derulare, avertizări, elemente active de atenționare.

### Reguli Tipografice
- **Font UI General**: `Inter` sau `Roboto` (sans-serif) pentru structură și etichete.
- **Font Monospațiat**: `JetBrains Mono` sau `Roboto Mono` pentru afișarea datelor brute, codurilor, identificatorilor și valorilor numerice.

---

## 3. 🧪 Standarde de Testare Unitară (Unit Testing)

Orice modul de cod adăugat în proiect trebuie însoțit de teste unitare, respectând pragul minim obligatoriu de **80% acoperire**.

### Backend (Pest PHP / PHPUnit)
- Testarea unitară a claselor de servicii, regulilor de validare, modelelor și controllerelor API.
- Izolarea dependințelor externe prin mocks și factories.
- **Comenzi de rulare**:
  ```bash
  # Rulare suită teste backend
  php artisan test

  # Verificare acoperire cod cu prag minim de 80%
  php artisan test --coverage --min=80
  ```

### Frontend (Vitest)
- Testarea unitară a componentelor React, hook-urilor personalizate și utilitarelor TypeScript.
- Rulare în mediu simulat DOM (`jsdom`).
- **Comenzi de rulare**:
  ```bash
  npm test
  npm run test:coverage
  ```

---

## 4. 🎭 Standarde de Testare End-to-End (Playwright)

Testarea End-to-End asigură că stiva completă (Frontend React + Backend Laravel + Bază de Date PostgreSQL) funcționează corect în browser.

### Principii & Configurare
- Framework: **Playwright** (`@playwright/test`).
- Suport multi-browser: Chromium, Firefox, WebKit.
- Structură bazată pe Page Object Model (POM) pentru mentenanță facilă.
- Testarea rutelor principale, răspunsurilor HTTP și a stărilor de interfață.

### Comenzi Playwright:
```bash
# Rulare teste E2E în consolă (headless)
npx playwright test

# Rulare interactivă cu interfață grafică
npx playwright test --ui
```

---

## 5. 🏷️ Standardul Obligatoriu de Serializare Industrială PCB (`YYMMDDNNNNNN`)

Toate numerele de serie ale plăcilor electronice (PCB), etichetate și scanate în sistemul SmartQMA la orice stație (QR Laser, SMD, AOI, THT, ICT, EOL, Export) sau în testele unitare/de integrare/seederi, **TREBUIE** să respecte strict și fără excepție formatul de **12 cifre numerice**:

$$\text{Serie PCB} = \underbrace{\text{YYMMDD}}_{\text{6 cifre: data producției}} + \underbrace{\text{NNNNNN}}_{\text{6 cifre: secvență zilnică}}$$

### 1. Specificația Formatului
1. **`YYMMDD` (primele 6 cifre)**: Reprezintă data fabricației (ex: `260902` pentru 2 septembrie 2026, `261029` pentru 29 octombrie 2026).
2. **`NNNNNN` (următoarele 6 cifre)**: Număr secvențial incremental alocat în ziua respectivă, completat cu zerouri la stânga (`000001`, `000002`, `000003`, ..., `999999`).
3. **Lungime fixă**: Exact **12 caractere numerice**. Orice serie mai scurtă (ex: 11 cifre) sau mai lungă (ex: 13 cifre) sau care conține litere este respinsă de validatoarele API și din interfață.

### 2. Reguli Absolute de Proiectare
- ❌ **Interzis cu desăvârșire**: Utilizarea prefixelor textuale sau a formatelor de test de tip `ARD-UNO-...`, `TEST-001`, `PCB-2026-...`.
- ✅ **Obligatoriu**: Toate exemplele, placeholder-ele, datele din seeders și testele automate folosesc exclusiv formatul `YYMMDDNNNNNN` (ex: `261029000001`, `261029000002`, `260902000001`).
- ✅ **Validare în Backend**: Regula Laravel `'qr_serial_number' => ['required', 'string', 'regex:/^\d{12}$/']`.
- ✅ **Validare în Frontend**: Expresia regulată `/^\d{12}$/.test(serial.trim())`.

---

## 6. ⚙️ Standardul Generatorului de Flux de Producție (`Statistica / Pagina-6`)

Generatorul de flux de producție este integrat în modulul de statistică pe subpagina `pagina-6` (`/statistica/pagina-6`) și simulează ciclul industrial cap-coadă respectând cu strictețe următoarele specificații:

### 1. Aprovizionare Magazie & Control Calitate la Intrare
- **Comenzi automate**: Când stocul oricărei componente din rețetă scade sub pragul minim (50 buc), generatorul emite automat comenzi în `inventory_components` (implicit 500 buc).
- **Semnare Analist Calitate**: Lotul sosit este verificat și semnat automat de către `analist_calitate`, primind statusul `conform` cu nota de atestare a conformității conform standardului IPC-A-610G.

### 2. Etape de Fabricație & Timpi de Ciclu
1. **QR Laser Marking**:
   - Timp ciclu stație: **15 secunde**.
   - Format serie: **12 cifre numerice `YYMMDDNNNNNN`**.
   - Rată defecte: **0.0%** (fără erori de marcare în stadiul curent).
2. **Tranzit QR ➔ SMD**:
   - Timp de bază: **30 secunde**.
   - Pauze aleatorii de producție: probabilitate 5%, durată **1 minut - 10 minute** (60s - 600s).
3. **Amplasare SMD (Pick & Place)**:
   - Timp ciclu stație: **10 secunde**.
   - Montaj componente: U3, U5, U2, U4, T1, F1, Y1.
   - **Rată defecte SMD: Total 2.0%**:
     - Prinse la AOI: **1.0%** (oprite imediat la inspecția optică).
     - Prinse la ICT: **0.7%** (trec de AOI, pică la testul electric ICT).
     - Scăpate la EOL: **0.3%** (trec de AOI și ICT, pică la testarea funcțională EOL).
     - Plăci SMD conforme (bune): **98.0%**.
4. **Tranzit SMD ➔ AOI**:
   - Durată tranzit: **25 - 50 secunde**.
   - Pauze rare de producție: probabilitate 3%, durată **1 - 5 minute** (60s - 300s).
5. **Inspecție AOI (Automated Optical Inspection)**:
   - Timp ciclu stație: **10 secunde**.
   - Prinde defectele SMD de 1.0% (punți cositor, componente lipsă, tombstone). Plăcile cu defect sunt rebutate și nu avansează.
6. **Suport Lot AOI ➔ THT (Tavă Suport 40 - 60 bucăți)**:
   - **Regulă obligatorie**: Plăcile **NU** trec bucată cu bucată la THT, ci se acumulează pe un suport/tavă de **40 - 60 bucăți** (implicit 50 buc). Doar la umplerea tăvii (sau finalul lotului), întregul lot de piese este transferat odată către THT.
7. **Amplasare & Cositorire THT**:
   - Timp ciclu stație: **15 secunde** per piesă (montaj U1 ATmega328P DIP-28, pini headere).
   - **Rată defecte THT: Total 1.5%**:
     - Prinse la ICT: **1.0%** (lipituri reci, pini nesudați).
     - Scăpate la EOL: **0.5%** (conexiuni slăbite sesizate la asamblare).
     - Plăci THT conforme (bune): **98.5%**.
8. **Tranzit THT ➔ ICT**:
   - Durată tranzit: **30 - 40 secunde**.
9. **Test In-Circuit (ICT Bed-of-Nails)**:
   - Durată test: **30 secunde**.
   - Verificare șine de tensiune (5V, 3.3V), rezistențe, frecvență cristal 16MHz.
   - Prinde defectele SMD de 0.7% și defectele THT de 1.0%.
10. **Tranzit ICT ➔ EOL (Carcasare & Montaj)**:
    - Durată manipulare și deplasare spre EOL: **20 - 50 secunde** (implicit 35s).
11. **Testare Funcțională Finală (EOL - End-of-Line)**:
    - Durată test funcțional: **50 secunde**.
    - Prinde defectele SMD scăpate (0.3%) și defectele THT scăpate (0.5%).
    - Plăcile care trec primesc verdictul **PASS** și reprezintă produse finite 100% conforme.
12. **Stația Export**:
    - **EXCLUSĂ EXPRES** din generator conform cerinței de sistem.

### 3. Editabilitate Totală în UI
Toate valorile specificate mai sus (rate de defecte, timpi de ciclu, intervale de tranzit, capacitate tavă suport 40-60 buc, opțiuni magazie și prefix serializare) sunt editabile direct de pe pagina `statistica / pagina-6`, cu butoane de salvare și resetare la valorile din fabrică.

