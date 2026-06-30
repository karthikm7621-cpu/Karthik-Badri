# Data Model: [Feature Name]

**Related Spec:** `[path/to/feature_spec.md]`  
**Owner:** [Name or Team]  
**Status:** [Draft | Approved]

## 1. Entities

| Entity | Purpose | Storage |
| --- | --- | --- |
| [Entity] | [Purpose] | [SQLite / IndexedDB / Memory / External] |

## 2. Backend Models

### `[ModelName]`

| Field | Type | Required | Constraints | Notes |
| --- | --- | --- | --- | --- |
| `id` | integer | Yes | Primary key | [Notes] |

## 3. Frontend State

```json
{
  "key": "value meaning"
}
```

## 4. IndexedDB / Offline Storage

| Store | Key | Value Shape | Sync Behavior |
| --- | --- | --- | --- |
| [Store] | [Key] | [Shape] | [Behavior] |

## 5. Validation Rules

- [Rule]
- [Rule]

## 6. Migration Plan

- Forward migration: [Steps]
- Rollback migration: [Steps]
- Backfill required: [Yes/No]

## 7. Data Retention and Privacy

- Retention period: [Duration]
- Sensitive fields: [None or list]
- Redaction requirements: [None or details]
