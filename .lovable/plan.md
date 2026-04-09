

## Angesetzte Spiele + Live-Statistiken verbinden, Captain-Auswahl & Sortierung

### Was wird gemacht

1. **Statistiken-Seite**: Angesetzte Spiele anzeigen (Coach: "Live-Statistik starten" Button), vergangene Spiele für alle sichtbar auflisten
2. **LiveInput**: Wenn ein angesetztes Spiel geöffnet wird, Kader aus `game_rosters` laden. Nach Speichern `status` auf `'completed'` setzen
3. **Spieler nach Trikotnummer sortieren** (aufsteigend) in der Starting Five Auswahl und überall in LiveInput
4. **Captain-Auswahl**: Im StartingFiveSelector kann ein Spieler als Captain markiert werden (kleines "C" neben dem Namen)
5. **Starting Five Namen rot** im Live-Statistik-Eingabefenster (CompactPlayerCard), Bench-Spieler normal

### Technische Umsetzung

**`src/pages/Statistiken.tsx`**
- Neue Abschnitte: "Angesetzte Spiele" (Coach-only, `status = 'scheduled'`) und "Vergangene Spiele" (alle, Spiele mit Stats)
- Angesetzte Spiele: Karten mit Gegner, Datum, Uhrzeit, Ort + Button "Live-Statistik starten" → navigiert zu `/statistiken/live/{gameId}`
- Vergangene Spiele: Liste mit Ergebnis, klickbar zur GameSummary

**`src/pages/LiveInput.tsx`**
- Spieler nach `jersey_number` sortieren (nulls last) statt nach Name
- Neuer State `captainId` für Captain-Auswahl
- Neuer State `startingFiveIds` zum Tracken welche Spieler die Starting Five waren (bleibt auch nach Auswechslung bestehen)
- Wenn `gameId` vorhanden: Kader aus `game_rosters` laden, nur diese Spieler anzeigen
- Nach Speichern: `games.status = 'completed'` setzen
- `captainId` an CompactPlayerCard weitergeben
- `isStarter` Flag an CompactPlayerCard weitergeben

**`src/components/live-input/StartingFiveSelector.tsx`**
- Spieler nach Trikotnummer sortieren
- Captain-Auswahl: Tap auf bereits ausgewählten Spieler → Toggle Captain (nur 1 Captain möglich)
- Captain bekommt ein kleines "C" Badge neben dem Namen
- Props erweitern: `captainId`, `onSetCaptain`

**`src/components/live-input/CompactPlayerCard.tsx`**
- Neue Props: `isCaptain`, `isStarter`
- Captain: kleines "c" neben dem Namen
- Starter: Name in Rot (`text-red-500`)

### Dateien

| Aktion | Datei |
|--------|-------|
| Bearbeiten | `src/pages/Statistiken.tsx` — Angesetzte + vergangene Spiele |
| Bearbeiten | `src/pages/LiveInput.tsx` — Sortierung, Captain, Kader-Laden, Status-Update |
| Bearbeiten | `src/components/live-input/StartingFiveSelector.tsx` — Sortierung, Captain-Toggle |
| Bearbeiten | `src/components/live-input/CompactPlayerCard.tsx` — Captain "c", Starter-Name rot |

