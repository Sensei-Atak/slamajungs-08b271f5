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
    if (!email) {
      toast.error("Bitte gib deine E-Mail ein");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-password-reset", {
        body: { email },
      });
      if (error) throw error;
      setResetSent(true);
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
            resetSent ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Anfrage gesendet! Dein Coach wurde benachrichtigt und wird dir ein neues temporäres Passwort geben.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => { setResetMode(false); setResetSent(false); }}
                >
                  Zurück zur Anmeldung
                </Button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Gib deine E-Mail-Adresse ein. Dein Coach erhält eine Anfrage und kann dir ein neues Passwort erstellen.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">E-Mail</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
                  {loading ? "Wird gesendet..." : "Anfrage senden"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setResetMode(false)}
                >
                  Zurück zur Anmeldung
                </Button>
              </form>
            )
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
