import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";

const Login = lazy(() => import("@/pages/Login"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Feed = lazy(() => import("@/pages/Feed"));
const Aufgaben = lazy(() => import("@/pages/Aufgaben"));
const Statistiken = lazy(() => import("@/pages/Statistiken"));
const LiveInput = lazy(() => import("@/pages/LiveInput"));
const GameSummary = lazy(() => import("@/pages/GameSummary"));
const PlayerStats = lazy(() => import("@/pages/PlayerStats"));
const Verwaltung = lazy(() => import("@/pages/Verwaltung"));
const Profil = lazy(() => import("@/pages/Profil"));
const ChangePassword = lazy(() => import("@/pages/ChangePassword"));
const NotFound = lazy(() => import("@/pages/NotFound"));

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
