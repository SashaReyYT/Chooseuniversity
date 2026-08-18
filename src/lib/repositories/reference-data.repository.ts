import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Read access to the small, slow-changing reference tables. Public data,
 * no writes — see `supabase/migrations/0006_row_level_security.sql`.
 */
export class ReferenceDataRepository {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  async listCountries() {
    const { data, error } = await this.supabase
      .from("countries")
      .select("*")
      .order("name");

    if (error) throw error;
    return data ?? [];
  }

  /**
   * Countries currently offered as a *destination* choice (spec §13: V1
   * launches with Czechia only, more countries switch on later purely by
   * flipping `supported` — no UI code change). Nationality still uses the
   * full `listCountries()` list, since a user's nationality obviously
   * isn't limited to launch countries.
   */
  async listSupportedCountries() {
    const { data, error } = await this.supabase
      .from("countries")
      .select("*")
      .eq("supported", true)
      .order("sort_order")
      .order("name");

    if (error) throw error;
    return data ?? [];
  }

  async listLanguages() {
    const { data, error } = await this.supabase
      .from("languages")
      .select("*")
      .order("name");

    if (error) throw error;
    return data ?? [];
  }

  async listFieldsOfStudy() {
    const { data, error } = await this.supabase
      .from("fields_of_study")
      .select("*")
      .order("category")
      .order("subcategory", { nullsFirst: true })
      .order("name");

    if (error) throw error;
    return data ?? [];
  }

  /**
   * NMT (ЗНО/НМТ) subjects (spec §20). Configurable per the spec ("the
   * exact availability must be configurable in the database/admin
   * settings") — never hardcoded into the UI.
   */
  async listNmtSubjects() {
    const { data, error } = await this.supabase
      .from("nmt_subjects")
      .select("*")
      .order("name");

    if (error) throw error;
    return data ?? [];
  }

  /**
   * Configurable qualification/test types (spec §21, §51): SAT, ACT, IB,
   * A-Levels, AP, Abitur, Matura, IELTS, TOEFL, etc. Only `active` ones are
   * offered to users; the admin can add more without a code change.
   */
  async listQualifications() {
    const { data, error } = await this.supabase
      .from("qualifications")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .order("name");

    if (error) throw error;
    return data ?? [];
  }

  /**
   * EUR-based currency exchange rates for cross-currency Budget Fit
   * comparisons (spec §15) — see
   * `supabase/migrations/0012_currency_rates.sql`. Raw rows; callers that
   * need the `{ currency: rate }` shape the matching engine expects
   * should use `MatchingService`, which does that mapping.
   */
  async listCurrencyRates() {
    const { data, error } = await this.supabase
      .from("currency_rates")
      .select("*")
      .order("currency");

    if (error) throw error;
    return data ?? [];
  }
}