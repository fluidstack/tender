import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileSearch, Plus, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface Summary {
  totalTenders: number;
  openTenders: number;
  savedTenders: number;
  draftsInProgress: number;
  submitted: number;
  profileCompleteness: number;
  averageMatchScore: number;
  upcomingDeadlines: Array<{
    id: number;
    title: string;
    agency: string;
    closeDate: string | null;
    matchScore: number | null;
  }>;
  recentActivity: Array<{
    id: string;
    label: string;
    tenderId: number | null;
    createdAt: string;
  }>;
  statusBreakdown: Array<{ status: string; count: number }>;
}

export default function Dashboard() {
  const { data, isLoading } = useQuery<Summary>({
    queryKey: ["dashboard-summary"],
    queryFn: () => api<Summary>("/api/dashboard/summary"),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Your tender pipeline at a glance.
          </p>
        </div>
        <Link href="/tenders">
          <Button data-testid="button-add-tender">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" /> Add tender
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Open tenders" value={data.openTenders} />
        <StatCard label="Drafts in progress" value={data.draftsInProgress} />
        <StatCard label="Submitted" value={data.submitted} />
        <StatCard label="Avg match score" value={`${data.averageMatchScore}%`} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card data-testid="card-profile-completeness">
          <CardHeader>
            <CardTitle className="text-base">Profile completeness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold">{data.profileCompleteness}%</span>
            </div>
            <Progress value={data.profileCompleteness} />
            <Link href="/profile">
              <Button variant="link" className="px-0 mt-2">
                Improve profile <ArrowRight className="h-3 w-3 ml-1" aria-hidden="true" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Upcoming deadlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.upcomingDeadlines.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No upcoming deadlines.
              </p>
            )}
            {data.upcomingDeadlines.map((t) => (
              <Link key={t.id} href={`/tenders/${t.id}`}>
                <div className="flex items-center justify-between rounded-md border border-card-border p-3 hover:bg-accent cursor-pointer">
                  <div>
                    <div className="font-medium text-sm">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.agency}
                      {t.closeDate
                        ? ` · closes ${format(new Date(t.closeDate), "PP")}`
                        : ""}
                    </div>
                  </div>
                  {t.matchScore != null && (
                    <Badge variant="secondary">{t.matchScore}% match</Badge>
                  )}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSearch className="h-4 w-4" aria-hidden="true" /> Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 && (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          )}
          <ul className="space-y-2">
            {data.recentActivity.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between text-sm"
                data-testid="activity-row"
              >
                <span>{a.label}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(a.createdAt), "PPp")}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
