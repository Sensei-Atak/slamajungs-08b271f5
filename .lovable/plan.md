

## Mobile-Responsive Tabellen fixen

### Problem
Die Tabellen auf den Seiten Verwaltung, Statistiken, GameSummary und PlayerStats sind zu breit fuer Mobilgeraete. `overflow-x-auto` erlaubt zwar horizontales Scrollen, aber die Tabelle selbst hat eine feste Mindestbreite, die ueber den Viewport hinausragt, was zum Rauszoomen zwingt.

### Loesung
Auf mobilen Bildschirmen die Tabellen durch **Card-basierte Listen** ersetzen. Jeder Spieler/Eintrag wird als kompakte Karte dargestellt statt als Tabellenzeile. Die Desktop-Tabelle bleibt fuer groessere Bildschirme erhalten.

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/Statistiken.tsx` | Spieler-Durchschnitte: Mobile-Ansicht als klickbare Karten mit den wichtigsten Stats (PPG, RPG, APG). Volle Tabelle nur ab `md:` |
| `src/pages/Verwaltung.tsx` | Spieler-Tab: Mobile-Karten mit Name, Nr, Position, Status + Action-Buttons. Spiele-Tab: Mobile-Karten. Verpasst-Tab: Mobile-Karten. Desktop bleibt Tabelle |
| `src/pages/GameSummary.tsx` | Mobile: Spieler-Karten mit Stats in Grid. Desktop: Tabelle |
| `src/pages/PlayerStats.tsx` | Mobile: Spiel-Karten mit Stats in Grid. Desktop: Tabelle. Saisondurchschnitt-Grid von `grid-cols-5` auf `grid-cols-3 sm:grid-cols-5` |

### Umsetzung
- Jede Seite bekommt ein Pattern: `<div className="hidden md:block">` fuer die Tabelle und `<div className="md:hidden">` fuer die Mobile-Karten
- Mobile-Karten zeigen die wichtigsten Infos kompakt in einem Grid-Layout
- Klick-Navigation bleibt erhalten (z.B. Spieler anklicken -> Spielerdetails)
- Keine neuen Komponenten noetig, alles inline mit bestehenden UI-Komponenten (Card, Badge)

