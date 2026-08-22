import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { SignInForm } from "@/components/sign-in-form";

export default async function SignInPage({
  params,
  searchParams,
}: PageProps<"/[locale]/sign-in"> & { searchParams?: Promise<Record<string, string | undefined>> }) {
  const { locale } = await params;
  const sp = await searchParams;
  const next = sp?.next ?? "/onboarding";

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("Auth");

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="max-w-sm space-y-2">
        <h1 className="font-headline-md text-headline-md text-primary">
          {t("signInTitle")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("signInDescription")}
        </p>
      </div>

      <SignInForm next={next} />

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {t("newHere")}{" "}
        <Link href={`/sign-up?next=${encodeURIComponent(next)}`} className="text-primary hover:underline">
          {t("createAccount")}
        </Link>
      </p>
    </main>
  );
}
