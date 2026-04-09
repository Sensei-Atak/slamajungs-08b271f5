import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon, Crop, Check, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Cropper from "react-easy-crop";
import getCroppedImg, { CroppedArea } from "./cropImage";

interface PhotoUploadFormProps {
  onPosted: () => void;
  onCancel: () => void;
}

const ASPECT = 9 / 16;

export default function PhotoUploadForm({ onPosted, onCancel }: PhotoUploadFormProps) {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isCropping, setIsCropping] = useState(false);

  const onCropComplete = useCallback((_: any, croppedPixels: CroppedArea) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setRawImage(URL.createObjectURL(f));
    setCroppedBlob(null);
    setCroppedPreview(null);
    setIsCropping(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleCropConfirm = async () => {
    if (!rawImage || !croppedAreaPixels) return;
    try {
      const blob = await getCroppedImg(rawImage, croppedAreaPixels);
      setCroppedBlob(blob);
      setCroppedPreview(URL.createObjectURL(blob));
      setIsCropping(false);
    } catch {
      toast.error("Fehler beim Zuschneiden");
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!croppedBlob || !user) return;
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("meal-photos")
        .upload(path, croppedBlob, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { error } = await supabase.from("feed_posts").insert({
        user_id: user.id,
        post_type: "photo" as const,
        image_url: path,
        caption: caption || null,
      });
      if (error) throw error;

      toast.success("Foto gepostet!");
      onPosted();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-purple-500/30">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Camera className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium">Foto posten</span>
        </div>
        <form onSubmit={handlePost} className="space-y-3">
          {!rawImage && (
            <label className="flex flex-col items-center gap-2 cursor-pointer border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Foto auswählen</span>
              <span className="text-xs text-muted-foreground/60">Wird auf Hochformat zugeschnitten</span>
              <Input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          )}

          {isCropping && rawImage && (
            <div className="space-y-3">
              <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ height: 400 }}>
                <Cropper image={rawImage} crop={crop} zoom={zoom} aspect={ASPECT} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Zoom</span>
                <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-primary" />
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={handleCropConfirm} className="min-h-[44px] gap-2">
                  <Check className="h-4 w-4" /> Zuschnitt bestätigen
                </Button>
                <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => { setRawImage(null); setIsCropping(false); }}>
                  Anderes Bild
                </Button>
              </div>
            </div>
          )}

          {croppedPreview && !isCropping && (
            <div className="space-y-2">
              <img src={croppedPreview} alt="Vorschau" className="w-32 h-auto rounded-lg mx-auto" style={{ aspectRatio: "9/16", objectFit: "cover" }} />
              <Button type="button" variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground" onClick={() => setIsCropping(true)}>
                <Crop className="h-4 w-4" /> Neu zuschneiden
              </Button>
            </div>
          )}

          <Textarea placeholder="Beschreibung (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={280} />
          <div className="flex gap-2">
            <Button type="submit" disabled={!croppedBlob || uploading} className="min-h-[44px]">
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
