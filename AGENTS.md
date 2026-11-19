# AMK Engelhardt

Statische Testseite für AMK Engelhardt, Oberer Kesselweg 2, 86744 Hainsfarth. Kein Build, kein Framework. Ein Merge auf `main` veröffentlicht die Seite über GitHub Pages unter https://pengelhard.github.io/amk-engelhardt/. `.nojekyll` liegt im Wurzelverzeichnis, Pages kopiert den Branch deshalb einschließlich Doku und Skripten. In diesen Dateien stehen keine Zugangsdaten.

## Feature-Karte

| Bereich | Einstieg | Was dort liegt |
| --- | --- | --- |
| Startseite | `index.html` | Einsatzfoto, vier Leistungskacheln, Neuheiten aus `data/aktuelles.json`, Vertrauensband, Telefonabschluss. Skripte: `js/nav.js`, `js/aktuelles.js`, `js/merkzettel.js`. |
| Mieten | `mieten/index.html`, `js/mieten.js` | Öffnet mit drei Bildkacheln. Ohne `?gruppe=` ist Bauzaun & Absperrgitter offen. Darunter fünf Bildkacheln auf einer Ebene: Bauzaun, Absperrgitter, Bodenleitschwellen, Schleusen, Bühnen. Bauzaun-Konfigurator in derselben Seite, Skript `js/bauzaun.js`, im selben Kartenstil wie die Absperrgitter: Bild links, Name, Länge erst nach dem Anhaken. Weiteres Zubehör bleibt als zugeklappte Zeile. Verkehrsabsicherung und Schilder sind eine Kategorie und behalten dieselben Artikel. Anhänger und die Typ-Karten über `js/auswahl.js` und `js/schilder.js`. Jede gesetzte Karte, jedes Sonderzubehör und die Genehmigung stehen in derselben Anzeige „Ihre Auswahl“, auf dem Desktop rechts. Auf dem Handy erscheint sie erst bei einer Auswahl, als eine Zeile mit Namen und Button. Der Mietzeitraum steht einmal auf der Anfrageseite. Gruppenliste: `js/gruppen.js`. Alte Werte `schilder` und `absperrung` landen in der gemeinsamen Kategorie. Die Startkachel Verkehrsschilder öffnet die Schilderpills (`teil=gefahr`), Verkehrsabsperreinrichtungen die Geräte (`teil=schranken`). |
| Typwahl | `js/typwahl.js`, `window.AMK_TYPWAHL` | Gemeinsame Typ-Karte für Miete und Kauf. Checkbox, Mengenfeld erst nach dem Anhaken, Fokus ins Feld. Bauzaun: Meter oder Felder. Sonst Stückzahl. Anhänger in der Miete nur an- oder abwählen, ohne Anzahl. Anhänger-Details aus `data/anhaenger-eckdaten.js` stehen an der Karte zugeklappt unter „Eckdaten anzeigen“. Abwählen nimmt die Zeile aus dem Korb. |
| Kaufen | `kaufen/index.html`, `js/kauf.js` | Dieselben drei Bildkacheln. Ohne `?gruppe=` und ohne Suche ist Bauzaun & Absperrgitter offen. Die Unterkategorien klappen als Panel mit denselben Bildkacheln auf, keine Text-Pills: Bauzaun, Absperrgitter, Bodenleitschwellen, Schleusen, Bühnen, Zaunzubehör, Türen & Tore, Sichtschutz & Planen. Verkehrsabsicherung und Anhänger genauso, mit denselben Kachelmaßen. Bauzaun, Zubehör, Türen und Sichtschutz bleiben der Katalog in dieser Datei, ohne die Anzeige „Ihre Auswahl“ und ohne die Attributleiste. Suche und Sortierung bleiben. Jede Gruppe zeigt dieselbe Produktkachel: großes Bild, Name, Kurzmaß aus `kicker`, gleiche Höhe, drei Spalten ab 1100 px, zwei ab 720 px, sonst eine. Bild und Name verlinken die Produktseite. Die Checkbox bleibt die Auswahl. Das Mengenformular der Katalogkachel bleibt im HTML und ist im Kaufbrett ausgeblendet. Die Datenblöcke bleiben im HTML und sind im Kaufbrett ausgeblendet. Absperrgitter, Bodenleitschwellen, Schleusen, Bühnen, Verkehrsabsicherung mit Schildern und Anhänger nutzen dieselbe Anzeige: Desktop rechts, auf dem Handy eine Zeile mit Namen und Button, sobald etwas gewählt ist. |
| Produktseiten | `produkt/<slug>/index.html` | `produkt/beispiel/` zeigt den Bauzaun Profi 3,5 × 2,0 m (`bauzaun-10075`) mit Galerie, Bestellart Einzelne Felder oder Ständer und auswählbarem Zubehör. Die Werte stehen in `data/bauzaun-beispiel.json`. Die Seite ist nicht von `kaufen/` verlinkt. Die eigene Produktseite des Artikels bleibt. Detailseite zum Kauf, Menge über `js/bestellen.js`. Bild über die volle Inhaltsbreite, Menge und Button direkt darunter, Daten danach. Die Galerie `js/galerie.js` zeigt `bild` oder die Liste `bilder` und `zeichnungen` aus `data/katalog.json`. Weitere Bilder: Datei plus Eintrag, beschrieben in `docs/kauf.md`. `js/produkt.js` zeigt Technische Daten und Beschreibung offen, die Kategorie in der Brotkrume, Lieferumfang und Zubehör nur bei vorhandenen Listen. Einzelne Schilder liegen unter `produkt/schild-<id>/`. Verkehrsschilder zusätzlich `js/schilder.js`. |
| Anfragekorb | `anfrage/index.html`, `js/merkzettel.js`, `js/anfrage.js` | Speicher `localStorage` unter `amk-wunsch`, Einstieg `window.AMK_WUNSCH`. Miete und Kauf in einem Korb. Der Zähler zählt Positionen, nicht Stückzahlen. Der Hinweis nach dem Hineinlegen nennt den Artikelnamen und bleibt schmal über der Tabbar. Fehlt eine Pflichtangabe, steht die Meldung unter dem Feld. Über der Anfrage steht kein Ortsname. Der Mietzeitraum steht einmal hier, mit dem Hinweis auf zwei Anfragen bei zwei Terminen. Versand über `js/form-config.js` und `js/formular.js`, sonst `mailto`. `anfrage/beratung/` ist die leere Beratung, `anfrage/danke/` die Bestätigung. |
| Aktuelles | `aktuelles/index.html`, `data/aktuelles.json`, `.pages.yml` | Pages CMS schreibt nur `data/aktuelles.json` und Bilder nach `images/aktuelles/`. Dieselbe Datei liest die Startseite. |
| Kontakt | `kontakt/index.html`, `js/einwilligung.js` | Adresse, Zeiten, Karte erst nach Einwilligung. Leaflet liegt unter `assets/leaflet/`. |
| Service, Über uns, Impressum, Datenschutz | `service/`, `ueber-uns/`, `impressum/`, `datenschutz/` | Eigene Seiten. Impressum und Datenschutz sind Entwürfe. |
| Weiterleitungen | `angebote/`, `bauzaun/`, `bauzaun/konfigurator/`, `verkehrssicherung/`, `anhaenger/`, `absperrung/`, `mieten/bauzaun/`, `mieten/absperrung/`, `mieten/verkehrssicherung/`, `mieten/mietpark/`, `kaufen/anhaenger/`, einzelne `produkt/`-Aliase | `meta refresh` auf die aktuelle Seite. Kein eigenes Menü. |
| Gestaltung | `css/styles.css`, `assets/fonts/`, `assets/logo.png` | Schriften lokal. Kein CDN. |
| Sperre | jede HTML-Seite, `robots.txt` | `noindex, nofollow` und `Disallow: /`. |

