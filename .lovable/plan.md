

## Benutzername im Profil (optional, fuer einfacheres Login)

### Uebersicht

Spieler koennen sich im Profil einen optionalen Benutzernamen setzen. Dieser wird NUR fuer den Login verwendet und ist nur fuer den Spieler selbst und den Coach sichtbar. Beim Login kann man dann wahlweise Benutzername oder E-Mail eingeben.

### Aenderungen

**1. Datenbank-Migration**
- `username` Spalte zur `profiles`-Tabelle hinzufuegen (text, nullable, unique)
- `get_email_by_username` Security-Definer-Funktion erstellen: nimmt einen Username, gibt die zugehoerige E-Mail aus `auth.users` zurueck (damit der Login funktioniert, ohne die E-Mail offenzulegen)

**2. `src/pages/Profil.tsx`**
- Neues optionales Feld "Benutzername" unterhalb des Namens
- Hinweistext: "Optional -- vereinfacht den Login. Nur du und dein Coach koennen ihn sehen."
- Validierung: nur Kleinbuchstaben, Zahlen, Punkte/Unterstriche, min. 3 Zeichen
- Wird zusammen mit dem Namen gespeichert

**3. `src/pages/Login.tsx`**
- Das E-Mail-Feld wird zu einem kombinierten "E-Mail oder Benutzername"-Feld
- Beim Submit: wenn die Eingabe kein `@` enthaelt, wird sie als Username behandelt und ueber `get_email_by_username` die E-Mail aufgeloest
- Fehlerbehandlung wenn Username nicht gefunden

**4. `src/pages/Verwaltung.tsx`**
- In der Spieler-Tabelle den Benutzernamen anzeigen (nur Coach sieht diese Seite)

### Sicherheit
- Die `get_email_by_username`-Funktion ist Security Definer und gibt nur die E-Mail zurueck -- kein oeffentlicher Zugriff auf andere Daten
- RLS auf `profiles` bleibt unveraendert -- alle authentifizierten User koennen Profile sehen, aber der Username wird nur im eigenen Profil und in der Coach-Verwaltung angezeigt (UI-seitige Einschraenkung)

