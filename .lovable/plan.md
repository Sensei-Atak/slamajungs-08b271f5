

## Drei neue Features: Aktivitaets-Tracking, Mahlzeit-Monatsranking & Dark Mode / Basketball-Design

### 1. Spieler-Aktivitaets-Tracking (nur Coach sichtbar)

**Datenbank:**
- Neue Tabelle `page_visits` mit `id` (uuid), `user_id` (uuid), `visited_at` (timestamptz default now())
- Neue Tabelle `activity_sessions` mit `id` (uuid), `user_id` (uuid), `started_at` (timestamptz), `last_seen_at` (timestamptz), `duration_seconds` (integer default 0)
- RLS: Spieler koennen nur INSERT auf eigene Eintraege, Coach kann SELECT auf alle

**Tracking-Logik (in AppLayout, unsichtbar fuer Spieler):**
- Bei jedem App-Start: INSERT in `page_visits` (zaehlt Besuche)
- Heartbeat alle 30 Sekunden: erstellt/aktualisiert `activity_sessions` Eintrag, pausiert bei `visibilitychange` (Tab nicht sichtbar)
- `duration_seconds` wird bei jedem Heartbeat hochgezaehlt

**Coach-Ansicht (neuer Tab "Aktivitaet" in Verwaltung):**
- Tabelle mit allen Spielern, pro Tag:
  - Anzahl Seitenbesuche
  - Gesamte aktive Zeit (in Minuten/Sekunden)
  - Kombinierte Kategorie: **selten** (rot), **mittel** (gelb), **oft** (gruen)
- Kategorisierung basiert auf kombiniertem Score aus Besuchen + aktiver Zeit
  - selten: 0-1 Besuche UND unter 2 Minuten
  - mittel: 2-3 Besuche ODER 2-10 Minuten
  - oft: 4+ Besuche ODER ueber 10 Minuten
- Tagesfilter / Kalenderansicht

### 2. Mahlzeit-des-Tages Monatsranking

**Datenbank:**
- Neue Tabelle `monthly_meal_winners` mit `id`, `month` (text, YYYY-MM), `player_id` (uuid), `player_name` (text), `win_count` (integer)

**Logik:**
- Aus bestehenden `meals` + `meal_ratings` wird pro Tag der Gewinner ermittelt (hoechste Durchschnittsbewertung)
- Pro Monat werden die Tagessiege pro Spieler gezaehlt
- Beim ersten Laden im neuen Monat wird der Vormonatsgewinner in `monthly_meal_winners` archiviert

**UI (Feed-Seite):**
- Neues Segment unter "Mahlzeit des Tages": Monatsranking-Leaderboard
- Separater "Hall of Fame"-Bereich fuer vergangene Monatsgewinner mit Pokal-Icons
- Neue Komponenten: `MonthlyMealRanking.tsx`, `MealHallOfFame.tsx`

### 3. Dark Mode & Basketball-Design

**Dark Mode:**
- `.dark` CSS-Variablen existieren bereits in `index.css`
- Neuer `ThemeContext.tsx` der `dark` Klasse auf `<html>` setzt und in localStorage speichert
- Toggle-Button (Sonne/Mond) im Sidebar-Header und Mobile-Header

**Basketball-Design:**
- Primaerfarbe von Hellblau (hsl 199) zu kraeftigem Orange aendern (ca. hsl 25 95% 55%)
- Dark-Mode ebenfalls auf Orange-Akzent anpassen
- Basketball-Icon neben "Slama Jama" im Sidebar
- Gradient-Akzente in Orange/Schwarz fuer Karten-Header
- Sportlichere, kraeftigere Ueberschriften

### Dateien

- **Neu:** `src/contexts/ThemeContext.tsx`, `src/components/feed/MonthlyMealRanking.tsx`, `src/components/feed/MealHallOfFame.tsx`
- **Geaendert:** `src/index.css`, `src/components/AppLayout.tsx` (Theme-Toggle + Visit/Session-Tracking), `src/pages/Feed.tsx`, `src/pages/Verwaltung.tsx` (neuer Aktivitaet-Tab), `src/main.tsx` (ThemeProvider)
- **Migration:** `page_visits`, `activity_sessions`, `monthly_meal_winners` Tabellen + RLS

### Reihenfolge
1. Dark Mode + Basketball-Design
2. Aktivitaets-Tracking (Besuche + Zeit)
3. Mahlzeit-Monatsranking

