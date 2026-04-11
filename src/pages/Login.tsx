import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

function normalizeForEmail(str: string): string {
  return str
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9.-]/g, "");
}

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let loginEmail = email;
      if (!email.includes("@")) {
        const { data, error } = await supabase.rpc("get_email_by_username", { p_username: email });
        if (error || !data) {
          toast.error("Benutzername nicht gefunden");
          setLoading(false);
          return;
        }
        loginEmail = data as string;
      }
      localStorage.setItem("rememberMe", rememberMe ? "true" : "false");
      await signIn(loginEmail, password);
      navigate("/feed");
    } catch (err: any) {
      toast.error("Anmeldung fehlgeschlagen: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Bitte Vor- und Nachname eingeben");
      return;
    }
    if (password.length < 6) {
      toast.error("Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwörter stimmen nicht überein");
      return;
    }
    if (!inviteCode.trim()) {
      toast.error("Bitte Team-Code eingeben");
      return;
    }
    setLoading(true);
    try {
      const { data: codeValid, error: codeError } = await supabase.rpc("verify_invite_code", { code: inviteCode.trim() });
      if (codeError || !codeValid) {
        toast.error("Ungültiger Team-Code");
        setLoading(false);
        return;
      }
      const generatedEmail = `${normalizeForEmail(firstName.trim())}.${normalizeForEmail(lastName.trim())}@sj.de`;
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const { error } = await supabase.auth.signUp({
        email: generatedEmail,
        password,
        options: { data: { name: fullName, role: "spieler" } },
      });
      if (error) {
        if (error.message.includes("already been registered") || error.message.includes("already registered")) {
          toast.error("Dieser Name ist bereits registriert. Bitte melde dich an.");
        } else {
          toast.error("Registrierung fehlgeschlagen: " + error.message);
        }
        return;
      }
      toast.success("Registrierung erfolgreich!");
      navigate("/feed");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Bitte gib deine E-Mail ein");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("request-password-reset", { body: { email } });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / Branding */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl gradient-primary mx-auto flex items-center justify-center shadow-lg">
            <span className="text-3xl">🏀</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Slama Jama</h1>
          <p className="text-sm text-muted-foreground">Gröbenzell</p>
        </div>

        <Card className="card-elevated border-border/60">
          <CardHeader className="pb-2 pt-6 px-6">
            <h2 className="text-lg font-semibold text-center">
              {mode === "reset" ? "Passwort zurücksetzen" : mode === "signup" ? "Registrieren" : "Willkommen zurück"}
            </h2>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {mode === "reset" ? (
              resetSent ? (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 mx-auto flex items-center justify-center">
                    <span className="text-2xl">✉️</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Anfrage gesendet! Dein Coach wurde benachrichtigt und wird dir ein neues temporäres Passwort geben.
                  </p>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => { setMode("login"); setResetSent(false); }}>
                    Zurück zur Anmeldung
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Gib deine E-Mail ein. Dein Coach kann dir ein neues Passwort erstellen.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">E-Mail</Label>
                    <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
                  </div>
                  <Button type="submit" className="w-full h-11 gradient-primary text-primary-foreground font-semibold" disabled={loading}>
                    {loading ? "Wird gesendet..." : "Anfrage senden"}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("login")}>
                    Zurück zur Anmeldung
                  </Button>
                </form>
              )
            ) : mode === "signup" ? (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Vorname</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nachname</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="h-11" />
                  </div>
                </div>
                {firstName.trim() && lastName.trim() && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                    Deine E-Mail: <span className="font-medium text-foreground">{normalizeForEmail(firstName.trim())}.{normalizeForEmail(lastName.trim())}@sj.de</span>
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Team-Code</Label>
                  <Input id="inviteCode" type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required placeholder="Code vom Coach" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signupPassword">Passwort</Label>
                  <Input id="signupPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="h-11" />
                </div>
                <Button type="submit" className="w-full h-11 gradient-primary text-primary-foreground font-semibold" disabled={loading}>
                  {loading ? "Wird registriert..." : "Registrieren"}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("login")}>
                  Bereits registriert? Anmelden
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail oder Benutzername</Label>
                  <Input id="email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="E-Mail oder Benutzername" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11" />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="rememberMe" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />
                  <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">Angemeldet bleiben</Label>
                </div>
                <Button type="submit" className="w-full h-11 gradient-primary text-primary-foreground font-semibold" disabled={loading}>
                  {loading ? "Wird angemeldet..." : "Anmelden"}
                </Button>
                <div className="flex flex-col gap-1">
                  <Button type="button" variant="ghost" className="w-full text-sm" onClick={() => setMode("signup")}>
                    Noch kein Konto? <span className="text-primary font-semibold ml-1">Registrieren</span>
                  </Button>
                  <Button type="button" variant="link" className="w-full text-xs text-muted-foreground" onClick={() => setMode("reset")}>
                    Passwort vergessen?
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
