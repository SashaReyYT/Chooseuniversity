"use server";

import { revalidatePath } from "next/cache";
import { requireAdminForAction } from "@/lib/admin/require-admin";
import { AdminCatalogRepository } from "@/lib/repositories/admin/admin-catalog.repository";
import { AdminCostsRepository } from "@/lib/repositories/admin/admin-costs.repository";
import { AdminSourcesRepository } from "@/lib/repositories/admin/admin-sources.repository";
import { AdminImportsRepository } from "@/lib/repositories/admin/admin-imports.repository";
import {
  runImportPipeline,
  type ImportLookups,
} from "@/lib/admin/import-pipeline";
import type { ImportFormat } from "@/types/database";
import type { Database } from "@/types/database";

type UniversityInsert = Database["public"]["Tables"]["universities"]["Insert"];
type UniversityUpdate = Database["public"]["Tables"]["universities"]["Update"];
type ProgrammeInsert = Database["public"]["Tables"]["programmes"]["Insert"];
type ProgrammeUpdate = Database["public"]["Tables"]["programmes"]["Update"];

/**
 * All admin mutations, one file. Every action independently re-checks
 * admin membership (`requireAdminForAction`) — forms can only be posted
 * by someone with a valid admin session, and RLS enforces the same
 * boundary on the database side (migration 0010). After any change the
 * admin section is revalidated so the server-rendered tables refresh.
 */

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function nullableText(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function nullableNumber(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (text.length === 0) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

// ---- Universities ----

export async function createUniversityAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const repo = new AdminCatalogRepository(supabase);

  const name = String(formData.get("name") ?? "");
  if (!name) return;

  const input: UniversityInsert = {
    name,
    country_code: String(formData.get("country_code") ?? ""),
    city: String(formData.get("city") ?? ""),
    website_url: nullableText(formData.get("website_url")),
    logo_url: nullableText(formData.get("logo_url")),
    cover_image_url: nullableText(formData.get("cover_image_url")),
    official_application_url: nullableText(formData.get("official_application_url")),
    description: nullableText(formData.get("description")),
    short_description: nullableText(formData.get("short_description")),
    founded_year: nullableNumber(formData.get("founded_year")),
    student_count: nullableNumber(formData.get("student_count")),
    international_student_percentage: nullableNumber(formData.get("international_student_percentage")),
    latitude: nullableNumber(formData.get("latitude")),
    longitude: nullableNumber(formData.get("longitude")),
    slug: nullableText(formData.get("slug")) ?? slugify(name),
    published: formData.get("published") === "on",
    ranking_data: parseRankingJson(formData.get("ranking_data")),
  };

  await repo.createUniversity(input);
  revalidatePath("/[locale]/admin", "layout");
}

export async function updateUniversityAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const repo = new AdminCatalogRepository(supabase);

  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const name = String(formData.get("name") ?? "");
  if (!name) return;

  const changes: UniversityUpdate = {
    name,
    country_code: String(formData.get("country_code") ?? ""),
    city: String(formData.get("city") ?? ""),
    website_url: nullableText(formData.get("website_url")),
    logo_url: nullableText(formData.get("logo_url")),
    cover_image_url: nullableText(formData.get("cover_image_url")),
    official_application_url: nullableText(formData.get("official_application_url")),
    description: nullableText(formData.get("description")),
    short_description: nullableText(formData.get("short_description")),
    founded_year: nullableNumber(formData.get("founded_year")),
    student_count: nullableNumber(formData.get("student_count")),
    international_student_percentage: nullableNumber(formData.get("international_student_percentage")),
    latitude: nullableNumber(formData.get("latitude")),
    longitude: nullableNumber(formData.get("longitude")),
    slug: nullableText(formData.get("slug")) ?? slugify(name),
    published: formData.get("published") === "on",
    ranking_data: parseRankingJson(formData.get("ranking_data")),
  };

  await repo.updateUniversity(id, changes);
  revalidatePath("/[locale]/admin", "layout");
}

export async function deleteUniversityAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await new AdminCatalogRepository(supabase).deleteUniversity(id);
  revalidatePath("/[locale]/admin", "layout");
}

// ---- Programmes ----

