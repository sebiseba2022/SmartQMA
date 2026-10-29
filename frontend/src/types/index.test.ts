import { describe, it, expect } from 'vitest';
import { PACKAGE_TYPE_OPTIONS, EMPTY_FILTERS } from './index';

describe('SmartQMA Types & Constants', () => {
  it('should define exactly 7 component package type options', () => {
    expect(PACKAGE_TYPE_OPTIONS).toHaveLength(7);
    expect(PACKAGE_TYPE_OPTIONS).toEqual([
      'SMD',
      'THT',
      'Carcasă',
      'PCB',
      'Cositor',
      'Stecker',
      'Altele',
    ]);
  });

  it('should initialize EMPTY_FILTERS with all required column filter keys', () => {
    expect(EMPTY_FILTERS).toEqual({
      ident: '',
      part_name: '',
      ordered_at: '',
      quantity: '',
      provider: '',
      tracking_number: '',
      arrived: '',
      arrival_time: '',
    });
  });
});

