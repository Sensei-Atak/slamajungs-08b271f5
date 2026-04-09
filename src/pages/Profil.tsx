import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSignedUrl } from "@/lib/storage";
import { StorageImage } from "@/components/ui/storage-image";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Camera } from "lucide-react";

export default function Profil() {
  const { profile, user, isCoach, signOut } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const positions = profile?.position ? profile.position.split(",").map((p) => p.trim()).filter(Boolean) : [];

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const storedPath = `${path}?t=${Date.now()}`;
      setAvatarUrl(storedPath);

      await supabase.from("profiles").update({ avatar_url: storedPath }).eq("id", user.id);
      toast.success("Profilbild aktualisiert");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

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

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Mein Profil</h1>
      <Card>
        <CardContent className="pt-4 space-y-5">
          {/* Avatar + Info */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="w-20 h-20">
                {avatarUrl && <AvatarImage src={useSignedUrl("avatars", avatarUrl) || undefined} alt={name} />}
                <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarUpload(f);
                }}
              />
            </div>
            <div>
              <p className="font-medium text-lg">{name}</p>
              <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
              {profile.jersey_number && (
                <p className="text-sm text-muted-foreground">#{profile.jersey_number}</p>
              )}
              {positions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {positions.map((pos) => (
                    <Badge key={pos} variant="secondary" className="text-xs">
                      {pos}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* E-Mail */}
          <div className="space-y-2">
            <Label>E-Mail</Label>
            <Input value={user?.email || ""} disabled />
          </div>

          <Button onClick={handleSave} disabled={saving} className="min-h-[44px]">
            {saving ? "Wird gespeichert..." : "Speichern"}
          </Button>
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        className="w-full min-h-[44px]"
        onClick={async () => {
          await signOut();
          window.location.href = "/login";
        }}
      >
        Abmelden
      </Button>
    </div>
  );
}