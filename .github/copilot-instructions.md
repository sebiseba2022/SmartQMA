# SmartQMA — Instrucțiuni pentru Dezvoltare în Antigravity (AI Coding Assistant)

Aceste instrucțiuni oferă context critic asistentului AI integrat în **Antigravity** pentru a asigura respectarea convențiilor, arhitecturii și standardelor definite pentru stack-ul tehnic **SmartQMA**.

---

## 🛠️ Stack Tehnologic & Mediu
- **IDE / Mediu de Dezvoltare**: Exclusiv **Antigravity**.
- **Backend**: **PHP 8.2+ / Laravel 11** cu Eloquent ORM.
- **Frontend**: **React + Vite (TypeScript)**.
- **Bază de Date**: **PostgreSQL 16**.

---

## 🧭 Convenții de Arhitectură & Calitate Cod

### 1. Backend (Laravel & PHP)
- Respectați standardele PSR-12 și stilul Laravel, formatat cu **Laravel Pint** (`./vendor/bin/pint`).
- Folosiți **PHPStan** pentru verificare strictă a tipurilor (`./vendor/bin/phpstan analyse`).
- Structură modulară curată:
  - Modele Eloquent cu tipizare strictă pe proprietăți și relații.
  - Form Requests pentru validarea request-urilor HTTP.
  - API Resources pentru serializarea răspunsurilor JSON.
  - Politici de autorizare (Laravel Policies / Gates).

### 2. Frontend (React & TypeScript)
- Folosiți **TypeScript în mod strict** (`strict: true`, fără utilizarea tipului `any`).
- Formatare automată cu **Prettier** și verificare cu **ESLint** (`npm run lint`).
- Componente modulare și reutilizabile, stilizate folosind token-urile de design SmartQMA.

### 3. Autentificare & Securitate
- ❌ **Nu creați tabele sau câmpuri de parole locale.**
- Autentificarea utilizatorilor se bazează exclusiv pe **Google OAuth2 / OIDC** prin **Laravel Socialite**.

### 4. Sistem Vizual (Design Tokens)
- Respectați paleta oficială:
  - **Negru** (`#09090B`, `#18181B`) pentru fundaluri și structuri dark.
  - **Alb** (`#FFFFFF`, `#FAFAFA`) pentru text și suprafețe luminoase.
  - **Roșu** (`#DC2626`, `#991B1B`) pentru erori și stări eșuate (`FAILED`).
  - **Portocaliu** (`#EA580C`, `#F97316`) pentru stări în derulare (`IN_PROGRESS`) și avertizări.
- Folosiți fonturi monospațiale (`JetBrains Mono` / `Roboto Mono`) pentru date brute, coduri și valori numerice.

---

## 🧪 Reguli de Testare
- **Backend (Laravel)**: Teste unitare și feature scrise cu **Pest PHP** sau **PHPUnit**, acoperire minimă impusă de **80%** (`php artisan test --coverage --min=80`).
- **Frontend (React)**: Teste de componente cu **Vitest** + React Testing Library (`npm test`, `npm run test:coverage`).
- **E2E Testing**: Suită **Playwright** pentru validarea fluxurilor complete în browser (`npx playwright test`).
