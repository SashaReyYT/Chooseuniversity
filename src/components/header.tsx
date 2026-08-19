import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";

const NAV_LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/saved", label: "Saved" },
  { href: "/compare", label: "Compare" },
];

export async function Header() {
  const user = await getCurrentUser();
  const isAnonymous = user?.is_anonymous === true;

  return (
    <header className="border-b border-outline-variant/40 bg-surface-container-lowest">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-headline-sm text-headline-sm text-primary"
        >
          Unifind
        </Link>

        {user && !isAnonymous ? (
          <nav className="flex items-center gap-6">
            <ul className="hidden sm:flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/profile"
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              {user.email}
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="font-label-caps text-label-caps px-4 py-2 rounded-full border border-outline-variant hover:bg-surface-container transition-colors"
              >
                Sign out
              </button>
            </form>
          </nav>
        ) : (
          <nav className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="font-label-caps text-label-caps px-4 py-2 rounded-full text-primary hover:bg-surface-container transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="font-label-caps text-label-caps px-5 py-2 rounded-full bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors"
            >
              Get started
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
