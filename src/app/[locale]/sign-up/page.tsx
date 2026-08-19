import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { SignUpForm } from "@/components/sign-up-form";

export default async function SignUpPage({
  params,
}: PageProps<"/[locale]/sign-up">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="max-w-sm space-y-2">
        <h1 className="font-headline-md text-headline-md text-primary">
          Create your account
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          A couple of minutes to set up your profile, then see every
          programme scored against it.
        </p>
      </div>

      <SignUpForm />

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}