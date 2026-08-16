# i18n

Unifind supports exactly two UI languages in V1: English (`en`) and
Ukrainian (`uk`), via [next-intl](https://next-intl.dev). Locale is always
present in the URL (`/en/...`, `/uk/...`) — see `routing.ts` for why.

- `routing.ts` — supported locales, default locale, URL prefix strategy.
  The single source of truth; add a locale here (+ a matching
  `messages/<locale>.json`) to support a third language.
- `navigation.ts` — locale-aware `Link`/`redirect`/`useRouter`/
  `usePathname`. Use these instead of the `next/link` / `next/navigation`
  originals anywhere a link or redirect should carry the locale prefix.
- `request.ts` — resolves the active locale per-request and loads its
  messages; wired into `next.config.ts` via `createNextIntlPlugin`.

## Adding translatable content

1. Add the key to **both** `messages/en.json` and `messages/uk.json` —
   keep them in sync (nothing enforces this automatically yet; consider a
   CI check if the message files grow large).
2. In a Server Component: `const t = await getTranslations("Namespace")`.
   In a Client Component: `const t = useTranslations("Namespace")`.
3. Never hardcode user-facing strings in components — this includes
   validation messages, empty states, ARIA/`aria-label` text, and error
   messages, not just visible copy (see the product spec's i18n
   requirements).

Programme/university data (names, descriptions) is a separate concern
from UI strings — it's source data in whatever language it was published
in, not translated by this layer. If per-programme translated content is
ever needed, that's a schema change (e.g. a `programmes_i18n` table), not
something `messages/*.json` should attempt.

## Why `src/proxy.ts` looks the way it does

Next.js allows exactly one proxy/middleware file. `next-intl`'s
`createMiddleware` (locale detection/redirects) and the Supabase
anonymous-session bootstrap (see that file's comments) are both
middleware-shaped, so they're combined into one function rather than two
files fighting over the same export. The ordering there matters — read
the comment at the top of `src/proxy.ts` before changing it.
