

## Mobile Logout + "Angemeldet bleiben"

### Änderungen

**1. Logout nur auf der Profilseite (`Profil.tsx`)**
- "Abmelden"-Button am Ende der Profilseite hinzufügen (destructive variant, volle Breite)
- Kein Logout-Icon in der Bottom-Nav — bleibt wie sie ist

**2. "Angemeldet bleiben" Checkbox (`Login.tsx`)**
- Checkbox unter dem Passwort-Feld: "Auf diesem Gerät angemeldet bleiben" (Standard: aktiviert)
- Wenn deaktiviert: `rememberMe = false` in `localStorage` speichern

**3. Auto-Logout Logik (`AuthContext.tsx`)**
- Beim App-Start prüfen: wenn `rememberMe` nicht `true` ist → `signOut()` aufrufen
- Dadurch wird die Session beim nächsten Öffnen beendet

### Dateien

| Aktion | Datei |
|--------|-------|
| Bearbeiten | `src/pages/Profil.tsx` — Abmelden-Button hinzufügen |
| Bearbeiten | `src/pages/Login.tsx` — "Angemeldet bleiben" Checkbox |
| Bearbeiten | `src/contexts/AuthContext.tsx` — Remember-me Logik |

