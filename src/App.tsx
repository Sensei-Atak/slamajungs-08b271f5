import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import Feed from "@/pages/Feed";
import Aufgaben from "@/pages/Aufgaben";
import Statistiken from "@/pages/Statistiken";
import LiveInput from "@/pages/LiveInput";
import GameSummary from "@/pages/GameSummary";
import PlayerStats from "@/pages/PlayerStats";
import Verwaltung from "@/pages/Verwaltung";
import Profil from "@/pages/Profil";
import ChangePassword from "@/pages/ChangePassword";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Laden...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.must_change_password) return <Navigate to="/change-password" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/feed" replace />;
  return <>{children}</>;
}

function ChangePasswordRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <ChangePassword />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/change-password" element={<ChangePasswordRoute />} />
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/feed" element={<Feed />} />
              <Route path="/aufgaben" element={<Aufgaben />} />
              <Route path="/statistiken" element={<Statistiken />} />
              <Route path="/statistiken/live" element={<LiveInput />} />
              <Route path="/statistiken/live/:gameId" element={<LiveInput />} />
              <Route path="/statistiken/spiel/:gameId" element={<GameSummary />} />
              <Route path="/statistiken/spieler/:playerId" element={<PlayerStats />} />
              <Route path="/verwaltung" element={<Verwaltung />} />
              <Route path="/profil" element={<Profil />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