export async function createProgrammeAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const repo = new AdminCatalogRepository(supabase);

  const name = String(formData.get("name") ?? "");
  if (!name) return;

  const tuitionMin = nullableNumber(formData.get("tuition_min")) ?? 0;
  const tuitionMax = Math.max(
    nullableNumber(formData.get("tuition_max")) ?? tuitionMin,
    tuitionMin,
  );

  const input: ProgrammeInsert = {
    university_id: String(formData.get("university_id") ?? ""),
    faculty_id: nullableText(formData.get("faculty_id")),
    name,
    slug: nullableText(formData.get("slug")) ?? slugify(name),
    degree_level: String(formData.get("degree_level") ?? "") as ProgrammeInsert["degree_level"],
    degree_title: nullableText(formData.get("degree_title")),
    field_of_study_id: String(formData.get("field_of_study_id") ?? ""),
    language_code: String(formData.get("language_code") ?? ""),
    duration_months: nullableNumber(formData.get("duration_months")) ?? 0,
    study_mode: nullableText(formData.get("study_mode")) as ProgrammeInsert["study_mode"] ?? "full_time",
    tuition_min: tuitionMin,
    tuition_max: tuitionMax,
    tuition_currency: nullableText(formData.get("tuition_currency")) ?? "",
    application_fee_amount: nullableNumber(formData.get("application_fee_amount")),
    application_fee_currency: nullableText(formData.get("application_fee_currency")),
    estimated_living_cost_monthly: nullableNumber(formData.get("estimated_living_cost_monthly")),
    living_cost_currency: nullableText(formData.get("living_cost_currency")),
    application_deadline: nullableText(formData.get("application_deadline")),
    intake_start: nullableText(formData.get("intake_start")),
    description: nullableText(formData.get("description")),
    programme_url: nullableText(formData.get("programme_url")),
    application_url: nullableText(formData.get("application_url")),
    required_documents: splitLines(formData.get("required_documents")),
    scholarship_notes: nullableText(formData.get("scholarship_notes")),
    career_notes: nullableText(formData.get("career_notes")),
    published: formData.get("published") === "on",
  };

  await repo.createProgramme(input);
  revalidatePath("/[locale]/admin", "layout");
}

export async function updateProgrammeAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const repo = new AdminCatalogRepository(supabase);

  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const name = String(formData.get("name") ?? "");
  if (!name) return;

  const tuitionMin = nullableNumber(formData.get("tuition_min")) ?? 0;
  const tuitionMax = Math.max(
    nullableNumber(formData.get("tuition_max")) ?? tuitionMin,
    tuitionMin,
  );

  const changes: ProgrammeUpdate = {
    university_id: String(formData.get("university_id") ?? ""),
    faculty_id: nullableText(formData.get("faculty_id")),
    name,
    slug: nullableText(formData.get("slug")) ?? slugify(name),
    degree_level: String(formData.get("degree_level") ?? "") as ProgrammeUpdate["degree_level"],
    degree_title: nullableText(formData.get("degree_title")),
    field_of_study_id: String(formData.get("field_of_study_id") ?? ""),
    language_code: String(formData.get("language_code") ?? ""),
    duration_months: nullableNumber(formData.get("duration_months")) ?? 0,
    study_mode: nullableText(formData.get("study_mode")) as ProgrammeUpdate["study_mode"] ?? "full_time",
    tuition_min: tuitionMin,
    tuition_max: tuitionMax,
    tuition_currency: nullableText(formData.get("tuition_currency")) ?? "",
    application_fee_amount: nullableNumber(formData.get("application_fee_amount")),
    application_fee_currency: nullableText(formData.get("application_fee_currency")),
    estimated_living_cost_monthly: nullableNumber(formData.get("estimated_living_cost_monthly")),
    living_cost_currency: nullableText(formData.get("living_cost_currency")),
    application_deadline: nullableText(formData.get("application_deadline")),
    intake_start: nullableText(formData.get("intake_start")),
    description: nullableText(formData.get("description")),
    programme_url: nullableText(formData.get("programme_url")),
    application_url: nullableText(formData.get("application_url")),
    required_documents: splitLines(formData.get("required_documents")),
    scholarship_notes: nullableText(formData.get("scholarship_notes")),
    career_notes: nullableText(formData.get("career_notes")),
    published: formData.get("published") === "on",
  };

  await repo.updateProgramme(id, changes);
  revalidatePath("/[locale]/admin", "layout");
}

export async function deleteProgrammeAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await new AdminCatalogRepository(supabase).deleteProgramme(id);
  revalidatePath("/[locale]/admin", "layout");
}

// ---- Reference tables ----

