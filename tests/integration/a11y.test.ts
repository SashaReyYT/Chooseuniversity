import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Automated a11y scan over server-rendered HTML. axe-core is injected into
 * the page's JSDOM window and executed there — the reliable pattern, since
 * the engine captures document/window at load time.
 *
 * Known limitation: JSDOM has no layout engine → colour-contrast rules are
 * disabled; those need a browser pass (manual or Playwright).
 */
const BASE = process.env.INTEGRATION_BASE_URL ?? "";

const PAGES = ["/en", "/en/guides", "/en/universities", "/en/privacy", "/en/forgot-password"];

const AXE_SOURCE = readFileSync(
  resolve(process.cwd(), "node_modules/axe-core/axe.min.js"),
  "utf-8",
);

interface AxeViolation {
  id: string;
  impact: string | null;
  nodes: unknown[];
}

async function runAxe(html: string): Promise<AxeViolation[]> {
  // Inject axe before </body> so it binds to this window's document.
  const withAxe = html.replace(
    "</body>",
    `<script>${AXE_SOURCE}</script></body>`,
  );
  const dom = new JSDOM(withAxe, {
    url: BASE,
    runScripts: "dangerously",
    pretendToBeVisual: true,
  });

  const result = await dom.window.eval(`
    new Promise((resolve) => {
      window.axe
        .run(document, { rules: { "color-contrast": { enabled: false } } })
        .then((res) => resolve(JSON.stringify(res.violations)))
        .catch((err) => resolve(JSON.stringify({ __axeError: String(err) })));
    })
  `);

  const parsed = JSON.parse(result as string);
  if (parsed && parsed.__axeError) {
    throw new Error(`axe failed: ${parsed.__axeError}`);
  }
  return parsed as AxeViolation[];
}

describe.skipIf(!BASE)("A11y (axe-core, no color-contrast)", () => {
  for (const path of PAGES) {
    it(`no serious violations on ${path}`, async () => {
      const res = await fetch(`${BASE}${path}`);
      expect(res.status).toBe(200);
      const html = await res.text();

      const violations = await runAxe(html);
      const serious = violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );

      if (serious.length > 0) {
        const summary = serious
          .map((v) => `${v.id} (${v.impact}) ×${v.nodes.length}`)
          .join(", ");
        throw new Error(`A11y violations on ${path}: ${summary}`);
      }
      expect(serious).toHaveLength(0);
    });
  }
});