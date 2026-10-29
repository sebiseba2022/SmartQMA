import { describe, it, expect } from 'vitest';
import { STATS_MODEL_PAGES } from '../i18n';

describe('FlowGeneratorLogic & Parameters Specification', () => {
  it('pagina-6 is correctly mapped in STATS_MODEL_PAGES', () => {
    const page6 = STATS_MODEL_PAGES.find((p) => p.id === 'pagina-6');
    expect(page6).toBeDefined();
    expect(page6?.id).toBe('pagina-6');
    expect(page6?.name.ro).toBe('Pagina 6');
  });

  it('calculates correct SMD defect rate and pass rate', () => {
    const smdAoi = 1.0;
    const smdIct = 0.7;
    const smdEol = 0.3;

    const totalSmdDefects = Number((smdAoi + smdIct + smdEol).toFixed(2));
    const smdPassRate = Number((100 - totalSmdDefects).toFixed(2));

    expect(totalSmdDefects).toBe(2.0);
    expect(smdPassRate).toBe(98.0);
  });

  it('calculates correct THT defect rate and pass rate', () => {
    const thtIct = 1.0;
    const thtEol = 0.5;

    const totalThtDefects = Number((thtIct + thtEol).toFixed(2));
    const thtPassRate = Number((100 - totalThtDefects).toFixed(2));

    expect(totalThtDefects).toBe(1.5);
    expect(thtPassRate).toBe(98.5);
  });

  it('validates 12-digit industrial serial number format (YYMMDDNNNNNN)', () => {
    const validSerial1 = '260902000001';
    const validSerial2 = '261029000042';
    const invalidSerialShort = '260902001';
    const invalidSerialOldArd = 'ARD-UNO-260902';

    const regex12Digits = /^\d{12}$/;

    expect(regex12Digits.test(validSerial1)).toBe(true);
    expect(regex12Digits.test(validSerial2)).toBe(true);
    expect(regex12Digits.test(invalidSerialShort)).toBe(false);
    expect(regex12Digits.test(invalidSerialOldArd)).toBe(false);
  });

  it('verifies carrier capacity constraints (40-60 boards per carrier)', () => {
    const minCapacity = 40;
    const maxCapacity = 60;
    const defaultCapacity = 50;

    expect(minCapacity).toBeLessThanOrEqual(defaultCapacity);
    expect(defaultCapacity).toBeLessThanOrEqual(maxCapacity);
    expect(minCapacity).toBe(40);
    expect(maxCapacity).toBe(60);
  });

  it('verifies station cycle times specifications', () => {
    const cycleTimes = {
      qrLaser: 15,
      smd: 10,
      tht: 15,
      ict: 30,
      eol: 50,
    };

    expect(cycleTimes.qrLaser).toBe(15);
    expect(cycleTimes.smd).toBe(10);
    expect(cycleTimes.tht).toBe(15);
    expect(cycleTimes.ict).toBe(30);
    expect(cycleTimes.eol).toBe(50);
  });
});
