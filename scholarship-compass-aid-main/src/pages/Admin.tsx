import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Award, Users, FileText, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Admin() {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", provider: "", amount: "", deadline: "", category: "general", eligibility: "", requirements: "" });

  const { data: scholarships } = useQuery({
    queryKey: ["admin-scholarships"],
    enabled: userRole === "admin",
    queryFn: async () => {
      const { data, error } = await supabase.from("scholarships").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: applications } = useQuery({
    queryKey: ["admin-applications"],
    enabled: userRole === "admin",
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("*, scholarships(title), profiles:user_id(full_name, email)").order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createScholarship = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("scholarships").insert({
        title: form.title,
        description: form.description,
        provider: form.provider,
        amount: parseFloat(form.amount) || 0,
        deadline: form.deadline || null,
        category: form.category,
        eligibility: form.eligibility,
        requirements: form.requirements,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Scholarship created!");
      queryClient.invalidateQueries({ queryKey: ["admin-scholarships"] });
      setShowCreate(false);
      setForm({ title: "", description: "", provider: "", amount: "", deadline: "", category: "general", eligibility: "", requirements: "" });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateAppStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("applications").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (userRole !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-16 text-center">
          <h1 className="font-heading text-2xl font-bold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Scholarships", value: scholarships?.length ?? 0, icon: Award },
    { label: "Applications", value: applications?.length ?? 0, icon: FileText },
    { label: "Total Aid", value: `$${(scholarships?.reduce((s, sc) => s + (sc.amount ?? 0), 0) ?? 0).toLocaleString()}`, icon: DollarSign },
    { label: "Pending Review", value: applications?.filter(a => a.status === "pending").length ?? 0, icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage scholarships and applications</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" />Add Scholarship</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-heading">New Scholarship</DialogTitle></DialogHeader>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div><Label>Provider / Organization</Label><Input value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Amount ($)</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
                  <div><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} /></div>
                </div>
                <div><Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["general", "merit", "need-based", "athletic", "stem", "arts", "community"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
                <div><Label>Eligibility</Label><Textarea value={form.eligibility} onChange={e => setForm(f => ({ ...f, eligibility: e.target.value }))} rows={2} /></div>
                <div><Label>Requirements</Label><Textarea value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} rows={2} /></div>
                <Button className="w-full" onClick={() => createScholarship.mutate()} disabled={!form.title || createScholarship.isPending}>
                  {createScholarship.isPending ? "Creating..." : "Create Scholarship"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map(s => (
            <Card key={s.label} className="shadow-card">
              <CardContent className="flex items-center gap-3 p-4">
                <s.icon className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-heading text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="scholarships">
          <TabsList>
            <TabsTrigger value="scholarships">Scholarships</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="scholarships" className="mt-4 space-y-3">
            {scholarships?.map(s => (
              <Card key={s.id} className="shadow-card">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.provider} · ${s.amount.toLocaleString()} · {s.deadline ? format(new Date(s.deadline), "MMM d, yyyy") : "No deadline"}</p>
                  </div>
                  <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                </CardContent>
              </Card>
            ))}
            {scholarships?.length === 0 && <p className="py-8 text-center text-muted-foreground">No scholarships yet.</p>}
          </TabsContent>

          <TabsContent value="applications" className="mt-4 space-y-3">
            {applications?.map(app => (
              <Card key={app.id} className="shadow-card">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{(app as any).profiles?.full_name || "Student"}</p>
                    <p className="text-xs text-muted-foreground">
                      {(app as any).scholarships?.title} · {format(new Date(app.submitted_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Select value={app.status} onValueChange={v => updateAppStatus.mutate({ id: app.id, status: v })}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["pending", "under_review", "approved", "rejected"].map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ))}
            {applications?.length === 0 && <p className="py-8 text-center text-muted-foreground">No applications yet.</p>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
