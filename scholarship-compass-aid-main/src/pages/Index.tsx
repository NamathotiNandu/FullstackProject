import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Search, FileText, TrendingUp, ArrowRight, DollarSign, Users, Award } from "lucide-react";
import Navbar from "@/components/Navbar";

const stats = [
  { icon: DollarSign, label: "Total Aid Available", value: "$2.5M+" },
  { icon: Users, label: "Active Students", value: "1,200+" },
  { icon: Award, label: "Scholarships Listed", value: "350+" },
];

const features = [
  { icon: Search, title: "Discover Scholarships", desc: "Search and filter thousands of scholarships matching your profile and interests." },
  { icon: FileText, title: "Easy Applications", desc: "Apply directly through the platform with a streamlined application process." },
  { icon: TrendingUp, title: "Track Progress", desc: "Monitor all your applications in real-time with status updates and deadlines." },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(217,91%,60%,0.15),transparent_60%)]" />
        <div className="container relative z-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
            Fund Your Future
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/70">
            Discover scholarships, apply with ease, and track your financial aid journey — all in one place.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/scholarships">
              <Button size="lg" className="gap-2 gradient-primary border-0 text-primary-foreground shadow-lg hover:opacity-90">
                Browse Scholarships <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card py-12">
        <div className="container grid grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map(s => (
            <div key={s.label} className="flex flex-col items-center text-center animate-fade-in">
              <s.icon className="mb-2 h-8 w-8 text-primary" />
              <p className="font-heading text-3xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <h2 className="mb-12 text-center font-heading text-3xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((f, i) => (
              <Card key={f.title} className="shadow-card border-border hover:shadow-elevated transition-shadow" style={{ animationDelay: `${i * 0.1}s` }}>
                <CardContent className="flex flex-col items-center p-8 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <f.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-2 font-heading text-xl font-semibold">{f.title}</h3>
                  <p className="text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-primary py-16">
        <div className="container text-center">
          <h2 className="font-heading text-3xl font-bold text-primary-foreground">Ready to Start?</h2>
          <p className="mx-auto mt-3 max-w-lg text-primary-foreground/80">
            Join thousands of students who have found funding for their education.
          </p>
          <Link to="/auth" className="mt-6 inline-block">
            <Button size="lg" variant="secondary" className="gap-2">
              Create Free Account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © 2026 ScholarHub. Helping students fund their future.
        </div>
      </footer>
    </div>
  );
}
