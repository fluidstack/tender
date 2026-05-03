import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 w-full flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
              <h1 className="text-2xl font-bold">404 — Page not found</h1>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              The page you’re looking for doesn’t exist or has moved.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
