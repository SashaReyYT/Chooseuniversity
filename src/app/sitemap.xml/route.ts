import { createServerSupabaseClient } from "@/lib/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://unifind.org";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  // Fetch all published programmes
  const { data: programmes } = await supabase
    .from("programmes")
    .select("id, updated_at, slug")
    .eq("published", true);

  // Fetch all published universities
  const { data: universities } = await supabase
    .from("universities")
    .select("id, updated_at, slug")
    .eq("published", true);

  const staticPages = [
    { url: BASE_URL, lastmod: new Date().toISOString(), changefreq: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/en/discover`, lastmod: new Date().toISOString(), changefreq: "daily", priority: 0.9 },
    { url: `${BASE_URL}/uk/discover`, lastmod: new Date().toISOString(), changefreq: "daily", priority: 0.9 },
    { url: `${BASE_URL}/en/about`, lastmod: new Date().toISOString(), changefreq: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/uk/about`, lastmod: new Date().toISOString(), changefreq: "monthly", priority: 0.5 },
  ];

  const programmeUrls = (programmes ?? []).map((p) => ({
    url: `${BASE_URL}/en/programmes/${p.slug || p.id}`,
    lastmod: p.updated_at,
    changefreq: "weekly",
    priority: 0.8,
  }));

  const universityUrls = (universities ?? []).map((u) => ({
    url: `${BASE_URL}/en/universities/${u.slug || u.id}`,
    lastmod: u.updated_at,
    changefreq: "monthly",
    priority: 0.8,
  }));

  const allUrls = [...staticPages, ...programmeUrls, ...universityUrls];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allUrls
  .map(
    (page) => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${page.url}" />
    <xhtml:link rel="alternate" hreflang="uk" href="${page.url.replace("/en/", "/uk/")}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${page.url}" />
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}