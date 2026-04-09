import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Profil() {
  const { profile, user } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name })
      .eq("id", user.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profil gespeichert");
    }
    setSaving(false);
  };

  if (!profile) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Mein Profil</h1>
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold">
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <p className="font-medium">{name}</p>
              <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
              {profile.jersey_number && (
                <p className="text-sm text-muted-foreground">
                  #{profile.jersey_number} {profile.position && `· ${profile.position}`}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>E-Mail</Label>
            <Input value={user?.email || ""} disabled />
          </div>
          <Button onClick={handleSave} disabled={saving} className="min-h-[44px]">
            {saving ? "Wird gespeichert..." : "Speichern"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
