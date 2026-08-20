import { Header } from "@/components/header";
import { AppNav } from "@/components/app-nav";

/**
 * The standard app chrome: minimal top bar (brand + account) plus the
 * single `AppNav` (mobile bottom nav / desktop bar). Pages that opt out —
 * the questionnaire (/onboarding, /profile) and auth screens — render
 * their own full-screen layout per the mockups instead.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Header />
      <AppNav />
      {children}
    </div>
  );
}