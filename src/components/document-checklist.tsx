import { DOCUMENT_PROFILES } from "@/lib/documents/document-profiles";

/**
 * A static reference list of documents typically needed to apply to
 * study abroad — general guidance, not tailored to a specific programme
 * or destination, and not something the user tracks progress on. See
 * `document-profiles.ts` for what this is and isn't ported from Nevora.
 */
export function DocumentChecklist() {
  return (
    <section className="max-w-2xl space-y-4">
      <div>
        <h2 className="font-headline-sm text-headline-sm text-primary">
          Documents you&apos;ll typically need
        </h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          General guidance for a study-abroad application — check the
          programme&apos;s official page for its exact requirements.
        </p>
      </div>
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg divide-y divide-outline-variant/30 ambient-shadow">
        {DOCUMENT_PROFILES.map((doc) => (
          <details key={doc.key} className="group p-4">
            <summary className="flex cursor-pointer items-center justify-between list-none">
              <span className="font-body-md text-body-md text-on-surface flex items-center gap-2">
                <span aria-hidden>{doc.icon}</span> {doc.label}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                ~€{doc.estimatedCost} · {doc.prepDays + doc.processingDays}d
              </span>
            </summary>
            <div className="mt-3 space-y-2 font-body-sm text-body-sm text-on-surface-variant">
              <p>{doc.why}</p>
              <p>
                <span className="text-on-surface">Where to get it: </span>
                {doc.whereToGet}
              </p>
              {doc.dependsOn.length > 0 && (
                <p>
                  <span className="text-on-surface">Get first: </span>
                  {doc.dependsOn
                    .map(
                      (key) =>
                        DOCUMENT_PROFILES.find((d) => d.key === key)?.label ?? key,
                    )
                    .join(", ")}
                </p>
              )}
              {doc.tips.length > 0 && (
                <ul className="list-disc pl-5 space-y-1">
                  {doc.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
