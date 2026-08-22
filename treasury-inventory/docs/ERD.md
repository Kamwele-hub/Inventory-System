# Data model

```mermaid
erDiagram
  DEPARTMENT ||--o{ LOCATION : has
  LOCATION ||--o{ ITEM : "currently holds"
  CATEGORY ||--o{ ITEM : classifies
  VENDOR ||--o{ ITEM : supplies
  ITEM ||--o{ CUSTODY_RECORD : "custody history"
  ITEM ||--o{ SERVICE_RECORD : "service history"
  ITEM ||--o{ ATTACHMENT : "receipts / photos"
  ITEM ||--o| DISPOSAL_RECORD : "ends in"
  USER ||--o{ CUSTODY_RECORD : "held by"
  USER ||--o{ ITEM : "currently issued to"

  ITEM {
    uuid id PK
    string name
    string serial_number UK
    string asset_tag UK
    string ifmis_asset_code
    string status
    string condition
    decimal unit_cost_kes
    date date_acquired
    date warranty_expiry
    date next_service_due
  }
  CUSTODY_RECORD {
    int id PK
    uuid item FK
    int custodian FK
    int location FK
    datetime received_at
    datetime returned_at
  }
  SERVICE_RECORD {
    int id PK
    uuid item FK
    date service_date
    string performed_by
    decimal cost_kes
  }
  DISPOSAL_RECORD {
    int id PK
    uuid item FK
    date disposal_date
    string method
    decimal proceeds_kes
  }
```

## Design notes

- **`Item` is never deleted.** Disposal is modeled as a `DisposalRecord`, not a row removal -- the register must reconcile with historical audit reports years later, and the Office of the Auditor-General needs the full trail.
- **History tables are append-only in practice.** `CustodyRecord` and `ServiceRecord` allow `create`/`read` in the API but block `destroy`; nothing rewrites the past.
- **`django-auditlog`** additionally captures field-level before/after diffs (who changed what, when) on `Item`, `CustodyRecord`, `ServiceRecord`, and `DisposalRecord`, independent of the domain tables above -- so even a legitimate status correction is traceable.
- **Denormalized `current_custodian` / `current_location` on `Item`** exist purely for fast list-page queries; a Django signal keeps them in sync whenever a new `CustodyRecord` is written. `CustodyRecord` remains the source of truth.
- **`ifmis_asset_code`** cross-references the Treasury's own IFMIS record for the same asset, where one exists.
- **Indexes** on `status`, `category`, the `(status, current_location)` pair, `created_at`, and `next_service_due` back the dashboard aggregates and the cursor-paginated list views without full table scans as the register grows.
