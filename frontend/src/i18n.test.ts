import { describe, it, expect } from 'vitest';
import { WORKSTATIONS, STATS_MODEL_PAGES, ROLE_NAMES, translations } from './i18n';

describe('SmartQMA i18n & Workstations Standard', () => {
  it('should define exactly 11 production and management workstations (including PLM)', () => {
    expect(WORKSTATIONS).toHaveLength(11);
  });

  it('should have complete RO and EN translations for all 11 workstations', () => {
    WORKSTATIONS.forEach((ws) => {
      expect(ws.name.ro).toBeTruthy();
      expect(ws.name.en).toBeTruthy();
      expect(ws.category.ro).toBeTruthy();
      expect(ws.category.en).toBeTruthy();
      expect(ws.code).toMatch(/^WS-[A-Z]+-\d{2}$/);
    });
  });

  it('should contain all required workstation identifiers including plm', () => {
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
      'plm',
    ]);
  });

  it('should translate all roles to Romanian according to standards', () => {
    expect(ROLE_NAMES.owner.ro).toBe('Proprietar (Owner)');
    expect(ROLE_NAMES.director.ro).toBe('Director Fabricație');
    expect(ROLE_NAMES.engineer.ro).toBe('Inginer Proces & Calitate');
    expect(ROLE_NAMES.magazioner.ro).toBe('Magazioner');
    expect(ROLE_NAMES.analist_calitate.ro).toBe('Analist Calitate');
    expect(ROLE_NAMES.operator.ro).toBe('Operator Producție');
  });

  it('should configure workstation role permissions accurately', () => {
    const plm = WORKSTATIONS.find((w) => w.id === 'plm');
    expect(plm?.allowedRoles).toEqual(
      expect.arrayContaining(['engineer', 'director', 'owner', 'magazioner', 'analist_calitate'])
    );

    const magazie = WORKSTATIONS.find((w) => w.id === 'magazie');
    expect(magazie?.allowedRoles).toContain('magazioner');
    expect(magazie?.allowedRoles).toContain('analist_calitate');
    expect(magazie?.allowedRoles).not.toContain('operator');
    expect(magazie?.allowedRoles).not.toContain('production');

    const receptie = WORKSTATIONS.find((w) => w.id === 'receptie-marfa');
    expect(receptie?.allowedRoles).toContain('analist_calitate');
    expect(receptie?.allowedRoles).toContain('magazioner');
    expect(receptie?.allowedRoles).not.toContain('operator');
    expect(receptie?.allowedRoles).not.toContain('production');
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
