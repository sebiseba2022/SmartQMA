# SmartQMA — Ghid de Inginerie, Calitate & Metodologie

Acest document stabilește standardele tehnice, cerințele de calitate a codului și metodologia de dezvoltare adoptate în cadrul proiectului **SmartQMA**.

---

## 1. 🔍 Calitatea Codului & Analiză Statică (Code Quality)

### Reguli de Linting & Formatare pe Stack-ul Tehnic
Aplicația este formată din backend în **PHP / Laravel** și frontend în **React (TypeScript)**, rulând pe **PostgreSQL**.

- **Backend (PHP / Laravel)**:
  - **Laravel Pint**: Formatter oficial bazat pe stilul Laravel și regulile PSR-12.
  - **PHPStan**: Analiză statică strictă a tipurilor și a apelurilor de metode.
  - Comenzi:
    ```bash
    # Verificare stil cod backend fără modificări
    ./vendor/bin/pint --test

    # Corectare automată stil backend
    ./vendor/bin/pint

    # Analiză statică de tipuri
    ./vendor/bin/phpstan analyse
    ```

- **Frontend (React / TypeScript)**:
  - **ESLint**: Reguli stricte de TypeScript (`@typescript-eslint/recommended-type-checked`).
  - **Prettier**: Formatare automată a fișierelor `.tsx`, `.ts`, `.css`.
  - Comenzi:
    ```bash
    npm run lint
    npm run lint:fix
    npm run format:check
    ```

- **Pre-commit Hooks**:
  - Se folosește **Husky** / Git Hooks + `lint-staged`.
  - Niciun commit nu este permis dacă Pint, PHPStan sau ESLint raportează erori.

- **Securitate & Dependințe**:
  - Scanare automată prin **Dependabot** pe GitHub.
  - `composer audit` pentru pachetele PHP și `npm audit` pentru dependințele npm.
  - Scanare SAST prin GitHub CodeQL.

---

## 2. 🔐 Controlul Versiunilor & Protecția Branch-ului Principal

### Reguli pentru Branch-ul `main`
Branch-ul `main` reprezintă codul de producție și este **strict protejat**:
- ❌ **Comitere directă interzisă**: Nimeni nu are voie să execute `git push origin main` direct.
- ✅ **Pull Requests obligatorii**: Orice modificare se introduce exclusiv prin PR.
- ✅ **Aprobare minimă**: Este necesar minim 1 review aprobat de la un coleg / membru al echipei înainte de merge.
- ✅ **Status Checks obligatorii**:
  - Toate testele unitare și de feature (Pest/PHPUnit și Vitest) trebuie să treacă.
  - Verificările de linter (Pint + ESLint) trebuie să fie fără erori.
  - Build-ul containerelor Podman/Docker trebuie să fie verde.
- ✅ **Sincronizare obligatorie**: Branch-ul de lucru trebuie să fie adus la zi cu `main` înainte de squash/merge.

### Fluxul de Pull Request (PR)
1. Se creează un branch nou pornind dintr-un Issue deschis (`feature/issue-12-station-scan`, `bugfix/issue-30-tolerance-calc`).
2. Se scriu modificările și testele aferente (conform principiului TDD).
3. Se rulează verificările locale:
   ```bash
   ./vendor/bin/pint --test && npm run lint
   php artisan test && npm test
   ```
4. Se deschide PR completând șablonul dedicat (`.github/pull_request_template.md`).
5. Se asociază obligatoriu Issue-ul prin cuvinte cheie: `Fixes #12` sau `Closes #30`.
6. După aprobare și trecerea cu succes a pipeline-ului CI, se execută **Squash and Merge**.

---

## 3. 🧪 Cerințe de Testare (Unit & E2E)

### Testare Unitară & Feature (Acoperire minimă 80%)
- **Backend (Laravel)**:
  - Se utilizează **Pest PHP** sau **PHPUnit**.
  - Sunt testate izolat: modelele Eloquent, regulile de business ale state machine-ului pentru produse, calculul toleranțelor testelor și politicile de autorizare (Gate/Policy).
  ```bash
  # Rulare suita teste backend
  php artisan test

  # Generare raport acoperire cod
  php artisan test --coverage --min=80
  ```
- **Frontend (React)**:
  - Se utilizează **Vitest** + **React Testing Library**.
  ```bash
  npm test
  npm run test:coverage
  ```

