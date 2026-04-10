

## Pop-Up Erinnerung fuer offene Aufgaben nach dem Login

### Uebersicht

Nach dem Login sehen Spieler ein Dialog-Pop-Up, das sie an offene Aufgaben erinnert, bei denen sie noch nichts eingereicht haben. Das Pop-Up erscheint nur einmal pro Session und nur wenn es tatsaechlich offene Aufgaben ohne Abgabe gibt.

### Aenderungen

**1. Neue Komponente: `src/components/feed/TaskReminder.tsx`**
- Dialog-Komponente die beim Feed-Mount prüft ob offene Tasks ohne Submission existieren
- Query: Alle Tasks wo `is_closed = false` laden, dann `task_submissions` fuer den aktuellen User laden, und Tasks ohne Submission filtern
- Zeigt Anzahl offener Aufgaben und einen Button "Zu den Aufgaben" (navigiert zu `/aufgaben`)
- Zweiter Button "Spaeter" schliesst das Pop-Up
- Wird nur einmal pro Session angezeigt (sessionStorage Flag)

**2. `src/pages/Feed.tsx`**
- `TaskReminder` Komponente einbinden, damit das Pop-Up beim Laden des Feeds erscheint (Feed ist die erste Seite nach Login)

### Logik
- Offene Tasks = `tasks` wo `is_closed = false`
- Fehlende Abgaben = offene Tasks ohne passenden Eintrag in `task_submissions` fuer den aktuellen User
- Pop-Up nur anzeigen wenn `fehlende Abgaben > 0` und `sessionStorage.getItem("taskReminderShown")` nicht gesetzt ist

