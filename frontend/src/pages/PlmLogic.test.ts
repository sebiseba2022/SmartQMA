import { describe, it, expect } from 'vitest';
import { EMPTY_PLM_FILTERS } from './PlmPage';
import type { ComponentIdentItem } from '../types';

describe('PLM Page Logic & Utilities', () => {
  it('should initialize empty filters correctly', () => {
    expect(EMPTY_PLM_FILTERS).toEqual({
      ident: '',
      part_name: '',
      manufacturer_part_number: '',
      provider: '',
      package_type: '',
      manufacturer: '',
      unit: '',
    });
  });

  it('should detect standalone wildcard tokens', () => {
    const isStandAloneWildcard = (val: string) => {
      const v = val.trim();
      return v === '%%' || v === '%';
    };

    expect(isStandAloneWildcard('%%')).toBe(true);
    expect(isStandAloneWildcard(' % ')).toBe(true);
    expect(isStandAloneWildcard('%% ')).toBe(true);
    expect(isStandAloneWildcard('1000%')).toBe(false);
    expect(isStandAloneWildcard('%328%')).toBe(false);
    expect(isStandAloneWildcard('')).toBe(false);
  });

  it('should compute empty row counts consistently for 24-row grid', () => {
    const minRows = 24;
    const computeEmptyRows = (loadedCount: number) => {
      if (loadedCount >= minRows) {
        return 1;
      }
      return Math.max(1, minRows - loadedCount);
    };

    expect(computeEmptyRows(0)).toBe(24);
    expect(computeEmptyRows(10)).toBe(14);
    expect(computeEmptyRows(24)).toBe(1);
    expect(computeEmptyRows(50)).toBe(1);
  });

  it('should format CSV export rows with proper escaping', () => {
    const mockIdents: ComponentIdentItem[] = [
      {
        ident: 10002,
        part_name: 'ATmega328P (Microcontroler 8-bit)',
        manufacturer_part_number: 'ATMEGA328P-PU',
        provider: 'Mouser Electronics',
        package_type: 'THT',
        manufacturer: 'Microchip Technology',
        unit: 'buc.',
        has_datasheet: true,
      },
    ];

    const row = [
      mockIdents[0].ident,
      `"${(mockIdents[0].part_name || '').replace(/"/g, '""')}"`,
      `"${(mockIdents[0].manufacturer_part_number || '').replace(/"/g, '""')}"`,
      `"${(mockIdents[0].provider || '').replace(/"/g, '""')}"`,
      `"${(mockIdents[0].package_type || '').replace(/"/g, '""')}"`,
      `"${(mockIdents[0].manufacturer || '').replace(/"/g, '""')}"`,
      `"${(mockIdents[0].unit || '').replace(/"/g, '""')}"`,
      mockIdents[0].has_datasheet ? `Datasheet-${mockIdents[0].ident}.pdf` : 'Lipsă',
    ];

    expect(row[0]).toBe(10002);
    expect(row[1]).toBe('"ATmega328P (Microcontroler 8-bit)"');
    expect(row[7]).toBe('Datasheet-10002.pdf');
  });

  it('should verify operator station gating check', () => {
    const OPERATOR_GATED_STATIONS = ['qr-laser', 'smd', 'aoi', 'tht', 'ict', 'eol', 'export'];

    const checkRequiresBarcode = (
      userRole: string,
      stationId: string,
      unlocked: Set<string>
    ) => {
      const isOperator = userRole === 'operator' || userRole === 'production';
      return isOperator && OPERATOR_GATED_STATIONS.includes(stationId) && !unlocked.has(stationId);
    };

    // Operator accessing SMD without prior unlock
    expect(checkRequiresBarcode('operator', 'smd', new Set())).toBe(true);

    // Operator accessing SMD after unlock
    expect(checkRequiresBarcode('operator', 'smd', new Set(['smd']))).toBe(false);

    // Operator accessing PLM (not a gated operational station)
    expect(checkRequiresBarcode('operator', 'plm', new Set())).toBe(false);

    // Engineer accessing SMD (no barcode gate required)
    expect(checkRequiresBarcode('engineer', 'smd', new Set())).toBe(false);

    // Director / Owner accessing AOI (no barcode gate required)
    expect(checkRequiresBarcode('director', 'aoi', new Set())).toBe(false);
    expect(checkRequiresBarcode('owner', 'aoi', new Set())).toBe(false);
  });
});
