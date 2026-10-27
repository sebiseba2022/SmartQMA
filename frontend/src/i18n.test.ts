import { describe, it, expect } from 'vitest';
import { WORKSTATIONS, translations } from './i18n';

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
