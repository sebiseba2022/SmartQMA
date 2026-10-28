import { describe, it, expect } from 'vitest';
import { WORKSTATIONS, STATS_MODEL_PAGES, translations } from './i18n';

describe('SmartQMA i18n & Workstations Standard', () => {
  it('should define exactly 10 production workstations', () => {
    expect(WORKSTATIONS).toHaveLength(10);
  });

  it('should have complete RO and EN translations for all 10 workstations', () => {
    WORKSTATIONS.forEach((ws) => {
      expect(ws.name.ro).toBeTruthy();
      expect(ws.name.en).toBeTruthy();
      expect(ws.category.ro).toBeTruthy();
      expect(ws.category.en).toBeTruthy();
      expect(ws.code).toMatch(/^WS-[A-Z]+-\d{2}$/);
    });
  });

  it('should contain all required workstation identifiers', () => {
    const ids = WORKSTATIONS.map((w) => w.id);
    expect(ids).toEqual([
      'magazie',
      'receptie-marfa',
      'qr-laser',
      'smd',
      'aoi',
      'tht',
      'ict',
      'eol',
      'export',
      'statistica',
    ]);
  });

  it('should restrict statistica access only to director and owner roles', () => {
    const statsWs = WORKSTATIONS.find((w) => w.id === 'statistica');
    expect(statsWs?.allowedRoles).toEqual(['director', 'owner']);
  });

  it('should define 6 model options pages (Pagina 1 ... Pagina 6) for Statistics', () => {
    expect(STATS_MODEL_PAGES).toHaveLength(6);
    expect(STATS_MODEL_PAGES.map((p) => p.name.ro)).toEqual([
      'Pagina 1',
      'Pagina 2',
      'Pagina 3',
      'Pagina 4',
      'Pagina 5',
      'Pagina 6',
    ]);
  });

  it('should provide symmetric translations for all UI keys', () => {
    const roKeys = Object.keys(translations.ro).sort();
    const enKeys = Object.keys(translations.en).sort();
    expect(roKeys).toEqual(enKeys);
  });

  it('should render correct brand and headline translations', () => {
    expect(translations.ro.bannerHeadline).toBe('Trasabilitate, simplificată.');
    expect(translations.en.bannerHeadline).toBe('Traceability, simplified.');
    expect(translations.ro.authPortalTitle).toBe('Portal de autentificare');
    expect(translations.en.authPortalTitle).toBe('Authentication portal');
  });
});
