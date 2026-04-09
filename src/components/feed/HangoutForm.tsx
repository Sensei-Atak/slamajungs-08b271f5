import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MapPin } from "lucide-react";

interface HangoutFormProps {
  onPosted: () => void;
  onCancel: () => void;
}

export default function HangoutForm({ onPosted, onCancel }: HangoutFormProps) {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [posting, setPosting] = useState(false);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date || !time || !location) return;
    setPosting(true);
    try {
      const { data: post, error: postErr } = await supabase
        .from("feed_posts")
        .insert({
          user_id: user.id,
          post_type: "hangout" as const,
          caption: caption || null,
        })
        .select("id")
        .single();
      if (postErr) throw postErr;

      const { error: detailErr } = await supabase
        .from("hangout_details")
        .insert({
          post_id: post.id,
          date,
          time,
          location,
        });
      if (detailErr) throw detailErr;

      toast.success("Verabredung gepostet!");
      onPosted();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <Card className="border-blue-500/30">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">Verabredung erstellen</span>
        </div>
        <form onSubmit={handlePost} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Datum</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Uhrzeit</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ort</Label>
            <Input
              placeholder="z.B. Basketballplatz am Park"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
          <Textarea
            placeholder="Nachricht (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={280}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={posting} className="min-h-[44px]">
              {posting ? "Wird gepostet..." : "Veröffentlichen"}
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
