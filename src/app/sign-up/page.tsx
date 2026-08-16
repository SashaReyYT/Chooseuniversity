import Link from "next/link";
import { SignUpForm } from "@/components/sign-up-form";

export default function SignUpPage() {
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
