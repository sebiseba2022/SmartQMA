export type Language = 'ro' | 'en';

export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  barcode?: string | null;
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
  has_datasheet?: boolean;
  datasheet_url?: string | null;
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

export interface QrLaserMarkingItem {
  id: number;
  qr_serial_number: string;
  product_model: string;
  pcb_side: string;
  laser_power_pct: number | string;
  mark_duration_ms: number;
  operator_username: string | null;
  marked_at: string;
  status: string;
  notes: string | null;
}

export interface SmdPlacementItem {
  id: number;
  station_id: string;
  qr_serial_number: string;
  bestuck_position: string;
  component_internal_id: number;
  operator_username: string | null;
  mounted_at: string;
  component?: {
    part_name: string;
    ident: string;
    supplier_lot: string | null;
    provider: string | null;
  } | null;
}

export interface AoiResultItem {
  id: number;
  station_id: string;
  qr_serial_number: string;
  test_result: 'PASS' | 'FAIL' | string;
  defect_code: string | null;
  details: string | null;
  operator_username: string | null;
  tested_at: string;
}

export interface ThtPlacementItem {
  id: number;
  station_id: string;
  qr_serial_number: string;
  bestuck_position: string;
  component_internal_id: number;
  operator_username: string | null;
  mounted_at: string;
  component?: {
    part_name: string;
    ident: string;
    supplier_lot: string | null;
    provider: string | null;
  } | null;
}

export interface IctResultItem {
  id: number;
  station_id: string;
  qr_serial_number: string;
  test_result: 'PASS' | 'FAIL' | string;
  measured_values: Record<string, string | number> | null;
  failed_nets: string | null;
  operator_username: string | null;
  tested_at: string;
}

export interface EolResultItem {
  id: number;
  station_id: string;
  qr_serial_number: string;
  product_ident: string;
  hardware_version: string;
  software_version: string;
  test_result: 'PASS' | 'FAIL' | string;
  current_draw_ma: number | string | null;
  functional_checks: Record<string, any> | null;
  operator_username: string | null;
  tested_at: string;
}

export interface StationFeederItem {
  id: number;
  station_id: string;
  position: string;
  component_internal_id: number;
  loaded_by: string | null;
  loaded_at: string;
  component?: {
    part_name: string;
    ident: string;
    supplier_lot: string | null;
  } | null;
}

