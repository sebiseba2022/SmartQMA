export type Language = 'ro' | 'en';

export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

export interface WarehouseOrder {
  id: number;
  internal_id: number;
  ident: string;
  part_name: string;
  ordered_at: string;
  quantity: number;
  arrived: boolean;
  arrival_time: string | null;
  tracking_number: string | null;
  provider: string | null;
}

export interface ComponentIdentItem {
  ident: number;
  part_name: string;
  manufacturer_part_number: string;
  provider: string;
  package_type: string;
  manufacturer: string | null;
  unit: string;
}

export interface ColumnFilters {
  ident: string;
  part_name: string;
  ordered_at: string;
  quantity: string;
  provider: string;
  tracking_number: string;
  arrived: string;
  arrival_time: string;
}

export const EMPTY_FILTERS: ColumnFilters = {
  ident: '',
  part_name: '',
  ordered_at: '',
  quantity: '',
  provider: '',
  tracking_number: '',
  arrived: '',
  arrival_time: '',
};

export const PACKAGE_TYPE_OPTIONS = [
  'SMD',
  'THT',
  'Carcasă',
  'PCB',
  'Cositor',
  'Stecker',
  'Altele',
] as const;

