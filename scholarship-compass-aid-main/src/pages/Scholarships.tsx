import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Search, DollarSign, Calendar, Building, SlidersHorizontal, X, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

export default function Scholarships() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [provider, setProvider] = useState("all");
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 100000]);
  const [deadlineFrom, setDeadlineFrom] = useState<Date | undefined>();
  const [deadlineTo, setDeadlineTo] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState("");

  const { data: scholarships, isLoading } = useQuery({
    queryKey: ["scholarships"],
    queryFn: async () => {
      const { data, error } = await supabase.from("scholarships").select("*").eq("status", "active").order("deadline", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const categories = useMemo(() => [...new Set(scholarships?.map(s => s.category) ?? [])], [scholarships]);
  const providers = useMemo(() => [...new Set(scholarships?.map(s => s.provider).filter(Boolean) ?? [])].sort(), [scholarships]);
  const maxAmount = useMemo(() => Math.max(...(scholarships?.map(s => s.amount) ?? [1000]), 1000), [scholarships]);

  const hasActiveFilters = provider !== "all" || amountRange[0] > 0 || amountRange[1] < maxAmount || deadlineFrom || deadlineTo;

  const clearFilters = () => {
    setProvider("all");
    setAmountRange([0, maxAmount]);
    setDeadlineFrom(undefined);
    setDeadlineTo(undefined);
    setCategory("all");
    setSearch("");
  };

  const filtered = useMemo(() => {
    return scholarships?.filter(s => {
      const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || s.provider.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "all" || s.category === category;
      const matchProvider = provider === "all" || s.provider === provider;
      const matchAmount = s.amount >= amountRange[0] && s.amount <= amountRange[1];
      const matchDeadlineFrom = !deadlineFrom || !s.deadline || !isBefore(startOfDay(new Date(s.deadline)), startOfDay(deadlineFrom));
      const matchDeadlineTo = !deadlineTo || !s.deadline || !isAfter(startOfDay(new Date(s.deadline)), startOfDay(deadlineTo));
      return matchSearch && matchCat && matchProvider && matchAmount && matchDeadlineFrom && matchDeadlineTo;
    });
  }, [scholarships, search, category, provider, amountRange, deadlineFrom, deadlineTo]);

  const handleApply = async (scholarshipId: string) => {
    if (!user) { toast.error("Please sign in to apply"); return; }
    try {
      const { error } = await supabase.from("applications").insert({
        user_id: user.id,
        scholarship_id: scholarshipId,
        cover_letter: coverLetter,
      });
      if (error) {
        if (error.code === "23505") toast.error("You've already applied to this scholarship");
        else throw error;
      } else {
        toast.success("Application submitted!");
        setApplyingTo(null);
        setCoverLetter("");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="mb-2 font-heading text-3xl font-bold">Scholarships</h1>
        <p className="mb-6 text-muted-foreground">Discover financial aid opportunities that match your profile.</p>

        {/* Search + Category Row */}
        <div className="mb-3 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by title or provider..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="default"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-xs font-bold text-primary">
                !
              </span>
            )}
          </Button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Card className="mb-6 animate-fade-in shadow-card">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-heading text-sm font-semibold">Advanced Filters</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs text-muted-foreground">
                    <X className="h-3 w-3" /> Clear all
                  </Button>
                )}
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Provider */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Provider</Label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Providers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      {providers.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount Range */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Amount Range: ${amountRange[0].toLocaleString()} – ${amountRange[1].toLocaleString()}
                  </Label>
                  <Slider
                    min={0}
                    max={maxAmount}
                    step={Math.max(100, Math.round(maxAmount / 100) * 10)}
                    value={amountRange}
                    onValueChange={(v) => setAmountRange(v as [number, number])}
                    className="py-2"
                  />
                </div>

                {/* Deadline From */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Deadline From</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !deadlineFrom && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadlineFrom ? format(deadlineFrom, "MMM d, yyyy") : "Any start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker
                        mode="single"
                        selected={deadlineFrom}
                        onSelect={setDeadlineFrom}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Deadline To */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Deadline To</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !deadlineTo && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadlineTo ? format(deadlineTo, "MMM d, yyyy") : "Any end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker
                        mode="single"
                        selected={deadlineTo}
                        onSelect={setDeadlineTo}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {filtered?.length ?? 0} scholarship{(filtered?.length ?? 0) !== 1 ? "s" : ""} found
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Card key={i} className="h-64 animate-pulse bg-muted" />)}
          </div>
        ) : filtered?.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <p>No scholarships found matching your criteria.</p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2 text-primary">Clear all filters</Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered?.map(s => (
              <Card key={s.id} className="shadow-card hover:shadow-elevated transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Badge variant="secondary" className="mb-2 text-xs">{s.category}</Badge>
                    <span className="font-heading text-lg font-bold text-primary">${s.amount.toLocaleString()}</span>
                  </div>
                  <CardTitle className="font-heading text-lg leading-tight">{s.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Building className="h-3 w-3" />{s.provider}</span>
                    {s.deadline && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(s.deadline), "MMM d, yyyy")}</span>}
                  </div>
                  <Dialog open={applyingTo === s.id} onOpenChange={open => { setApplyingTo(open ? s.id : null); if (!open) setCoverLetter(""); }}>
                    <DialogTrigger asChild>
                      <Button className="w-full" size="sm">{user ? "Apply Now" : "Sign In to Apply"}</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="font-heading">Apply: {s.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Amount: <strong>${s.amount.toLocaleString()}</strong></p>
                          {s.requirements && <p className="text-sm text-muted-foreground"><strong>Requirements:</strong> {s.requirements}</p>}
                        </div>
                        <Textarea placeholder="Write a brief cover letter..." value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={5} />
                        <Button className="w-full" onClick={() => handleApply(s.id)}>Submit Application</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
