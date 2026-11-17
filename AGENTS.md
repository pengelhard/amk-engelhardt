# AMK Engelhardt

Statische Testseite für AMK Engelhardt, Oberer Kesselweg 2, 86744 Hainsfarth. Kein Build, kein Framework. Ein Merge auf `main` veröffentlicht die Seite über GitHub Pages unter https://pengelhard.github.io/amk-engelhardt/. `.nojekyll` liegt im Wurzelverzeichnis, Pages kopiert den Branch deshalb einschließlich Doku und Skripten. In diesen Dateien stehen keine Zugangsdaten.

## Feature-Karte

| Bereich | Einstieg | Was dort liegt |
| --- | --- | --- |
| Startseite | `index.html` | Einsatzfoto, vier Leistungskacheln, Neuheiten aus `data/aktuelles.json`, Vertrauensband, Telefonabschluss. Skripte: `js/nav.js`, `js/aktuelles.js`, `js/merkzettel.js`. |
| Mieten | `mieten/index.html`, `js/mieten.js` | Vier Hauptgruppen. Bauzaun-Konfigurator in derselben Seite, Skript `js/bauzaun.js`. Absperrgitter, Verkehrsabsperreinrichtungen, Anhänger und die Typ-Karten der Schilder über `js/auswahl.js` und `js/schilder.js`. Zeitraum nur bei der Miete, `js/zeitraum.js`. Gruppenliste: `js/gruppen.js`. |
| Typwahl | `js/typwahl.js`, `window.AMK_TYPWAHL` | Gemeinsame Typ-Karte für Miete und Kauf. Checkbox, Mengenfeld erst nach dem Anhaken, Fokus ins Feld. Bauzaun: Meter oder Felder. Sonst Stückzahl. Abwählen nimmt die Zeile aus dem Korb. |
| Kaufen | `kaufen/index.html`, `js/kauf.js` | Dieselben vier Hauptgruppen. Bauzaun, Zubehör, Türen und Sichtschutz bleiben der Filterkatalog in dieser Datei. Absperrgitter, Absperreinrichtungen, Anhänger und Schilder nutzen Typwahl und `js/auswahl.js`. |
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
- PR-Text nach `.github/pull_request_template.md`. Die Vorlage kommt mit dem eigenen PR. Bis dahin gelten dieselben Abschnitte: Peters Sollverhalten wörtlich, Abnahmepunkte mit Beleg, Dateien zum Abnahmepunkt, Funktionsinventar bei Löschungen, Gefunden und nicht geändert, Was, Warum, Selbstprüfung, Offen.
- Funktionsinventar vor dem Löschen oder Ersetzen: Funktion, Datei, wer sie aufruft. Erst danach entfernen. Öffentliche Einstiege sind `window.AMK_TYPWAHL`, `window.AMK_AUSWAHL`, `window.AMK_WUNSCH`, `window.AMK_SCHILDER`, `window.AMK_ZEIT`, `window.AMK_GRUPPEN`, `window.AMK_FORM`, `window.AMK_FORMULAR`.
- Keine Secrets in Seiten, Skripten, CI oder Commit-Nachrichten. `js/form-config.js` lässt `accessKey` leer.
- HTML, CSS, JavaScript, Bilder, Inhalte, `robots.txt`, CNAME, Pages-Einstellungen und `.pages.yml` nur anfassen, wenn der Auftrag die sichtbare Seite meint.

## Prüfung

Regressionsbefehl `npm run verify` ist geplant und kommt mit dem PR für die Prüfkette. Bis dahin ist die Selbstprüfung ein `git diff --stat`, das keine der gesperrten Pfade zeigt.

## Offen

- Ob außer GitHub Pages ein weiterer Hoster hängt, steht nicht im Repo.
- `assets/leaflet/leaflet.css` verweist auf `layers.png` und `layers-2x.png`. Die Dateien fehlen. Die Kontaktkarte setzt einen eigenen Marker.
