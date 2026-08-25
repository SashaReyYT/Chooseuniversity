import { Header } from "@/components/header";
import { AppNav } from "@/components/app-nav";
import { SiteFooter } from "@/components/site-footer";

/**
 * The standard app chrome: minimal top bar (brand + account) plus the
 * single `AppNav` (mobile bottom nav / desktop bar). Pages that opt out —
 * the questionnaire (/onboarding, /profile) and auth screens — render
 * their own full-screen layout per the mockups instead.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-16 md:pb-0">
      {/* A11y: first tab stop skips the nav straight into page content. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:left-4 focus:top-4 focus:bg-primary focus:text-on-primary focus:px-4 focus:py-2 focus:rounded-full"
      >
        Skip to content
      </a>
      <Header />
      <AppNav />
      <div id="main-content">{children}</div>
      <SiteFooter />
    </div>
  );
}