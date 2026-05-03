import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useUpload } from "@workspace/object-storage-web";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Download,
  Bookmark,
  BookmarkCheck,
  ListChecks,
  RefreshCw,
  CheckCircle2,
  Circle,
} from "lucide-react";

interface Doc {
  id: number;
  name: string;
  contentType: string;
  sizeBytes: number;
  pageCount: number | null;
  parseStatus: string;
  parseError: string | null;
  createdAt: string;
}
interface Req {
  id: number;
  category: string;
  text: string;
  section: string | null;
  mandatory: boolean;
}
interface ComplianceItem {
  requirement: string;
  status: "met" | "partial" | "gap";
  evidence: string;
  recommendation: string | null;
}
interface Compliance { id: number; score: number; summary: string | null; gaps: string[]; items: ComplianceItem[] }
interface RiskItem { clause: string; category: string; severity: "low" | "medium" | "high"; rationale: string; suggestion: string | null }
interface Risk { id: number; overallRisk: string; summary: string | null; items: RiskItem[] }
interface DraftSection { key: string; title: string; content: string }
interface Draft { id: number; sections: DraftSection[] }
interface Tender {
  id: number;
  title: string;
  agency: string;
  status: string;
  saved: boolean;
  summary: string | null;
  category: string | null;
  closeDate: string | null;
  matchScore: number | null;
  matchRationale: string | null;
  documents: Doc[];
  requirements: Req[];
  compliance: Compliance | null;
  risks: Risk | null;
  draft: Draft | null;
}
interface ChecklistItem {
  id: string;
  category: string;
  label: string;
  complete: boolean;
  detail?: string | null;
}