export async function toggleCountryAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const code = String(formData.get("code") ?? "");
  const supported = formData.get("supported") === "true";
  if (!code) return;
  await new AdminCatalogRepository(supabase).toggleCountrySupported(code, supported);
  revalidatePath("/[locale]/admin", "layout");
}

export async function createStudyFieldAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const name = String(formData.get("name") ?? "");
  if (!name) return;
  await new AdminCatalogRepository(supabase).createFieldOfStudy({
    name,
    category: nullableText(formData.get("category")) ?? "Other",
    subcategory: nullableText(formData.get("subcategory")),
  });
  revalidatePath("/[locale]/admin", "layout");
}

// ---- Requirements / costs / accommodation ----

export async function saveRequirementsAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const repo = new AdminCostsRepository(supabase);

  const programmeId = String(formData.get("programme_id") ?? "");
  if (!programmeId) return;

  const entranceExamRequired = formData.get("entrance_exam_required") === "on";

  await repo.upsertAcademicRequirements(programmeId, {
    min_gpa: nullableNumber(formData.get("min_gpa")),
    gpa_scale: nullableNumber(formData.get("gpa_scale")),
    required_subjects: splitComma(formData.get("required_subjects")),
    entrance_exam_required: entranceExamRequired,
    entrance_exam_notes: nullableText(formData.get("entrance_exam_notes")),
    notes: nullableText(formData.get("notes")),
    required_degree_level: nullableText(formData.get("required_degree_level")) as Database["public"]["Tables"]["programme_academic_requirements"]["Row"]["required_degree_level"],
    required_math_background: nullableText(formData.get("required_math_background")) as Database["public"]["Tables"]["programme_academic_requirements"]["Row"]["required_math_background"],
    portfolio_required: formData.get("portfolio_required") === "on",
    interview_required: formData.get("interview_required") === "on",
  });

  // Structured test requirements (spec §50): repeated inputs, one set per
  // row. The full set is replaced on save.
  const qualificationIds = formData.getAll("test_qualification_id");
  const testRequirements = qualificationIds
    .map((raw, index) => {
      const qualificationId = String(raw).trim();
      if (!qualificationId) return null;
      if (formData.getAll("test_remove")[index] === "on") return null;
      const minimumScore = nullableNumber(formData.getAll("test_minimum_score")[index] ?? null);
      return {
        qualification_id: qualificationId,
        section: nullableText(formData.getAll("test_section")[index] ?? null),
        subject: nullableText(formData.getAll("test_subject")[index] ?? null),
        minimum_score: minimumScore,
        minimum_score_display:
          nullableText(formData.getAll("test_minimum_score_display")[index] ?? null) ??
          (minimumScore != null ? String(minimumScore) : null),
        comparison: (nullableText(formData.getAll("test_comparison")[index] ?? null) ??
          "greater_or_equal") as Database["public"]["Tables"]["programme_test_requirements"]["Row"]["comparison"],
        notes: nullableText(formData.getAll("test_notes")[index] ?? null),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r != null);

  await repo.replaceTestRequirements(programmeId, testRequirements);
  revalidatePath("/[locale]/admin", "layout");
}

export async function saveTuitionVariantsAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const repo = new AdminCostsRepository(supabase);

  const programmeId = String(formData.get("programme_id") ?? "");
  if (!programmeId) return;

  const names = formData.getAll("variant_name");
  const variants = names
    .map((raw, index) => {
      const name = String(raw).trim();
      if (!name) return null;
      if (formData.getAll("variant_remove")[index] === "on") return null;
      const tuitionMin = nullableNumber(formData.getAll("variant_min")[index] ?? null) ?? 0;
      const tuitionMax = Math.max(
        nullableNumber(formData.getAll("variant_max")[index] ?? null) ?? tuitionMin,
        tuitionMin,
      );
      return {
        name,
        tuition_min: tuitionMin,
        tuition_max: tuitionMax,
        currency:
          nullableText(formData.getAll("variant_currency")[index] ?? null) ?? "",
        period: (nullableText(formData.getAll("variant_period")[index] ?? null) ??
          "per_year") as Database["public"]["Tables"]["programme_tuition_variants"]["Row"]["period"],
        notes: nullableText(formData.getAll("variant_notes")[index] ?? null),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r != null);

  await repo.replaceTuitionVariants(programmeId, variants);
  revalidatePath("/[locale]/admin", "layout");
}

// ---- Faculties (spec §48) ----

export async function createFacultyAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const repo = new AdminCatalogRepository(supabase);

  const name = String(formData.get("name") ?? "").trim();
  const universityId = String(formData.get("university_id") ?? "").trim();
  if (!name || !universityId) return;

  await repo.createFaculty({
    university_id: universityId,
    name,
    description: nullableText(formData.get("description")),
    website_url: nullableText(formData.get("website_url")),
  });
  revalidatePath("/[locale]/admin", "layout");
}

export async function updateFacultyAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const repo = new AdminCatalogRepository(supabase);

  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await repo.updateFaculty(id, {
    university_id: String(formData.get("university_id") ?? "").trim(),
    name,
    description: nullableText(formData.get("description")),
    website_url: nullableText(formData.get("website_url")),
  });
  revalidatePath("/[locale]/admin", "layout");
}

