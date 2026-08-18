import type { ImportFormat } from "@/types/database";

/**
 * The file-import pipeline (§43/§45). Pure and deterministic: parses
 * JSON/CSV into candidate programme rows, validates each against the
 * required contract, and returns the rows that are safe to insert plus
 * per-row errors for the admin review screen. No database access here —
 * the caller (a server action) matches names against the live catalog
 * and inserts.
 *
 * Required columns, per the docs (`docs/data-import.md`):
 *   university_name, name, degree_level, field_name, language_code,
 *   duration_months, tuition_min, tuition_currency
 * `tuition_max` is optional — it defaults to `tuition_min` (single price).
 */

export const IMPORT_REQUIRED_FIELDS = [
  "university_name",
  "name",
  "degree_level",
  "field_name",
  "language_code",
  "duration_months",
  "tuition_min",
  "tuition_currency",
] as const;

export const DEGREE_LEVELS = ["foundation", "bachelor", "master", "phd"] as const;

export interface ValidProgrammeRow {
  rowNumber: number;
  university_name: string;
  name: string;
  degree_level: string;
  field_name: string;
  language_code: string;
  duration_months: number;
  tuition_min: number;
  tuition_max: number;
  tuition_currency: string;
  /** Optional enrichment columns, when present. */
  programme_url?: string;
  description?: string;
}

export interface ImportRowError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface ImportValidationResult {
  validRows: ValidProgrammeRow[];
  errors: ImportRowError[];
}

export interface ImportLookups {
  languages: ReadonlySet<string>;
  fieldsOfStudy: ReadonlySet<string>;
  universities: ReadonlySet<string>;
}

/** Column-name → ValidProgrammeRow key mapping (values differ per row). */
type RawRow = Record<string, unknown>;

function asString(row: RawRow, key: string): string | null {
  const value = row[key];
  if (value == null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function asNumber(row: RawRow, key: string): number | null {
  const value = row[key];
  if (value == null) return null;
  const text = typeof value === "number" ? String(value) : String(value).trim();
  if (text.length === 0) return null;
  const parsed = typeof value === "number" ? value : Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Minimal quote-aware CSV splitter (handles "quoted, values"). */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCsv(text: string): RawRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]);
  return lines
    .slice(1)
    .map((line) => {
      const values = parseCsvLine(line);
      const row: RawRow = {};
      header.forEach((col, index) => {
        row[col.trim()] = values[index] ?? "";
      });
      return row;
    });
}

export function parseImportText(
  text: string,
  format: ImportFormat,
): { rows: RawRow[]; parseErrors: ImportRowError[] } {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { rows: [], parseErrors: [{ rowNumber: 1, field: "file", message: "File is empty" }] };
  }

  if (format === "json") {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) {
        return { rows: [], parseErrors: [{ rowNumber: 1, field: "file", message: "JSON must be an array of objects" }] };
      }
      const rows = parsed.filter((item): item is RawRow =>
        item != null && typeof item === "object" && !Array.isArray(item),
      );
      const skipped = parsed.length - rows.length;
      const parseErrors: ImportRowError[] = skipped > 0
        ? [{ rowNumber: 1, field: "file", message: `${skipped} non-object entries skipped` }]
        : [];
      return { rows, parseErrors };
    } catch {
      return { rows: [], parseErrors: [{ rowNumber: 1, field: "file", message: "Invalid JSON" }] };
    }
  }

  return { rows: parseCsv(trimmed), parseErrors: [] };
}

/**
 * Validates every row against the import contract and the live catalog
 * lookups. Rows with any problem are dropped from `validRows` and
 * reported in `errors` (with the 1-based row number for the review
 * screen); clean rows pass through.
 */
export function validateImportRows(
  rows: RawRow[],
  lookups: ImportLookups,
): ImportValidationResult {
  const validRows: ValidProgrammeRow[] = [];
  const errors: ImportRowError[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    let rowHasErrors = false;

    for (const field of IMPORT_REQUIRED_FIELDS) {
      if (asString(row, field) == null && asNumber(row, field) == null) {
        errors.push({ rowNumber, field, message: "Missing required value" });
        rowHasErrors = true;
      }
    }

    const degreeLevel = asString(row, "degree_level");
    if (degreeLevel && !DEGREE_LEVELS.includes(degreeLevel as (typeof DEGREE_LEVELS)[number])) {
      errors.push({ rowNumber, field: "degree_level", message: `Unknown degree level: ${degreeLevel}` });
      rowHasErrors = true;
    }

    const duration = asNumber(row, "duration_months");
    if (duration != null && duration <= 0) {
      errors.push({ rowNumber, field: "duration_months", message: "Must be a positive number of months" });
      rowHasErrors = true;
    } else if (asString(row, "duration_months") != null && duration == null) {
      errors.push({ rowNumber, field: "duration_months", message: "Not a number" });
      rowHasErrors = true;
    }

    const tuitionMin = asNumber(row, "tuition_min");
    if (asString(row, "tuition_min") != null && tuitionMin == null) {
      errors.push({ rowNumber, field: "tuition_min", message: "Not a number" });
      rowHasErrors = true;
    }

    const tuitionMax = asNumber(row, "tuition_max") ?? tuitionMin;
    if (tuitionMin != null && tuitionMax != null && tuitionMax < tuitionMin) {
      errors.push({ rowNumber, field: "tuition_max", message: "Must be >= tuition_min" });
      rowHasErrors = true;
    }

    const languageCode = asString(row, "language_code");
    if (languageCode && !lookups.languages.has(languageCode)) {
      errors.push({ rowNumber, field: "language_code", message: `Unknown language code: ${languageCode}` });
      rowHasErrors = true;
    }

    const fieldName = asString(row, "field_name");
    if (fieldName && !lookups.fieldsOfStudy.has(fieldName)) {
      errors.push({ rowNumber, field: "field_name", message: `Unknown study field: ${fieldName}` });
      rowHasErrors = true;
    }

    const universityName = asString(row, "university_name");
    if (universityName && !lookups.universities.has(universityName)) {
      errors.push({ rowNumber, field: "university_name", message: `Unknown university: ${universityName}` });
      rowHasErrors = true;
    }

    if (rowHasErrors) return;

    const name = asString(row, "name");
    if (name && degreeLevel && duration != null && tuitionMin != null && languageCode && fieldName && universityName) {
      validRows.push({
        rowNumber,
        university_name: universityName,
        name,
        degree_level: degreeLevel,
        field_name: fieldName,
        language_code: languageCode,
        duration_months: duration,
        tuition_min: tuitionMin,
        tuition_max: tuitionMax ?? tuitionMin,
        tuition_currency: asString(row, "tuition_currency") ?? "",
        programme_url: asString(row, "programme_url") ?? undefined,
        description: asString(row, "description") ?? undefined,
      });
    }
  });

  return { validRows, errors };
}

export function runImportPipeline(
  text: string,
  format: ImportFormat,
  lookups: ImportLookups,
): ImportValidationResult {
  const { rows, parseErrors } = parseImportText(text, format);
  const { validRows, errors } = validateImportRows(rows, lookups);
  return { validRows, errors: [...parseErrors, ...errors] };
}