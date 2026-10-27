# SmartQMA (Smart Quality Management & Analytics)

> **Platformă industrială pentru trasabilitatea și analiza produselor pe linia de fabricație.**
> Monitorizează ciclul complet de viață al componentelor prin multiple etape și stări de producție, înregistrând măsurătorile de testare calitativă și cantitativă pentru asigurarea calității (QA) și prevenirea defectelor.

---

## 📑 Cuprins
- [Prezentare Generală](#-prezentare-generală)
- [Arhitectură & Tehnologii](#-arhitectură--tehnologii)
- [Sistemul Vizual & Paletă Culori](#-sistemul-vizual--paletă-culori)
- [Cerințe Cheie (Core Requirements)](#-cerințe-cheie-core-requirements)
- [Documentație & Plan de Acțiune](#-documentație--plan-de-acțiune)
- [Rulare & Containerizare (Docker & Podman)](#-rulare--containerizare-docker--podman)
- [Metodologie de Dezvoltare](#-metodologie-de-dezvoltare)

---

## 🏭 Prezentare Generală

În orice secție modernă de producție, fiecare produs trece printr-o serie de stagii succesive (recepție componente, asamblare, test intermediar, finisare, inspecție finală QA, ambalare). 

**SmartQMA** asigură:
- **Trasabilitate unitară**: Identificarea fiecărei piese după număr de serie unic, cod de bare sau QR.
- **Validarea stagiilor**: Blocarea automată a avansării pe linie dacă testele etapei curente nu au fost promovate (`PASSED`).
- **Controlul Defectelor (QA)**: Identificare imediată, izolare în carantină (`QUARANTINED`) și proceduri de retuș/casare (`REWORK`/`SCRAP`).
- **Analiză Randament (Yield)**: Calcul First Pass Yield (FPY), diagrame Pareto de defecte și statistici ale stațiilor în timp real.
- **Audit Imutabil**: Înregistrarea la nivel de bază de date a fiecărui eveniment (cine, când, la ce stație, cu ce valori).

---

## 🛠️ Arhitectură & Tehnologii

- **Backend**: **PHP 8.2+ / Laravel 11** (REST API, Eloquent ORM, WebSockets prin Laravel Reverb / Echo).
- **Bază de Date**: **PostgreSQL 16** cu audit imutabil automat și suport avansat pentru date JSONB.
- **Frontend**: **React + Vite (TypeScript)**, optimizat pentru stații de scanare industrială și panouri tactile.
- **Mediu de Lucru Oficial**: **Antigravity** (mediu asistat de AI, fără suport sau dependență de alte IDE-uri).
- **Testare**: 
  - Teste Unitare & Feature: Pest PHP / PHPUnit și Vitest (acoperire minimă impusă: **80%**).
  - Teste End-to-End: Playwright (rulare automată zilnică în CI/CD).
- **Autentificare**: Exclusiv **Google OAuth2 / OpenID Connect (OIDC)** prin Laravel Socialite (fără parole locale).
- **Containerizare**: Suport dual pentru **Docker** și **Podman**.

---

## 🎨 Sistemul Vizual & Paletă Culori

Interfața SmartQMA este configurată pe o temă industrială cu contrast ridicat (conform **WCAG 2.1 AA**), concepută pentru ecrane de uzină, tablete și monitoare de control:

- ⬛ **Negru (`#09090B`, `#18181B`)**: Fundal structural, panouri de comandă, contrast maxim.
- ⬜ **Alb (`#FFFFFF`, `#FAFAFA`)**: Text primar pe fundal dark, carduri curate în laborator.
- 🔴 **Roșu (`#DC2626`, `#991B1B`)**: Erori critice, rebuturi (`FAILED`, `SCRAP`), oprire de urgență a liniei.
- 🟠 **Portocaliu (`#EA580C`, `#F97316`)**: Etape în derulare (`IN_PROGRESS`), avertizări de toleranță (`WARNING`), cozi de verificare.

👉 Detalii complete și token-uri CSS în [Ghidul Vizual SmartQMA](docs/DESIGN_SYSTEM.md).

---

## ✅ Cerințe Cheie (Core Requirements)

| Domeniu | Cerință | Implementare în SmartQMA |
| :--- | :--- | :--- |
| **Linting & Code Quality** | Verificări automate stricte | Laravel Pint + PHPStan (Backend) și ESLint + Prettier (Frontend) |
| **Branch Protection** | Protecție ramură `main` | PR obligatoriu, minim 1 review, status checks verzi |
| **AI Agent Guidelines** | Ghid pentru asistenți AI | [copilot-instructions.md](.github/copilot-instructions.md) |
| **Containerizare Duală** | Docker & Podman | Dockerfile multi-stage și `compose.yaml` (Laravel + React + Postgres) |
| **CI/CD Automation** | Pipeline-uri automate | GitHub Actions (Lint, Test, Coverage, Build, Deploy) |
| **Testare E2E** | Teste automate zilnice | Suită Playwright rulată la fiecare PR și zilnic la 02:00 UTC |
| **Testare Unitară & Feature** | Acoperire ridicată | Minim 80% coverage impus prin Pest/PHPUnit și Vitest |
| **Separare Medii** | Izolare staging vs. producție | `.env.staging` și `.env.production` configurate separat |
| **Mediu de Lucru** | Configurare oficială | Exclusiv **Antigravity** (configurare `.vscode/` integrată) |
| **Securitate & Auth** | Autentificare Google | OAuth2 / OIDC prin Laravel Socialite fără parole locale |
| **Bază de Date** | Auditare și salvări automate | Audit imutabil pe fiecare model Eloquent + backup-uri programate |

---

## 📚 Documentație & Plan de Acțiune

Documentația extinsă a proiectului este organizată în directorul `docs/`:

1. 🗺️ **[Plan de Acțiune & Faze de Dezvoltare](docs/ACTION_PLAN.md)**: Detalierea pas cu pas a celor 8 faze de implementare (de la modelul de date până la predarea licenței).
2. 🎨 **[Ghid Vizual & Design System](docs/DESIGN_SYSTEM.md)**: Specificații complete de culori, tipografie monospațială pentru seriale, componente UI și accesibilitate.
3. 📐 **[Standarde de Inginerie & Metodologie](docs/ENGINEERING_STANDARDS.md)**: Convenții de cod, flux de Pull Request, strategii de testare și audit.
4. 🤖 **[Instrucțiuni AI & GitHub Copilot](.github/copilot-instructions.md)**: Context architectural dedicat asistenților inteligenți de cod.

---

## 🐳 Rulare & Containerizare (Docker & Podman)

Proiectul este compatibil atât cu Docker, cât și cu Podman fără modificări ale configurației:

```bash
# Copiere configurare mediu
cp .env.example .env

# Pornire folosind Docker:
docker compose up -d --build

# Pornire folosind Podman (echivalent):
podman-compose up -d --build
```

---

## 📝 Metodologie de Dezvoltare

Proiectul adoptă **Issue-Driven Development**:
- Nicio modificare nu se comite direct în `main`.
- Orice activitate începe cu un Issue creat după șabloanele din `.github/ISSUE_TEMPLATE/`.
- Branch-urile respectă convenția `feature/issue-X` sau `bugfix/issue-Y`.
- Commit-urile respectă formatul [Conventional Commits](https://www.conventionalcommits.org/).
