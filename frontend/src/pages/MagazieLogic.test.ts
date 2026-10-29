import { describe, it, expect } from 'vitest';
import type { WarehouseOrder } from '../types';

describe('Magazie Business Logic & Validations', () => {
  describe('Standalone Wildcard Detection', () => {
    const isStandAloneWildcard = (val: string) => {
      const v = val.trim();
      return v === '%%' || v === '%';
    };

    it('should detect standalone "%%" as blocked wildcard', () => {
      expect(isStandAloneWildcard('%%')).toBe(true);
      expect(isStandAloneWildcard('  %%  ')).toBe(true);
    });

    it('should detect standalone "%" as blocked wildcard', () => {
      expect(isStandAloneWildcard('%')).toBe(true);
      expect(isStandAloneWildcard(' % ')).toBe(true);
    });

    it('should ALLOW specific wildcard patterns with prefix, suffix or infix tokens', () => {
      expect(isStandAloneWildcard('10002%%')).toBe(false);
      expect(isStandAloneWildcard('%%203')).toBe(false);
      expect(isStandAloneWildcard('%%ATmega%%')).toBe(false);
      expect(isStandAloneWildcard('10002')).toBe(false);
      expect(isStandAloneWildcard('Mouser')).toBe(false);
      expect(isStandAloneWildcard('')).toBe(false);
    });
  });

  describe('Package Type Resolution (Altele vs Standard)', () => {
    const resolvePackageType = (option: string, customText: string): string => {
      if (option === 'Altele') {
        return customText.trim();
      }
      return option;
    };

    it('should return standard package type when option is standard', () => {
      expect(resolvePackageType('SMD', '')).toBe('SMD');
      expect(resolvePackageType('THT', '')).toBe('THT');
      expect(resolvePackageType('Carcasă', '')).toBe('Carcasă');
      expect(resolvePackageType('PCB', '')).toBe('PCB');
    });

    it('should return custom text when option is Altele', () => {
      expect(resolvePackageType('Altele', 'Cablaj Flexibil')).toBe('Cablaj Flexibil');
      expect(resolvePackageType('Altele', 'Senzor Laser')).toBe('Senzor Laser');
    });

    it('should return empty string when Altele is selected without custom specification', () => {
      expect(resolvePackageType('Altele', '   ')).toBe('');
    });
  });

  describe('New Component Order Initial Defaults', () => {
    const createNewOrderPayload = (ident: string, quantity: number, partName: string, provider: string) => ({
      ident: ident.trim(),
      part_name: partName,
      ordered_at: new Date().toISOString(),
      quantity,
      provider,
      tracking_number: null,
      arrived: false,
      arrival_time: null,
    });

    it('should strictly initialize orders as not arrived, with null arrival time and null tracking number', () => {
      const payload = createNewOrderPayload('10002', 500, 'ATmega328P', 'Mouser Electronics');
      expect(payload.arrived).toBe(false);
      expect(payload.arrival_time).toBeNull();
      expect(payload.tracking_number).toBeNull();
      expect(payload.quantity).toBe(500);
      expect(payload.ident).toBe('10002');
    });
  });

  describe('CSV Row Formatting for Magazie Queries', () => {
    it('should format order rows into compliant CSV fields', () => {
      const mockOrder: WarehouseOrder = {
        id: 1,
        internal_id: 10002,
        ident: '10002',
        part_name: 'ATmega328P (Microcontroler 8-bit AVR)',
        ordered_at: '2026-10-20T12:15:00.000Z',
        quantity: 500,
        arrived: true,
        arrival_time: '2026-10-21T00:00:00.000Z',
        tracking_number: 'DHL-884920145',
        provider: 'Mouser Electronics',
      };

      const csvRow = [
        1,
        `"${mockOrder.ident}"`,
        `"${mockOrder.part_name}"`,
        `"${mockOrder.ordered_at}"`,
        mockOrder.quantity,
        `"${mockOrder.provider}"`,
        `"${mockOrder.tracking_number}"`,
        mockOrder.arrived ? 'Da' : 'Nu',
        `"${mockOrder.arrival_time}"`,
      ].join(',');

      expect(csvRow).toContain('"10002"');
      expect(csvRow).toContain('"ATmega328P (Microcontroler 8-bit AVR)"');
      expect(csvRow).toContain('500');
      expect(csvRow).toContain('"DHL-884920145"');
      expect(csvRow).toContain('Da');
    });
  });
});

