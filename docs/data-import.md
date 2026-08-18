# Data import

How file imports work in the admin panel (`/admin/imports`, §43/§45) —
the format, the contract, and how errors are handled.

## Format

Two formats, detected by file extension:

- **JSON** — an array of objects. One object per programme.
- **CSV** — a header row with the same column names, one programme per
  line. Values containing commas must be quoted (`"text, with commas"`).

## Required columns (the import contract)

Every row must provide:

| Column | Meaning |
| --- | --- |
| `university_name` | Must exactly match an existing university's name in the catalog |
| `name` | Programme name |
| `degree_level` | `foundation` \| `bachelor` \| `master` \| `phd` |
| `field_name` | Must exactly match an existing field of study name |
| `language_code` | Must match an existing language code (e.g. `en`, `cs`) |
| `duration_months` | Positive number |
| `tuition_min` | Number — annual tuition, cheapest option |
| `tuition_currency` | Currency code (e.g. `CZK`) |

Optional enrichment columns:

| Column | Meaning |
| --- | --- |
| `tuition_max` | Annual tuition, most expensive option. Defaults to `tuition_min` when omitted (single price). |
| `programme_url` | Official programme page URL (becomes the §41 official source) |
| `description` | Programme description |

Tuition is always **per year** in the import contract: the catalogue
stores an annual range (`tuition_min`–`tuition_max`, §49). Per-semester
or total-period figures belong to per-option rows edited on
`/admin/programmes` (the "Tuition by option" section), not the import
file.

## Example

```json
[
  {
    "university_name": "Charles University",
    "name": "BSc Computer Science",
    "degree_level": "bachelor",
    "field_name": "Computer Science",
    "language_code": "en",
    "duration_months": 36,
    "tuition_min": 12000,
    "tuition_max": 14000,
    "tuition_currency": "CZK",
    "programme_url": "https://www.mff.cuni.cz/en/...",
    "description": "..."
  }
]
```

CSV equivalent — same columns as the header row:

```
university_name,name,degree_level,field_name,language_code,duration_months,tuition_min,tuition_currency
Charles University,BSc Computer Science,bachelor,Computer Science,en,36,12000,CZK
```

## What happens on upload

1. The file is recorded in `imports` (source name/URL, format,
   status `parsed`).
2. `src/lib/admin/import-pipeline.ts` parses and validates every row
   against the contract **and** the live catalog (language codes, field
   names, university names must already exist).
3. Valid rows are inserted as programmes.
4. Rejected rows land in `import_errors` (row number, field, message);
   the import's status becomes `review` when anything failed,
   `imported` when everything passed. The admin sees the errors on
   `/admin/imports/<id>`.

The pipeline is a pure function with unit tests
(`src/lib/admin/import-pipeline.test.ts`) — the rules above are
enforced there, not in the UI.

## Design decisions

- **Unknown references are rejected, not auto-created.** "Unknown
  university: X" means the university must be added first in the admin
  catalog screens, then the import re-run. Auto-creating catalog
  entities from raw file names would silently seed typos and duplicates
  into the public catalog.
- **Errors are reviewable, not silent.** Rows that fail stay visible
  with their exact row number and reason, so an admin can fix the file
  and re-import the same data set without losing track of what failed.
- **Data provenance.** `imports.source_url`/`source_name` record where
  the file came from, per the acquisition rules in
  `docs/data-acquisition.md` — imports are an audit trail, not a
  black box.