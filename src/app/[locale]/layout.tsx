import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import "./globals.css";
import "./fonts.css";
import { routing } from "@/i18n/routing";
import { AppNav } from "@/components/app-nav";

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
    <html lang={locale} className="antialiased">
      <head>
        {/*
          Material Symbols Outlined is used throughout the Unifind mockups
          (nav icons, chips, status glyphs). It isn't a next/font/google
          entry, so it's loaded the same way the reference mockups load it.
        */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background font-body-md min-h-screen pb-16 md:pb-0">
        <NextIntlClientProvider>
          <AppNav />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
