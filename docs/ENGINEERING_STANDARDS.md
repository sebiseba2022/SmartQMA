# SmartQMA — Standarde Tehnice de Dezvoltare

Acest document cuprinde standardele obligatorii pentru proiectul **SmartQMA**, axate pe:
1. **Mediul curent de dezvoltare (Antigravity, Laravel, React, PostgreSQL)**
2. **Ghidul vizual industrial (Roșu, Portocaliu, Negru, Alb)**
3. **Testele unitare (acoperire minimă 80%)**
4. **Testele End-to-End (Playwright)**

---

## 1. 💻 Mediul Curent de Lucru

Toată dezvoltarea se realizează exclusiv în **Antigravity**. Nu se utilizează și nu se configurează alte IDE-uri.

### Stack-ul Tehnic Local
- **Backend**: **PHP 8.2+ / Laravel 11**
- **Frontend**: **React + Vite (TypeScript)**
- **Bază de Date**: **PostgreSQL 16**
- **Autentificare**: **Google OAuth2 / OIDC** via Laravel Socialite (fără parole locale)

### Calitatea Codului & Lintere Locale
- **PHP / Laravel**:
  - Se folosește **Laravel Pint** pentru formatare automată și respectarea stilului Laravel/PSR-12.
  - Se folosește **PHPStan** pentru verificarea strictă a tipurilor.
  ```bash
  # Verificare stil cod backend
  ./vendor/bin/pint --test

  # Corectare automată stil backend
  ./vendor/bin/pint

  # Analiză statică de tipuri
  ./vendor/bin/phpstan analyse
  ```
- **React / TypeScript**:
  - Se folosește **ESLint** și **Prettier**.
  ```bash
  # Verificare și corectare stil frontend
  npm run lint
  npm run lint:fix
  ```
- **Configurare Antigravity (`.vscode/`)**:
  - `settings.json`: Formatare automată la salvare (`formatOnSave`).
  - `extensions.json`: Extensii recomandate pentru Laravel Pint, PHP Intelephense, ESLint, Prettier și Playwright.

---

## 2. 🎨 Ghidul Vizual (Visual Guidelines)

Interfața SmartQMA este dedicată mediului industrial de producție și respectă cerințele de accesibilitate **WCAG 2.1 AA** (contrast ridicat și identificare facilă la distanță).

### Paleta Cromatică
- ⬛ **Negru (`#09090B`, `#18181B`)**: Fundal principal (Dark Theme), panouri de comandă ale stațiilor, contrast ridicat.
- ⬜ **Alb (`#FFFFFF`, `#FAFAFA`)**: Text primar, fundaluri de carduri clare.
- 🔴 **Roșu (`#DC2626`, `#991B1B`)**: Semnalare erori critice, piese respinse (`FAILED`), alerte de calitate, oprire linie sau rebuturi (`SCRAP`).
- 🟠 **Portocaliu (`#EA580C`, `#F97316`)**: Etape în desfășurare (`IN_PROGRESS`), atenționări parametri la limită (`WARNING`), coadă de re-testare.

### Reguli Tipografice & Componente
- **Font Monospațiat (`JetBrains Mono` / `Roboto Mono`)**: Utilizat obligatoriu pentru:
  - Numere de serie și coduri de bare / QR.
  - Valori măsurate la teste (ex: `12.45 V`, `0.02 mm`, `85 °C`).
  - Timestamp-uri și identificatori de lot.
- **Badge-uri de Stare**:
  - `PASSED`: Verde `#16A34A` (confirmare trecere test).
  - `FAILED`: Roșu `#DC2626` (defect depistat).
  - `IN_PROGRESS`: Portocaliu `#EA580C` (test în curs de execuție).
  - `QUARANTINED`: Roșu închis `#991B1B` (produs blocat pe linie).

---

## 3. 🧪 Teste Unitare (Unit Testing)

Fiecare componentă logică de business trebuie acoperită prin teste unitare, respectând o acoperire minimă de **80%**.

### Backend (Pest PHP / PHPUnit)
- **Ce se testează**:
  - Tranzițiile de stare din state machine (un produs nu poate avansa dacă testul curent a eșuat).
  - Validarea toleranțelor parametrice (valori minime/maxime admise).
  - Jurnalizarea automată în tabela de audit la orice modificare.
  - Politicile de autorizare (Gate/Policy) pe baza rolului utilizatorului Google.
- **Comenzi de rulare**:
  ```bash
  # Rulare suita completa de teste
  php artisan test

  # Verificare acoperire cod (minim 80% impus)
  php artisan test --coverage --min=80
  ```

### Frontend (Vitest)
- **Ce se testează**:
  - Randarea corectă a badge-urilor de stare în funcție de paleta vizuală (Roșu/Portocaliu/Negru/Alb).
  - Validarea formularelor de introducere a măsurătorilor la stația de lucru.
  - Afișarea arborelui de trasabilitate a etapelor.
- **Comenzi de rulare**:
  ```bash
  npm test
  npm run test:coverage
  ```

---

## 4. 🎭 Teste End-to-End (Playwright)

Testele End-to-End validează scenariile complete ale utilizatorului pe un browser real.

### Scenarii Critice Obligatorii
1. **Fluxul Produs Conform (Happy Path)**:
   - Autentificare utilizator prin Google OAuth2.
   - Scanare număr de serie produs nou la prima stație.
   - Introducere măsurători de test în intervalul de toleranță.
   - Validare salvare și avansare produs la etapa următoare cu starea `PASSED`.
2. **Fluxul Produs Defect (Carantină)**:
   - Scanare produs la stația de testare.
   - Introducere valoare aflată în afara limitelor admise.
   - Validare blocare automată a produsului în starea `QUARANTINED` cu badge roșu și împiedicarea avansării pe linie.
3. **Fluxul de Trasabilitate & Audit**:
   - Accesare panou istoric produs după serial number.
   - Verificare afișare corectă a tuturor stagiilor parcurse, a valorilor de test și a utilizatorului care a operat stația.

### Comenzi Playwright:
```bash
# Rulare teste E2E in modul headless
npx playwright test

# Rulare interactiva cu interfata grafica
npx playwright test --ui
```
