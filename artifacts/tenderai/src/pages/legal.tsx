import Footer from "@/components/Footer";
import { Link } from "wouter";
import { Sparkles } from "lucide-react";

type Section = { heading: string; body: string };

function LegalPage({
  title,
  lastUpdated,
  intro,
  sections,
  testId,
}: {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: Section[];
  testId: string;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <a href="#legal-main" className="skip-link">
        Skip to main content
      </a>
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div
              className="h-8 w-8 rounded-md bg-primary flex items-center justify-center"
              aria-hidden="true"
            >
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">TenderAI</span>
          </Link>
        </div>
      </header>
      <main
        id="legal-main"
        tabIndex={-1}
        className="flex-1 focus:outline-none"
        data-testid={testId}
      >
        <article className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
          <p className="mt-6 text-base">{intro}</p>
          <p className="mt-4 text-sm text-muted-foreground italic">
            This is placeholder content and has not been reviewed by legal
            counsel. Final language is required before public release.
          </p>
          <div className="mt-8 space-y-8">
            {sections.map((s) => (
              <section key={s.heading}>
                <h2 className="text-xl font-semibold tracking-tight">
                  {s.heading}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}

export function TermsPage() {
  return (
    <LegalPage
      testId="page-terms"
      title="Terms & Conditions"
      lastUpdated="May 1, 2026"
      intro="These Terms govern your access to and use of TenderAI. By using the service you agree to these Terms."
      sections={[
        { heading: "Use of the service", body: "Placeholder description of the permitted uses of TenderAI and account responsibilities." },
        { heading: "Your content", body: "Placeholder description of ownership and licence of tender documents and other content you upload." },
        { heading: "Subscriptions and billing", body: "Placeholder description of plans, billing cycles, and cancellation." },
        { heading: "Disclaimers and limitation of liability", body: "Placeholder description of warranties, disclaimers, and the limits of our liability." },
        { heading: "Changes to these Terms", body: "Placeholder description of how and when we may update these Terms." },
        { heading: "Contact", body: "Questions about these Terms can be sent to legal@tenderai.example." },
      ]}
    />
  );
}

export function PrivacyPage() {
  return (
    <LegalPage
      testId="page-privacy"
      title="Privacy Policy"
      lastUpdated="May 1, 2026"
      intro="This Privacy Policy explains what information TenderAI collects, how we use it, and the choices you have."
      sections={[
        { heading: "Information we collect", body: "Placeholder description of account, usage, and uploaded document data we process." },
        { heading: "How we use information", body: "Placeholder description of how data is used to provide and improve the service." },
        { heading: "Sharing and processors", body: "Placeholder description of third-party processors (e.g. authentication, hosting, AI models)." },
        { heading: "Data retention", body: "Placeholder description of how long different categories of data are retained." },
        { heading: "Your rights", body: "Placeholder description of your rights to access, correct, export, and delete your data." },
        { heading: "Contact", body: "Privacy questions or requests can be sent to privacy@tenderai.example." },
      ]}
    />
  );
}

export function AccessibilityPage() {
  return (
    <LegalPage
      testId="page-accessibility"
      title="Accessibility Statement"
      lastUpdated="May 1, 2026"
      intro="TenderAI is committed to making our product usable by everyone, including people who rely on assistive technologies."
      sections={[
        { heading: "Our commitment", body: "We aim to conform to WCAG 2.1 Level AA across the TenderAI web application." },
        { heading: "What we do", body: "Placeholder description of our practices: semantic markup, keyboard support, focus management, colour contrast, and automated checks." },
        { heading: "Known limitations", body: "Placeholder description of any current known accessibility gaps and our plans to address them." },
        { heading: "Feedback", body: "If you encounter an accessibility barrier, please contact accessibility@tenderai.example so we can address it." },
      ]}
    />
  );
}
