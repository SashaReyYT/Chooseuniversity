import LegalPage from "@/components/legal-page";

export default async function TermsPage(props: PageProps<"/[locale]/terms">) {
  return <LegalPage {...props} kind="terms" />;
}