export default function TenderDetail({ id }: { id: number }) {
  const { data: tender, isLoading } = useQuery<Tender>({
    queryKey: ["tender", id],
    queryFn: () => api(`/api/tenders/${id}`),
  });

  const toggleSave = useMutation({
    mutationFn: () =>
      api(`/api/tenders/${id}/save`, {
        method: "PATCH",
        body: JSON.stringify({ saved: !tender?.saved }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender", id] });
      queryClient.invalidateQueries({ queryKey: ["tenders"] });
    },
  });

  if (isLoading || !tender) return <p>Loading…</p>;

  return (
    <div className="space-y-6">
      <Link href="/tenders">
        <Button variant="ghost" size="sm" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-1" /> All tenders
        </Button>
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-tender-title">
            {tender.title}
          </h1>
          <p className="text-muted-foreground">
            {tender.agency}
            {tender.category ? ` · ${tender.category}` : ""}
            {tender.closeDate ? ` · closes ${tender.closeDate}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={tender.saved ? "default" : "outline"}
            size="sm"
            onClick={() => toggleSave.mutate()}
            disabled={toggleSave.isPending}
            data-testid="button-save-tender"
          >
            {tender.saved ? (
              <><BookmarkCheck className="h-4 w-4 mr-2" /> Saved</>
            ) : (
              <><Bookmark className="h-4 w-4 mr-2" /> Save</>
            )}
          </Button>
          {tender.matchScore != null && (
            <Card className="px-5 py-3 text-center min-w-32">
              <div className="text-3xl font-bold">{tender.matchScore}%</div>
              <div className="text-xs text-muted-foreground">match</div>
            </Card>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
          <TabsTrigger value="requirements" data-testid="tab-requirements">Requirements</TabsTrigger>
          <TabsTrigger value="compliance" data-testid="tab-compliance">Compliance</TabsTrigger>
          <TabsTrigger value="risks" data-testid="tab-risks">Risks</TabsTrigger>
          <TabsTrigger value="draft" data-testid="tab-draft">Draft</TabsTrigger>
          <TabsTrigger value="checklist" data-testid="tab-checklist">Checklist</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{tender.summary || "No summary provided."}</p>
              {tender.matchRationale && (
                <p className="text-sm text-muted-foreground mt-3"><strong>Match:</strong> {tender.matchRationale}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4 mt-4">
          <DocumentsPanel tenderId={id} docs={tender.documents} />
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4 mt-4">
          <RequirementsPanel tenderId={id} reqs={tender.requirements} hasDocs={tender.documents.length > 0} />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4 mt-4">
          <CompliancePanel tenderId={id} comp={tender.compliance} hasReqs={tender.requirements.length > 0} />
        </TabsContent>

        <TabsContent value="risks" className="space-y-4 mt-4">
          <RisksPanel tenderId={id} risk={tender.risks} hasDocs={tender.documents.length > 0} />
        </TabsContent>

        <TabsContent value="draft" className="space-y-4 mt-4">
          <DraftPanel tenderId={id} draft={tender.draft} />
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4 mt-4">
          <ChecklistPanel tenderId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DocumentsPanel({ tenderId, docs }: { tenderId: number; docs: Doc[] }) {
  const upload = useUpload({
    onError: (e) => toast({ title: "Upload failed", description: e.message, variant: "destructive" }),
  });
  const attach = useMutation({
    mutationFn: (body: {
      name: string;
      contentType: string;
      sizeBytes: number;
      objectPath: string;
    }) =>
      api(`/api/tenders/${tenderId}/documents`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tender", tenderId] }),
  });
  const del = useMutation({
    mutationFn: (docId: number) =>
      api(`/api/tenders/${tenderId}/documents/${docId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tender", tenderId] }),
  });

  const handleFile = async (file: File) => {
    const res = await upload.uploadFile(file);
    if (!res) return;
    await attach.mutateAsync({
      name: file.name,
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      objectPath: res.objectPath,
    });
    toast({ title: "Document uploaded" });
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Tender documents</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <label className="block">
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            data-testid="input-file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <Button asChild variant="outline" disabled={upload.isUploading || attach.isPending}>
            <span><Upload className="h-4 w-4 mr-2" /> {upload.isUploading || attach.isPending ? "Processing…" : "Upload PDF or DOCX"}</span>
          </Button>
        </label>

        {docs.length === 0 && <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>}
        {docs.map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-md border border-card-border p-3">
            <div>
              <div className="font-medium text-sm">{d.name}</div>
              <div className="text-xs text-muted-foreground">
                {(d.sizeBytes / 1024).toFixed(0)} KB
                {d.pageCount ? ` · ${d.pageCount} pages` : ""} · {d.parseStatus}
                {d.parseError ? ` · ${d.parseError}` : ""}
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => del.mutate(d.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RequirementsPanel({ tenderId, reqs, hasDocs }: { tenderId: number; reqs: Req[]; hasDocs: boolean }) {
  const extract = useMutation({
    mutationFn: () => api(`/api/tenders/${tenderId}/extract-requirements`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender", tenderId] });
      toast({ title: "Requirements extracted" });
    },
  });
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Requirements</CardTitle>
        <Button size="sm" onClick={() => extract.mutate()} disabled={!hasDocs || extract.isPending} data-testid="button-extract">
          <Sparkles className="h-4 w-4 mr-2" /> {extract.isPending ? "Extracting…" : "Extract with AI"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {!hasDocs && <p className="text-sm text-muted-foreground">Upload tender documents first.</p>}
        {reqs.length === 0 && hasDocs && <p className="text-sm text-muted-foreground">No requirements extracted yet.</p>}
        {reqs.map((r) => (
          <div key={r.id} className="rounded-md border border-card-border p-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={r.mandatory ? "destructive" : "secondary"}>{r.category}</Badge>
              {r.mandatory && <Badge variant="outline">Mandatory</Badge>}
              {r.section && <span className="text-xs text-muted-foreground">{r.section}</span>}
            </div>
            <p className="text-sm">{r.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CompliancePanel({ tenderId, comp, hasReqs }: { tenderId: number; comp: Compliance | null; hasReqs: boolean }) {
  const run = useMutation({
    mutationFn: () => api(`/api/tenders/${tenderId}/compliance`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tender", tenderId] }),
  });
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Compliance & gap analysis</CardTitle>
        <Button size="sm" onClick={() => run.mutate()} disabled={!hasReqs || run.isPending} data-testid="button-compliance">
          <ShieldCheck className="h-4 w-4 mr-2" /> {run.isPending ? "Analysing…" : comp ? "Re-run" : "Run analysis"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasReqs && <p className="text-sm text-muted-foreground">Extract requirements first.</p>}
        {comp && (
          <>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold">{comp.score}%</div>
              <div className="text-sm text-muted-foreground">{comp.summary}</div>
            </div>
            {comp.gaps.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-1">Top gaps</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {comp.gaps.map((g) => <li key={g}>{g}</li>)}
                </ul>
              </div>
            )}
            <div className="space-y-2">
              {comp.items.map((it, i) => (
                <div key={i} className="rounded-md border border-card-border p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={it.status === "met" ? "default" : it.status === "partial" ? "secondary" : "destructive"}
                    >
                      {it.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{it.requirement}</p>
                  {it.evidence && <p className="text-xs text-muted-foreground mt-1"><strong>Evidence:</strong> {it.evidence}</p>}
                  {it.recommendation && <p className="text-xs text-muted-foreground"><strong>Recommendation:</strong> {it.recommendation}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RisksPanel({ tenderId, risk, hasDocs }: { tenderId: number; risk: Risk | null; hasDocs: boolean }) {
  const run = useMutation({
    mutationFn: () => api(`/api/tenders/${tenderId}/risks`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tender", tenderId] }),
  });
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Contract risk analysis</CardTitle>
        <Button size="sm" onClick={() => run.mutate()} disabled={!hasDocs || run.isPending} data-testid="button-risks">
          <AlertTriangle className="h-4 w-4 mr-2" /> {run.isPending ? "Analysing…" : risk ? "Re-run" : "Run analysis"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasDocs && <p className="text-sm text-muted-foreground">Upload tender documents first.</p>}
        {risk && (
          <>
            <div className="flex items-center gap-3">
              <Badge variant={risk.overallRisk === "high" ? "destructive" : risk.overallRisk === "medium" ? "secondary" : "default"}>
                {risk.overallRisk} risk
              </Badge>
              <span className="text-sm text-muted-foreground">{risk.summary}</span>
            </div>
            {risk.items.map((it, i) => (
              <div key={i} className="rounded-md border border-card-border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={it.severity === "high" ? "destructive" : it.severity === "medium" ? "secondary" : "default"}>
                    {it.severity}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{it.category}</span>
                </div>
                <p className="text-sm font-medium">{it.clause}</p>
                <p className="text-xs text-muted-foreground mt-1">{it.rationale}</p>
                {it.suggestion && <p className="text-xs text-muted-foreground"><strong>Suggestion:</strong> {it.suggestion}</p>}
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ChecklistPanel({ tenderId }: { tenderId: number }) {
  const { data, isLoading } = useQuery<{ items: ChecklistItem[] }>({
    queryKey: ["tender-checklist", tenderId],
    queryFn: () => api(`/api/tenders/${tenderId}/checklist`),
  });
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const items = data?.items ?? [];
  const done = items.filter((i) => i.complete).length;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ListChecks className="h-4 w-4" /> Submission checklist ({done}/{items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">No checklist items yet.</p>
        )}
        {items.map((it) => (
          <div key={it.id} className="flex items-start gap-3 py-1" data-testid={`checklist-${it.id}`}>
            {it.complete ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1">
              <div className="text-sm font-medium">{it.label}</div>
              {it.detail && <div className="text-xs text-muted-foreground">{it.detail}</div>}
            </div>
            <Badge variant="outline" className="text-xs">{it.category}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DraftPanel({ tenderId, draft }: { tenderId: number; draft: Draft | null }) {
  const [local, setLocal] = useState<DraftSection[] | null>(null);
  const regenSection = useMutation({
    mutationFn: (key: string) =>
      api(`/api/tenders/${tenderId}/draft/sections/${key}/regenerate`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender", tenderId] });
      setLocal(null);
      toast({ title: "Section regenerated" });
    },
  });
  const generate = useMutation({
    mutationFn: () => api(`/api/tenders/${tenderId}/draft`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender", tenderId] });
      toast({ title: "Draft generated" });
    },
  });
  const save = useMutation({
    mutationFn: (sections: DraftSection[]) =>
      api(`/api/tenders/${tenderId}/draft`, {
        method: "PATCH",
        body: JSON.stringify({ sections }),
      }),
    onSuccess: () => toast({ title: "Draft saved" }),
  });
  const sections = local ?? draft?.sections ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {draft ? "Edit sections below, then save or export." : "Generate a tailored response using your profile and the tender requirements."}
        </p>
        <div className="flex items-center gap-2">
          <Button onClick={() => generate.mutate()} disabled={generate.isPending} data-testid="button-generate-draft">
            <FileText className="h-4 w-4 mr-2" /> {generate.isPending ? "Generating…" : draft ? "Regenerate" : "Generate draft"}
          </Button>
          {draft && (
            <>
              <Button variant="outline" onClick={() => save.mutate(sections)} disabled={save.isPending}>Save</Button>
              <Button variant="outline" asChild>
                <a href={`/api/tenders/${tenderId}/draft/export?format=docx`} download data-testid="button-export-docx">
                  <Download className="h-4 w-4 mr-2" /> DOCX
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`/api/tenders/${tenderId}/draft/export?format=pdf`} download data-testid="button-export-pdf">
                  <Download className="h-4 w-4 mr-2" /> PDF
                </a>
              </Button>
            </>
          )}
        </div>
      </div>
      {sections.length === 0 && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No draft yet.</CardContent></Card>
      )}
      {sections.map((s, i) => (
        <Card key={s.key}>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{s.title}</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => regenSection.mutate(s.key)}
              disabled={regenSection.isPending}
              data-testid={`button-regen-${s.key}`}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Regenerate
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={8}
              value={s.content}
              onChange={(e) => {
                const next = [...sections];
                next[i] = { ...s, content: e.target.value };
                setLocal(next);
              }}
              data-testid={`textarea-section-${s.key}`}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
