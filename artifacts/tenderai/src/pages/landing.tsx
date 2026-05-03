import { Link } from "wouter";
import { SignedIn, SignedOut } from "@/lib/clerk-helpers";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import {
  Sparkles,
  FileSearch,
  ShieldCheck,
  FileText,
  Gauge,
  AlertTriangle,
} from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "") || "";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#landing-main" className="skip-link">
        Skip to main content
      </a>
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-md bg-primary flex items-center justify-center"
              aria-hidden="true"
            >
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">TenderAI</span>
          </div>
          <nav aria-label="Account" className="flex items-center gap-2">
            <SignedOut>
              <Link href="/sign-in">
                <Button variant="ghost" data-testid="button-signin">Sign in</Button>
              </Link>
              <Link href="/sign-up">
                <Button data-testid="button-signup">Get started</Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button data-testid="button-dashboard">Open dashboard</Button>
              </Link>
            </SignedIn>
          </nav>
        </div>
      </header>

      <main id="landing-main" tabIndex={-1} className="focus:outline-none">
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-sm text-accent-foreground mb-6">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> AI-powered tender response platform
        </span>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Win more government tenders.
          <br />
          Without the all-nighters.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          TenderAI parses tender documents, extracts requirements, identifies
          compliance gaps and contract risks, and drafts persuasive responses —
          tailored to your business profile.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <SignedOut>
            <Link href="/sign-up">
              <Button size="lg" data-testid="button-cta">Start free</Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button size="lg">Go to dashboard</Button>
            </Link>
          </SignedIn>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-3 gap-6">
        {[
          {
            icon: FileSearch,
            title: "Tender intelligence",
            body: "Upload PDF or DOCX tender packs. We parse, extract every requirement, and score how well your business matches.",
          },
          {
            icon: ShieldCheck,
            title: "Compliance & gap analysis",
            body: "Automatically check your business profile against mandatory criteria. See exactly what to fix before bidding.",
          },
          {
            icon: AlertTriangle,
            title: "Contract risk review",
            body: "Spot risky clauses — liability caps, IP, termination, payment terms — with severity ratings and suggestions.",
          },
          {
            icon: FileText,
            title: "Drafted response",
            body: "Generate a tailored response in 9 sections — executive summary, methodology, past performance, and more.",
          },
          {
            icon: Gauge,
            title: "Ready dashboard",
            body: "Track open tenders, deadlines, draft progress, and submission readiness in one place.",
          },
          {
            icon: Sparkles,
            title: "Export anywhere",
            body: "Download polished Word or PDF documents you can edit, brand, and submit.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-card-border bg-card p-6 shadow-sm"
            data-testid={`feature-${f.title.toLowerCase().replace(/\s/g, "-")}`}
          >
            <f.icon className="h-6 w-6 text-primary" aria-hidden="true" />
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>
      </main>

      <Footer />
      {/* basePath used for build-aware static imports */}
      {void basePath}
    </div>
  );
}
