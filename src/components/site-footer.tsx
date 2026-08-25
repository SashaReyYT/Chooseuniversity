import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * Slim legal/methodology footer shown on every AppShell page (desktop
 * only — mobile keeps the bottom-nav chrome uncluttered).
 */
export async function SiteFooter() {
  const t = await getTranslations("Footer");

  return (
    <footer className="hidden md:block border-t border-outline-variant/30 mt-16">
      <div className="max-w-container-max mx-auto px-margin-desktop py-6 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Link href="/guides" className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors">
          {t("guides")}
        </Link>
        <Link href="/score-methodology" className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors">
          {t("methodology")}
        </Link>
        <Link href="/privacy" className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors">
          {t("privacy")}
        </Link>
        <Link href="/terms" className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors">
          {t("terms")}
        </Link>
      </div>
    </footer>
  );
}