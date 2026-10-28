export type Language = 'ro' | 'en';

export interface WorkstationDef {
  id: string;
  code: string;
  allowedRoles: string[];
  name: {
    ro: string;
    en: string;
  };
  category: {
    ro: string;
    en: string;
  };
}

export const STATS_MODEL_PAGES = [
  { id: 'pagina-1', name: { ro: 'Pagina 1', en: 'Page 1' } },
  { id: 'pagina-2', name: { ro: 'Pagina 2', en: 'Page 2' } },
  { id: 'pagina-3', name: { ro: 'Pagina 3', en: 'Page 3' } },
  { id: 'pagina-4', name: { ro: 'Pagina 4', en: 'Page 4' } },
  { id: 'pagina-5', name: { ro: 'Pagina 5', en: 'Page 5' } },
  { id: 'pagina-6', name: { ro: 'Pagina 6', en: 'Page 6' } },
];

export const WORKSTATIONS: WorkstationDef[] = [
  {
    id: 'magazie',
    code: 'WS-MAG-01',
    allowedRoles: ['production', 'engineer', 'director', 'owner'],
    name: {
      ro: 'Zona de stocare - Magazie',
      en: 'Storage Area - Warehouse',
    },
    category: {
      ro: 'Stocare & Logistică',
      en: 'Storage & Logistics',
    },
  },
  {
    id: 'receptie-marfa',
    code: 'WS-REC-02',
    allowedRoles: ['production', 'engineer', 'director', 'owner'],
    name: {
      ro: 'Punct de verificare - Receptie marfa',
      en: 'Inspection Point - Goods Receipt',
    },
    category: {
      ro: 'Control Calitate Intrare',
      en: 'Incoming Quality Control',
    },
  },
  {
    id: 'qr-laser',
    code: 'WS-LSR-03',
    allowedRoles: ['production', 'engineer', 'director', 'owner'],
    name: {
      ro: 'Zona de marcare - QR Laser',
      en: 'Marking Area - QR Laser',
    },
    category: {
      ro: 'Identificare & Marcare Laser',
      en: 'Laser Marking & Identification',
    },
  },
  {
    id: 'smd',
    code: 'WS-SMD-04',
    allowedRoles: ['production', 'engineer', 'director', 'owner'],
    name: {
      ro: 'Zona de amplasare - SMD',
      en: 'Placement Area - SMD',
    },
    category: {
      ro: 'Asamblare Suprafață',
      en: 'Surface Mount Technology',
    },
  },
  {
    id: 'aoi',
    code: 'WS-AOI-05',
    allowedRoles: ['production', 'engineer', 'director', 'owner'],
    name: {
      ro: 'Punct de verificare - AOI',
      en: 'Inspection Point - AOI',
    },
    category: {
      ro: 'Inspecție Optică Automată',
      en: 'Automated Optical Inspection',
    },
  },
  {
    id: 'tht',
    code: 'WS-THT-06',
    allowedRoles: ['production', 'engineer', 'director', 'owner'],
    name: {
      ro: 'Zona de amplasare - THT',
      en: 'Placement Area - THT',
    },
    category: {
      ro: 'Asamblare Manuală / THT',
      en: 'Through-Hole Technology',
    },
  },
  {
    id: 'ict',
    code: 'WS-ICT-07',
    allowedRoles: ['production', 'engineer', 'director', 'owner'],
    name: {
      ro: 'Punct de verificare - ICT',
      en: 'Inspection Point - ICT',
    },
    category: {
      ro: 'Testare Electrică În Circuit',
      en: 'In-Circuit Electrical Testing',
    },
  },
  {
    id: 'eol',
    code: 'WS-EOL-08',
    allowedRoles: ['production', 'engineer', 'director', 'owner'],
    name: {
      ro: 'Punct de verificare - EOL',
      en: 'Inspection Point - EOL',
    },
    category: {
      ro: 'Testare Funcțională Finală',
      en: 'End-Of-Line Functional Testing',
    },
  },
  {
    id: 'export',
    code: 'WS-EXP-09',
    allowedRoles: ['production', 'engineer', 'director', 'owner'],
    name: {
      ro: 'Zona de scanare - Export',
      en: 'Scanning Area - Export',
    },
    category: {
      ro: 'Scanare & Ambalare Finală',
      en: 'Final Packaging & Shipping',
    },
  },
  {
    id: 'statistica',
    code: 'WS-STA-10',
    allowedRoles: ['director', 'owner'],
    name: {
      ro: 'Statistica',
      en: 'Statistics & Analytics',
    },
    category: {
      ro: 'Management & Analiză Producție',
      en: 'Production & Yield Management',
    },
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
  en: {
    brandName: 'SmartQMA',
    brandTag: 'Manufacturing & Traceability Platform',
    bannerHeadline: 'Traceability, simplified.',
    bannerDescription:
      'Track every product across the production line: from goods intake and QR laser marking, to SMD/THT assembly, AOI/ICT/EOL inspection, and export.',
    bannerFooter: '© 2026 SmartQMA • Industrial Quality System',

    authPortalTitle: 'Authentication portal',
    authPortalSubtitle: 'Welcome to the SmartQMA platform.',
    usernameLabel: 'Username *',
    usernamePlaceholder: 'e.g. operator, engineer, director, owner',
    passwordLabel: 'Password *',
    passwordPlaceholder: '••••••••',
    stationLabel: 'Workstation / Destination *',
    testAutofillLabel: 'TEST AUTOFILL:',
    signInButton: 'Sign in',
    signingIn: 'Signing in...',

    validationRequired: 'Please enter both username and password.',
    authErrorDefault: 'Invalid username or password.',

    workstationsSection: 'WORKSTATIONS',
    navigationSection: 'NAVIGATION',
    backToLogin: 'Back to Login',
    signOut: 'Sign out',

    lineLabel: 'Electronic Assembly Line 1',
    statusActive: 'Status: Active',

    metricProcessed: 'PROCESSED UNITS',
    metricPassed: 'PASSED (PASS)',
    metricFailed: 'FAILED (SCRAP)',

    workspaceTitle: 'Workstation Space',
    workspaceDescPrefix: 'This is the operational workspace for workstation',
    workspaceDescSuffix:
      'Currently an empty workspace, ready for specific process and inspection controls.',
    statsMenuTitle: 'STATISTICS OPTIONS',
    statisticaAccessDenied:
      'Restricted access: Only Director and Owner roles have access to the Statistics pages.',
    restrictedAccessTitle: 'Restricted Access',
  },
};
