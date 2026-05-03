import { useAuth } from "@clerk/react";

// Accessibility test mode: set `window.__E2E_A11Y__ = true` (Playwright does
// this via addInitScript) to render protected shells without a real Clerk
// session so the axe matrix can scan dashboard/admin/etc deterministically.
function isA11yBypass(): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window === "undefined") return false;
  return (window as unknown as { __E2E_A11Y__?: boolean }).__E2E_A11Y__ === true;
}

function SignedInReal({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded || !isSignedIn) return null;
  return <>{children}</>;
}

function SignedOutReal({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded || isSignedIn) return null;
  return <>{children}</>;
}

export function SignedIn({ children }: { children: React.ReactNode }) {
  if (isA11yBypass()) return <>{children}</>;
  return <SignedInReal>{children}</SignedInReal>;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  if (isA11yBypass()) return null;
  return <SignedOutReal>{children}</SignedOutReal>;
}
