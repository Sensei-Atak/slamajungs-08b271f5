import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowRight, CalendarDays, CheckCircle2, Play, Radio, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Metric } from "@/components/Metric";
import { PageHeader } from "@/components/PageHeader";

type Game = { id: string; date: string; opponent: string; score_home: number; score_away: number; status: string; game_time: string | null; is_home_game: boolean };

export default function Home() {
  const navigate = useNavigate();
  const { isCoach, profile } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [openTasks, setOpenTasks] = useState(0);
  const [activityCount, setActivityCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [gamesRes, tasksRes, postsRes, mealsRes] = await Promise.all([
        supabase.from("games").select("id,date,opponent,score_home,score_away,status,game_time,is_home_game").order("date", { ascending: false }),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("is_closed", false),
        supabase.from("feed_posts").select("id", { count: "exact", head: true }),
        supabase.from("meals").select("id", { count: "exact", head: true }),
      ]);
      setGames((gamesRes.data || []) as Game[]);
      setOpenTasks(tasksRes.count || 0);
      setActivityCount((postsRes.count || 0) + (mealsRes.count || 0));
      setLoading(false);
    };
    load();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const nextGame = [...games].filter((g) => g.status === "scheduled" && g.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const liveGame = games.find((g) => g.status === "live");
  const lastGame = games.find((g) => g.status === "completed");
  const completed = games.filter((g) => g.status === "completed");
  const wins = completed.filter((g) => g.score_home > g.score_away).length;

  if (loading) return <div className="page-loading">Laden...</div>;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Teamzentrale" title={`Hallo, ${profile?.name?.split(" ")[0] || "Team"}`} description="Das Wichtigste für heute auf einen Blick." />

      {liveGame ? (
        <section className="relative overflow-hidden border-y border-primary bg-primary/5 px-5 py-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase text-primary"><Radio className="h-4 w-4" /> Laufendes Spiel</p>
              <h2 className="mt-2 font-display text-3xl">Slama Jama {liveGame.score_home} : {liveGame.score_away} {liveGame.opponent}</h2>
            </div>
            {isCoach && <Button onClick={() => navigate(`/statistiken/live/${liveGame.id}`)}><Play />Fortsetzen</Button>}
          </div>
        </section>
      ) : nextGame ? (
        <section className="border-y border-border py-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase text-primary">Nächste Begegnung</p>
              <h2 className="mt-2 font-display text-4xl sm:text-5xl">{nextGame.is_home_game ? "Slama Jama" : nextGame.opponent} <span className="text-muted-foreground">vs.</span> {nextGame.is_home_game ? nextGame.opponent : "Slama Jama"}</h2>
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" />{format(parseISO(nextGame.date), "EEEE, dd. MMMM", { locale: de })}{nextGame.game_time ? ` · ${nextGame.game_time.slice(0, 5)} Uhr` : ""}</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/statistiken")}>Spiele ansehen <ArrowRight /></Button>
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-6 border-b border-border pb-7 lg:grid-cols-4">
        <Metric label="Bilanz" value={`${wins}–${completed.length - wins}`} detail={`${completed.length} Spiele`} />
        <Metric label="Offene Aufgaben" value={openTasks} detail="Teamweit" />
        <Metric label="Teamaktivität" value={activityCount} detail="Beiträge im Feed" />
        <Metric label="Letztes Ergebnis" value={lastGame ? `${lastGame.score_home}:${lastGame.score_away}` : "–"} detail={lastGame?.opponent || "Noch kein Spiel"} />
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,.8fr)]">
        <section>
          <div className="section-heading"><div><p className="section-kicker">Jetzt wichtig</p><h2>Dein Teamtag</h2></div></div>
          <div className="divide-y divide-border border-y border-border">
            <button className="editorial-row" onClick={() => navigate("/aufgaben")}><CheckCircle2 /><span><strong>{openTasks} offene Aufgaben</strong><small>Fortschritt ansehen und Aufgaben erledigen</small></span><ArrowRight /></button>
            <button className="editorial-row" onClick={() => navigate("/feed")}><CalendarDays /><span><strong>Aktuelles aus dem Team</strong><small>Mahlzeiten, Fotos und Treffen</small></span><ArrowRight /></button>
            <button className="editorial-row" onClick={() => navigate("/ranking")}><Trophy /><span><strong>Meal-Ranking</strong><small>Monatssieger und Hall of Fame</small></span><ArrowRight /></button>
          </div>
        </section>
        <aside>
          <Card className="border-t-2 border-t-primary">
            <CardContent className="p-5">
              <p className="section-kicker">Schnellzugriff</p>
              <h2 className="mt-1 font-display text-xl">Bereit fürs nächste Spiel?</h2>
              <p className="mt-2 text-sm text-muted-foreground">Aufstellung wählen und die Live-Statistik im fokussierten Spielmodus starten.</p>
              {isCoach ? <Button className="mt-5 w-full" onClick={() => navigate("/statistiken/live")}><Play />Neues Spiel</Button> : <Button className="mt-5 w-full" variant="outline" onClick={() => navigate("/statistiken")}>Statistiken öffnen</Button>}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}