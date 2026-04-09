

## Self-Service Sign-Up mit automatischer E-Mail

### Ablauf
1. Login-Seite bekommt zwei Tabs/Buttons: "Anmelden" und "Registrieren"
2. Bei Registrierung: Vorname + Nachname eingeben, Passwort wählen
3. E-Mail wird automatisch generiert: `vorname.nachname@sj.de` (lowercase, Umlaute bereinigt)
4. Account wird erstellt, Spieler wird direkt eingeloggt

### Technische Umsetzung

**1. Auto-Confirm aktivieren**
- E-Mail-Bestätigung muss deaktiviert werden, da die @sj.de Adressen keine echten E-Mails sind
- Über `configure_auth` Tool konfigurieren

**2. Login.tsx erweitern**
- Neuer "Registrieren"-Modus mit Feldern: Vorname, Nachname, Passwort, Passwort bestätigen
- E-Mail-Generierung: Umlaute ersetzen (ä→ae, ö→oe, ü→ue, ß→ss), lowercase, Sonderzeichen entfernen
- `supabase.auth.signUp()` mit generierter E-Mail und `metadata: { name: "Vorname Nachname", role: "spieler" }`
- Bei Duplikat-Fehler: Hinweis anzeigen, dass der Name bereits vergeben ist

**3. Verwaltung.tsx — Coach-Erstellung bleibt bestehen**
- Coach kann weiterhin Spieler manuell anlegen (z.B. mit anderer E-Mail oder speziellen Einstellungen)
- Beide Wege koexistieren

### Dateien

| Aktion | Datei |
|--------|-------|
| Bearbeiten | `src/pages/Login.tsx` — Sign-Up Tab/Modus hinzufügen |
| Konfiguration | Auto-Confirm für E-Mail aktivieren |

