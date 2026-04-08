import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, LayoutDashboard, CalendarDays, UserCircle } from "lucide-react";

export default function Navbar() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
          <GraduationCap className="h-7 w-7 text-primary" />
          ScholarHub
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/scholarships">
                <Button variant="ghost" size="sm">Browse Scholarships</Button>
              </Link>
              <Link to="/calendar">
                <Button variant="ghost" size="sm">
                  <CalendarDays className="mr-1 h-4 w-4" />
                  Calendar
                </Button>
              </Link>
              <Link to={userRole === "admin" ? "/admin" : "/dashboard"}>
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="mr-1 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost" size="sm">
                  <UserCircle className="mr-1 h-4 w-4" />
                  Profile
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-1 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/scholarships">
                <Button variant="ghost" size="sm">Scholarships</Button>
              </Link>
              <Link to="/calendar">
                <Button variant="ghost" size="sm">
                  <CalendarDays className="mr-1 h-4 w-4" />
                  Calendar
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm">Sign In</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
