# SmartQMA — Ghid de Inginerie, Calitate & Metodologie

Acest document stabilește standardele tehnice, cerințele de calitate a codului și metodologia de dezvoltare adoptate în cadrul proiectului **SmartQMA**.

---

## 1. 🔍 Calitatea Codului & Analiză Statică (Code Quality)

### Reguli Obligatorii de Linting & Formatare
- Orice componentă a aplicației (Frontend și Backend) trebuie să aibă configurări stricte de linter și formatare integrate în rădăcina proiectului.
- **Node.js / TypeScript**:
  - `ESLint` configurat cu reguli stricte (`@typescript-eslint/recommended-type-checked`).
  - `Prettier` pentru formatarea uniformă a codului.
- **Comenzi Standard**:
  ```bash
  # Rulare verificare linter
  npm run lint

  # Corectare automată a problemelor de stil
  npm run lint:fix

  # Verificare formatare
  npm run format:check
  ```
- **Pre-commit Hooks**:
  - Se folosește **Husky** și **lint-staged**.
  - Niciun commit nu este permis dacă linter-ul raportează erori sau fișierele nu sunt formatate.
- **Integrare CI/CD**:
  - Pipeline-ul de integrare continuă eșuează imediat dacă există avertismente sau erori de linting.

### Instrumente de Analiză Statică a Securității
- Scanarea automată a vulnerabilităților din dependințe prin **Dependabot** și `npm audit`.
- Scanare automată de tip SAST (Static Application Security Testing) prin GitHub CodeQL.

---

## 2. 🔐 Controlul Versiunilor & Protecția Branch-ului Principal

### Reguli pentru Branch-ul `main`
Branch-ul `main` reprezintă codul de producție și este **strict protejat**:
- ❌ **Comitere directă interzisă**: Nimeni nu are voie să execute `git push origin main` direct.
- ✅ **Pull Requests obligatorii**: Orice modificare se introduce exclusiv prin PR.
- ✅ **Aprobare minimă**: Este necesar minim 1 review aprobat de la un coleg / membru al echipei înainte de merge.
- ✅ **Status Checks obligatorii**:
  - Toate testele unitare trebuie să treacă.
  - Verificarea de linter trebuie să fie fără erori.
  - Build-ul aplicației și al containerelor trebuie să se finalizeze cu succes.
- ✅ **Sincronizare obligatorie**: Branch-ul de lucru trebuie să fie adus la zi cu `main` înainte de squash/merge.

### Fluxul de Pull Request (PR)
1. Se creează un branch nou pornind dintr-un Issue deschis:
   - Format: `feature/issue-12-scan-station`, `bugfix/issue-45-null-serial`, `test/issue-60-e2e-quarantine`.
2. Se scriu modificările și testele aferente (conform principiului TDD).
3. Se rulează testele și linter-ul local (`npm test` și `npm run lint`).
4. Se deschide PR completând șablonul dedicat (`.github/pull_request_template.md`).
5. Se asociază obligatoriu Issue-ul prin cuvinte cheie: `Fixes #12` sau `Closes #45`.
6. După aprobare și trecerea cu succes a pipeline-ului CI, se execută **Squash and Merge**.

---

## 3. 🧪 Cerințe de Testare (Unit & E2E)

### Testare Unitară (Unit Testing)
- **Acoperire minimă impusă**: **80% code coverage** pe toate modulele critice de business (state machine, validare toleranțe teste, calcul randament, audit).
- **Izolare**: Testele unitare nu depind de rețea sau de instanțe reale de baze de date (se folosesc mocks și fixtures).
- **Viteză**: Suita completă de teste unitare trebuie să ruleze în **< 2 minute**.
- **Comenzi**:
  ```bash
  # Rulare teste unitare
  npm test

  # Generare raport de acoperire
  npm run test:coverage
  ```

### Testare End-to-End (E2E Testing cu Playwright)
- Se utilizează **Playwright** pentru testarea fluxurilor critice ale utilizatorului:
  1. Autentificare cu Google.
  2. Scanare cod serial produs la stația de intrare.
  3. Înregistrare valori de testare calitativă (în toleranță și în afara toleranței).
  4. Tranziția stării produsului către `PASSED` sau `QUARANTINED`.
  5. Verificarea generării automate a înregistrărilor în istoricul de audit.
- **Rulare zilnică automată**:
  - Un workflow GitHub Actions rulează zilnic la ora **02:00 UTC** pe mediul de staging pentru a detecta eventuale regresii.
- **Comenzi Playwright**:
  ```bash
  # Rulare teste E2E headless
  npx playwright test

  # Rulare interactivă cu UI
  npx playwright test --ui
  ```

