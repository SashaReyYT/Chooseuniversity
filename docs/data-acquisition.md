# University data acquisition

How catalog data gets into Unifind — the rules that keep it honest, and
the pipeline that ingests it. Read this before adding any university,
programme, cost, or ranking data.

## The core rule: never invent data

Every fact in the catalog must come from a real, public, verifiable
source. If a fact is not published by the institution (or a recognized
public reference like QS rankings), it stays `NULL` — the UI renders
`NULL` as "Not specified"/"unavailable", which is always better than a
made-up number.

Concretely:

- **Do not** estimate tuition from a different programme, country
  averages, or "what it probably costs."
- **Do not** backfill a university's founding year or student count
  from memory — only from the university's own pages.
- **Do not** invent ranking data. `universities.ranking_data` accepts
  values like `{"qs": 244}` — enter it only when you can see the rank
  on the ranking body's own page.

## The sources ledger (§41)

Every published fact can (and should) be backed by a row in `sources`,
linked through `programme_sources` / `university_sources` with a
`fact_key` identifying which fact the source supports (`general`,
`tuition`, `admission`, `accommodation`, `living_cost`, `career`,
`ranking`, …).

- `sources.type`: `official_university`, `official_faculty`,
  `official_dormitory`, or `public_reference`.
- A source URL must be the actual page the fact came from — a deep
  link, not the university homepage.
- The public programme page renders these as "Sources" with their
  official/public label, so they're both an audit trail and user
  documentation.

## Where the data comes from

| Fact | Preferred source |
| --- | --- |
| Programme name, degree level, study mode, duration, language | The programme's own page (official faculty/department page) |
| Tuition & application fees | The programme's fees page |
| Application deadline, intake | The admission section of the programme page |
| Language requirements | The programme/admission requirements page |
| Entrance exam, required subjects, GPA | The admission requirements page |
| Required documents | The application/checklist page |
| Scholarships | The university's scholarship page |
| Career outcomes | The programme's careers/alumni page (if published) |
| Accommodation (dormitories) | The dormitory's own page (type `official_dormitory`) |
| Living-cost breakdown | University/city cost-of-living page, or a recognized public reference (type `public_reference`) |
| Ranking | QS / THE / ARWU / national ranking pages (`ranking_data` JSON) |
| Student count, international % | The university's own "about/facts" page |

## Acquisition workflow

1. **Verify the page exists and is current.** Note the date.
2. **Extract only what the page states.** Record it in the admin panel
   (Universities / Programmes / Requirements / Costs / Accommodation /
   Sources screens — §44).
3. **Record the source** in the Sources screen and link it to the
   university/programme with the matching `fact_key`.
4. **Leave the rest `NULL`.** A missing fact is a honest "not specified";
   a guessed fact is wrong data that users and the matching engine will
   both trust incorrectly.

## Bulk import (§43/§45)

For bulk work (e.g. an initial catalogue of 100+ programmes collected
from university sites), use the admin **Imports** screen: upload JSON
or CSV, the pipeline validates every row against the import contract
(required columns, degree-level enum, known language/field/university
references), inserts the valid rows, and records every rejected row in
`import_errors` for review. See `docs/data-import.md` for the exact
format.

The import pipeline deliberately **rejects** rows referencing unknown
universities, fields, or languages rather than auto-creating them —
catalog entities are created deliberately, not by typo. If an import
fails with "Unknown university", add the university first (Universities
screen), then re-run the import.

## What stays NULL vs. what must be present

A programme only appears on the public site once it has the minimum the
matching engine can score: university, field of study, language,
duration, and degree level. Everything else (GPA, tests, fees, costs,
accommodation, rankings, documents, scholarships, career notes) is
optional and shows the "not specified"/"unavailable" states the UI
already handles (§39–§40).