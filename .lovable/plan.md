

## Registrierung nur mit Team-Code schuetzen

### Uebersicht

Beim Registrieren muessen Spieler einen geheimen Team-Code eingeben (z.B. "SlamaJama2026"). Ohne den richtigen Code ist keine Registrierung moeglich. Der Code wird serverseitig validiert, damit er nicht umgangen werden kann.

### Aenderungen

**1. Datenbank: Team-Code als App-Setting speichern**
- Neue Tabelle `app_settings` mit key/value-Paaren
- Eintrag `team_invite_code` mit dem gewuenschten Code
- RLS: Nur Coach kann den Code lesen und aendern
- Security-Definer-Funktion `verify_invite_code(code text)` die `true/false` zurueckgibt -- so wird der Code nie an den Client gesendet

**2. `src/pages/Login.tsx`**
- Neues Eingabefeld "Team-Code" im Registrierungsformular
- Vor dem `signUp`-Aufruf wird der Code ueber `supabase.rpc("verify_invite_code")` geprueft
- Fehlermeldung wenn der Code falsch ist

**3. `src/pages/Verwaltung.tsx`**
- Neuer Bereich fuer den Coach: "Team-Code aendern"
- Einfaches Textfeld + Speichern-Button

### Sicherheit
- Der Code wird NIE an den Client uebertragen -- nur eine `true/false`-Antwort
- Die Validierung erfolgt serverseitig ueber eine Security-Definer-Funktion
- Nur der Coach kann den Code einsehen und aendern

