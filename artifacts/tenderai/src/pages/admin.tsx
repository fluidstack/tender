import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetAuthMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const API = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "") + "/api";

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

interface AdminStats {
  userCount: number;
  profileCount: number;
  tenderCount: number;
  catalogueCount: number;
  latestRun: {
    id: number;
    mode: string;
    status: string;
    fetched: number;
    upserted: number;
    failed: number;
    finishedAt: string | null;
  } | null;
}

interface AdminUser {
  userId: string;
  companyName: string | null;
  industry: string | null;
  email: string | null;
  lastSignInAt: number | null;
  tenderCount: number;
  updatedAt: string;
}

interface AdminTender {
  id: number;
  userId: string;
  title: string;
  agency: string;
  status: string;
  category: string | null;
  createdAt: string;
}

interface AdminActivity {
  id: number;
  userId: string;
  kind: string;
  label: string;
  createdAt: string;
}

interface IngestionRun {
  id: number;
  sourceSystem: string;
  mode: string;
  status: string;
  fetched: number;
  upserted: number;
  failed: number;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
}

export default function AdminPage() {
  const { data: me, isLoading: meLoading } = useGetAuthMe();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState("overview");

  const stats = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminFetch<AdminStats>("/admin/stats"),
    enabled: !!me?.isAdmin,
  });
  const users = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminFetch<AdminUser[]>("/admin/users"),
    enabled: !!me?.isAdmin && tab === "users",
  });
  const tenders = useQuery({
    queryKey: ["admin", "tenders"],
    queryFn: () => adminFetch<AdminTender[]>("/admin/tenders"),
    enabled: !!me?.isAdmin && tab === "tenders",
  });
  const activity = useQuery({
    queryKey: ["admin", "activity"],
    queryFn: () => adminFetch<AdminActivity[]>("/admin/activity"),
    enabled: !!me?.isAdmin && tab === "activity",
  });
  const runs = useQuery({
    queryKey: ["admin", "runs"],
    queryFn: () => adminFetch<IngestionRun[]>("/admin/ingestion/runs"),
    enabled: !!me?.isAdmin && tab === "ingestion",
  });

  const triggerRun = useMutation({
    mutationFn: () =>
      adminFetch<IngestionRun>("/admin/ingestion/run", {
        method: "POST",
        body: JSON.stringify({ mode: "incremental" }),
      }),
    onSuccess: (r) => {
      toast({
        title: "Ingestion run completed",
        description: `Fetched ${r.fetched}, upserted ${r.upserted}, failed ${r.failed}`,
      });
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (err: Error) =>
      toast({
        title: "Ingestion failed",
        description: err.message,
        variant: "destructive",
      }),
  });

  useEffect(() => {
    document.title = "Admin · TenderAI";
  }, []);

  if (meLoading) return <div className="p-6">Loading…</div>;
  if (!me?.isAdmin)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your account does not have administrator privileges.
          </p>
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-6" data-testid="admin-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
          <p className="text-sm text-muted-foreground">
            Cross-account view of users, tenders, activity, and ingestion.
          </p>
        </div>
        <Badge variant="secondary">Administrator</Badge>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label="Admin sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="tenders">All tenders</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="ingestion">Ingestion</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          {stats.data ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Users with profile" value={stats.data.profileCount} />
              <StatCard label="Active tender owners" value={stats.data.userCount} />
              <StatCard label="User tenders" value={stats.data.tenderCount} />
              <StatCard label="Catalogue tenders" value={stats.data.catalogueCount} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading stats…</p>
          )}
          {stats.data?.latestRun && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Last ingestion run</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div>Mode: {stats.data.latestRun.mode}</div>
                <div>Status: {stats.data.latestRun.status}</div>
                <div>
                  Fetched {stats.data.latestRun.fetched}, upserted{" "}
                  {stats.data.latestRun.upserted}, failed{" "}
                  {stats.data.latestRun.failed}
                </div>
                {stats.data.latestRun.finishedAt && (
                  <div>
                    Finished:{" "}
                    {new Date(stats.data.latestRun.finishedAt).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All users</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                isLoading={users.isLoading}
                empty="No user profiles yet."
                columns={["Company", "Email", "Industry", "Tenders", "Last sign-in"]}
                rows={(users.data ?? []).map((u) => [
                  u.companyName ?? u.userId,
                  u.email ?? "—",
                  u.industry ?? "—",
                  String(u.tenderCount),
                  u.lastSignInAt
                    ? new Date(u.lastSignInAt).toLocaleString()
                    : "—",
                ])}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenders" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All tenders</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                isLoading={tenders.isLoading}
                empty="No tenders yet."
                columns={["Title", "Agency", "Owner", "Status", "Category", "Created"]}
                rows={(tenders.data ?? []).map((t) => [
                  t.title,
                  t.agency,
                  t.userId,
                  t.status,
                  t.category ?? "—",
                  new Date(t.createdAt).toLocaleString(),
                ])}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                isLoading={activity.isLoading}
                empty="No activity yet."
                columns={["When", "User", "Kind", "Label"]}
                rows={(activity.data ?? []).map((a) => [
                  new Date(a.createdAt).toLocaleString(),
                  a.userId,
                  a.kind,
                  a.label,
                ])}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ingestion" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Catalogue ingestion</CardTitle>
              <Button
                size="sm"
                onClick={() => triggerRun.mutate()}
                disabled={triggerRun.isPending}
                aria-busy={triggerRun.isPending}
                data-testid="run-incremental-button"
              >
                {triggerRun.isPending ? "Running…" : "Run incremental"}
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                isLoading={runs.isLoading}
                empty="No ingestion runs yet."
                columns={[
                  "When",
                  "Source",
                  "Mode",
                  "Status",
                  "Fetched",
                  "Upserted",
                  "Failed",
                ]}
                rows={(runs.data ?? []).map((r) => [
                  new Date(r.startedAt).toLocaleString(),
                  r.sourceSystem,
                  r.mode,
                  r.status,
                  String(r.fetched),
                  String(r.upserted),
                  String(r.failed),
                ])}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-2xl font-semibold">{value.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}

function DataTable({
  columns,
  rows,
  isLoading,
  empty,
}: {
  columns: string[];
  rows: string[][];
  isLoading: boolean;
  empty: string;
}) {
  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (rows.length === 0)
    return <div className="text-sm text-muted-foreground">{empty}</div>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((c) => (
            <TableHead key={c}>{c}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={i}>
            {r.map((cell, j) => (
              <TableCell key={j} className="text-sm">
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
