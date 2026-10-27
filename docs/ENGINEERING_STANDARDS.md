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
