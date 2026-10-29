# SmartQMA

> **SmartQMA** — Aplicație pentru trasabilitatea și analiza produselor dintr-o secție de producție, monitorizând componentele prin multiple stagii și stări și înregistrând datele de testare de-a lungul procesului de fabricație.

---

## 📑 Cuprins
- [Mediul Curent de Lucru](#-mediul-curent-de-lucru)
- [Ghidul Vizual (Design Tokens)](#-ghidul-vizual-design-tokens)
- [Strategie de Testare (Unit & E2E)](#-strategie-de-testare-unit--e2e)
- [Plan de Configurare a Stack-ului](#-plan-de-configurare-a-stack-ului)
- [Comenzi de Rulare & Calitate Locală](#-comenzi-de-rulare--calitate-locală)

---

## 💻 Mediul Curent de Lucru

Toată dezvoltarea se desfășoară exclusiv în **Antigravity**. Nu se utilizează alte IDE-uri.

- **Backend**: **PHP 8.2+ / Laravel 11**
- **Frontend**: **React + Vite (TypeScript)**
- **Bază de Date**: **PostgreSQL 16**
- **Autentificare**: **Google OAuth2 / OIDC** via Laravel Socialite
- **Calitate Cod Local**:
  - Backend: **Laravel Pint** (formatter) și **PHPStan** (analiză statică).
  - Frontend: **ESLint** (reguli stricte TypeScript) și **Prettier**.

---

## 🎨 Ghidul Vizual (Design Tokens)

Sistemul de design este definit prin token-uri de stil, respectând standardul **WCAG 2.1 AA**:

- ⬛ **Negru (`#09090B`, `#18181B`)**: Fundal principal Dark Mode, suprafețe structurale.
- ⬜ **Alb (`#FFFFFF`, `#FAFAFA`)**: Text primar, fundaluri deschise.
- 🔴 **Roșu (`#DC2626`, `#991B1B`)**: Erori, alerte critice, stări respinse.
- 🟠 **Portocaliu (`#EA580C`, `#F97316`)**: În derulare, atenționări, stări active.
- 🔤 **Font Monospațiat (`JetBrains Mono`)**: Utilizat obligatoriu pentru numere de serie, date brute, coduri și valori numerice.

👉 Detalii complete în [Ghidul Vizual SmartQMA](docs/DESIGN_SYSTEM.md).

---

## 🧪 Strategie de Testare (Unit & E2E)

### 1. Testare Unitară (Unit Testing)
- **Acoperire minimă impusă**: **80%**
- **Backend**: **Pest PHP / PHPUnit** cu raportare acoperire de cod.
  ```bash
  php artisan test --coverage --min=80
  ```
- **Frontend**: **Vitest** + **React Testing Library** în mediu `jsdom`.
  ```bash
  npm test
  npm run test:coverage
  ```

### 2. Testare End-to-End (Playwright)
- Automatizare pe browser real prin **Playwright** (`@playwright/test`):
  - Suport multi-browser (Chromium, Firefox, WebKit).
  - Validare rute, interfață și integrări API.
  ```bash
  # Rulare teste E2E headless
  npx playwright test

  # Rulare interactivă cu interfață grafică
  npx playwright test --ui
  ```

---

## 🗺️ Plan de Configurare & Documentație Tehnică

Documentația extinsă a infrastructurii și producției este disponibilă în `docs/`:
1. 🏭 **[Arhitectură Industrială & Posturi de Lucru](docs/ARCHITECTURE_AND_STATIONS.md)**: Ghid detaliat pentru cele 11 stații, securitate cod de bare, PLM, Magazie, multi-worker și streaming adaptiv.
2. 🗺️ **[Plan de Acțiune Stack](docs/ACTION_PLAN.md)**: Fazele de configurare ale mediului, tooling-ului, testelor și ghidului vizual.
3. 🎨 **[Ghid Vizual](docs/DESIGN_SYSTEM.md)**: Token-uri de culoare, tipografie și accesibilitate.
4. 📐 **[Standarde Tehnice](docs/ENGINEERING_STANDARDS.md)**: Convenții de cod, comenzi de testare și reguli locale.
5. 🤖 **[Instrucțiuni Antigravity](.github/copilot-instructions.md)**: Context specific pentru asistentul AI.

---

## 🚀 Comenzi de Rulare & Calitate Locală

```bash
# 1. Configurare fișier de mediu
cp .env.example .env

# 2. Verificare și corectare stil de cod
./vendor/bin/pint --test
npm run lint

# 3. Rulare teste unitare (verificare 80% coverage)
php artisan test --coverage --min=80
npm run test:coverage

# 4. Rulare teste End-to-End
npx playwright test
```
