import { defineRouting } from "next-intl/routing";

/**
 * Unifind supports exactly two UI languages in V1: English and Ukrainian
 * (see the product spec). Locale is always present in the URL
 * (`localePrefix: "always"`) rather than hidden for the default locale —
 * explicit is better here than "guess which language you're reading"
 * for a product that markets itself to a bilingual audience.
 *
 * Add a locale here — and a matching `messages/<locale>.json` — to
 * support a third language later; nothing else in the i18n setup needs
 * to change.
 */
export const routing = defineRouting({
  locales: ["en", "uk"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