---

## 4. 🐳 Containerizare (Docker & Podman)

Aplicația SmartQMA suportă în mod nativ atât **Docker**, cât și **Podman**, asigurând compatibilitate completă în orice infrastructură.

### Cerințe Dockerfile Multi-Stage
- Etapa de `builder`: compilare TypeScript, instalare dependințe de dezvoltare.
- Etapa de `production`: bazată pe imagini Alpine minimale, conține exclusiv fișierele compilate (`dist/`) și dependințele de producție, rulând sub un utilizator non-root (`node`).

### Comenzi Duale:
```bash
# Folosind Docker:
docker compose up -d --build
docker compose down

# Folosind Podman (comportament identic):
podman-compose up -d --build
podman-compose down
```

---

## 5. 🗄️ Baza de Date, Audit Imutabil & Backups

### Audit Trail Automat
- Fiecărei entități critice (`Product`, `QualityTest`, `StageExecution`, `Defect`) îi este atașat un mecanism automat de audit la nivel de ORM / Trigger BD:
  - `user_id` / `user_email`: Identificatorul operatorului/inspectorului care a efectuat acțiunea.
  - `action`: `INSERT`, `UPDATE`, `SOFT_DELETE`.
  - `changed_fields`: Diff-ul JSON între starea precedentă și starea nouă.
  - `timestamp`: Timpul precis la nivel de milisecundă (UTC).
  - `station_id` / `ip_address`: Stația fizică de la care s-a transmis evenimentul.
- **Interzicere ștergeri fizice**: Produsele și datele istorice de testare nu sunt șterse niciodată din baza de date (`soft-delete`).

### Strategie de Backup
- Scripturi automatizate zilnice cu reținere de 30 de zile.
- Baza de date suportă restaurare Point-in-Time Recovery (PITR) folosind Write-Ahead Logging (WAL) pe PostgreSQL.

---

## 6. 🔒 Securitate & Autentificare Google

- **Doar Google Authentication**:
  - Autentificarea utilizatorilor se realizează **exclusiv prin Google OAuth2 / OpenID Connect (OIDC)**.
  - ❌ **Fără parole locale**: Aplicația nu stochează, nu generează și nu gestionează parole în tabele proprii.
- **Managementul Secretelor**:
  - Niciun secret (client secret Google, cheie JWT, credențiale BD) nu este salvat în git.
  - Se folosește `.env.example` pentru documentarea variabilelor necesare.
  - Se folosesc **GitHub Repository Secrets** pentru CI/CD.

---

## 7. 🚀 Separarea Mediilor (Environment Separation)

| Mediu | Scop | Bază de Date | Logging |
| :--- | :--- | :--- | :--- |
| **Development / Staging** | Testare funcționalități noi, rulare teste E2E | Bază separată cu date sintetice | Nivel `debug`, afișare stack-trace detaliat |
| **Production** | Rulare reală pe linia de fabricație | Bază de date securizată cu replica & backup zilnic | Nivel `error`/`warn`, monitorizare performanță |

---

## 8. 💻 Configurare Mediu de Dezvoltare (IDEs)

### Visual Studio Code
Directorul `.vscode/` include:
- `settings.json`: Formatare automată la salvare prin ESLint și Prettier.
- `launch.json`: Profiluri de depanare (Debug Backend, Debug Frontend).
- `extensions.json`: Recomandare automată a extensiilor esențiale (ESLint, Prettier, Playwright Test).

### IntelliJ IDEA / WebStorm
- Se importă ca proiect Node.js / TypeScript.
- Activare ESLint: `Settings > Languages & Frameworks > JavaScript > Code Quality Tools > ESLint` (Automatic ESLint configuration).
- Activare Prettier: `Settings > Languages & Frameworks > JavaScript > Prettier` (Run on save).

---

## 9. 📝 Metodologie: Issue-Driven Development (IDD)

- **Regulă de Aur**: Nicio linie de cod nu este integrată fără un Issue aprobat în prealabil.
- **Ciclul de viață al unui Issue**:
  $$\text{To Do} \longrightarrow \text{In Progress} \longrightarrow \text{QA / Code Review} \longrightarrow \text{Done}$$
- **Convenția Commit-urilor (Conventional Commits)**:
  - `feat: adaugare endpoint inregistrare test calitativ`
  - `fix: corectie calcul toleranta masuratori rezistenta`
  - `test: adaugare suita teste e2e flux carantina`
  - `docs: actualizare ghid vizual si tokenuri css`
  - `refactor: optimizare query arbore genealogic produs`
