import Link from "next/link";
import { SignInForm } from "@/components/sign-in-form";

export default function SignInPage() {
  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 space-y-8">
      <div className="max-w-sm space-y-2">
        <h1 className="font-headline-md text-headline-md text-primary">
          Sign in
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Welcome back — pick up where you left off.
        </p>
      </div>

      <SignInForm />

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        New to Unifind?{" "}
        <Link href="/sign-up" className="text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
