import { useState, useId } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, Download } from "lucide-react";

interface Tender {
  id: number;
  title: string;
  agency: string;
  category: string | null;
  closeDate: string | null;
  status: string;
  saved: boolean;
  matchScore: number | null;
  documentCount: number;
  requirementCount: number;
}

interface CatalogueTender {
  id: number;
  sourceSystem: string;
  sourceTenderId: string;
  title: string;
  description: string | null;
  status: string;
  jurisdiction: string;
  category: string | null;
  location: string | null;
  estimatedValueMin: number | null;
  estimatedValueMax: number | null;
  currency: string | null;
  publishedAt: string | null;
  closingAt: string | null;
  buyerName: string | null;
}

interface CataloguePage {
  total: number;
  limit: number;
  offset: number;
  items: CatalogueTender[];
}

export default function Tenders() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tenders</h1>
        <p className="text-muted-foreground">
          Browse the live AusTender catalogue and track tenders in your workspace.
        </p>
      </div>

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine" data-testid="tab-mine">My tenders</TabsTrigger>
          <TabsTrigger value="catalogue" data-testid="tab-catalogue">
            Browse catalogue
          </TabsTrigger>
        </TabsList>
        <TabsContent value="mine" className="mt-4">
          <MyTendersTab />
        </TabsContent>
        <TabsContent value="catalogue" className="mt-4">
          <CatalogueTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MyTendersTab() {
  const [search, setSearch] = useState("");
  const { data: tenders = [], isLoading } = useQuery<Tender[]>({
    queryKey: ["tenders", search],
    queryFn: () =>
      api<Tender[]>(
        `/api/tenders${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      ),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Label htmlFor="my-tenders-search" className="sr-only">
            Search my tenders
          </Label>
          <Input
            id="my-tenders-search"
            type="search"
            placeholder="Search tenders…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <CreateTenderDialog />
      </div>

      {isLoading && <p>Loading…</p>}
      {!isLoading && tenders.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No tenders yet. Browse the catalogue to import one.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {tenders.map((t) => (
          <Link key={t.id} href={`/tenders/${t.id}`}>
            <Card
              className="hover:border-primary transition-colors cursor-pointer"
              data-testid={`tender-${t.id}`}
            >
              <CardContent className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{t.title}</h3>
                    <Badge variant="outline">{t.status}</Badge>
                    {t.saved && <Badge variant="secondary">Saved</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t.agency}
                    {t.category ? ` · ${t.category}` : ""}
                    {t.closeDate ? ` · closes ${t.closeDate}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t.documentCount} document{t.documentCount === 1 ? "" : "s"} ·{" "}
                    {t.requirementCount} requirement
                    {t.requirementCount === 1 ? "" : "s"}
                  </div>
                </div>
                {t.matchScore != null && (
                  <div className="text-right">
                    <div className="text-2xl font-bold">{t.matchScore}%</div>
                    <div className="text-xs text-muted-foreground">match</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CatalogueTab() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();
  const { data, isLoading } = useQuery<CataloguePage>({
    queryKey: ["catalogue", search],
    queryFn: () =>
      api<CataloguePage>(
        `/api/catalogue/tenders${
          search ? `?search=${encodeURIComponent(search)}` : ""
        }`,
      ),
  });

  const importMut = useMutation({
    mutationFn: (sourceTenderId: number) =>
      api<{ id: number }>("/api/tenders/import", {
        method: "POST",
        body: JSON.stringify({ sourceTenderId }),
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["tenders"] });
      navigate(`/tenders/${created.id}`);
    },
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Label htmlFor="catalogue-search" className="sr-only">
            Search the catalogue
          </Label>
          <Input
            id="catalogue-search"
            type="search"
            placeholder="Search the catalogue…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-catalogue-search"
          />
        </div>
        <div className="text-sm text-muted-foreground" aria-live="polite">
          {data ? `${data.total.toLocaleString()} tenders` : ""}
        </div>
      </div>

      {isLoading && <p>Loading catalogue…</p>}
      {!isLoading && items.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            The catalogue is empty. Run an ingestion to pull AusTender data.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {items.map((t) => (
          <Card key={t.id} data-testid={`catalogue-${t.id}`}>
            <CardContent className="p-5 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{t.title}</h3>
                  <Badge variant="outline">{t.status}</Badge>
                  <Badge variant="secondary">{t.jurisdiction}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {t.buyerName ?? "Unknown buyer"}
                  {t.category ? ` · ${t.category}` : ""}
                  {t.location ? ` · ${t.location}` : ""}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t.publishedAt
                    ? `Published ${new Date(t.publishedAt).toLocaleDateString()}`
                    : ""}
                  {t.closingAt
                    ? ` · closes ${new Date(t.closingAt).toLocaleDateString()}`
                    : ""}
                  {t.estimatedValueMax
                    ? ` · up to ${t.currency ?? "AUD"} ${t.estimatedValueMax.toLocaleString()}`
                    : ""}
                </div>
                {t.description && (
                  <p className="text-sm mt-2 line-clamp-2 text-muted-foreground">
                    {t.description}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => importMut.mutate(t.id)}
                disabled={importMut.isPending}
                aria-label={`Import ${t.title} into your workspace`}
                data-testid={`button-import-${t.id}`}
              >
                <Download className="h-4 w-4 mr-2" aria-hidden="true" /> Import
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CreateTenderDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    agency: "",
    summary: "",
    category: "",
    closeDate: "",
  });
  const titleId = useId();
  const agencyId = useId();
  const categoryId = useId();
  const closeDateId = useId();
  const summaryId = useId();
  const create = useMutation({
    mutationFn: (body: typeof form) =>
      api("/api/tenders", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenders"] });
      setOpen(false);
      setForm({ title: "", agency: "", summary: "", category: "", closeDate: "" });
    },
  });
  const titleMissing = !form.title;
  const agencyMissing = !form.agency;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-new-tender">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" /> New tender
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add tender</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={titleId}>
              Title <span aria-hidden="true">*</span>
              <span className="sr-only"> (required)</span>
            </Label>
            <Input
              id={titleId}
              required
              aria-required="true"
              aria-invalid={titleMissing || undefined}
              aria-describedby={titleMissing ? `${titleId}-error` : undefined}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              data-testid="input-title"
            />
            {titleMissing && (
              <p
                id={`${titleId}-error`}
                role="alert"
                className="text-xs text-destructive"
              >
                Title is required.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={agencyId}>
              Agency <span aria-hidden="true">*</span>
              <span className="sr-only"> (required)</span>
            </Label>
            <Input
              id={agencyId}
              required
              aria-required="true"
              aria-invalid={agencyMissing || undefined}
              aria-describedby={agencyMissing ? `${agencyId}-error` : undefined}
              value={form.agency}
              onChange={(e) => setForm({ ...form, agency: e.target.value })}
              data-testid="input-agency"
            />
            {agencyMissing && (
              <p
                id={`${agencyId}-error`}
                role="alert"
                className="text-xs text-destructive"
              >
                Agency is required.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={categoryId}>Category</Label>
            <Input id={categoryId} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={closeDateId}>Close date</Label>
            <Input id={closeDateId} type="date" value={form.closeDate} onChange={(e) => setForm({ ...form, closeDate: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={summaryId}>Summary</Label>
            <Textarea id={summaryId} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={titleMissing || agencyMissing || create.isPending}
            aria-busy={create.isPending}
            onClick={() => create.mutate(form)}
            data-testid="button-create-tender"
          >
            {create.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
