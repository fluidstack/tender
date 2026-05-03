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
          <div className="mt-8 space-y-8">
            {sections.map((s) => (
              <section key={s.heading}>
                <h2 className="text-xl font-semibold tracking-tight">
                  {s.heading}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{s.body}</p>
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
      lastUpdated="May 3, 2026"
      intro="These Terms & Conditions (the “Terms”) form a binding agreement between you (“you” or “Customer”) and TenderAI Ltd (“TenderAI”, “we”, “us”) and govern your access to and use of the TenderAI platform, websites, APIs, and related services (the “Service”). By creating an account, clicking to accept, or otherwise using the Service, you confirm that you have read, understood, and agree to be bound by these Terms."
      sections={[
        {
          heading: "Eligibility and accounts",
          body: "You must be at least 18 years old and able to enter into a binding contract to use the Service. When you register, you agree to provide accurate information, keep your credentials confidential, and remain responsible for all activity under your account. You must notify us promptly at security@tenderai.example of any suspected unauthorised access. We may suspend or terminate accounts that violate these Terms or pose a risk to the Service or other users.",
        },
        {
          heading: "Use of the service",
          body: "Subject to these Terms and payment of any applicable fees, we grant you a limited, non-exclusive, non-transferable, revocable right to access and use the Service for your internal business purposes. You agree not to: (a) reverse engineer, decompile, or attempt to extract the source code of the Service; (b) use the Service to build a competing product or to train competing AI models; (c) upload content that is unlawful, infringing, malicious, or that you are not authorised to share; (d) attempt to gain unauthorised access to the Service or other accounts; or (e) use the Service in violation of applicable export controls, sanctions, or other laws.",
        },
        {
          heading: "Your content",
          body: "You retain all rights, title, and interest in the tenders, documents, prompts, and other materials you submit to the Service (“Customer Content”). You grant TenderAI a worldwide, royalty-free licence to host, copy, transmit, display, and process Customer Content solely as needed to operate, secure, and improve the Service for you, and to comply with law. We do not use Customer Content to train foundation models for other customers. You are responsible for ensuring you have the rights and any necessary consents to submit Customer Content to the Service.",
        },
        {
          heading: "AI outputs and accuracy",
          body: "The Service uses large language models and other AI techniques to generate summaries, drafts, and recommendations (“Outputs”). Outputs may be inaccurate, incomplete, or unsuitable for a particular purpose and must not be relied on as legal, financial, or professional advice. You are solely responsible for reviewing Outputs before relying on them or submitting them to a third party (including in any tender response) and for ensuring compliance with applicable procurement rules.",
        },
        {
          heading: "Subscriptions, fees, and taxes",
          body: "Paid plans renew automatically for successive terms (monthly or annual, as selected) at the then-current price unless cancelled before the renewal date through your account settings. Fees are stated exclusive of VAT and other applicable taxes, which you are responsible for paying. Except where required by law, fees are non-refundable. We may change prices for future renewal terms with at least 30 days’ prior notice.",
        },
        {
          heading: "Confidentiality",
          body: "Each party agrees to protect the other party’s confidential information using at least the same degree of care it uses for its own confidential information (and no less than a reasonable standard of care), and to use it only to exercise rights and perform obligations under these Terms. These obligations do not apply to information that is or becomes public through no fault of the receiving party, was lawfully known prior to disclosure, or is independently developed without use of the disclosing party’s confidential information.",
        },
        {
          heading: "Disclaimers",
          body: "Except as expressly stated in these Terms and to the maximum extent permitted by law, the Service is provided “as is” and “as available”, without warranties of any kind, whether express, implied, statutory, or otherwise, including any warranties of merchantability, fitness for a particular purpose, non-infringement, or that the Service will be uninterrupted, secure, or error-free.",
        },
        {
          heading: "Limitation of liability",
          body: "To the maximum extent permitted by law, neither party will be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, revenue, goodwill, or data, even if advised of the possibility of such damages. Each party’s total aggregate liability arising out of or related to these Terms will not exceed the fees paid or payable by you to TenderAI in the 12 months immediately preceding the event giving rise to the liability. Nothing in these Terms limits liability that cannot be limited by law.",
        },
        {
          heading: "Term and termination",
          body: "These Terms apply for as long as you use the Service. Either party may terminate for material breach if the breach is not cured within 30 days of written notice. On termination, your right to access the Service ends and we may delete Customer Content after a reasonable wind-down period as described in the Privacy Policy. Sections that by their nature should survive termination (including those on Your Content, Confidentiality, Disclaimers, Limitation of Liability, and Governing Law) will survive.",
        },
        {
          heading: "Changes to these Terms",
          body: "We may update these Terms from time to time. If we make material changes, we will provide reasonable advance notice (for example, by email or in-product notification) before the changes take effect. Your continued use of the Service after the effective date constitutes acceptance of the updated Terms. If you do not agree, you may stop using the Service and cancel your subscription.",
        },
        {
          heading: "Governing law and disputes",
          body: "These Terms are governed by the laws of England and Wales, without regard to its conflict of laws principles. The parties submit to the exclusive jurisdiction of the courts of England and Wales for any dispute arising out of or relating to these Terms, except that either party may seek injunctive relief in any court of competent jurisdiction to protect its intellectual property or confidential information.",
        },
        {
          heading: "Contact",
          body: "Questions about these Terms can be sent to legal@tenderai.example.",
        },
      ]}
    />
  );
}

export function PrivacyPage() {
  return (
    <LegalPage
      testId="page-privacy"
      title="Privacy Policy"
      lastUpdated="May 3, 2026"
      intro="This Privacy Policy explains how TenderAI Ltd (“TenderAI”, “we”) collects, uses, shares, and protects personal data when you use our platform, websites, and related services (the “Service”). It applies to visitors, account holders, and authorised users of customer accounts. For most uses of the Service, our customer (typically your employer) is the controller of personal data contained in uploaded tender documents and we act as the processor on their behalf."
      sections={[
        {
          heading: "Information we collect",
          body: "Account information: name, work email, organisation, role, and authentication identifiers.\nUsage information: pages viewed, features used, log and device data, IP address, and approximate location, collected through cookies and similar technologies.\nCustomer Content: tender documents, prompts, and other materials you upload to the Service, together with any AI Outputs generated from them.\nBilling information: company details and limited payment metadata; full card data is handled by our payment processor and is not stored by TenderAI.\nSupport communications: messages, attachments, and metadata when you contact us.",
        },
        {
          heading: "How we use information",
          body: "We use personal data to: provide, secure, and operate the Service; authenticate users and prevent abuse; generate AI Outputs you request; provide customer support; bill paid plans; send service and security notifications; monitor and improve performance and reliability; and comply with legal obligations. Where we rely on consent (for example, optional marketing emails or non-essential cookies), you can withdraw it at any time.",
        },
        {
          heading: "Legal bases (UK/EU)",
          body: "We process personal data on the legal bases of: performance of a contract with you or your organisation; our legitimate interests in operating, securing, and improving the Service (balanced against your rights); compliance with legal obligations; and, where required, your consent.",
        },
        {
          heading: "AI processing",
          body: "Customer Content is processed to generate the Outputs you request. We do not use Customer Content to train foundation models for other customers. We use a small number of carefully vetted model providers as sub-processors; where they are used, they are contractually prohibited from using Customer Content to train their models.",
        },
        {
          heading: "Sharing and processors",
          body: "We share personal data with service providers that help us run the Service, including cloud hosting, authentication, analytics, error monitoring, customer support, payment processing, and AI model providers. Each is bound by a written data processing agreement and may only use personal data on our documented instructions. We may also share personal data when required by law, to enforce our agreements, to protect rights and safety, or in connection with a corporate transaction (e.g. merger or acquisition), in which case we will provide notice as required by law.",
        },
        {
          heading: "International transfers",
          body: "TenderAI is based in the United Kingdom. Where personal data is transferred outside the UK or EEA, we rely on appropriate safeguards such as the UK International Data Transfer Addendum, EU Standard Contractual Clauses, or equivalent mechanisms.",
        },
        {
          heading: "Data retention",
          body: "We retain account and billing information for as long as your account is active and for a reasonable period afterwards to meet legal, accounting, and dispute-resolution obligations. Customer Content is retained for the duration of your subscription and deleted within 30 days of account closure or earlier on documented request, except where retention is required by law. Backups are purged on a rolling 35-day cycle.",
        },
        {
          heading: "Security",
          body: "We use administrative, technical, and physical safeguards designed to protect personal data, including encryption in transit and at rest, role-based access controls, least-privilege production access, audit logging, and regular security reviews. No system is completely secure; please report any suspected vulnerability to security@tenderai.example.",
        },
        {
          heading: "Your rights",
          body: "Subject to applicable law, you may have the right to access, correct, delete, restrict, or object to processing of your personal data, to data portability, and to withdraw consent. Where TenderAI acts as a processor, we will direct requests to our customer (the controller). To exercise your rights, contact privacy@tenderai.example. You also have the right to lodge a complaint with your local supervisory authority (in the UK, the Information Commissioner’s Office at ico.org.uk).",
        },
        {
          heading: "Cookies",
          body: "We use strictly necessary cookies to operate the Service and, with your consent where required, analytics cookies to understand usage and improve performance. You can manage cookie preferences via your browser settings or any in-product cookie banner.",
        },
        {
          heading: "Children",
          body: "The Service is not directed to children under 16 and we do not knowingly collect personal data from them. If you believe a child has provided us with personal data, please contact us so we can delete it.",
        },
        {
          heading: "Changes to this Policy",
          body: "We may update this Policy from time to time. If we make material changes, we will provide reasonable advance notice before they take effect. The “Last updated” date above shows when this Policy was most recently revised.",
        },
        {
          heading: "Contact",
          body: "Privacy questions or requests can be sent to privacy@tenderai.example. Postal: TenderAI Ltd, Data Protection, 1 Finsbury Avenue, London EC2M 2PP, United Kingdom.",
        },
      ]}
    />
  );
}

export function AccessibilityPage() {
  return (
    <LegalPage
      testId="page-accessibility"
      title="Accessibility Statement"
      lastUpdated="May 3, 2026"
      intro="TenderAI is committed to making our product usable by everyone, including people who rely on assistive technologies. This statement describes the standards we follow, the steps we take, and how to give us feedback if something does not work for you."
      sections={[
        {
          heading: "Our commitment",
          body: "We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA across the TenderAI web application. We treat accessibility as part of our definition of done for new features and review existing screens on an ongoing basis.",
        },
        {
          heading: "What we do",
          body: "Our practices include: using semantic HTML and ARIA only where it adds value; supporting full keyboard navigation with visible focus indicators and skip links; meeting Level AA colour contrast for text and essential UI; respecting user preferences for reduced motion; providing accessible names for icons, controls, and form fields; testing with screen readers (NVDA, VoiceOver) on the most common browsers; and including automated accessibility checks in our development pipeline.",
        },
        {
          heading: "Compatibility",
          body: "TenderAI is designed to work with the latest two versions of Chrome, Edge, Firefox, and Safari, and with current versions of NVDA, JAWS, and VoiceOver. Older browsers and assistive technologies may have a degraded experience.",
        },
        {
          heading: "Known limitations",
          body: "We are aware of the following limitations and are actively working to address them: some complex data tables in the analytics views do not yet announce sort state changes; a small number of legacy icons lack high-contrast variants; and PDF exports generated by the Service are not always fully tagged for screen readers. We expect to resolve these in upcoming releases.",
        },
        {
          heading: "Assessment approach",
          body: "Our accessibility conformance is evaluated through a combination of internal review by our engineering and design teams, automated testing, and periodic third-party audits. The most recent internal review was completed in April 2026.",
        },
        {
          heading: "Feedback",
          body: "If you encounter an accessibility barrier, or if you need information from TenderAI in an alternative format, please contact accessibility@tenderai.example. We aim to acknowledge accessibility feedback within two business days and to provide a substantive response within ten business days.",
        },
        {
          heading: "Enforcement",
          body: "If you are not satisfied with our response, UK users may contact the Equality Advisory and Support Service (EASS). EU users may contact the supervisory body in their member state responsible for the implementation of the Web Accessibility Directive.",
        },
      ]}
    />
  );
}
