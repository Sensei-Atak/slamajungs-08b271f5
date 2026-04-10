

## In-App Benachrichtigungen bei neuen Kommentaren

### Uebersicht
Spieler sehen ein Glocken-Symbol in der Navigation. Wenn jemand ihren Beitrag kommentiert, erscheint dort ein roter Zaehler. Per Klick oeffnet sich eine Liste der letzten Benachrichtigungen.

### Aenderungen

**1. Datenbank**
- Neue Tabelle `notifications` mit Spalten: `id`, `user_id` (Empfaenger), `type` (z.B. "comment"), `title`, `body`, `post_id`, `is_read`, `created_at`
- RLS: Nutzer koennen nur eigene Benachrichtigungen lesen und als gelesen markieren
- Datenbank-Funktion + Trigger auf `post_comments` INSERT: ermittelt den Besitzer des Beitrags (aus `feed_posts` oder `meals` je nach post_id-Format) und erstellt eine Notification -- aber nicht, wenn man seinen eigenen Beitrag kommentiert

**2. Notification-Dropdown (`src/components/NotificationBell.tsx`)**
- Glocken-Icon mit Badge fuer ungelesene Anzahl
- Popover mit Liste der letzten Benachrichtigungen (Name, Vorschau, Zeitstempel)
- Klick auf eine Benachrichtigung markiert sie als gelesen
- "Alle gelesen"-Button

**3. AppLayout anpassen**
- NotificationBell in die Desktop-Sidebar-Kopfzeile und Mobile-Header einbauen

### Sicherheit
- RLS stellt sicher, dass Spieler nur ihre eigenen Benachrichtigungen sehen
- Der Trigger laeuft als SECURITY DEFINER, damit er auf beide Tabellen zugreifen kann

