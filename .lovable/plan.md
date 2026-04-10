

## YouTube-Video als Pflichtaufgabe mit Watchtime-Tracking

### Uebersicht
Der Coach kann eine Aufgabe erstellen, bei der ein YouTube-Video vollstaendig angeschaut werden muss. Die App trackt die Watchtime ueber die YouTube IFrame Player API und markiert die Aufgabe erst als abgeschlossen, wenn der Spieler mindestens 90% des Videos tatsaechlich geschaut hat. Vorspulen wird erkannt und nicht als geschaute Zeit gezaehlt.

### Wie es funktioniert
- Der Spieler oeffnet die Aufgabe und sieht das eingebettete YouTube-Video
- Die App trackt sekundengenau, welche Teile des Videos tatsaechlich abgespielt wurden (nicht vorgespult)
- Ein Fortschrittsbalken zeigt an, wie viel Prozent geschaut wurden
- Erst ab 90% erscheint der "Aufgabe abschliessen"-Button
- Vorspulen ist moeglich (man kann den Player nicht sperren), aber nur tatsaechlich abgespielte Sekunden zaehlen
- Der Fortschritt wird regelmaessig in der Datenbank gespeichert, damit man das Video auch in mehreren Sitzungen schauen kann

### Aenderungen

**1. Datenbank**
- Neue Spalte `requires_watch` (boolean, default false) in der `tasks`-Tabelle -- markiert ob diese Aufgabe ein Watch-Task ist
- Neue Tabelle `task_watch_progress` mit `task_id`, `player_id`, `watched_seconds`, `total_seconds`, `completed` -- speichert den Fortschritt pro Spieler
- RLS: Spieler koennen eigenen Fortschritt lesen/schreiben, Coach kann alles sehen

**2. YouTube Watch-Komponente (`src/components/feed/YouTubeWatchTask.tsx`)**
- Laedt die YouTube IFrame Player API
- Trackt jede Sekunde ob das Video gerade abspielt (nicht pausiert/vorgespult)
- Zaehlt kumulierte Watch-Sekunden mit einem Set von geschauten Sekundenintervallen
- Speichert Fortschritt alle 10 Sekunden in die Datenbank
- Zeigt Fortschrittsbalken und "Abgeschlossen"-Button ab 90%

**3. Aufgaben-Seite (`src/pages/Aufgaben.tsx`)**
- Beim Erstellen: neuer Toggle "Video muss angeschaut werden" (nur wenn YouTube-URL gesetzt)
- Spieleransicht: Wenn `requires_watch` aktiv, wird statt dem normalen Video-Upload die YouTubeWatchTask-Komponente angezeigt
- Abschluss erfolgt automatisch per Datenbankeintrag statt Video-Upload

**4. Coach-Ansicht**
- Im Task-Detail sieht der Coach pro Spieler den Watch-Fortschritt als Prozentbalken

### Technisches Detail
Die YouTube IFrame API bietet Events wie `onStateChange` (PLAYING, PAUSED, BUFFERING) und `getCurrentTime()`. Jede Sekunde im PLAYING-Zustand wird ein Zeitstempel in ein Set eingetragen. Da ein Set keine Duplikate erlaubt, zaehlt Vorspulen und Zurueckspulen nicht doppelt. Die Groesse des Sets geteilt durch die Videodauer ergibt den echten Fortschritt.

