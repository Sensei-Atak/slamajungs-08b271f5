import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MealUploadFormProps {
  onPosted: () => void;
  onCancel: () => void;
}

export default function MealUploadForm({ onPosted, onCancel }: MealUploadFormProps) {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateImage = (f: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.height < img.width) {
          setError("Bitte nur Hochformat-Bilder (Portrait) hochladen!");
          resolve(false);
        } else {
          setError(null);
          resolve(true);
        }
      };
      img.src = URL.createObjectURL(f);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    const valid = await validateImage(f);
    if (valid) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    } else {
      setFile(null);
      setPreview(null);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("meal-photos")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("meal-photos")
        .getPublicUrl(path);

      const { error } = await supabase.from("meals").insert({
        user_id: user.id,
        image_url: urlData.publicUrl,
        caption: caption || null,
      });
      if (error) throw error;

      toast.success("Mahlzeit gepostet!");
      onPosted();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <form onSubmit={handlePost} className="space-y-3">
          <div>
            <label className="flex flex-col items-center gap-2 cursor-pointer border-2 border-dashed border-border rounded-lg p-6 justify-center hover:border-primary/50 transition-colors">
              {preview ? (
                <img src={preview} alt="Vorschau" className="w-32 h-44 object-cover rounded-lg" />
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Hochformat-Foto auswählen
                  </span>
                  <span className="text-xs text-muted-foreground/60">
                    Nur Portrait / Handyformat
                  </span>
                </>
              )}
              <Input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            {error && (
              <p className="text-xs text-destructive mt-1">{error}</p>
            )}
          </div>
          <Textarea
            placeholder="Beschreibung (optional, max. 280 Zeichen)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={280}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={!file || uploading} className="min-h-[44px]">
              {uploading ? "Wird hochgeladen..." : "Veröffentlichen"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="min-h-[44px]">
              Abbrechen
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
