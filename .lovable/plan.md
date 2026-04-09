

## Coach-genehmigte Passwort-Zurücksetzung mit temporärem Passwort

### Ablauf

1. **Spieler** klickt "Passwort vergessen?" auf der Login-Seite → gibt seine E-Mail ein → eine Anfrage wird in der DB gespeichert (Status: `pending`)
2. **Spieler** sieht: "Anfrage gesendet. Bitte wende dich an deinen Coach."
3. **Coach** sieht in der Verwaltung einen Badge/Tab "Passwort-Anfragen" mit offenen Anfragen
4. **Coach** klickt "Genehmigen" → ein zufälliges 8-stelliges temporäres Passwort wird generiert → Edge Function setzt es via Admin API → das Passwort wird dem Coach im Dialog angezeigt zum Kopieren
5. **Spieler** meldet sich mit dem temporären Passwort an → wird automatisch auf eine "Neues Passwort setzen"-Seite weitergeleitet, bevor er die App nutzen kann

### Technische Umsetzung

**1. DB-Migration**
- Neue Tabelle `password_reset_requests` (`id`, `player_id`, `status` text default 'pending', `created_at`)
- `must_change_password` boolean-Spalte auf `profiles` (default `false`)
- RLS: Spieler können eigene Anfragen erstellen (INSERT), Coach kann alle lesen und updaten

**2. Edge Function `reset-player-password`**
- Nimmt `player_id` + `new_password` entgegen
- Prüft serverseitig ob Aufrufer Coach ist (via `is_coach` DB-Funktion)
- Setzt Passwort via `auth.admin.updateUserById()`
- Setzt `must_change_password = true` auf dem Profil
- Setzt Request-Status auf `approved`

**3. Login-Seite (`Login.tsx`)**
- "Passwort vergessen?" → E-Mail eingeben → Player-ID über Profil-Lookup finden → Insert in `password_reset_requests`
- Bestätigungsmeldung anzeigen

**4. Auth-Flow anpassen (`AuthContext.tsx` + `App.tsx`)**
- Nach Login prüfen: wenn `profile.must_change_password === true` → Redirect auf `/change-password`
- Neue Route `/change-password` (geschützt, aber außerhalb AppLayout)

**5. Neue Seite `ChangePassword.tsx`**
- Zwei Felder: Neues Passwort + Bestätigung
- Ruft `supabase.auth.updateUser({ password })` auf
- Setzt `must_change_password = false` im Profil
- Redirect auf `/feed`

**6. Verwaltung erweitern (`Verwaltung.tsx`)**
- Neuer Tab "Passwort-Anfragen" mit Badge-Zähler
- Liste: Spielername, Datum, Button "Genehmigen" / "Ablehnen"
- Bei Genehmigung: generiert zufälliges Passwort (z.B. `Math.random().toString(36).slice(-8)`), ruft Edge Function auf, zeigt Passwort in einem kopierbaren Dialog

### Dateien

| Aktion | Datei |
|--------|-------|
| Migration | `password_reset_requests` Tabelle + `must_change_password` Spalte + RLS |
| Neu | `supabase/functions/reset-player-password/index.ts` |
| Neu | `src/pages/ChangePassword.tsx` |
| Bearbeiten | `src/pages/Login.tsx` — "Passwort vergessen?" Flow |
| Bearbeiten | `src/pages/Verwaltung.tsx` — Anfragen-Tab |
| Bearbeiten | `src/contexts/AuthContext.tsx` — `must_change_password` ins Profile-Interface |
| Bearbeiten | `src/App.tsx` — Route `/change-password` + Redirect-Logik |

