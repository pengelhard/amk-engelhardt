# AMK Engelhardt

Statische Testseite für AMK Engelhardt, Oberer Kesselweg 2, 86744 Hainsfarth. Kein Build, kein Framework. Ein Merge auf `main` veröffentlicht die Seite über GitHub Pages unter https://pengelhard.github.io/amk-engelhardt/. `.nojekyll` liegt im Wurzelverzeichnis, Pages kopiert den Branch deshalb einschließlich Doku und Skripten. In diesen Dateien stehen keine Zugangsdaten.

## Feature-Karte

| Bereich | Einstieg | Was dort liegt |
| --- | --- | --- |
| Startseite | `index.html` | Einsatzfoto, vier Leistungskacheln, Neuheiten aus `data/aktuelles.json`, Vertrauensband, Telefonabschluss. Skripte: `js/nav.js`, `js/aktuelles.js`, `js/merkzettel.js`. |
| Mieten | `mieten/index.html`, `js/mieten.js` | Öffnet direkt die Kategorie-Pills und die Auswahl. Ohne `?gruppe=` ist Bauzaun & Absperrgitter offen. Bauzaun-Konfigurator in derselben Seite, Skript `js/bauzaun.js`. Verkehrsabsicherung und Schilder sind eine Kategorie. Anhänger und die Typ-Karten über `js/auswahl.js` und `js/schilder.js`. Der Mietzeitraum steht einmal auf der Anfrageseite. Gruppenliste: `js/gruppen.js`. Alte Werte `schilder` und `absperrung` landen in der gemeinsamen Kategorie. |
| Typwahl | `js/typwahl.js`, `window.AMK_TYPWAHL` | Gemeinsame Typ-Karte für Miete und Kauf. Checkbox, Mengenfeld erst nach dem Anhaken, Fokus ins Feld. Bauzaun: Meter oder Felder. Sonst Stückzahl. Anhänger in der Miete nur an- oder abwählen, ohne Anzahl. Anhänger-Details aus `data/anhaenger-eckdaten.js`. Abwählen nimmt die Zeile aus dem Korb. |
| Kaufen | `kaufen/index.html`, `js/kauf.js` | Dieselben drei Hauptgruppen, direkt als Pills. Ohne `?gruppe=` und ohne Suche ist Bauzaun & Absperrgitter offen. Bauzaun, Zubehör, Türen und Sichtschutz bleiben der Filterkatalog in dieser Datei. Verkehrsabsicherung und Schilder sind eine Kategorie, Anhänger die Typwahl über `js/auswahl.js`. |
| Produktseiten | `produkt/<slug>/index.html` | Detailseite zum Kauf, Menge über `js/bestellen.js`. Verkehrsschilder zusätzlich `js/schilder.js`. Daten aus `data/katalog.json`. |
| Anfragekorb | `anfrage/index.html`, `js/merkzettel.js`, `js/anfrage.js` | Speicher `localStorage` unter `amk-wunsch`, Einstieg `window.AMK_WUNSCH`. Miete und Kauf in einem Korb. Versand über `js/form-config.js` und `js/formular.js`, sonst `mailto`. `anfrage/beratung/` ist die leere Beratung, `anfrage/danke/` die Bestätigung. |
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
