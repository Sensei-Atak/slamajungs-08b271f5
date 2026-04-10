import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";

interface DBBGame {
  date: string;
  time: string;
  home: string;
  away: string;
  venue: string;
  is_home: boolean;
  opponent: string;
}

interface DBBImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
  existingGames: Array<{ date: string; opponent: string }>;
}

export default function DBBImportDialog({ open, onOpenChange, onImported, existingGames }: DBBImportDialogProps) {
  const [ligaId, setLigaId] = useState("");
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<DBBGame[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [importing, setImporting] = useState(false);
  const [fetched, setFetched] = useState(false);

  const isAlreadyImported = (game: DBBGame) => {
    return existingGames.some(
      (eg) => eg.date === game.date && eg.opponent.toLowerCase().includes(game.opponent.toLowerCase().slice(0, 10))
    );
  };

  const handleFetch = async () => {
    if (!ligaId.trim()) {
      toast.error("Bitte Liga-ID eingeben");
      return;
    }
    setLoading(true);
    setGames([]);
    setSelected([]);
    setFetched(false);
    try {
      const { data, error } = await supabase.functions.invoke("import-dbb-schedule", {
        body: { liga_id: ligaId.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const fetchedGames = data.games || [];
      setGames(fetchedGames);
      setFetched(true);

      // Auto-select games not yet imported
      const autoSelect = fetchedGames
        .map((g: DBBGame, i: number) => (!isAlreadyImported(g) ? i : -1))
        .filter((i: number) => i >= 0);
      setSelected(autoSelect);

      if (fetchedGames.length === 0) {
        toast.info("Keine Spiele für Slama Jama gefunden");
      } else {
        toast.success(`${fetchedGames.length} Spiele gefunden`);
      }
    } catch (err: any) {
      toast.error("Fehler: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleGame = (idx: number) => {
    setSelected((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleImport = async () => {
    if (selected.length === 0) return;
    setImporting(true);
    try {
      const toImport = selected.map((idx) => games[idx]);
      const inserts = toImport.map((g) => ({
        date: g.date,
        opponent: g.opponent,
        game_time: g.time + ":00",
        location: g.venue || null,
        is_home_game: g.is_home,
        status: "scheduled",
      }));

      const { error } = await supabase.from("games").insert(inserts as any);
      if (error) throw error;

      toast.success(`${inserts.length} Spiele importiert`);
      onOpenChange(false);
      setGames([]);
      setSelected([]);
      setFetched(false);
      onImported();
    } catch (err: any) {
      toast.error("Import-Fehler: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  const formatDate = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>DBB Spielplan importieren</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Liga-ID (aus der DBB-URL)</Label>
            <div className="flex gap-2">
              <Input
                value={ligaId}
                onChange={(e) => setLigaId(e.target.value)}
                placeholder="z.B. 51302"
                className="flex-1"
              />
              <Button onClick={handleFetch} disabled={loading} className="min-h-[44px]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Laden"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Gehe auf basketball-bund.net → deine Liga → kopiere die Zahl nach "liga_id=" aus der URL
            </p>
          </div>

          {fetched && games.length > 0 && (
            <>
              <div className="space-y-2">
                <Label>{games.length} Spiele gefunden</Label>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {games.map((g, idx) => {
                    const already = isAlreadyImported(g);
                    return (
                      <label
                        key={idx}
                        className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${
                          already ? "opacity-40 bg-muted" : selected.includes(idx) ? "border-primary bg-primary/5" : "hover:bg-accent"
                        }`}
                      >
                        <Checkbox
                          checked={selected.includes(idx)}
                          onCheckedChange={() => toggleGame(idx)}
                          disabled={already}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <span className="truncate">
                              {g.is_home ? "vs" : "@"} {g.opponent}
                            </span>
                            {already && (
                              <span className="text-xs text-muted-foreground shrink-0">(bereits vorhanden)</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2">
                            <span>{formatDate(g.date)}</span>
                            <span>{g.time} Uhr</span>
                            {g.venue && <span>{g.venue}</span>}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={handleImport}
                disabled={importing || selected.length === 0}
                className="w-full min-h-[44px] gap-2"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {selected.length} Spiele importieren
              </Button>
            </>
          )}

          {fetched && games.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine Spiele für Slama Jama Gröbenzell gefunden. Prüfe die Liga-ID.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