Nicht eingebunden, aber im Baum: `js/dia.js`, `js/filter.js`, `js/rechner.js`, `js/team.js`, `data/anhaenger.js`. Vor dem Löschen gilt das Funktionsinventar.

## Regeln

- `bauzaun-mieten.net`, Domain, DNS und Mail bleiben unangetastet. Die Adresse steht nur als sichtbarer Kontakt.
- `noindex, nofollow` und `Disallow: /` bleiben. Wer das aufhebt, ändert Seiten und Prüfung im selben PR und nur mit Peters OK.
- Ein Merge auf `main` ist live. Die Testseite zeigt danach diesen Stand.
- Ein PR, ein Thema. Gegeneinander von aktuellem `main`.
- PR-Text nach `.github/pull_request_template.md`. Der erste Abschnitt heißt `## Peters Sollverhalten (wörtlich)`. Danach Abnahmepunkte mit Beleg, Dateien zum Abnahmepunkt, Funktionsinventar bei Löschungen, Gefunden und nicht geändert, Was und warum, Selbstprüfung, Offen.
- Funktionsinventar vor dem Löschen oder Ersetzen: Funktion, Datei, wer sie aufruft. Erst danach entfernen. Öffentliche Einstiege sind `window.AMK_TYPWAHL`, `window.AMK_AUSWAHL`, `window.AMK_WUNSCH`, `window.AMK_SCHILDER`, `window.AMK_ZEIT`, `window.AMK_GRUPPEN`, `window.AMK_FORM`, `window.AMK_FORMULAR`.
- Keine Secrets in Seiten, Skripten, CI oder Commit-Nachrichten. `js/form-config.js` lässt `accessKey` leer.
- HTML, CSS, JavaScript, Bilder, Inhalte, `robots.txt`, CNAME, Pages-Einstellungen und `.pages.yml` nur anfassen, wenn der Auftrag die sichtbare Seite meint.

