import LegalPage from "@/components/legal-page";

export default async function PrivacyPage(props: PageProps<"/[locale]/privacy">) {
  return <LegalPage {...props} kind="privacy" />;
}