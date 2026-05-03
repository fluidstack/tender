import { Link } from "wouter";

const LINKS = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/accessibility", label: "Accessibility Statement" },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      aria-label="Site footer"
      className="border-t border-border bg-background text-xs text-muted-foreground"
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p data-testid="footer-copyright">© {year} TenderAI</p>
        <nav aria-label="Legal" className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid={`footer-link-${l.href.slice(1)}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
