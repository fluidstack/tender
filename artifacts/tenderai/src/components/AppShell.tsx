import { Link, useLocation } from "wouter";
import { UserButton } from "@clerk/react";
import {
  LayoutDashboard,
  FileSearch,
  Building2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tenders", label: "Tenders", icon: FileSearch },
  { href: "/profile", label: "Profile", icon: Building2 },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-60 border-r border-border bg-sidebar p-4 flex flex-col">
        <div className="flex items-center gap-2 px-2 py-3 mb-4">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="font-semibold tracking-tight">TenderAI</div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
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
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-4 flex items-center gap-2 px-2">
          <UserButton />
          <span className="text-xs text-muted-foreground">Account</span>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
