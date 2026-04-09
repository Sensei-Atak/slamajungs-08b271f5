import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Utensils,
  ClipboardList,
  BarChart3,
  Settings,
  User,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  coachOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Feed", path: "/feed", icon: Utensils },
  { label: "Aufgaben", path: "/aufgaben", icon: ClipboardList },
  { label: "Statistiken", path: "/statistiken", icon: BarChart3 },
  { label: "Verwaltung", path: "/verwaltung", icon: Settings, coachOnly: true },
  { label: "Mein Profil", path: "/profil", icon: User },
];

export default function AppLayout() {
  const { isCoach, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingResets, setPendingResets] = useState(0);

  useEffect(() => {
    if (!isCoach) return;
    const fetchPending = async () => {
      const { count } = await supabase
        .from("password_reset_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      setPendingResets(count || 0);
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [isCoach]);

  const filteredItems = navItems.filter(
    (item) => !item.coachOnly || isCoach
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card transition-all duration-200",
          sidebarOpen ? "w-56" : "w-16"
        )}
      >
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="min-w-[44px] min-h-[44px]"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {sidebarOpen && (
            <span className="font-semibold text-sm truncate">Slama Jama</span>
          )}
        </div>
        <nav className="flex-1 flex flex-col gap-1 p-2">
          {filteredItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors min-h-[44px]",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span className="flex-1">{item.label}</span>}
                {item.path === "/verwaltung" && pendingResets > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-[20px] px-1 text-xs">
                    {pendingResets}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-2 border-t border-border">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent w-full min-h-[44px]"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Abmelden</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0">
        <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-card border-t border-border flex justify-around items-center h-16 z-50">
        {filteredItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 px-2 min-w-[44px] min-h-[44px] justify-center",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.path === "/verwaltung" && pendingResets > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[9px] rounded-full h-4 min-w-[16px] flex items-center justify-center px-0.5">
                    {pendingResets}
                  </span>
                )}
              </div>
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
