# SmartQMA — Ghid Vizual & Design Tokens

Sistemul vizual SmartQMA definește token-urile de stil, culorile, tipografia și componentele fundamentale ale interfeței, asigurând o estetică modernă de tip **dark/light industrial** și conformitate cu standardul de accesibilitate **WCAG 2.1 AA**.

---

## 🎨 Paleta Cromatică

Paleta este construită pe cele 4 culori fundamentale: **Negru**, **Alb**, **Roșu** și **Portocaliu**, completate cu nuanțe neutre de zinc/oțel.

### 1. Culori Principale

| Nume Token | HEX | Rol în Sistem |
| :--- | :--- | :--- |
| `--color-black` | `#09090B` | Fundal principal în modul întunecat (Dark Theme), contrast maxim. |
| `--color-surface-dark` | `#18181B` | Fundal containere, carduri și bare de navigare. |
| `--color-white` | `#FFFFFF` | Text primar pe fundal dark, fundal suprafețe în Light Theme. |
| `--color-surface-light`| `#FAFAFA` | Fundal deschis pentru modul luminos. |
| `--color-red-primary` | `#DC2626` | Erori, stări eșuate (`FAILED`), alerte critice, oprire. |
| `--color-red-dark` | `#991B1B` | Stări presate, borduri de alertă critică. |
| `--color-orange-primary`| `#EA580C` | Stări în desfășurare (`IN_PROGRESS`), avertizări (`WARNING`). |
| `--color-orange-amber` | `#F97316` | Accente active, tag-uri de atenționare. |

### 2. Nuanțe Neutre (Borduri & Text Secundar)

| Token | HEX | Utilizare |
| :--- | :--- | :--- |
| `--gray-100` | `#F4F4F5` | Borduri fine, fundaluri de hover subtile |
| `--gray-300` | `#D4D4D8` | Separatoare de conținut, text secundar în Light Mode |
| `--gray-500` | `#71717A` | Placeholder câmpuri, text terțiar |
| `--gray-700` | `#3F3F46` | Borduri structurale în Dark Mode |
| `--gray-900` | `#18181B` | Suprafețe secundare întunecate |

---

## 🔤 Tipografie (Typography)

Sistemul folosește două familii de fonturi:
1. **Font General UI**: `Inter` sau `Roboto` (sans-serif) — pentru etichete, butoane, titluri și text de navigare.
2. **Font Monospațiat**: `JetBrains Mono` sau `Roboto Mono` — obligatoriu pentru identificatori, coduri, valori numerice și date structurate.

### Scară Tipografică
- **Heading 1**: 32px (2rem), font-weight: 700, line-height: 1.2
- **Heading 2**: 24px (1.5rem), font-weight: 600, line-height: 1.3
- **Heading 3**: 18px (1.125rem), font-weight: 600, line-height: 1.4
- **Body**: 14px (0.875rem), font-weight: 400, line-height: 1.5
- **Data / Mono**: 13px (0.8125rem), font-weight: 500, line-height: 1.4
- **Badge / Small**: 12px (0.75rem), font-weight: 600, line-height: 1.2

---

## 📐 Sistem de Spațiere & Raze (Spacing & Radius)

| Token | Valoare | Utilizare |
| :--- | :--- | :--- |
| `--spacing-xs` | `4px` | Padding badge-uri, spațiu între icon și text |
| `--spacing-sm` | `8px` | Spațiu între elemente adiacente, padding compact |
| `--spacing-md` | `16px` | Padding standard carduri, distanță între coloane |
| `--spacing-lg` | `24px` | Spațiere secțiuni principale |
| `--spacing-xl` | `32px` | Separare module majore |
| `--radius-sm` | `4px` | Rază badge-uri, butoane mici |
| `--radius-md` | `8px` | Rază carduri, câmpuri de intrare |
| `--radius-lg` | `12px` | Rază dialoguri modale, panouri |

---

## 🧱 Exemplu Token-uri CSS Globale (`smartqma-tokens.css`)

```css
:root {
  /* Culori Principale */
  --qma-color-black: #09090b;
  --qma-color-surface-dark: #18181b;
  --qma-color-surface-card: #27272a;
  --qma-color-white: #ffffff;
  
  /* Accente SmartQMA */
  --qma-color-red-primary: #dc2626;
  --qma-color-red-hover: #b91c1c;
  --qma-color-red-bg: rgba(220, 38, 38, 0.15);
  
  --qma-color-orange-primary: #ea580c;
  --qma-color-orange-hover: #c2410c;
  --qma-color-orange-bg: rgba(234, 88, 12, 0.15);
  
  /* Neutre */
  --qma-border-color: #3f3f46;
  --qma-text-muted: #a1a1aa;
  
  /* Fonturi */
  --qma-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --qma-font-mono: 'JetBrains Mono', 'Roboto Mono', monospace;
  
  /* Raze */
  --qma-radius-sm: 4px;
  --qma-radius-md: 8px;
  --qma-radius-lg: 12px;
}
```

---

## ♿ Accesibilitate (WCAG 2.1 AA)

1. **Raport de Contrast**: Raport de contrast de minim **7:1** între textul deschis și fundalul întunecat.
2. **Semnalare Multi-Modală**: Orice alertă sau stare bazată pe roșu/portocaliu include obligatoriu o iconiță și o etichetă textuală explicită (nu se bazează exclusiv pe culoare).
3. **Focalizare & Navigare**: Toate elementele interactive dispun de contur vizibil de focus (`outline` cu contrast ridicat).