export async function deleteFacultyAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await new AdminCatalogRepository(supabase).deleteFaculty(id);
  revalidatePath("/[locale]/admin", "layout");
}

// ---- Qualifications (spec §51) ----

export async function createQualificationAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const repo = new AdminCatalogRepository(supabase);

  const code = String(formData.get("code") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!code || !name) return;

  await repo.createQualification({
    code,
    name,
    category: (String(formData.get("category") ?? "other") as Database["public"]["Tables"]["qualifications"]["Row"]["category"]),
    description: nullableText(formData.get("description")),
    max_score: nullableNumber(formData.get("max_score")),
    active: formData.get("active") !== "off",
    sort_order: nullableNumber(formData.get("sort_order")) ?? 0,
  });
  revalidatePath("/[locale]/admin", "layout");
}

export async function updateQualificationAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const repo = new AdminCatalogRepository(supabase);

  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await repo.updateQualification(id, {
    name,
    category: String(formData.get("category") ?? "other") as Database["public"]["Tables"]["qualifications"]["Row"]["category"],
    description: nullableText(formData.get("description")),
    max_score: nullableNumber(formData.get("max_score")),
    active: formData.get("active") !== "off",
    sort_order: nullableNumber(formData.get("sort_order")) ?? 0,
  });
  revalidatePath("/[locale]/admin", "layout");
}

export async function deleteQualificationAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await new AdminCatalogRepository(supabase).deleteQualification(id);
  revalidatePath("/[locale]/admin", "layout");
}

export async function saveLivingCostsAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const repo = new AdminCostsRepository(supabase);

  const programmeId = String(formData.get("programme_id") ?? "");
  if (!programmeId) return;

  const currency = nullableText(formData.get("currency"));
  const num = (key: string) => nullableNumber(formData.get(key));

  await repo.upsertLivingCostEstimates(programmeId, {
    accommodation_min: num("accommodation_min"),
    accommodation_max: num("accommodation_max"),
    food_min: num("food_min"),
    food_max: num("food_max"),
    transport_min: num("transport_min"),
    transport_max: num("transport_max"),
    utilities_min: num("utilities_min"),
    utilities_max: num("utilities_max"),
    internet_phone_min: num("internet_phone_min"),
    internet_phone_max: num("internet_phone_max"),
    study_materials_min: num("study_materials_min"),
    study_materials_max: num("study_materials_max"),
    other_min: num("other_min"),
    other_max: num("other_max"),
    total_min: num("total_min"),
    total_max: num("total_max"),
    currency,
    source_url: nullableText(formData.get("source_url")),
    source_name: nullableText(formData.get("source_name")),
    notes: nullableText(formData.get("notes")),
  });
  revalidatePath("/[locale]/admin", "layout");
}

export async function saveAccommodationAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const repo = new AdminCostsRepository(supabase);

  const universityId = String(formData.get("university_id") ?? "");
  if (!universityId) return;

  await repo.upsertAccommodation(universityId, {
    dormitory_available: formData.get("dormitory_available") === "on",
    dormitory_name: nullableText(formData.get("dormitory_name")),
    room_type: nullableText(formData.get("room_type")),
    estimated_monthly_cost_min: nullableNumber(formData.get("estimated_monthly_cost_min")),
    estimated_monthly_cost_max: nullableNumber(formData.get("estimated_monthly_cost_max")),
    currency: nullableText(formData.get("currency")),
    estimated_deposit: nullableNumber(formData.get("estimated_deposit")),
    estimated_capacity: nullableNumber(formData.get("estimated_capacity")),
    distance_from_campus_km: nullableNumber(formData.get("distance_from_campus_km")),
    official_link: nullableText(formData.get("official_link")),
    source_url: nullableText(formData.get("source_url")),
    source_name: nullableText(formData.get("source_name")),
    notes: nullableText(formData.get("notes")),
  });
  revalidatePath("/[locale]/admin", "layout");
}

