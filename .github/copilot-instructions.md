# SmartQMA — Instrucțiuni pentru Dezvoltare în Antigravity (AI Coding Assistant)

Aceste instrucțiuni oferă context critic asistentului AI integrat în **Antigravity** pentru a asigura respectarea arhitecturii, convențiilor și standardelor definite pentru proiectul **SmartQMA**.

---

## 📌 Prezentare Generală a Proiectului
- **SmartQMA** este o aplicație industrială de **trasabilitate și analiză a calității produselor** dintr-o secție de producție.
- Produsele au identificatori unici (serial number, cod bare/QR) și trec secvențial prin **stagii de fabricație și testare**, fiecare etapă putând genera măsurători cantitative sau calitative și tranziții de stare (`PASSED`, `IN_PROGRESS`, `FAILED`, `QUARANTINED`, `SCRAPPED`).

---

## 🛠️ Stack Tehnologic & Mediu
- **IDE / Mediu de Dezvoltare**: Exclusiv **Antigravity**.
- **Backend**: **PHP 8.2+ / Laravel 11** cu Eloquent ORM.
- **Frontend**: **React + Vite (TypeScript)**.
- **Bază de Date**: **PostgreSQL 16** cu audit imutabil și suport JSONB.

---

## 🧭 Convenții de Arhitectură & Cod

### 1. Backend (Laravel & PHP)
- Respectați standardele PSR-12 și stilul oficial Laravel, formatat cu **Laravel Pint**.
- Folosiți **PHPStan** pentru verificare strictă de tipuri pe clase, metode și relații Eloquent.
- Aplicați principii de arhitectură curată:
  - Modele Eloquent cu tipizare strictă pe atribute și relații.
  - Form Requests pentru validarea datelor de intrare (scanări, parametri de test).
  - API Resources pentru formatarea răspunsurilor JSON.
  - Politici de autorizare (Laravel Policies / Gates) pentru controlul accesului bazat pe roluri (RBAC).

### 2. Frontend (React & TypeScript)
- Folosiți **TypeScript în mod strict** (`strict: true`, fără tipuri `any`).
- Definiți interfețe clare pentru entitățile de producție (`Product`, `QualityTest`, `StageExecution`, `Station`).
- Formatare automată cu **Prettier** și validare cu **ESLint**.

### 3. Autentificare & Securitate
- ❌ **Nu creați tabele sau câmpuri de parole locale.**
- Autentificarea se bazează exclusiv pe **Google OAuth2 / OIDC** prin **Laravel Socialite**.
- Asigurați verificarea rolului utilizatorului (`OPERATOR`, `QUALITY_INSPECTOR`, `LINE_MANAGER`, `ADMIN`) pe fiecare operațiune critică.

### 4. Trasabilitate & Audit Bază de Date (PostgreSQL)
- Fiecare modificare de stare a unui produs sau înregistrare a unui test trebuie însoțită de un log de audit imutabil (`owen-it/laravel-auditing` sau Observers dedicate):
  - `user_id`, `timestamp`, `event`, `old_values`, `new_values`, `ip_address`.
- Nu efectuați ștergeri fizice pe produsele sau testele din fabrică; folosiți trait-ul `SoftDeletes` din Laravel.

### 5. Sistem Vizual (Design System)
- Respectați paleta de culori SmartQMA:
  - **Negru** (`#09090B`, `#18181B`) pentru fundaluri și panouri industriale.
  - **Alb** (`#FFFFFF`, `#FAFAFA`) pentru suprafețe curate și contrast maxim.
  - **Roșu** (`#DC2626`) pentru stări `FAILED`, rebuturi `SCRAP`, erori și alerte de calitate.
  - **Portocaliu** (`#EA580C`, `#F97316`) pentru stări `IN_PROGRESS`, avertizări de toleranță `WARNING` și cozi de testare.
- Pentru valori numerice, seriale și coduri de bare, folosiți fonturi monospațiale (`JetBrains Mono` / `Roboto Mono`).

---

## 🧪 Reguli de Testare
- **Backend (Laravel)**: Teste scrise cu **Pest PHP** sau **PHPUnit**, acoperire minimă impusă de **80%** (`php artisan test --coverage`).
- **Frontend (React)**: Teste de componente cu **Vitest** + React Testing Library.
- **E2E Testing**: Suită automată **Playwright** pentru fluxurile complete (scanare, testare, carantină, audit).

---

## 📦 Containerizare
- Asigurați compatibilitate completă atât cu **Docker**, cât și cu **Podman** (`compose.yaml`).