## Prüfung

Regressionsbefehl: `npm run verify` (`node scripts/verify.mjs`, Node 20 oder neuer, keine Abhängigkeiten).

Der Befehl prüft Lint, Tests, den statischen Stand und die Invarianten. Typecheck entfällt, es gibt kein TypeScript. Geprüft wird:

- JavaScript-Syntax unter `js/`, dazu `data/*.js`, `scripts/*.mjs` und `assets/leaflet/leaflet.js`
- HTML-Grundgerüst jeder Seite: Doctype, `lang="de"`, genau ein Titel, Viewport
- interne Links und Bildpfade, einschließlich CSS-`url()` und Pfade in `js/` und `data/`
- gemeinsame Navigation (Kopf, Menü, Fuß, Leiste) auf allen Inhaltsseiten; Weiterleitungen mit `meta refresh` haben kein Menü
- `noindex, nofollow` auf jeder Seite und `robots.txt` mit genau `Disallow: /`
- keine Token, keine Secrets, keine Zugangsdaten im Dateinamen; die Prüfkette liest keine Zugangsdaten. Der Umfangs-Check liest in der CI nur die `GITHUB_`-Felder des Ereignisses
- Umfang: Warnung ab 500 geänderten Zeilen, ab 15 Dateien und bei Pfaden, die der Abschnitt `## Dateien` nicht nennt. Fehlender Abschnitt `## Peters Sollverhalten (wörtlich)` lässt die Prüfung nur auf einem Pull Request fehlschlagen. Lokal ohne PR-Kontext entfällt dieser Teil

GitHub Actions (`.github/workflows/verify.yml`) führt denselben Befehl auf jedem PR und jedem Push auf `main` aus. Der Workflow veröffentlicht nichts. Pages baut `main` davon unabhängig.

Bekannte Ausnahme, nicht geändert: `assets/leaflet/leaflet.css` verweist auf `images/layers.png` und `images/layers-2x.png`. Beide Dateien fehlen. Die Kontaktkarte setzt einen eigenen Marker, keinen Ebenen-Schalter. Die Prüfung meldet das und bleibt grün.

## Offen

- Ob außer GitHub Pages ein weiterer Hoster hängt, steht nicht im Repo.
