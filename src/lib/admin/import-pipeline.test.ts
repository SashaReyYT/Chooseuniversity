import { describe, expect, it } from "vitest";
import {
  parseImportText,
  runImportPipeline,
  validateImportRows,
  type ImportLookups,
} from "./import-pipeline";

const lookups: ImportLookups = {
  languages: new Set(["en", "cs", "uk"]),
  fieldsOfStudy: new Set(["Computer Science", "Economics"]),
  universities: new Set(["Charles University", "TU Prague"]),
};

describe("parseImportText (§43)", () => {
  it("parses a JSON array of rows", () => {
    const { rows, parseErrors } = parseImportText(
      JSON.stringify([{ name: "CS" }, { name: "Econ" }]),
      "json",
    );
    expect(rows).toHaveLength(2);
    expect(parseErrors).toHaveLength(0);
  });

  it("rejects invalid JSON with a row-1 file error", () => {
    const { rows, parseErrors } = parseImportText("{not json", "json");
    expect(rows).toHaveLength(0);
    expect(parseErrors[0]?.field).toBe("file");
  });

  it("rejects non-array JSON", () => {
    const { parseErrors } = parseImportText('{"name":"CS"}', "json");
    expect(parseErrors[0]?.message).toContain("array");
  });

  it("parses CSV with a header row and skips blank lines", () => {
    const csv = [
      "name,university_name,duration_months",
      "CS,Charles University,24",
      "",
      "Econ,TU Prague,36",
    ].join("\n");
    const { rows } = parseImportText(csv, "csv");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ name: "CS", university_name: "Charles University", duration_months: "24" });
  });

  it("handles quoted CSV values containing commas", () => {
    const csv = 'name,description\nCS,"Introduction, basics"\n';
    const { rows } = parseImportText(csv, "csv");
    expect(rows[0]?.description).toBe("Introduction, basics");
  });
});

describe("validateImportRows (§43)", () => {
  const goodRow = {
    university_name: "Charles University",
    name: "BSc Computer Science",
    degree_level: "bachelor",
    field_name: "Computer Science",
    language_code: "en",
    duration_months: 36,
    tuition_min: 12000,
    tuition_max: 12000,
    tuition_currency: "CZK",
  };

  it("passes a fully valid row through", () => {
    const { validRows, errors } = validateImportRows([goodRow], lookups);
    expect(errors).toHaveLength(0);
    expect(validRows).toHaveLength(1);
    expect(validRows[0]?.name).toBe("BSc Computer Science");
  });

  it("flags missing required fields per row", () => {
    const { validRows, errors } = validateImportRows([{ ...goodRow, name: "" }], lookups);
    expect(validRows).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ rowNumber: 1, field: "name", message: "Missing required value" });
  });

  it("rejects an unknown degree level", () => {
    const { errors } = validateImportRows([{ ...goodRow, degree_level: "associate" }], lookups);
    expect(errors.some((e) => e.field === "degree_level")).toBe(true);
  });

  it("rejects a non-numeric duration", () => {
    const { errors } = validateImportRows([{ ...goodRow, duration_months: "two years" }], lookups);
    expect(errors.some((e) => e.field === "duration_months")).toBe(true);
  });

  it("rejects unknown language, field, and university references", () => {
    const { errors } = validateImportRows(
      [{ ...goodRow, language_code: "xx", field_name: "Nope", university_name: "Nowhere" }],
      lookups,
    );
    expect(errors.map((e) => e.field).sort()).toEqual(["field_name", "language_code", "university_name"]);
  });

  it("carries optional enrichment columns", () => {
    const { validRows } = validateImportRows(
      [{ ...goodRow, programme_url: "https://example.com", description: "Great course" }],
      lookups,
    );
    expect(validRows[0]).toMatchObject({
      programme_url: "https://example.com",
      description: "Great course",
    });
  });

  it("defaults tuition_max to tuition_min when only a single price is given", () => {
    const { validRows, errors } = validateImportRows(
      [{ ...goodRow, tuition_min: 5000, tuition_max: undefined }],
      lookups,
    );
    expect(errors).toHaveLength(0);
    expect(validRows[0]).toMatchObject({ tuition_min: 5000, tuition_max: 5000 });
  });

  it("rejects tuition_max below tuition_min", () => {
    const { validRows, errors } = validateImportRows(
      [{ ...goodRow, tuition_min: 5000, tuition_max: 4000 }],
      lookups,
    );
    expect(validRows).toHaveLength(0);
    expect(errors.some((e) => e.field === "tuition_max")).toBe(true);
  });
});

describe("runImportPipeline (§43)", () => {
  it("end-to-end: valid JSON in, clean rows out", () => {
    const text = JSON.stringify([
      {
        university_name: "Charles University",
        name: "BSc Economics",
        degree_level: "bachelor",
        field_name: "Economics",
        language_code: "en",
        duration_months: 36,
        tuition_min: 1000,
        tuition_currency: "CZK",
      },
    ]);
    const result = runImportPipeline(text, "json", lookups);
    expect(result.errors).toHaveLength(0);
    expect(result.validRows).toHaveLength(1);
  });

  it("keeps row numbers accurate when some rows fail", () => {
    const text = JSON.stringify([
      {
        university_name: "Charles University",
        name: "Bad",
        degree_level: "weird",
        field_name: "Economics",
        language_code: "en",
        duration_months: 36,
        tuition_min: 1000,
        tuition_currency: "CZK",
      },
      {
        university_name: "Charles University",
        name: "Good",
        degree_level: "bachelor",
        field_name: "Economics",
        language_code: "en",
        duration_months: 36,
        tuition_min: 1000,
        tuition_currency: "CZK",
      },
    ]);
    const result = runImportPipeline(text, "json", lookups);
    expect(result.validRows).toHaveLength(1);
    expect(result.validRows[0]?.rowNumber).toBe(2);
    expect(result.errors[0]?.rowNumber).toBe(1);
  });
});