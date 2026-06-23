# Live-Statistik Redesign – Aktions-zuerst

## Ziel
Live-Eingabe wird auf **Aktions-zuerst**-Workflow umgestellt: Coach tippt zuerst die Aktion (z. B. „2P getroffen"), dann den Spieler. Große Buttons, weniger Stats, klarere Viertel-Auswertung.

## 1. Stats-Reduktion
Aus der Live-Eingabe **entfernt**: Assists (AST), Blocks (BLK), Steals (STL).

Verbleibende Stats pro Spieler:
- **FW** getroffen / verfehlt
- **2P** getroffen / verfehlt
- **3P** getroffen / verfehlt
- **Rebound (REB)**
- **Turnover (TO)**
- **Foul (F)**

DB-Spalten bleiben erhalten (alte Spiele behalten ihre Werte), nur UI versteckt sie. In `GameSummary` werden AST/BLK/STL ebenfalls ausgeblendet.

## 2. Neues Aktions-zuerst Layout (`LiveInput.tsx`)

```text
┌──────────────────────────────────────────────────────────┐
│ Datum · Gegner · SJ 42 : 38 GG · [Q2] [Viertel-Ende]     │  Toolbar
├──────────────────────────────────────────────────────────┤
│  AKTION WÄHLEN                                            │
│  ┌──────┬──────┬──────┐  ┌──────┬──────┬──────┐          │
│  │ +1 ✓ │ +2 ✓ │ +3 ✓ │  │ FW ✗ │ 2P ✗ │ 3P ✗ │  große   │
│  └──────┴──────┴──────┘  └──────┴──────┴──────┘  Buttons │
│  ┌──────┬──────┬──────┐                                   │
│  │ REB  │ TO   │ FOUL │                                   │
│  └──────┴──────┴──────┘                                   │
├──────────────────────────────────────────────────────────┤
│  SPIELER ANTIPPEN  (5 Court-Spieler als große Kacheln)    │
│  ┌────────┬────────┬────────┬────────┬────────┐           │
│  │ #5 Max │ #7 Tim │ #9 Leo │#11 Ben │#14 Tom │           │
│  │ 8 PTS  │ 4 PTS  │ 6 PTS  │ 0 PTS  │ 2 PTS  │           │
│  │ [Sub]  │ [Sub]  │ [Sub]  │ [Sub]  │ [Sub]  │           │
│  └────────┴────────┴────────┴────────┴────────┘           │
└──────────────────────────────────────────────────────────┘
```

**Flow:**
1. Coach tippt Aktion (z. B. „2P ✓") → Button hebt sich farbig hervor, Hinweis „Spieler antippen für: 2P getroffen"
2. Coach tippt Spieler → Stat wird gebucht, Kachel leuchtet kurz auf, ggf. Score-Update bei Treffern
3. Aktion setzt sich automatisch zurück (nächste Eingabe braucht neue Aktions-Auswahl)
4. **Rückgängig-Button** für den letzten Eintrag (Undo-Stack)

**Spieler-Kachel** zeigt nur Trikotnummer, Name, PTS, Sub-Button. Detail-Stats pro Spieler werden in einem optionalen „Details"-Sheet sichtbar.

## 3. Viertel-Ende: Auto-Save + Zwischenstand-Dialog

Beim Klick auf **„Viertel beenden"** / „→ Halbzeit" / „OT beenden":

1. **Zwischenstand-Dialog** öffnet sich mit zwei Eingabefeldern:
   - „Stand Slama Jama" (vorbelegt mit aktuellem `scoreHome`)
   - „Stand Gegner" (vorbelegt mit aktuellem `scoreAway`)
   - Hinweis: „Stimmt der Spielstand? Korrigiere ihn, falls Punkte fehlen."
2. Bei Bestätigung:
   - Korrigierte Scores überschreiben `scoreHome` / `scoreAway`
   - Differenz zum Baseline-Stand wird als Quarter-Eintrag gebucht (`{label, home, away}`)
   - **Auto-Save** erfolgt automatisch
   - Toast: „Q1 gespeichert (12 : 9)"

## 4. Spiel-Übersicht (`GameSummary.tsx`)

Neue Sektion **„Viertel-Auswertung"** ganz oben (falls `quarter_scores` vorhanden):

```text
┌────┬────┬────┬────┬─────┬────────┐
│    │ Q1 │ Q2 │ Q3 │ Q4  │ Gesamt │
├────┼────┼────┼────┼─────┼────────┤
│ SJ │ 12 │ 14 │ 10 │  8  │   44   │
│ GG │  9 │ 11 │ 13 │ 12  │   45   │
└────┴────┴────┴────┴─────┴────────┘
```

OTs hängen als weitere Spalten an („OT1", „OT2").

Spalten AST/BLK/STL werden aus der Spieler-Stats-Tabelle entfernt. Spalten bleiben: PTS, FW, 2P, 3P, REB, TO, F.

## Technische Details
- `src/pages/LiveInput.tsx`: Umbau auf zwei-Schritt-Workflow, neuer State `pendingAction`, `actionHistory[]` für Undo.
- Neue Komponente `src/components/live-input/ActionBar.tsx`: große Aktions-Buttons (Treffer grün, Miss rot, neutrale Stats grau).
- Neue Komponente `src/components/live-input/PlayerTile.tsx`: große Spieler-Kachel.
- Neue Komponente `src/components/live-input/QuarterEndDialog.tsx`: Dialog mit zwei Number-Inputs.
- `GameSummary.tsx`: neue Viertel-Tabelle, Stats-Spalten reduziert.
- Keine DB-Migration nötig.
