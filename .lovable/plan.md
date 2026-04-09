

## Fix: Mobile-Overflow auf Verwaltung und Statistiken

### Problem
Zwei Ursachen fuer das Rauszoomen:

1. **Verwaltung - TabsList**: Die 4 Tabs ("Spieler", "Spiele", "Verpasste Abgaben", "Passwort") passen nicht in 390px Breite. Die `TabsList` hat `inline-flex` und laeuft ueber den Viewport hinaus.

2. **Statistiken - Angesetzte Spiele**: Die Cards mit Gegner-Name, Datum, Uhrzeit, Ort in einer Zeile plus "Live-Statistik" Button koennen bei langen Gegnernamen oder Ort-Angaben ueberlaufen.

### Loesung

| Datei | Aenderung |
|-------|-----------|
| `src/pages/Verwaltung.tsx` | TabsList auf Mobile: `w-full` und `flex-wrap` oder `grid grid-cols-2` damit die Tabs umbrechen statt ueberlaufen. "Verpasste Abgaben" auf Mobile kuerzen zu "Verpasst". |
| `src/pages/Statistiken.tsx` | Angesetzte-Spiele-Cards: Metadata-Zeile mit `flex-wrap` versehen. "Live-Statistik" Button auf Mobile nur als Icon-Button ohne Text. `min-w-0` und `overflow-hidden` auf den Text-Container. |

### Details

**Verwaltung TabsList** (Zeile 274-286):
- `TabsList` bekommt `className="w-full grid grid-cols-4"` auf Mobile bzw `flex-wrap`
- Alternativ: Tab-Labels auf Mobile kuerzen ("Verpasst" statt "Verpasste Abgaben")

**Statistiken Cards** (Zeile 161-193):
- Textcontainer bekommt `min-w-0` damit truncation funktioniert
- Metadata `flex-wrap` fuer lange Ortsangaben
- "Live-Statistik" Button auf Mobile: nur Play-Icon, kein Text

