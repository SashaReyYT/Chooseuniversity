import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getGuides } from "@/content/guides";

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

  // Fetch supported countries for country pages
  const { data: countries } = await supabase
    .from("countries")
    .select("code, name")
    .eq("supported", true);

  const staticPages = [
    { url: BASE_URL, lastmod: new Date().toISOString(), changefreq: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/en/discover`, lastmod: new Date().toISOString(), changefreq: "daily", priority: 0.9 },
    { url: `${BASE_URL}/uk/discover`, lastmod: new Date().toISOString(), changefreq: "daily", priority: 0.9 },
    { url: `${BASE_URL}/en/about`, lastmod: new Date().toISOString(), changefreq: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/uk/about`, lastmod: new Date().toISOString(), changefreq: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/en/score-methodology`, lastmod: new Date().toISOString(), changefreq: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/uk/score-methodology`, lastmod: new Date().toISOString(), changefreq: "monthly", priority: 0.6 },
  ];

  const programmeUrls = (programmes ?? []).flatMap((p) => {
    const slug = p.slug || p.id;
    return [
      { url: `${BASE_URL}/en/programmes/${slug}`, lastmod: p.updated_at, changefreq: "weekly", priority: 0.8 },
      { url: `${BASE_URL}/uk/programmes/${slug}`, lastmod: p.updated_at, changefreq: "weekly", priority: 0.8 },
    ];
  });

  const universityUrls = (universities ?? []).flatMap((u) => {
    const slug = u.slug || u.id;
    return [
      { url: `${BASE_URL}/en/universities/${slug}`, lastmod: u.updated_at, changefreq: "monthly", priority: 0.8 },
      { url: `${BASE_URL}/uk/universities/${slug}`, lastmod: u.updated_at, changefreq: "monthly", priority: 0.8 },
    ];
  });

  const countryUrls = (countries ?? []).flatMap((c) => [
    { url: `${BASE_URL}/en/countries/${c.code}`, lastmod: new Date().toISOString(), changefreq: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/uk/countries/${c.code}`, lastmod: new Date().toISOString(), changefreq: "monthly", priority: 0.6 },
  ]);

  const guidesEn = getGuides("en");
  const guidesUk = getGuides("uk");

  const allUrls = [
    ...staticPages,
    ...guidesEn.map((g) => ({
      url: `${BASE_URL}/en/guides/${g.slug}`,
      lastmod: g.updated,
      changefreq: "monthly",
      priority: 0.7,
    })),
    ...guidesUk.map((g) => ({
      url: `${BASE_URL}/uk/guides/${g.slug}`,
      lastmod: g.updated,
      changefreq: "monthly",
      priority: 0.7,
    })),
    { url: `${BASE_URL}/en/guides`, lastmod: new Date().toISOString(), changefreq: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/uk/guides`, lastmod: new Date().toISOString(), changefreq: "monthly", priority: 0.7 },
    ...programmeUrls,
    ...universityUrls,
    ...countryUrls,
  ];

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
    <xhtml:link rel="alternate" hreflang="en" href="${page.url.replace("/uk/", "/en/")}" />
    <xhtml:link rel="alternate" hreflang="uk" href="${page.url.replace("/en/", "/uk/")}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${page.url.replace("/uk/", "/en/")}" />
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