// ---- Sources ----

export async function createSourceAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const repo = new AdminSourcesRepository(supabase);

  const url = String(formData.get("url") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!url || !name) return;

  const source = await repo.createSource({
    url,
    name,
    type: String(formData.get("type") ?? "public_reference") as Database["public"]["Tables"]["sources"]["Row"]["type"],
    notes: nullableText(formData.get("notes")),
  });

  const programmeId = String(formData.get("link_programme_id") ?? "");
  const universityId = String(formData.get("link_university_id") ?? "");
  const factKey = String(formData.get("fact_key") ?? "general").trim() || "general";
  if (programmeId) await repo.linkToProgramme(programmeId, source.id, factKey);
  if (universityId) await repo.linkToUniversity(universityId, source.id, factKey);

  revalidatePath("/[locale]/admin", "layout");
}

export async function deleteSourceAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await new AdminSourcesRepository(supabase).deleteSource(id);
  revalidatePath("/[locale]/admin", "layout");
}

// ---- Imports ----

export async function runImportAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const importsRepo = new AdminImportsRepository(supabase);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;

  const format: ImportFormat = file.name.toLowerCase().endsWith(".csv") ? "csv" : "json";
  const sourceName = String(formData.get("source_name") ?? "").trim() || file.name;
  const sourceUrl = nullableText(formData.get("source_url"));
  const text = await file.text();

  const importRow = await importsRepo.createImport({
    source_name: sourceName,
    source_url: sourceUrl,
    format,
    status: "parsed",
    row_count: 0,
  });

  const catalog = new AdminCatalogRepository(supabase);
  const [languages, fields, universities] = await Promise.all([
    catalog.listLanguages(),
    catalog.listFieldsOfStudy(),
    catalog.listUniversities(),
  ]);

  const lookups: ImportLookups = {
    languages: new Set(languages.map((l) => l.code)),
    fieldsOfStudy: new Set(fields.map((f) => f.name)),
    universities: new Set(universities.map((u) => u.name)),
  };

  const result = runImportPipeline(text, format, lookups);
  const universityByName = new Map(universities.map((u) => [u.name, u]));
  const fieldByName = new Map(fields.map((f) => [f.name, f]));

  for (const row of result.validRows) {
    const university = universityByName.get(row.university_name);
    const field = fieldByName.get(row.field_name);
    if (!university || !field) continue;

    const { error } = await supabase
      .from("programmes")
      .insert({
        university_id: university.id,
        name: row.name,
        degree_level: row.degree_level as ProgrammeInsert["degree_level"],
        field_of_study_id: field.id,
        language_code: row.language_code,
        duration_months: row.duration_months,
        tuition_min: row.tuition_min,
        tuition_max: row.tuition_max,
        tuition_currency: row.tuition_currency,
        programme_url: row.programme_url ?? null,
        description: row.description ?? null,
      });
    if (error) {
      result.errors.push({
        rowNumber: row.rowNumber,
        field: "insert",
        message: error.message,
      });
    }
  }

  await importsRepo.recordErrors(
    importRow.id,
    result.errors.map((e) => ({
      row_number: e.rowNumber,
      field: e.field,
      message: e.message,
    })),
  );
  await supabase
    .from("imports")
    .update({
      row_count: result.validRows.length,
      status: result.errors.length > 0 ? "review" : "imported",
    })
    .eq("id", importRow.id);

  revalidatePath("/[locale]/admin", "layout");
}

// ---- Settings ----

export async function grantAdminAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return;
  const { error } = await supabase.from("admin_users").insert({ user_id: userId });
  if (error) throw error;
  revalidatePath("/[locale]/admin", "layout");
}

export async function revokeAdminAction(formData: FormData): Promise<void> {
  const supabase = await requireAdminForAction();
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) return;
  const { error } = await supabase.from("admin_users").delete().eq("user_id", userId);
  if (error) throw error;
  revalidatePath("/[locale]/admin", "layout");
}

// ---- helpers ----

function parseRankingJson(value: FormDataEntryValue | null): Database["public"]["Tables"]["universities"]["Row"]["ranking_data"] {
  const text = String(value ?? "").trim();
  if (text.length === 0) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Database["public"]["Tables"]["universities"]["Row"]["ranking_data"];
  } catch {
    return null;
  }
}

function splitLines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function splitComma(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}