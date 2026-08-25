import { describe, expect, it } from "vitest";

/**
 * API-level smoke tests against a running dev/preview server.
 * Skipped unless INTEGRATION_BASE_URL is set:
 *
 *   INTEGRATION_BASE_URL=http://localhost:3000 npm run test:integration
 *
 * Replaces the browser E2E attempts that kept tripping on hydration —
 * these exercise real HTTP behaviour without rendering.
 */
const BASE = process.env.INTEGRATION_BASE_URL ?? "";

describe.skipIf(!BASE)("Integration smoke", () => {
  it("landing page renders with brand", async () => {
    const res = await fetch(`${BASE}/en`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Unifind");
  });

  it("sitemap lists programmes and universities", async () => {
    const res = await fetch(`${BASE}/sitemap.xml`);
    expect(res.status).toBe(200);
    const xml = await res.text();
    expect(xml).toContain("<urlset");
    expect(xml).toMatch(/\/programmes\//);
    expect(xml).toMatch(/\/universities\//);
  });

  it("robots.txt points at the sitemap", async () => {
    const res = await fetch(`${BASE}/robots.txt`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Sitemap:");
  });

  it("a sitemap programme URL renders with Course JSON-LD", async () => {
    const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
    const match = sitemap.match(
      /https?:\/\/[^<]+\/en\/programmes\/[0-9a-f-]{36}/i,
    );
    if (!match) return; // empty catalogue envs are valid
    const res = await fetch(match[0]);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("application/ld+json");
    expect(html).toContain('"@type":"Course"');
  });

  it("forgot-password page is reachable", async () => {
    const res = await fetch(`${BASE}/en/forgot-password`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('name="email"');
  });

  it("auth reset exchange rejects bad codes gracefully", async () => {
    const res = await fetch(`${BASE}/auth/reset?code=invalid`, {
      redirect: "manual",
    });
    // Should redirect back to forgot-password, never 500.
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
  });
});
