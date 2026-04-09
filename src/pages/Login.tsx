import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/feed");
    } catch (err: any) {
      toast.error("Anmeldung fehlgeschlagen: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const [resetSent, setResetSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Look up player_id by email from profiles
      // We need to find the user by email - query profiles won't have email,
      // so we insert a request after finding the user via a workaround:
      // Try to sign in with wrong password to check if user exists, or just
      // search profiles by name. Actually, we need a different approach.
      // Let's just create a request using the email to look up the auth user.
      // Since we can't query auth.users from client, we'll use a simple approach:
      // The player enters their email, we look up profiles to find a matching user.
      // But profiles don't store email. So we need to attempt a lookup differently.
      
      // Simplest: sign in attempt will fail but we can use the email to find the user
      // via an edge function or just let the player submit the request with their email
      // and the coach matches it manually.
      
      // For now: create a password_reset_requests entry. We need the player's user ID.
      // We'll try to get it by checking if there's a session or by matching email.
      // Since the player is NOT logged in, we can't use auth.uid().
      // 
      // Solution: Use a public-facing approach - store email in the request,
      // but our table only has player_id. Let's use a workaround:
      // Sign up won't work. Let's just show a message to contact the coach.
      
      // Actually the simplest working approach: the player is not authenticated,
      // so they can't insert into password_reset_requests (RLS requires auth).
      // Let's just show them a message to contact their coach directly.
      
      setResetSent(true);
      toast.success("Bitte wende dich an deinen Coach für ein neues Passwort.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {resetMode ? "Passwort zurücksetzen" : "Slama Jama Gröbenzell"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {resetMode ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Dein Coach kann dir ein neues temporäres Passwort erstellen. Bitte wende dich direkt an ihn.
              </p>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setResetMode(false)}
              >
                Zurück zur Anmeldung
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
                {loading ? "Wird angemeldet..." : "Anmelden"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => setResetMode(true)}
              >
                Passwort vergessen?
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
