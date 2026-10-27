# SmartQMA (Smart Quality Management & Analytics)

> **Platformă industrială pentru trasabilitatea și analiza calității produselor pe linia de fabricație.**
> Monitorizează ciclul complet de viață al componentelor prin multiple etape și stări de producție, înregistrând măsurătorile de testare calitativă și cantitativă pentru asigurarea calității (QA) și prevenirea defectelor.

---

## 📑 Cuprins
- [Prezentare Generală](#-prezentare-generală)
- [Mediul Curent de Lucru](#-mediul-curent-de-lucru)
- [Ghidul Vizual (Design System)](#-ghidul-vizual-design-system)
- [Strategie de Testare (Unit & E2E)](#-strategie-de-testare-unit--e2e)
- [Plan de Acțiune](#-plan-de-acțiune)
- [Pornire & Rulare Locală](#-pornire--rulare-locală)

---

## 🏭 Prezentare Generală

În orice secție modernă de producție, fiecare produs trece printr-o serie de stagii succesive (recepție componente, asamblare, test intermediar, finisare, inspecție finală QA, ambalare). 

**SmartQMA** asigură:
- **Trasabilitate unitară**: Identificarea fiecărei piese după număr de serie unic, cod de bare sau QR.
- **Validarea stagiilor**: Blocarea automată a avansării pe linie dacă testele etapei curente nu au fost promovate (`PASSED`).
- **Controlul Defectelor (QA)**: Identificare imediată, izolare în carantină (`QUARANTINED`) și proceduri de retuș/casare (`REWORK`/`SCRAP`).
- **Analiză Randament (Yield)**: Calcul First Pass Yield (FPY), diagrame Pareto de defecte și statistici în timp real.
- **Audit Imutabil**: Înregistrarea la nivel de bază de date a fiecărui eveniment (cine, când, la ce stație, cu ce valori).

---

## 💻 Mediul Curent de Lucru

Dezvoltarea se realizează exclusiv în **Antigravity**. Nu se utilizează alte IDE-uri.

- **Backend**: **PHP 8.2+ / Laravel 11** (REST API, Eloquent ORM, WebSockets).
- **Frontend**: **React + Vite (TypeScript)**, optimizat pentru operare rapidă și ecrane tactile de producție.
- **Bază de Date**: **PostgreSQL 16** cu istoric de audit și stocare JSONB pentru măsurători dinamice.
- **Autentificare**: Exclusiv **Google OAuth2 / OpenID Connect (OIDC)** via Laravel Socialite (fără stocare de parole locale).
- **Calitate Cod Local**:
  - Backend: **Laravel Pint** (formatter) și **PHPStan** (analiză statică de tipuri).
  - Frontend: **ESLint** și **Prettier**.

---

## 🎨 Ghidul Vizual (Design System)

Interfața SmartQMA este configurată pe o temă industrială cu contrast ridicat (conform **WCAG 2.1 AA**):

- ⬛ **Negru (`#09090B`, `#18181B`)**: Fundal structural, panouri de comandă, contrast maxim.
- ⬜ **Alb (`#FFFFFF`, `#FAFAFA`)**: Text primar pe fundal dark, carduri curate de date.
- 🔴 **Roșu (`#DC2626`, `#991B1B`)**: Erori critice, rebuturi (`FAILED`, `SCRAP`), carantină (`QUARANTINED`), oprire linie.
- 🟠 **Portocaliu (`#EA580C`, `#F97316`)**: Etape în desfășurare (`IN_PROGRESS`), atenționări de toleranță (`WARNING`), cozi de verificare.
- 🔤 **Font Monospațiat (`JetBrains Mono`)**: Utilizat obligatoriu pentru numere de serie, coduri de bare și valori numerice ale măsurătorilor de test.

👉 Detalii complete în [Ghidul Vizual SmartQMA](docs/DESIGN_SYSTEM.md).

---

## 🧪 Strategie de Testare (Unit & E2E)

### 1. Testare Unitară (Unit Testing)
- **Acoperire minimă impusă**: **80%**
- **Backend**: **Pest PHP / PHPUnit** pentru testarea regulilor de tranziție ale stărilor, validarea toleranțelor și audit.
  ```bash
  php artisan test --coverage --min=80
  ```
- **Frontend**: **Vitest** pentru componentele React și validarea formularelor de măsurători.
  ```bash
  npm test
  npm run test:coverage
  ```

### 2. Testare End-to-End (Playwright)
- Validare pe browser a fluxurilor utilizator complete:
  - **Happy Path**: Scanare produs -> Introducere măsurători conforme -> Trecere în `PASSED`.
  - **Flux Defect**: Scanare produs -> Introducere valoare peste toleranță -> Blocare în `QUARANTINED`.
  - **Trasabilitate**: Verificare arbore de etape și jurnal de audit.
  ```bash
  # Rulare teste E2E
  npx playwright test
  npx playwright test --ui
  ```

---

## 🗺️ Plan de Acțiune

Documentația extinsă a proiectului este organizată în `docs/`:
1. 🗺️ **[Plan de Acțiune](docs/ACTION_PLAN.md)**: Cele 6 faze de implementare (Mediu curent, Model date, Backend, Frontend, Teste Unitare, Teste E2E).
2. 🎨 **[Ghid Vizual](docs/DESIGN_SYSTEM.md)**: Paletă de culori, componente de stare, accesibilitate.
3. 📐 **[Standarde Tehnice](docs/ENGINEERING_STANDARDS.md)**: Calitate cod, comenzi de testare și reguli de lucru.
4. 🤖 **[Instrucțiuni AI Antigravity](.github/copilot-instructions.md)**: Context specific pentru asistentul AI.

---

## 🚀 Pornire & Rulare Locală

```bash
# 1. Configurare fișier de mediu
cp .env.example .env

# 2. Rulare verificări de stil
./vendor/bin/pint --test
npm run lint

# 3. Rulare teste unitare
php artisan test
npm test

# 4. Rulare teste E2E
npx playwright test
```
