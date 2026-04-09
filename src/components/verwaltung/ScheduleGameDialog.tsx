import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Player {
  id: string;
  name: string;
  jersey_number: number | null;
  is_active: boolean;
}

interface ScheduleGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  players: Player[];
}

export default function ScheduleGameDialog({ open, onOpenChange, onCreated, players }: ScheduleGameDialogProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [tipOff, setTipOff] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [opponent, setOpponent] = useState("");
  const [location, setLocation] = useState("");
  const [isHome, setIsHome] = useState(true);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const activePlayers = players.filter((p) => p.is_active);

  const togglePlayer = (id: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedPlayers.length === activePlayers.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(activePlayers.map((p) => p.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponent.trim()) {
      toast.error("Bitte Gegner eingeben");
      return;
    }
    setSaving(true);
    try {
      const { data: game, error } = await supabase
        .from("games")
        .insert({
          date,
          opponent: opponent.trim(),
          game_time: tipOff || null,
          meeting_time: meetingTime || null,
          location: location.trim() || null,
          is_home_game: isHome,
          status: "scheduled",
        } as any)
        .select()
        .single();
      if (error) throw error;

      if (selectedPlayers.length > 0 && game) {
        const { error: rosterError } = await supabase
          .from("game_rosters" as any)
          .insert(
            selectedPlayers.map((pid) => ({
              game_id: game.id,
              player_id: pid,
            }))
          );
        if (rosterError) throw rosterError;
      }

      toast.success("Spiel angesetzt");
      onOpenChange(false);
      setOpponent("");
      setLocation("");
      setTipOff("");
      setMeetingTime("");
      setIsHome(true);
      setSelectedPlayers([]);
      onCreated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Spiel ansetzen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Gegner</Label>
            <Input value={opponent} onChange={(e) => setOpponent(e.target.value)} required placeholder="z.B. TSV München" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Datum</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Tip-Off</Label>
              <Input type="time" value={tipOff} onChange={(e) => setTipOff(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Treffpunkt-Zeit</Label>
              <Input type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Heim / Auswärts</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsHome(true)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isHome ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  Heim
                </button>
                <button
                  type="button"
                  onClick={() => setIsHome(false)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    !isHome ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  Auswärts
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Ort</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="z.B. Sporthalle Gröbenzell" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Kader</Label>
              <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
                {selectedPlayers.length === activePlayers.length ? "Keine" : "Alle"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {activePlayers.map((p) => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-accent">
                  <Checkbox
                    checked={selectedPlayers.includes(p.id)}
                    onCheckedChange={() => togglePlayer(p.id)}
                  />
                  <span className="text-sm">
                    {p.jersey_number != null && <span className="text-muted-foreground mr-1">#{p.jersey_number}</span>}
                    {p.name}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{selectedPlayers.length} Spieler ausgewählt</p>
          </div>

          <Button type="submit" className="w-full min-h-[44px]" disabled={saving}>
            {saving ? "Wird erstellt..." : "Spiel ansetzen"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
