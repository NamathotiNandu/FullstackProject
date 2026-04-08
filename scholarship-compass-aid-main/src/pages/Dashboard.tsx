import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, CalendarDays, Bell } from "lucide-react";
import { format, differenceInDays } from "date-fns";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  under_review: { label: "Under Review", variant: "outline", icon: AlertCircle },
  approved: { label: "Approved", variant: "default", icon: CheckCircle },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
  withdrawn: { label: "Withdrawn", variant: "secondary", icon: XCircle },
};

export default function Dashboard() {
  const { user } = useAuth();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["my-applications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, scholarships(*)")
        .eq("user_id", user!.id)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch upcoming deadlines for applied scholarships
  const upcomingDeadlines = applications
    ?.filter(a => {
      const s = (a as any).scholarships;
      return s?.deadline && new Date(s.deadline) >= new Date() && a.status !== "withdrawn" && a.status !== "rejected";
    })
    .map(a => ({
      ...a,
      daysLeft: differenceInDays(new Date((a as any).scholarships.deadline), new Date()),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5) ?? [];

  const counts = {
    total: applications?.length ?? 0,
    pending: applications?.filter(a => a.status === "pending").length ?? 0,
    approved: applications?.filter(a => a.status === "approved").length ?? 0,
    rejected: applications?.filter(a => a.status === "rejected").length ?? 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="mb-1 font-heading text-3xl font-bold">Student Dashboard</h1>
        <p className="mb-6 text-muted-foreground">Welcome back, {profile?.full_name || "Student"}!</p>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Total Applications", value: counts.total, icon: FileText, color: "text-primary" },
            { label: "Pending", value: counts.pending, icon: Clock, color: "text-warning" },
            { label: "Approved", value: counts.approved, icon: CheckCircle, color: "text-success" },
            { label: "Rejected", value: counts.rejected, icon: XCircle, color: "text-destructive" },
          ].map(s => (
            <Card key={s.label} className="shadow-card">
              <CardContent className="flex items-center gap-3 p-4">
                <s.icon className={`h-8 w-8 ${s.color}`} />
                <div>
                  <p className="font-heading text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Deadline Reminders */}
        {upcomingDeadlines.length > 0 && (
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-heading text-xl font-semibold">
                <Bell className="h-5 w-5 text-warning" />
                Deadline Reminders
              </h2>
              <Link to="/calendar">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  <CalendarDays className="h-4 w-4" /> View Calendar
                </Button>
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {upcomingDeadlines.map(app => {
                const scholarship = (app as any).scholarships;
                const isUrgent = app.daysLeft <= 3;
                const isSoon = app.daysLeft <= 7;
                return (
                  <Card
                    key={app.id}
                    className={`shadow-card transition-shadow hover:shadow-elevated ${
                      isUrgent ? "border-destructive/50 bg-destructive/5" : isSoon ? "border-warning/50 bg-warning/5" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium leading-tight">{scholarship?.title}</p>
                        <Badge
                          variant={isUrgent ? "destructive" : isSoon ? "outline" : "secondary"}
                          className="ml-2 shrink-0"
                        >
                          {app.daysLeft === 0 ? "Today!" : app.daysLeft === 1 ? "Tomorrow" : `${app.daysLeft}d left`}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Deadline: {format(new Date(scholarship?.deadline), "MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Amount: ${scholarship?.amount?.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Applications */}
        <h2 className="mb-4 font-heading text-xl font-semibold">My Applications</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Card key={i} className="h-20 animate-pulse bg-muted" />)}
          </div>
        ) : applications?.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p>No applications yet. Browse scholarships to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {applications?.map(app => {
              const cfg = statusConfig[app.status] ?? statusConfig.pending;
              const Icon = cfg.icon;
              return (
                <Card key={app.id} className="shadow-card hover:shadow-elevated transition-shadow">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{(app as any).scholarships?.title ?? "Scholarship"}</p>
                        <p className="text-xs text-muted-foreground">
                          Applied {format(new Date(app.submitted_at), "MMM d, yyyy")} · ${(app as any).scholarships?.amount?.toLocaleString() ?? "N/A"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
