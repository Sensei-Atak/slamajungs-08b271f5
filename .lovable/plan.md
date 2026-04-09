

## Responsive-Optimierung & Querformat-Pflicht für Live-Statistiken

### Aktueller Stand

Die Live-Statistik-Seite funktioniert grundsätzlich, hat aber Probleme auf kleinen Bildschirmen:
- Die CompactPlayerCard nutzt `flex-wrap`, wodurch Inhalte auf schmalen Screens umbrechen und 5 Karten nicht gleichzeitig sichtbar sind
- Keine Querformat-Erzwingung auf Mobilgeräten
- Buttons und Stat-Counter sind für Touchscreens teilweise zu klein (7x7px)
- Die Game-Info-Bar bricht auf kleinen Screens unschön um

### Plan

**1. Querformat-Pflicht auf Mobilgeräten (nur LiveInput)**
- Overlay-Komponente `LandscapePrompt` erstellen, die auf Hochformat-Handys einen Fullscreen-Hinweis zeigt: "Bitte drehe dein Gerät ins Querformat"
- Erkennung via `window.matchMedia("(orientation: portrait)")` + Bildschirmbreite < 768px
- Nur auf der LiveInput-Seite aktiv, nicht app-weit

**2. Responsive CompactPlayerCard optimieren**
- Auf kleinen Landscape-Screens (Handy quer ~850x400): einzeiligeres Layout, alle Elemente in einer kompakten Zeile
- Shot-Stats (FW/2P/3P) und Sekundär-Stats (REB, AST, etc.) nebeneinander statt umbrechen
- Touch-Targets auf mindestens 44x44px (Apple HIG) vergrößern
- Schriftgrößen responsive anpassen

**3. LiveInput Layout-Anpassungen**
- Game-Info-Bar: auf Mobile kompakter (Gegner + Score in einer Zeile)
- `grid gap-2` für die 5 Spieler: auf Landscape-Handy mit `grid-cols-1` und reduziertem Gap damit alle 5 ohne Scrollen sichtbar sind
- Auf Tablet/Desktop: mehr Platz nutzen, optional 2-3 Spalten-Grid
- `overflow-hidden` und `h-[calc(100dvh-...)]` verwenden damit kein vertikales Scrollen nötig ist

**4. Allgemeine App-Responsiveness prüfen**
- AppLayout Sidebar/Bottom-Nav ist bereits responsive (gut)
- Feed, Aufgaben, Statistiken nutzen standard Tailwind-Breakpoints (funktioniert)
- Kleinere Anpassungen wo nötig (z.B. Tabellen auf Mobile horizontal scrollbar)

### Dateien

| Aktion | Datei |
|--------|-------|
| Neu | `src/components/live-input/LandscapePrompt.tsx` |
| Bearbeiten | `src/pages/LiveInput.tsx` — Layout-Optimierung + LandscapePrompt einbinden |
| Bearbeiten | `src/components/live-input/CompactPlayerCard.tsx` — Responsive Layout |
| Bearbeiten | `src/components/live-input/StatCounter.tsx` — Größere Touch-Targets |
| Bearbeiten | `src/components/live-input/QuickScoreButtons.tsx` — Responsive Sizing |

