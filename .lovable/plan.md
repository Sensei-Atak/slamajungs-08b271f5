# Redesign: Slama Jama als moderne Basketball-Teamplattform

## Zielbild
Die gesamte App erhält die gewählte helle, redaktionelle Gestaltung: präzise Raster, großzügiger Weißraum, starke Sport-Typografie und Orange nur als gezielter Akzent. Die Oberfläche wird für Coach und Spieler klarer priorisiert, ohne bestehende Funktionen oder Datenabläufe zu verändern.

## 1. Einheitliches Designsystem
- Archivo Black für prägnante Überschriften und Hind für Fließtext, Navigation und Bedienelemente einsetzen.
- Helle Papier-/Weißflächen, dunkle Schrift, feine Court-Linien und kontrollierte orange Akzente definieren; Dark Mode weiterhin vollständig unterstützen.
- Radien auf 6–8 px reduzieren, Schatten fast vollständig durch feine Konturen und Flächenhierarchie ersetzen.
- Einheitliche Seitentitel, Kennzahlen, Statusanzeigen, leere Zustände, Lade-Platzhalter und kurze 150–200-ms-Übergänge schaffen.
- Gemeinsame Bausteine für Seitenkopf, Kennzahl, Abschnittstitel, Status und Inhaltsrahmen anlegen, damit alle Bereiche konsistent bleiben.

## 2. Navigation und Grundlayout
- Desktop als kompaktes linkes Navigationsband mit klar gruppierten Zielen und festem Profilbereich gestalten.
- Mobile auf fünf Kernziele reduzieren und eine zentrale Erstellen-Aktion anbieten; weitere Bereiche kommen in ein übersichtliches Menü.
- Bestehende Bereiche verständlich ordnen: Start, Feed, Aufgaben, Statistiken, Ranking sowie Coach-Verwaltung und Profil.
- Benachrichtigungen, Rollenrechte, offene Passwortanfragen, Abmelden und Theme-Wechsel erhalten.
- Inhaltsbreite je nach Aufgabe steuern: redaktionell für Feed, breit für Statistiken und fokussiert für Formulare.

## 3. Neue priorisierte Startseite
- Eine echte Startseite ergänzen, die vorhandene Daten bündelt: nächstes Spiel, letztes Ergebnis, laufendes Spiel, offene Aufgaben und jüngste Teamaktivität.
- Coaches sehen zusätzlich schnelle Einstiege in Live-Statistik und Verwaltung; Spieler sehen ihre nächsten relevanten Aufgaben und Termine.
- Keine gleichförmige Kachelwand: eine dominante Tageslage, kompakte Kennzahlen und eine schlanke Aktivitätsspur.

## 4. Social Feed und Ranking
- Den Feed nach der gewählten „Minimalist editorial feed“-Komposition umbauen: starke Bildbeiträge, kompakte Autorenzeile und ruhige Interaktionen.
- Mahlzeiten, Fotos, Treffen, Spieltagsbanner, Tagesgewinner, Bewertungen, Likes, Kommentare und Löschrechte vollständig erhalten.
- Erstellen als schnelle, mobile und desktopgerechte Aktion mit klarer Auswahl für Mahlzeit, Foto oder Treffen gestalten.
- Ranking und Hall of Fame als visuelle Bestenliste mit Monatsfokus, Podium und dauerhaft sichtbarem Archiv neu ordnen.

## 5. Aufgaben und Kommunikation
- Offene Aufgaben zuerst anzeigen; Status, Medienart, Fortschritt und Fristwirkung klarer hervorheben.
- Coach-Ansicht als kompakte Fortschrittsübersicht gestalten, Spieler-Ansicht als direkte Erledigungsstrecke.
- Video-Upload, YouTube-Wiedergabe, 90-%-Fortschritt, Links, Fotos, PDFs, Rückgängig-Funktion und Abschlussstatus beibehalten.

## 6. Basketball-Statistiken
- Statistikübersicht zuerst visuell lesbar machen: letzte Ergebnisse, laufende/angesetzte Spiele, zentrale Teamwerte und Spielerführer; Detailtabellen nachgelagert.
- Spieleransichten mit großen Kernwerten, Wurfquoten, Spiel-für-Spiel-Verlauf und kompakten Vergleichen strukturieren.
- Spielzusammenfassung mit prominentem Endstand und klarer Viertel-/Overtime-Leiste gestalten.
- Assists, Steals und Blocks dort nicht wieder in den Vordergrund bringen, wo sie aus dem Live-Ablauf entfernt wurden; erfasste Kernwerte bleiben Punkte, Würfe, Rebounds, Turnover und Fouls.

## 7. Live-Statistik als fokussierter Spielmodus
- Den bestehenden Aktionen-zuerst-Ablauf beibehalten und visuell vom normalen App-Rahmen lösen.
- Spielstand, aktuelles Viertel, Speichern, Viertelende und Spielende als stabile, groß bedienbare Kopfzone gestalten.
- Aktionsleiste und fünf aktive Spieler für schnelle Bedienung im Querformat optimieren; Wechselbank und Korrekturen bleiben direkt erreichbar.
- Automatisches Speichern nach Vierteln, manuelles Speichern, Wiederaufnahme laufender Spiele, Halbzeit, Overtime und Ergebnisabgleich unverändert absichern.

## 8. Profil, Anmeldung und Coach-Verwaltung
- Anmeldung und Registrierung als klare, markentypische Einstiegsseite neu gestalten, ohne generische Marketingfläche.
- Profilinformationen, Avatar, Positionen, Trikotnummer und Benutzername editorial und kompakt ordnen.
- Die umfangreiche Coach-Verwaltung in klar benannte Teilbereiche mit progressiver Offenlegung gliedern; bestehende Konto-, Spielplan-, Aktivitäts- und Passwortfunktionen erhalten.

## 9. Responsive Qualität und Prüfung
- Alle Hauptansichten auf Desktop, Tablet und Mobil prüfen; Live-Statistik zusätzlich gezielt im Querformat testen.
- Mindestgröße von 44 px für wichtige mobile Aktionen, sichtbare Fokuszustände, ausreichende Kontraste und reduzierte Bewegung berücksichtigen.
- Kritische Abläufe als Coach und Spieler testen: Beitrag erstellen, Aufgabe bearbeiten/abgeben, Ranking öffnen, Spiel starten/speichern/wiederaufnehmen/beenden und Profil ändern.

## Technische Umsetzung
- Bestehende React-, Routing- und Lovable-Cloud-Datenlogik weiterverwenden; keine neue Datenbankstruktur ist für das Redesign vorgesehen.
- Seiten in kleinere Darstellungsbausteine zerlegen, ohne Abfragen oder Rollenprüfungen unnötig umzubauen.
- Recharts nur für sinnvolle Statistikvisualisierungen einsetzen; Tabellen bleiben als vertiefende Ebene verfügbar.
- Semantische Farb-, Typografie-, Schatten- und Abstandswerte zentral definieren und bestehende UI-Bausteine darauf abstimmen.
- Umsetzung in Etappen: Grundlayout und Designsystem, Start/Feed, Aufgaben/Ranking, Statistiken/Live-Spiel, Profil/Verwaltung/Login, abschließende Geräte- und Rollenprüfung.
