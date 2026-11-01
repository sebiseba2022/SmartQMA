export type Language = 'ro';

export interface WorkstationDef {
  id: string;
  code: string;
  allowedRoles: string[];
  name: {
    ro: string;
  };
  category: {
    ro: string;
  };
}

export const STATS_MODEL_PAGES = [
  { id: 'pagina-1', name: { ro: 'Pagina 1' } },
  { id: 'pagina-2', name: { ro: 'Pagina 2' } },
  { id: 'pagina-3', name: { ro: 'Pagina 3' } },
  { id: 'pagina-4', name: { ro: 'Pagina 4' } },
  { id: 'pagina-5', name: { ro: 'Pagina 5' } },
  { id: 'pagina-6', name: { ro: 'Pagina 6' } },
];

export const ROLE_NAMES: Record<string, { ro: string }> = {
  owner: { ro: 'Proprietar (Owner)' },
  director: { ro: 'Director Fabricație' },
  engineer: { ro: 'Inginer Proces & Calitate' },
  magazioner: { ro: 'Magazioner' },
  analist_calitate: { ro: 'Analist Calitate' },
  operator: { ro: 'Operator Producție' },
  production: { ro: 'Operator Producție' },
};

export const WORKSTATIONS: WorkstationDef[] = [
  {
    id: 'magazie',
    code: 'WS-MAG-01',
    allowedRoles: ['magazioner', 'analist_calitate', 'engineer', 'director', 'owner'],
    name: { ro: 'Zona de stocare - Magazie' },
    category: { ro: 'Stocare & Logistică' },
  },
  {
    id: 'receptie-marfa',
    code: 'WS-REC-02',
    allowedRoles: ['analist_calitate', 'magazioner', 'engineer', 'director', 'owner'],
    name: { ro: 'Punct de verificare - Receptie marfa' },
    category: { ro: 'Control Calitate Intrare' },
  },
  {
    id: 'qr-laser',
    code: 'WS-LSR-03',
    allowedRoles: ['operator', 'production', 'engineer', 'director', 'owner'],
    name: { ro: 'Zona de marcare - QR Laser' },
    category: { ro: 'Identificare & Marcare Laser' },
  },
  {
    id: 'smd',
    code: 'WS-SMD-04',
    allowedRoles: ['operator', 'production', 'engineer', 'director', 'owner'],
    name: { ro: 'Zona de amplasare - SMD' },
    category: { ro: 'Asamblare Suprafață' },
  },
  {
    id: 'aoi',
    code: 'WS-AOI-05',
    allowedRoles: ['operator', 'production', 'engineer', 'director', 'owner'],
    name: { ro: 'Punct de verificare - AOI' },
    category: { ro: 'Inspecție Optică Automată' },
  },
  {
    id: 'tht',
    code: 'WS-THT-06',
    allowedRoles: ['operator', 'production', 'engineer', 'director', 'owner'],
    name: { ro: 'Zona de amplasare - THT' },
    category: { ro: 'Asamblare Manuală / THT' },
  },
  {
    id: 'ict',
    code: 'WS-ICT-07',
    allowedRoles: ['operator', 'production', 'engineer', 'director', 'owner'],
    name: { ro: 'Punct de verificare - ICT' },
    category: { ro: 'Testare Electrică În Circuit' },
  },
  {
    id: 'eol',
    code: 'WS-EOL-08',
    allowedRoles: ['operator', 'production', 'engineer', 'director', 'owner'],
    name: { ro: 'Punct de verificare - EOL' },
    category: { ro: 'Testare Funcțională Finală' },
  },
  {
    id: 'export',
    code: 'WS-EXP-09',
    allowedRoles: ['operator', 'production', 'engineer', 'director', 'owner'],
    name: { ro: 'Zona de scanare - Export' },
    category: { ro: 'Scanare & Ambalare Finală' },
  },
  {
    id: 'statistica',
    code: 'WS-STA-10',
    allowedRoles: ['director', 'owner'],
    name: { ro: 'Statistica' },
    category: { ro: 'Management & Analiză Producție' },
  },
  {
    id: 'plm',
    code: 'WS-PLM-11',
    allowedRoles: ['engineer', 'director', 'owner', 'magazioner', 'analist_calitate'],
    name: { ro: 'Product Lifetime Management (PLM)' },
    category: { ro: 'Management Date Tehnice & Nomenclator' },
  },
];

export const translations = {
  ro: {
    brandName: 'SmartQMA',
    brandTag: 'Platformă Fabricație & Trasabilitate',
    bannerHeadline: 'Trasabilitate, simplificată.',
    bannerDescription:
      'Monitorizează fiecare produs pe linia de fabricație: de la recepție marfă și marcare QR, până la asamblare SMD/THT, inspecție AOI/ICT/EOL și export.',
    bannerFooter: '© 2026 SmartQMA • Sistem Industrial de Calitate',

    authPortalTitle: 'Portal de autentificare',
    authPortalSubtitle: 'Bine ați venit în platforma SmartQMA.',
    usernameLabel: 'Nume utilizator *',
    usernamePlaceholder: 'ex: operator, engineer, director, owner',
    passwordLabel: 'Parolă *',
    passwordPlaceholder: '••••••••',
    stationLabel: 'Post de lucru / Destinație *',
    testAutofillLabel: 'CONTURI TEST:',
    signInButton: 'Autentificare',
    signingIn: 'Se conectează...',

    validationRequired: 'Completați utilizatorul și parola.',
    authErrorDefault: 'Utilizator sau parolă incorectă.',

    workstationsSection: 'POSTURI DE LUCRU',
    navigationSection: 'NAVIGARE',
    backToLogin: 'Înapoi la Login',
    signOut: 'Deconectare',

    lineLabel: 'Linia 1 Fabricație Electronică',
    statusActive: 'Status: Activ',

    metricProcessed: 'PIESE PROCESATE',
    metricPassed: 'CONFORME (PASS)',
    metricFailed: 'NE-CONFORME (FAIL)',

    workspaceTitle: 'Pagină de lucru',
    workspaceDescPrefix: 'Acesta este spațiul de operare pentru postul',
    workspaceDescSuffix:
      'Momentan este o pagină goală, pregătită pentru implementarea controalelor specifice de proces și testare.',
    statsMenuTitle: 'OPȚIUNI STATISTICĂ',
    statisticaAccessDenied:
      'Acces restricționat: Pe paginile de Statistică au acces doar rolurile Director și Owner.',
    restrictedAccessTitle: 'Acces Restricționat',
  },
};
