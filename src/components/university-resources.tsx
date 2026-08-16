import type { UniversityResource } from "@/lib/repositories/university-resources.repository";

const CATEGORY_LABELS: Record<string, string> = {
  international_office: "International Office",
  housing: "Housing",
  visa_support: "Visa Support",
  buddy_program: "Buddy Programme",
  student_services: "Student Services",
  erasmus: "Erasmus+",
  arrival_info: "Arrival Info",
};

/**
 * External resource links for a university (international office,
 * housing, visa support, etc.) — read-only reference links, ported from
 * Nevora's per-university research. See
 * `university-resources.repository.ts`.
 */
export function UniversityResources({
  universityName,
  resources,
}: {
  universityName: string;
  resources: UniversityResource[];
}) {
  if (resources.length === 0) return null;

  return (
    <section className="max-w-2xl space-y-4">
      <h2 className="font-headline-sm text-headline-sm text-primary">
        {universityName} resources
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {resources.map((r) => (
          <div
            key={r.id}
            className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-4 ambient-shadow"
          >
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide mb-1">
              {CATEGORY_LABELS[r.category] ?? r.category}
            </p>
            <p className="font-body-md text-body-md text-on-surface">{r.title}</p>
            {r.description && (
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                {r.description}
              </p>
            )}
            {r.link_url && (
              <a
                href={r.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body-sm text-body-sm text-primary hover:underline mt-2 inline-block"
              >
                {r.link_title ?? r.link_url} ↗
              </a>
            )}
            {r.contact_value && (
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                {r.contact_label ?? r.contact_type}: {r.contact_value}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
