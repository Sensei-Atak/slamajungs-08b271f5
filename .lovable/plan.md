

## DBB-Spielplan Import fuer Slama Jama Groebenzell

### Analyse

Der DBB hat **keine offizielle JSON-API**. Die Website `basketball-bund.net` ist ein altes Java-System (TeamSL) ohne REST-Schnittstelle. **Aber**: Es gibt oeffentlich zugaengliche "Print"-Seiten mit strukturiertem HTML, die geparst werden koennen:

```text
https://www.basketball-bund.net/public/spielplan_list.jsp
  ?print=1
  &viewDescKey=sport.dbb.liga.SpielplanViewPublic/index.jsp_
  &liga_id={LIGA_ID}
```

Diese Seiten liefern eine HTML-Tabelle mit: **Nr, Spieltag, Datum+Uhrzeit, Heim, Gast, Spielhalle** - genau die Daten, die wir brauchen.

### Vorgehen

**Schritt 1: Liga-ID ermitteln**
Dein Team taucht bereits auf der DBB-Seite auf (z.B. liga_id 51302 fuer U12m). Fuer die U16-1 Bezirksliga West muss die korrekte liga_id gefunden werden. Ich wuerde dich bitten, die Liga-ID aus der URL auf basketball-bund.net zu nennen (die Zahl nach `liga_id=`), da es 459 Ligen im BBV gibt und die U16 Bezirksliga West Maennlich nicht auf der ersten Seite erscheint.

**Schritt 2: Edge Function zum Scrapen**
Eine Backend-Funktion, die:
- Die Print-Spielplan-Seite der DBB abruft
- Das HTML parst (Datum, Uhrzeit, Heim/Gast, Halle extrahiert)
- Nur Spiele von "Slama Jama Gröbenzell" filtert
- Die Daten als JSON zurueckgibt

**Schritt 3: Import-Button in Verwaltung**
Ein Button auf der Verwaltungs-Seite (Tab "Spiele"), der:
- Die Edge Function aufruft
- Die DBB-Spiele anzeigt
- Noch nicht vorhandene Spiele als "scheduled" in die `games`-Tabelle importiert
- Bereits vorhandene Spiele (gleicher Gegner + Datum) ueberspringt

### Was du tun musst

Bitte geh auf `basketball-bund.net`, navigiere zu deiner U16-1 Bezirksliga West Maennlich Liga und teil mir die **liga_id** aus der URL mit (die Zahl nach `liga_id=` in der Adressleiste).

### Technische Details

| Komponente | Beschreibung |
|---|---|
| `supabase/functions/import-dbb-schedule/index.ts` | Edge Function: Fetcht die DBB Print-Seite, parst HTML mit Regex/String-Parsing, gibt JSON-Array zurueck |
| `src/pages/Verwaltung.tsx` | Neuer "DBB Import" Button im Spiele-Tab |
| `src/components/verwaltung/DBBImportDialog.tsx` | Dialog zeigt gefundene Spiele, laesst Coach auswaehlen welche importiert werden |

### Einschraenkungen

- **Kein Echtzeit-Sync**: Die Daten werden nur bei manuellem Import aktualisiert
- **HTML-Scraping**: Falls der DBB sein HTML-Format aendert, muss der Parser angepasst werden
- **Keine Ergebnisse**: Nur Ansetzungen werden importiert, keine Spielergebnisse