### Testare End-to-End (E2E Testing cu Playwright)
- Se utilizează **Playwright** pentru testarea fluxurilor end-to-end pe browser:
  1. Autentificare prin Google OAuth2.
  2. Scanare cod serial produs la stația de lucru.
  3. Înregistrare parametri de testare (caz conform vs. caz neconform).
  4. Schimbare stare produs în `PASSED` sau blocare în `QUARANTINED`.
  5. Validare creare înregistrări în log-ul de audit.
- **Rulare zilnică automată**:
  - Workflow GitHub Actions programat zilnic la ora **02:00 UTC** pe mediul de staging.
- **Comenzi Playwright**:
  ```bash
  npx playwright test
  npx playwright test --ui
  ```

---

## 4. 🐳 Containerizare (Docker & Podman)

Aplicația SmartQMA suportă în mod nativ atât **Docker**, cât și **Podman**, asigurând compatibilitate completă în orice infrastructură.

### Servicii Containerizate (`compose.yaml`):
1. **app**: Container PHP 8.2/8.3 FPM / Nginx rulând Laravel.
2. **frontend**: Container Node / Nginx servind aplicația React compilată cu Vite.
3. **postgres**: Instanță de producție **PostgreSQL 16**.
4. **redis**: Server cache și pub/sub pentru actualizări în timp real.

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

## 5. 🗄️ Baza de Date PostgreSQL, Audit Imutabil & Backups

### Audit Trail Automat
- Fiecărei entități critice (`Product`, `QualityTest`, `StageExecution`, `Defect`) îi este atașat un mecanism automat de audit:
  - Se utilizează pachetul `owen-it/laravel-auditing` sau Observers Eloquent pe tabele dedicate.
  - Se înregistrează: `user_id`, tipul acțiunii (`created`, `updated`, `deleted`), diff-ul valorilor vechi/noi (`old_values`, `new_values`), adresa IP și timestamp-ul exact.
  - **Interzicere ștergeri fizice**: Se folosește trait-ul `SoftDeletes` din Laravel. Datele istorice de testare nu sunt șterse niciodată.

### Strategie de Backup
- Scripturi automatizate zilnice cu reținere de 30 de zile (`pg_dump`).
- Suport pentru Point-in-Time Recovery (PITR) folosind Write-Ahead Logging (WAL) pe PostgreSQL.

---

## 6. 🔒 Securitate & Autentificare Google

- **Doar Google Authentication**:
  - Autentificarea utilizatorilor se realizează **exclusiv prin Google OAuth2 / OpenID Connect (OIDC)** folosind **Laravel Socialite**.
  - ❌ **Fără parole locale**: Aplicația nu stochează, nu generează și nu gestionează parole în tabele proprii.
- **Managementul Secretelor**:
  - Niciun secret (client secret Google, cheie aplicație Laravel `APP_KEY`, credențiale BD) nu este salvat în git.
  - Se folosește `.env.example` pentru documentarea variabilelor necesare.
  - Se folosesc **GitHub Repository Secrets** pentru CI/CD.

---

## 7. 🚀 Separarea Mediilor (Environment Separation)

| Mediu | Scop | Bază de Date | Logging |
| :--- | :--- | :--- | :--- |
| **Development / Staging** | Testare funcționalități noi, rulare teste E2E | Bază PostgreSQL separată cu date sintetice | Nivel `debug`, afișare erori detaliate |
| **Production** | Rulare reală pe linia de fabricație | Bază de date PostgreSQL securizată cu replica & backup zilnic | Nivel `error`/`warn`, monitorizare performanță |

---

## 8. 💻 Mediu de Lucru Oficial: Antigravity

Proiectul **SmartQMA** este dezvoltat exclusiv utilizând **Antigravity** ca mediu de programare asistat de inteligență artificială. Nu se utilizează alte medii de dezvoltare.

### Configurare Spațiu de Lucru în Antigravity:
Directorul `.vscode/` asigură configurarea optimă a spațiului de lucru în Antigravity:
- **`settings.json`**: Formatare automată la salvare prin Pint și Prettier, integrare linter în timp real.
- **`extensions.json`**: Extensii recomandate pentru PHP, Laravel, React și Playwright.
- Asistentul AI din Antigravity citește automat instrucțiunile din `.github/copilot-instructions.md` și ghidurile din `docs/`.

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
