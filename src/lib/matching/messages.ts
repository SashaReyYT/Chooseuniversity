/**
 * A reason/concern the matching engine produces is either:
 *  - `translated`: UI copy authored by this codebase, translated via
 *    next-intl at render time using the `Matching` message namespace
 *    (`messages/{locale}.json`). `params` are passed straight to
 *    next-intl's ICU formatting (supports `{n, number}`, `{d, date}`,
 *    etc.) — do not pre-format numbers/dates in the scorer files, since
 *    they don't know the active locale.
 *  - `raw`: content sourced from the database (e.g.
 *    `programme_academic_requirements.entrance_exam_notes`), which is
 *    someone's actual source-language text, not UI copy — translating it
 *    generically isn't this layer's job (see the product spec's
 *    distinction between UI strings and programme/university source
 *    data). Rendered verbatim.
 */
export type MatchMessage =
  | { type: "translated"; key: string; params?: Record<string, string | number | Date> }
  | { type: "raw"; text: string };

export function translated(
  key: string,
  params?: Record<string, string | number | Date>,
): MatchMessage {
  return { type: "translated", key, params };
}

export function rawMessage(text: string): MatchMessage {
  return { type: "raw", text };
}
