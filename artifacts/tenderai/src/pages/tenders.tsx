import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";

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

export default function Tenders() {
  const [search, setSearch] = useState("");
  const { data: tenders = [], isLoading } = useQuery<Tender[]>({
    queryKey: ["tenders", search],
    queryFn: () =>
      api<Tender[]>(`/api/tenders${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenders</h1>
          <p className="text-muted-foreground">Track and respond to government tenders.</p>
        </div>
        <CreateTenderDialog />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tenders…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
      </div>

      {isLoading && <p>Loading…</p>}
      {!isLoading && tenders.length === 0 && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No tenders yet. Add one above.</CardContent></Card>
      )}

      <div className="grid gap-3">
        {tenders.map((t) => (
          <Link key={t.id} href={`/tenders/${t.id}`}>
            <Card className="hover:border-primary transition-colors cursor-pointer" data-testid={`tender-${t.id}`}>
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
                    {t.documentCount} document{t.documentCount === 1 ? "" : "s"} · {t.requirementCount} requirement{t.requirementCount === 1 ? "" : "s"}
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

function CreateTenderDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    agency: "",
    summary: "",
    category: "",
    closeDate: "",
  });
  const create = useMutation({
    mutationFn: (body: typeof form) =>
      api("/api/tenders", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenders"] });
      setOpen(false);
      setForm({ title: "", agency: "", summary: "", category: "", closeDate: "" });
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-new-tender"><Plus className="h-4 w-4 mr-2" /> New tender</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add tender</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-title" /></div>
          <div><Label>Agency</Label><Input value={form.agency} onChange={(e) => setForm({ ...form, agency: e.target.value })} data-testid="input-agency" /></div>
          <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div><Label>Close date</Label><Input type="date" value={form.closeDate} onChange={(e) => setForm({ ...form, closeDate: e.target.value })} /></div>
          <div><Label>Summary</Label><Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={4} /></div>
        </div>
        <DialogFooter>
          <Button
            disabled={!form.title || !form.agency || create.isPending}
            onClick={() => create.mutate(form)}
            data-testid="button-create-tender"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
