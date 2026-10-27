# SmartQMA — AI Coding Assistant & Copilot Instructions

Aceste instrucțiuni oferă context critic asistenților de inteligență artificială (GitHub Copilot, Antigravity, etc.) pentru a asigura respectarea arhitecturii, convențiilor și standardelor definite pentru proiectul **SmartQMA**.

---

## 📌 Prezentare Generală a Proiectului
- **SmartQMA** este o aplicație industrială de **trasabilitate și analiză a calității produselor** dintr-o secție de producție.
- Produsele au identificatori unici (serial number, cod bare/QR) și trec secvențial prin **stagii de fabricație și testare**, fiecare etapă putând genera măsurători cantitative sau calitative și tranziții de stare (`PASSED`, `IN_PROGRESS`, `FAILED`, `QUARANTINED`, `SCRAPPED`).

---

## 🧭 Convenții de Arhitectură & Cod

### 1. Limbaj & Tipare
- Folosiți **TypeScript în mod strict** (`strict: true`, fără tipuri `any`). Definiți interfețe și tipuri pentru toate entitățile de producție.
- Aplicați principii de **Clean Architecture / Modular Monolith**:
  - Separarea clară a stratului de domeniu (entități, state machine), stratului de aplicație (cazuri de utilizare) și stratului de infrastructură (bază de date, API).
- Operațiuni asincrone bazate exclusiv pe `async/await`.

### 2. Autentificare & Securitate
- ❌ **Nu creați tabele sau câmpuri de parole locale.**
- Autentificarea se bazează exclusiv pe **Google OAuth2 / OIDC**.
- Asigurați verificarea rolului utilizatorului (`OPERATOR`, `QUALITY_INSPECTOR`, `LINE_MANAGER`, `ADMIN`) pe fiecare operațiune critică.

### 3. Trasabilitate & Audit Bază de Date
- Fiecare modificare de stare a unui produs sau înregistrare a unui test trebuie însoțită de un log de audit imutabil:
  - `userId`, `timestamp`, `action`, `previousState`, `newState`, `details`.
- Nu efectuați ștergeri fizice (`DELETE FROM ...`) pe entitățile de produse sau teste; folosiți `deletedAt` (soft-delete).

### 4. Sistem Vizual (Design System)
- Respectați paleta de culori SmartQMA:
  - **Negru** (`#09090B`, `#18181B`) pentru fundaluri și structuri dark industrial.
  - **Alb** (`#FFFFFF`, `#FAFAFA`) pentru contrast maxim și suprafețe luminoase.
  - **Roșu** (`#DC2626`) pentru stări `FAILED`, alerte de calitate, erori și defecte critice.
  - **Portocaliu** (`#EA580C`, `#F97316`) pentru stări `IN_PROGRESS`, avertizări și parametri la limită.
- Pentru valori numerice, seriale și coduri de bare, folosiți fonturi monospațiale (`JetBrains Mono` / `Roboto Mono`).

---

## 🧪 Reguli de Testare
- **Unit Testing**: Toate funcțiile de calcul (toleranțe, validare tranziții de stare, randament FPY) necesită teste unitare cu **acoperire minimă de 80%**.
- **E2E Testing**: Noile fluxuri utilizator trebuie însoțite de specificații de testare **Playwright**.
- Folosiți mock-uri pentru apelurile de rețea externe și servicii cloud.

---

## 📦 Containerizare
- Asigurați-vă că orice modificare la nivel de build este compatibilă atât cu **Docker**, cât și cu **Podman**.
