export type ItemStatus = "in_store" | "issued" | "under_repair" | "lost" | "disposed";
export type ItemCondition = "new" | "good" | "fair" | "poor" | "unusable";

export interface RefOption {
  id: number;
  name: string;
}

export interface Department extends RefOption {
  code: string;
}

export interface Location extends RefOption {
  department: number;
  department_name: string;
  address: string;
}

export interface Category extends RefOption {
  depreciation_rate_pct: string;
}

export interface Vendor extends RefOption {
  contact_email: string;
  contact_phone: string;
}

export interface ItemListRow {
  id: string;
  name: string;
  serial_number: string;
  asset_tag: string;
  category_name: string;
  status: ItemStatus;
  condition: ItemCondition;
  current_custodian_name: string | null;
  current_location_name: string | null;
  next_service_due: string | null;
  unit_cost: string;
}

export interface CustodyRecord {
  id: number;
  item: string;
  custodian: number;
  custodian_detail: { id: number; username: string };
  location: number;
  location_detail: { id: number; name: string };
  received_at: string;
  returned_at: string | null;
  notes: string;
}

export interface ServiceRecord {
  id: number;
  item: string;
  service_date: string;
  performed_by: string;
  description: string;
  cost: string;
  next_service_due: string | null;
}

export interface DisposalRecord {
  id: number;
  item: string;
  disposal_date: string;
  method: "sold" | "scrapped" | "donated" | "lost_write_off";
  reason: string;
  proceeds: string;
}

export interface ItemDetail extends ItemListRow {
  description: string;
  category: number;
  vendor: number | null;
  purchase_order_ref: string;
  funding_source: string;
  ifmis_asset_code: string;
  current_book_value_kes: string;
  date_acquired: string;
  warranty_expiry: string | null;
  date_issued: string | null;
  custody_history: CustodyRecord[];
  service_history: ServiceRecord[];
  disposal: DisposalRecord | null;
}

export interface CursorPage<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DashboardSummary {
  total_items: number;
  total_value_kes: string;
  total_book_value_kes: string;
  by_status: Record<string, number>;
  by_condition: Record<string, number>;
  due_for_service_30d: number;
  overdue_for_service: number;
  disposed_ytd: number;
}
