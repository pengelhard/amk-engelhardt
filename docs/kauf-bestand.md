# Kaufbereich, Bestand und gemeinsamer Aufbau

Stand nach dem Refactoring. Die Funktionen bleiben die des Stands davor. Mieten nutzt die geteilten Dateien nur so, dass die Zeilen und das zweispaltige Layout bleiben.

## Dateien

HTML: `kaufen/index.html` (Übersicht, Ober- und Unterkacheln, Bauzaun-Liste), `produkt/beispiel/index.html`, jede Seite unter `produkt/` (Detail, Galerie, Auswahl). CSS: `css/styles.css` mit den Variablen `--kachel-radius`, `--kachel-rand`, `--kachel-schatten`, `--kachel-schatten-ruhe`, `--kachel-luecke`, `--bild-quer`, `--bild-produkt`, `--kreis-groesse`, `--kachel-grund`. JS: `js/kauf-bausteine.js` (Kachel, Kreis, Menge), `js/kauf.js` (Navigation, Panel, Liste), `js/auswahl.js` (Katalog laden, Typ-Liste), `js/schilder.js` (Schilderliste über dieselbe Typ-Karte), `js/typwahl.js` (Miet-Zeile und Aufruf der Kauf-Kachel), `js/kauf-auswahl.js` (Detail, Ständer, Fuß, Schelle, Zubehör, Korb), `js/beispiel.js` (Beispielseite, dieselben Bausteine), `js/galerie.js`, `js/produkt.js`, `js/merkzettel.js` (Speicher `amk-wunsch`), `js/anfrage.js` (Korb-Ansicht, Gruppe Kauf, Zeile Komplett-Ständer). Daten, unverändert: `data/katalog.json`, `data/kauf-auswahl.json`, `data/anhaenger-eckdaten.js`, `data/bauzaun-beispiel.json`.

## Vorher doppelt, jetzt ein Baustein

Die Produktkachel stand in `js/typwahl.js`, das Zubehör noch einmal in `js/kauf-auswahl.js` und `js/beispiel.js`. Die Schrittsteuerung stand dreimal. Jetzt baut `js/kauf-bausteine.js` die Produktkachel (`kachel--produkt`), den Kreis (`kachel-kreis`) und die Menge (`kachel-menge`). Oberkacheln sind `kachel--ober`, Unterkacheln `kachel--unter`, dieselben Maße und derselbe Rahmen wie bisher. Die Mitlauf-Box auf der Liste ist `.konfig-summary.kachel-box` („Ihre Auswahl“), auf der Detailseite `.beispiel-korb.kachel-box`.

## Abweichende Stile, die bleiben

Die Miet-Zeile `.pick` bleibt flach und zweispaltig. Sie ist kein Kauf-Kachel. „Ihre Auswahl“ auf der Liste behält den weichen Schatten der Leiste, der Korb auf der Detailseite den harten Schatten. Beides ist die Auswahl-Box, mit demselben Inhalt, nicht mit derselben Fläche. Eckdaten der Anhänger stehen weiter unter der Kachel, nicht in ihr. Piktogramme in der Verkehrs-Leiste bleiben enthalten auf weiß, Fotos füllen das Feld.

## Toter oder ungenutzter Code, nicht gelöscht

`js/typwahl.js` kann noch eine `.pick-linked`-Kachel bauen. Kein Aufruf setzt `href` ohne die Kauf-Kachel, die Miete übergibt kein `href`. Die passenden Regeln `.kauf-board .pick-linked` in `css/styles.css` bleiben, damit nichts verschwindet, was ein späterer Aufruf noch träfe. `#kauf-vorlage` gibt es im HTML nicht. `js/kauf.js` liest die Bauzaun-Artikel deshalb nur aus `section.copy`. Die große Aufteilung von `js/beispiel.js` in `js/kauf-auswahl.js` wäre ein Löschen von mehreren hundert Zeilen und bleibt aus.

## Funktionsliste

Oberkacheln, Unterkacheln, undurchsichtiges Hover-Panel über „Ihre Auswahl“ und unter dem Seitenkopf, Schließen per Klick und Escape. Adresse `?gruppe`, `?kat`, `?teil`. Auf Verkehrsabsicherung, Anhängern und den Zaun-Gruppen außer dem Bauzaun-Katalog stehen die Kategorien untereinander; die Leiste markiert per IntersectionObserver die sichtbare Kategorie, ein Klick scrollt zur Überschrift. Suche und Sortierung gelten über alle Abschnitte, leere Abschnitte verschwinden. Der Bauzaun-Katalog bleibt die eigene Liste, mit Schnellauswahl Ständer und Einzelfelder, Link „Details anpassen“ und der rechten Box „Ihre Auswahl“. Die Mengen schreiben denselben Korb wie die Detailseite; ein geänderter Fuß oder eine geänderte Schelle wird nicht überschrieben. Runder Auswahlkreis, Mengenfeld nach dem Anhaken, Grenze 9999. Mitlauf-Auswahl mit einem Scrollbalken. Automatischer Korb. Komplett-Ständer und Einzelfelder, Fuß- und Schellentausch, Blöcke „Im Komplett-Ständer enthalten“ und „Zusätzlich“, im Korb die Gruppe Kauf mit der Zeile Komplett-Ständer. Zubehör aus `data/kauf-auswahl.json`. Galerie auf der Produktseite und der Beispielseite. Cache-Busting, `noindex`, Handy ohne Quer-Scroll, `aria-expanded`. Mieten: keine Kauf-Kachel, Zeilen bleiben, ab 980 px zwei Spalten. Keine Funktion entfernt: `showTeil` und `apply` blenden ohne `data-stapel` weiter nur eine Unterkategorie ein.
