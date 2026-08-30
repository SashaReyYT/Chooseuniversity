import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme-provider";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://unifind.org";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: requested } = await params;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "HomePage" });

  return {
    title: `Unifind — ${t("heading")}`,
    description: t("description"),
    alternates: {
      languages: {
        en: `${baseUrl}/en`,
        uk: `${baseUrl}/uk`,
        "x-default": `${baseUrl}/en`,
      },
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Required by next-intl so static rendering (generateStaticParams
  // above) works correctly for each locale rather than only the one
  // resolved at request time.
  setRequestLocale(locale);

  return (
    <ThemeProvider>
      <html lang={locale} className="antialiased" suppressHydrationWarning>
        <body className="bg-background text-on-background font-body-md min-h-screen">
          <NextIntlClientProvider>
            {children}
          </NextIntlClientProvider>
        </body>
      </html>
    </ThemeProvider>
  );
}