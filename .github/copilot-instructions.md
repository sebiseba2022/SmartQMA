# SmartQMA — Instrucțiuni pentru Dezvoltare în Antigravity (AI Coding Assistant)

Aceste instrucțiuni oferă context critic asistentului AI integrat în **Antigravity** pentru a asigura respectarea convențiilor, arhitecturii și standardelor definite pentru stack-ul tehnic **SmartQMA**.

---

## 🛠️ Stack Tehnologic & Mediu
- **IDE / Mediu de Dezvoltare**: Exclusiv **Antigravity**.
- **Backend**: **PHP 8.2+ / Laravel 11** cu Eloquent ORM.
- **Frontend**: **React + Vite (TypeScript)**.
- **Bază de Date**: **PostgreSQL 16**.

---

## 🧭 Reguli Stricte & Convenții

### 1. Regula de Aur pentru UI / Interfață
- ❌ **STRICT:** Nu adăugați NICIODATĂ coduri de stații (ex: `WS-STA-10`, `WS-MAG-01`), tag-uri, badge-uri sau identificatori noi în UI fără permisiunea explicită a utilizatorului.
- Se afișează strict denumirile specificate, fără adaosuri, fără paranteze sau elemente suplimentare.
- Executați strict ce cere utilizatorul, fără suplimentări din proprie inițiativă.

### 2. Backend (Laravel & PHP)
- Respectați standardele PSR-12 și stilul Laravel, formatat cu **Laravel Pint** (`./vendor/bin/pint`).
- Folosiți **PHPStan** pentru verificare strictă a tipurilor (`./vendor/bin/phpstan analyse`).
- Structură modulară curată:
  - Modele Eloquent cu tipizare strictă pe proprietăți și relații.
  - Form Requests pentru validarea request-urilor HTTP.
  - API Resources pentru serializarea răspunsurilor JSON.
  - Politici de autorizare (Laravel Policies / Gates).

### 3. Frontend (React & TypeScript)
- Folosiți **TypeScript în mod strict** (`strict: true`, fără utilizarea tipului `any`).
- Componente modulare și reutilizabile, stilizate folosind token-urile de design SmartQMA.

### 4. Reguli de Testare
- **Backend (Laravel)**: Teste unitare și feature scrise cu **Pest PHP** sau **PHPUnit**, acoperire minimă impusă de **80%** (`php artisan test --coverage --min=80`).
- **Frontend (React)**: Teste de componente cu **Vitest** + React Testing Library (`npm test`, `npm run test:coverage`).
- **E2E Testing**: Suită **Playwright** pentru validarea fluxurilor complete în browser (`npx playwright test`).
