import { useState, useEffect, useId, cloneElement, isValidElement, type ReactElement } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

interface Profile {
  id: number;
  companyName: string;
  legalName: string | null;
  abn: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  industry: string | null;
  capabilities: string | null;
  capabilityStatement: string | null;
  yearsTrading: number | null;
  employeeCount: number | null;
  annualRevenue: string | null;
  insuranceDetails: string | null;
  wHSStatement: string | null;
  qualityStatement: string | null;
  diversityStatement: string | null;
  sustainabilityStatement: string | null;
  completeness: number;
}

interface Staff { id: number; name: string; role: string; bio: string | null }
interface Past { id: number; projectName: string; client: string | null; sector: string | null; outcomes: string | null; year: number | null; value: string | null }
interface Cert { id: number; name: string; issuer: string | null; expiryDate: string | null }

export default function ProfilePage() {
  const { data: profile } = useQuery<Profile>({
    queryKey: ["profile"],
    queryFn: () => api("/api/profile"),
  });
  const [form, setForm] = useState<Partial<Profile>>({});
  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const update = useMutation({
    mutationFn: (body: Partial<Profile>) =>
      api<Profile>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast({ title: "Profile saved" });
    },
    onError: (err) => toast({ title: "Save failed", description: String(err), variant: "destructive" }),
  });

  if (!profile) return <div>Loading…</div>;

  const setNum = (k: "yearsTrading" | "employeeCount", v: string) =>
    setForm((f) => ({ ...f, [k]: v === "" ? null : Number(v) }));
  const setField = (k: keyof Profile, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business profile</h1>
          <p className="text-muted-foreground">
            The richer your profile, the better your tender matches and drafts.
          </p>
        </div>
        <Button
          onClick={() => update.mutate(form)}
          disabled={update.isPending}
          data-testid="button-save-profile"
        >
          Save profile
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Completeness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">{profile.completeness}%</div>
            <Progress value={profile.completeness} className="flex-1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Company details</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <Field
            label="Company name"
            required
            error={
              (form.companyName ?? "").trim() === ""
                ? "Company name is required"
                : undefined
            }
          >
            <Input
              value={form.companyName ?? ""}
              onChange={(e) => setField("companyName", e.target.value)}
              data-testid="input-companyName"
              required
            />
          </Field>
          <Field label="Legal name"><Input value={form.legalName ?? ""} onChange={(e) => setField("legalName", e.target.value)} /></Field>
          <Field label="ABN"><Input value={form.abn ?? ""} onChange={(e) => setField("abn", e.target.value)} /></Field>
          <Field label="Industry"><Input value={form.industry ?? ""} onChange={(e) => setField("industry", e.target.value)} data-testid="input-industry" /></Field>
          <Field label="Website"><Input value={form.website ?? ""} onChange={(e) => setField("website", e.target.value)} /></Field>
          <Field label="Email"><Input value={form.email ?? ""} onChange={(e) => setField("email", e.target.value)} /></Field>
          <Field label="Phone"><Input value={form.phone ?? ""} onChange={(e) => setField("phone", e.target.value)} /></Field>
          <Field label="Address"><Input value={form.address ?? ""} onChange={(e) => setField("address", e.target.value)} /></Field>
          <Field label="Years trading"><Input type="number" value={form.yearsTrading ?? ""} onChange={(e) => setNum("yearsTrading", e.target.value)} /></Field>
          <Field label="Employee count"><Input type="number" value={form.employeeCount ?? ""} onChange={(e) => setNum("employeeCount", e.target.value)} /></Field>
          <Field label="Annual revenue"><Input value={form.annualRevenue ?? ""} onChange={(e) => setField("annualRevenue", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Capabilities</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Capabilities (comma separated keywords)"><Textarea rows={2} value={form.capabilities ?? ""} onChange={(e) => setField("capabilities", e.target.value)} data-testid="input-capabilities" /></Field>
          <Field label="Capability statement"><Textarea rows={5} value={form.capabilityStatement ?? ""} onChange={(e) => setField("capabilityStatement", e.target.value)} data-testid="input-capabilityStatement" /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Compliance & policies</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Insurance details"><Textarea rows={3} value={form.insuranceDetails ?? ""} onChange={(e) => setField("insuranceDetails", e.target.value)} /></Field>
          <Field label="WHS statement"><Textarea rows={3} value={form.wHSStatement ?? ""} onChange={(e) => setField("wHSStatement", e.target.value)} /></Field>
          <Field label="Quality statement"><Textarea rows={3} value={form.qualityStatement ?? ""} onChange={(e) => setField("qualityStatement", e.target.value)} /></Field>
          <Field label="Diversity statement"><Textarea rows={3} value={form.diversityStatement ?? ""} onChange={(e) => setField("diversityStatement", e.target.value)} /></Field>
          <Field label="Sustainability statement"><Textarea rows={3} value={form.sustainabilityStatement ?? ""} onChange={(e) => setField("sustainabilityStatement", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <ListEditor
        title="Key staff"
        endpoint="/api/profile/staff"
        empty={{ name: "", role: "", bio: "" }}
        fields={[
          { key: "name", label: "Name" },
          { key: "role", label: "Role" },
          { key: "bio", label: "Bio", multiline: true },
        ]}
        render={(s: { id: number; name: string; role: string; bio: string | null }) => (
          <>
            <div className="font-medium">{s.name} <span className="text-muted-foreground font-normal">— {s.role}</span></div>
            {s.bio && <div className="text-sm text-muted-foreground">{s.bio}</div>}
          </>
        )}
      />

      <ListEditor
        title="Past performance"
        endpoint="/api/profile/past-performance"
        empty={{ projectName: "", client: "", sector: "", outcomes: "" }}
        fields={[
          { key: "projectName", label: "Project name" },
          { key: "client", label: "Client" },
          { key: "sector", label: "Sector" },
          { key: "outcomes", label: "Outcomes", multiline: true },
        ]}
        render={(p: { id: number; projectName: string; client: string | null; outcomes: string | null }) => (
          <>
            <div className="font-medium">{p.projectName} {p.client && <span className="text-muted-foreground font-normal">— {p.client}</span>}</div>
            {p.outcomes && <div className="text-sm text-muted-foreground">{p.outcomes}</div>}
          </>
        )}
      />

      <ListEditor
        title="Certifications"
        endpoint="/api/profile/certifications"
        empty={{ name: "", issuer: "" }}
        fields={[
          { key: "name", label: "Name" },
          { key: "issuer", label: "Issuer" },
        ]}
        render={(c: { id: number; name: string; issuer: string | null }) => (
          <>
            <Badge variant="secondary">{c.name}</Badge>{" "}
            {c.issuer && <span className="text-sm text-muted-foreground">{c.issuer}</span>}
          </>
        )}
      />
    </div>
  );
}

function Field({
  label,
  children,
  required,
  error,
}: {
  label: string;
  children: React.ReactNode;
  testid?: string;
  required?: boolean;
  error?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  // Wire htmlFor → input id so screen readers announce the label (WCAG 1.3.1, 3.3.2);
  // also propagate aria-required, aria-invalid and aria-describedby for required
  // controls so SC 3.3.1 / 3.3.2 / 4.1.2 are met without visual-only cues.
  const extra: Record<string, unknown> = { id };
  if (required) {
    extra["aria-required"] = true;
    if (error) {
      extra["aria-invalid"] = true;
      extra["aria-describedby"] = errorId;
    }
  }
  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, extra)
    : children;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="text-destructive ml-0.5">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </Label>
      {child}
      {required && error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function ListEditor<T extends { id: number }>(props: {
  title: string;
  endpoint: string;
  empty: Record<string, string>;
  fields: Array<{ key: string; label: string; multiline?: boolean }>;
  render: (row: T) => React.ReactNode;
}) {
  const { data: rows = [] } = useQuery<T[]>({
    queryKey: [props.endpoint],
    queryFn: () => api<T[]>(props.endpoint),
  });
  const [draft, setDraft] = useState<Record<string, string>>(props.empty);
  const create = useMutation({
    mutationFn: (body: Record<string, string>) =>
      api(props.endpoint, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [props.endpoint] });
      setDraft(props.empty);
      toast({ title: `Added ${props.title.toLowerCase()}` });
    },
  });
  const del = useMutation({
    mutationFn: (id: number) =>
      api(`${props.endpoint}/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [props.endpoint] }),
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{props.title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="flex items-start justify-between gap-3 rounded-md border border-card-border p-3">
            <div className="flex-1">{props.render(row)}</div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => del.mutate(row.id)}
              data-testid={`button-delete-${row.id}`}
              aria-label={`Delete ${props.title.toLowerCase()} entry`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        ))}
        <div className="rounded-md border border-dashed border-border p-3 space-y-2">
          {props.fields.map((f) =>
            f.multiline ? (
              <Textarea
                key={f.key}
                placeholder={f.label}
                aria-label={`${props.title} ${f.label}`}
                value={draft[f.key] ?? ""}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                rows={2}
              />
            ) : (
              <Input
                key={f.key}
                placeholder={f.label}
                aria-label={`${props.title} ${f.label}`}
                value={draft[f.key] ?? ""}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              />
            ),
          )}
          <Button
            size="sm"
            onClick={() => create.mutate(draft)}
            disabled={create.isPending}
          >
            <Plus className="h-3 w-3 mr-1" aria-hidden="true" /> Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
