import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp } from "@clerk/react";
import { SignedIn, SignedOut } from "@/lib/clerk-helpers";
import { dark } from "@clerk/themes";
import { shadcn } from "@clerk/themes";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import TendersList from "@/pages/tenders";
import TenderDetail from "@/pages/tender-detail";
import AdminPage from "@/pages/admin";
import AppShell from "@/components/AppShell";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "") || "";

const publishableKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined,
);

const clerkAppearance = {
  baseTheme: shadcn,
  cssLayerName: "clerk",
};

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Redirect to="/sign-in" />
      </SignedOut>
    </>
  );
}

function CenteredAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      {children}
    </div>
  );
}

function Routes() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/sign-in" nest>
        <CenteredAuth>
          <SignIn
            routing="path"
            path={`${basePath}/sign-in`}
            signUpUrl={`${basePath}/sign-up`}
            fallbackRedirectUrl={`${basePath}/dashboard`}
          />
        </CenteredAuth>
      </Route>
      <Route path="/sign-up" nest>
        <CenteredAuth>
          <SignUp
            routing="path"
            path={`${basePath}/sign-up`}
            signInUrl={`${basePath}/sign-in`}
            fallbackRedirectUrl={`${basePath}/dashboard`}
          />
        </CenteredAuth>
      </Route>
      <Route path="/dashboard">
        <Protected>
          <AppShell><Dashboard /></AppShell>
        </Protected>
      </Route>
      <Route path="/profile">
        <Protected>
          <AppShell><Profile /></AppShell>
        </Protected>
      </Route>
      <Route path="/tenders">
        <Protected>
          <AppShell><TendersList /></AppShell>
        </Protected>
      </Route>
      <Route path="/admin">
        <Protected>
          <AppShell><AdminPage /></AppShell>
        </Protected>
      </Route>
      <Route path="/tenders/:id">
        {(params) => (
          <Protected>
            <AppShell><TenderDetail id={Number(params.id)} /></AppShell>
          </Protected>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  if (!publishableKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Authentication not configured</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set VITE_CLERK_PUBLISHABLE_KEY to enable sign-in.
          </p>
        </div>
      </div>
    );
  }
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      signInFallbackRedirectUrl={`${basePath}/dashboard`}
      signUpFallbackRedirectUrl={`${basePath}/dashboard`}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={basePath}>
            <Routes />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

// silence unused
void dark;
