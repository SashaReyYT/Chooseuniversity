export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://unifind.org";

  const robots = `# Unifind robots.txt
User-agent: *
Allow: /

Disallow: /en/sign-in
Disallow: /en/sign-up
Disallow: /en/onboarding
Disallow: /en/results
Disallow: /en/profile
Disallow: /en/saved
Disallow: /en/compare
Disallow: /en/admin

Disallow: /uk/sign-in
Disallow: /uk/sign-up
Disallow: /uk/onboarding
Disallow: /uk/results
Disallow: /uk/profile
Disallow: /uk/saved
Disallow: /uk/compare
Disallow: /uk/admin

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(robots, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    },
  });
}