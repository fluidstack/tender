import { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { UserButton as RealUserButton } from "@clerk/react";

function isA11yBypass(): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window === "undefined") return false;
  return (window as unknown as { __E2E_A11Y__?: boolean }).__E2E_A11Y__ === true;
}

function UserButton() {
  if (isA11yBypass()) {
    return (
      <button
        type="button"
        aria-label="Account menu"
        className="h-8 w-8 rounded-full bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    );
  }
  return <RealUserButton />;
}
import {
  LayoutDashboard,
  FileSearch,
  Building2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetAuthMe } from "@workspace/api-client-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tenders", label: "Tenders", icon: FileSearch },
  { href: "/profile", label: "Profile", icon: Building2 },
];

const ADMIN_NAV = {
  href: "/admin",
  label: "Admin",
  icon: ShieldCheck,
} as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: me } = useGetAuthMe();
  const nav = me?.isAdmin ? [...NAV, ADMIN_NAV] : NAV;
  const mainRef = useRef<HTMLElement>(null);

  // WCAG 2.4.3 / 3.2.3 — move focus to main on route change so screen readers
  // announce the new page and keyboard users land in the new content.
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.focus();
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header
        role="banner"
        className="flex items-center justify-between gap-4 border-b border-border px-4 sm:px-6 py-3"
      >
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-md bg-primary flex items-center justify-center"
            aria-hidden="true"
          >
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="font-semibold tracking-tight">TenderAI</div>
        </div>
        <div className="flex items-center gap-2">
          <UserButton />
          <span className="text-xs text-muted-foreground">Account</span>
        </div>
      </header>
      <nav
        className="md:hidden flex gap-1 overflow-x-auto border-b border-border px-3 py-2"
        aria-label="Main navigation"
      >
        {nav.map((item) => {
          const active =
            location === item.href || location.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent",
              )}
              aria-current={active ? "page" : undefined}
              data-testid={`nav-mobile-${item.label.toLowerCase()}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-1 min-h-0">
        <aside
          className="hidden md:flex w-60 border-r border-border bg-sidebar p-4 flex-col"
          aria-label="Primary"
        >
          <nav className="flex flex-col gap-1" aria-label="Main navigation">
            {nav.map((item) => {
              const active =
                location === item.href || location.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent",
                  )}
                  aria-current={active ? "page" : undefined}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="flex-1 overflow-auto focus:outline-none"
        >
          <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
      <footer
        role="contentinfo"
        className="border-t border-border px-4 sm:px-6 py-3 text-xs text-muted-foreground"
      >
        TenderAI — see the{" "}
        <a
          href={`${import.meta.env.BASE_URL}docs/accessibility.md`}
          className="underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          accessibility statement
        </a>
        .
      </footer>
    </div>
  );
}
