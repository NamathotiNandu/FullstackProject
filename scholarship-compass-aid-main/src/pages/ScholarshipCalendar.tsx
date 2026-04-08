import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, DollarSign, Building } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  differenceInDays,
  isPast,
} from "date-fns";

export default function ScholarshipCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: scholarships, isLoading } = useQuery({
    queryKey: ["scholarships-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scholarships")
        .select("*")
        .eq("status", "active")
        .not("deadline", "is", null)
        .order("deadline", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const deadlinesByDate = useMemo(() => {
    const map = new Map<string, typeof scholarships>();
    scholarships?.forEach(s => {
      if (s.deadline) {
        const key = format(new Date(s.deadline), "yyyy-MM-dd");
        const existing = map.get(key) ?? [];
        existing.push(s);
        map.set(key, existing);
      }
    });
    return map;
  }, [scholarships]);

  const selectedScholarships = selectedDate
    ? deadlinesByDate.get(format(selectedDate, "yyyy-MM-dd")) ?? []
    : [];

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    return scholarships
      ?.filter(s => s.deadline && new Date(s.deadline) >= now)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 5) ?? [];
  }, [scholarships]);

  const getDeadlineUrgency = (deadline: string) => {
    const days = differenceInDays(new Date(deadline), new Date());
    if (days < 0) return "past";
    if (days <= 3) return "urgent";
    if (days <= 7) return "soon";
    if (days <= 14) return "upcoming";
    return "normal";
  };

  const urgencyColors: Record<string, string> = {
    past: "bg-muted-foreground/20",
    urgent: "bg-destructive",
    soon: "bg-warning",
    upcoming: "bg-primary",
    normal: "bg-accent",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="mb-1 font-heading text-3xl font-bold">Scholarship Calendar</h1>
        <p className="mb-6 text-muted-foreground">Track upcoming deadlines and plan your applications.</p>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="font-heading text-xl">
                  {format(currentMonth, "MMMM yyyy")}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent>
                {/* Day headers */}
                <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d} className="py-2">{d}</div>
                  ))}
                </div>
                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                  {calendarDays.map(day => {
                    const key = format(day, "yyyy-MM-dd");
                    const deadlines = deadlinesByDate.get(key) ?? [];
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedDate(day)}
                        className={`relative flex min-h-[72px] flex-col items-center border border-border/50 p-1 text-sm transition-colors hover:bg-muted/50 ${
                          !isCurrentMonth ? "text-muted-foreground/40" : ""
                        } ${isToday(day) ? "bg-primary/5" : ""} ${
                          isSelected ? "ring-2 ring-primary ring-inset bg-primary/10" : ""
                        }`}
                      >
                        <span className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                          isToday(day) ? "bg-primary text-primary-foreground" : ""
                        }`}>
                          {format(day, "d")}
                        </span>
                        {deadlines.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-0.5">
                            {deadlines.slice(0, 3).map((s, i) => (
                              <div
                                key={i}
                                className={`h-1.5 w-1.5 rounded-full ${urgencyColors[getDeadlineUrgency(s.deadline!)]}`}
                              />
                            ))}
                            {deadlines.length > 3 && (
                              <span className="text-[9px] text-muted-foreground">+{deadlines.length - 3}</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {[
                    { color: "bg-destructive", label: "≤ 3 days" },
                    { color: "bg-warning", label: "≤ 7 days" },
                    { color: "bg-primary", label: "≤ 14 days" },
                    { color: "bg-accent", label: "> 14 days" },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${l.color}`} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selected day details */}
            {selectedDate && (
              <Card className="mt-4 shadow-card animate-fade-in">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-lg">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedScholarships.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No deadlines on this day.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedScholarships.map(s => {
                        const urgency = getDeadlineUrgency(s.deadline!);
                        return (
                          <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                            <div>
                              <p className="font-medium">{s.title}</p>
                              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Building className="h-3 w-3" />{s.provider}</span>
                                <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${s.amount.toLocaleString()}</span>
                              </div>
                            </div>
                            <Badge variant={urgency === "past" ? "secondary" : urgency === "urgent" ? "destructive" : "default"}>
                              {urgency === "past" ? "Expired" : urgency === "urgent" ? "Urgent" : s.category}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Upcoming deadlines sidebar */}
          <div>
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-heading text-lg">
                  <Clock className="h-5 w-5 text-warning" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  [1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)
                ) : upcomingDeadlines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>
                ) : (
                  upcomingDeadlines.map(s => {
                    const daysLeft = differenceInDays(new Date(s.deadline!), new Date());
                    const urgency = getDeadlineUrgency(s.deadline!);
                    return (
                      <div key={s.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium leading-tight">{s.title}</p>
                          <Badge
                            variant={urgency === "urgent" ? "destructive" : urgency === "soon" ? "outline" : "secondary"}
                            className="ml-2 shrink-0 text-[10px]"
                          >
                            {daysLeft === 0 ? "Today!" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d left`}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {format(new Date(s.deadline!), "MMM d, yyyy")} · ${s.amount.toLocaleString()}
                        </p>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
