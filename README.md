# AMK Engelhardt – Prototyp

Statische Testseite für AMK Engelhardt (Absperrungen Mieten Kaufen), Oberer Kesselweg 2, 86744 Hainsfarth. Kein Build, kein Framework. Alle Links sind relativ und funktionieren unter `/amk-engelhardt/`, sobald GitHub Pages aus dem Branch `main` eingeschaltet wird. Eine Pages-Action und eine Vercel-Konfiguration gibt es bewusst nicht. Die Datei `.nojekyll` liegt bereit.

Suchmaschinen sind ausgesperrt: `meta name="robots" content="noindex, nofollow"` auf jeder Seite und `robots.txt` mit `Disallow: /`. Beides ist unsichtbar. Auf den Seiten steht kein „Prototyp“, kein „Beispiel“ und kein grüner Testbalken. Zoomen ist nicht gesperrt (`width=device-width, initial-scale=1, viewport-fit=cover`, ohne `maximum-scale`).

An der bestehenden Website, an Domain, DNS oder E-Mail wurde nichts geändert.

## Seiten

Die Startadresse `index.html` ist der Einstieg. `mieten/` ist die Übersicht der drei Mietbereiche. `kaufen/anhaenger/` leitet auf den Verkaufskatalog `kaufen/` weiter.

| URL | Inhalt |
| --- | --- |
| `index.html` | Einstieg: Bildkarussell im Hero, Bildflächen, Aktuelles |
| `aktuelles/` | Sonderangebote, Neuheiten und besondere Produkte aus `data/aktuelles.json` |
| `angebote/` | Verweis auf `aktuelles/` |
| `mieten/` | Übersicht Mieten: Bauzaun, Absperrung, Anhänger |
| `mieten/bauzaun/`, `mieten/absperrung/`, `mieten/mietpark/` | Bauzaun ist ein Konfigurator. Absperrung und Mietpark bleiben Bildkacheln |
| `kaufen/` | Nur Verkaufsanhänger, ohne Filterleiste |
| `kaufen/anhaenger/<slug>/` | Detail eines Verkaufsanhängers |
| `produkt/<slug>/` | Detail eines Mietprodukts |
| `service/` | Full Service und die zwei genannten Partner |
| `anfrage/` | Anfrageliste wie ein Warenkorb, `mailto`. Leer zusätzlich „Individuelle Beratung anfragen“ |
| `ueber-uns/` | Firma, Standort |
| `kontakt/` | Kontaktdaten, Zeiten, Terminabsprache, Karte nach Einwilligung, Route in neuem Tab |
| `impressum/`, `datenschutz/` | Angaben nach § 5 DDG und Datenschutz nur für das, was die Seite nutzt. Entwurf, vor Veröffentlichung rechtlich prüfen. Dieser Satz steht nur hier, nicht auf den Seiten. |

Der Kopf trägt auf jeder Seite oben rechts ein Hamburger-Menü. Es öffnet dasselbe Panel: Startseite, Mieten, Kaufen, Aktuelles & Angebote, Kontakt, dazu „Anrufen 09082 921777“ und „Anfrage stellen“. Die aktuelle Seite ist markiert. Ab 980 px bleiben Mieten, Kaufen, Aktuelles & Angebote und Kontakt zusätzlich sichtbar, rechts daneben das Anfrage-Zeichen mit Zähler und der Hamburger. Die Fußleiste mit Mieten, Kaufen, Kontakt, Anfrage und Anrufen bleibt unter 980 px. Service, Über uns, Impressum und Datenschutz bleiben in der Fußzeile erreichbar.

JavaScript ergänzt nur: Merkzettel in `localStorage`, das Bildkarussell auf der Startseite, die Bauzaun-Konfiguration als eine Position, Zusammensetzen der `mailto`-Nachricht, Einlesen von `data/aktuelles.json`, die Einwilligung für die Karte und danach Leaflet. Die Seiten, die Kacheln und das Formular stehen im HTML. Ein VDE-Häkchen gibt es nicht, solange kein Artikel `data-vde="ja"` trägt. `js/rechner.js` ist nicht mehr eingebunden.

Das Karussell liegt im Hero und lässt Slogan und Lead stehen. Die Buttons „Anfrage stellen“ und „Anrufen“ stehen im Menü, nicht im Hero. Fünf vorhandene Fotos: Bauzaun Standard, Absperrschranke, Verkehrsschilder, Fahrzeugtransporter, Kühlanhänger 1,3 t. Nachweise stehen schon im Impressum. Wechsel alle 5 Sekunden, Pause bei Hover, Fokus und über den Pause-Knopf. `prefers-reduced-motion` schaltet den Automatiklauf aus. Die erste Folie lädt sofort, die übrigen erst beim Wechsel. Kein CDN.

## Aktuelles und Angebote

Michael Engelhardt pflegt nur diesen Bereich, über [Pages CMS](https://pagescms.org). Alles andere auf der Testseite pflegen wir. Pages CMS schreibt in `data/aktuelles.json`. Die Startseite und `aktuelles/` lesen dieselbe Datei, ohne Build. Eine Liste aus einzelnen Markdown-Dateien wäre ohne Build nicht auffindbar, deshalb ist die Sammlung diese eine JSON-Liste. `.pages.yml` gibt im CMS nur diese Liste und den Medienordner `images/aktuelles/` frei.

Felder: Titel, Kurztext, Bild, Bildbeschreibung, Typ (Angebot, Neuheit, Besonderes Produkt), Preis (leer heißt „Preis auf Anfrage“), Datum, Gültig bis, Sichtbar. Abgelaufene Einträge und unsichtbare Einträge verschwinden. Der genannte Gültig-bis-Tag zählt noch. Die Startseite zeigt höchstens die drei neuesten und blendet den ganzen Bereich aus, wenn nichts sichtbar ist. „Anfragen“ legt den Eintrag in den Anfragekorb.

Der einzige Startinhalt ist „Anhänger zum Kauf“, mit dem vorhandenen Foto des Fahrzeugtransporters und ohne Preis. Der Nachweis steht im Impressum. Neue Bilder lädt Michael nach `images/aktuelles/` hoch, Querformat etwa 1200 × 675 Pixel.

### So legt Michael einen Eintrag an

1. Den Link in der Einladungs-Mail öffnen und anmelden. Ein GitHub-Konto ist nicht nötig.
2. „Aktuelles & Angebote“ öffnen.
3. Einen Eintrag hinzufügen: Titel, Kurztext, Typ und Bild. Die Bildbeschreibung ausfüllen.
4. Den Preis leer lassen, wenn er auf Anfrage ist. „Gültig bis“ nur setzen, wenn der Eintrag endet. „Sichtbar“ anlassen. Ein Datum setzt die Reihenfolge.
5. Speichern. Der Eintrag steht unter Aktuelles und, wenn er zu den drei neuesten gehört, auf der Startseite.

### So lädt Peter ihn ein

1. Unter https://app.pagescms.org mit dem GitHub-Konto anmelden, das `pengelhard/amk-engelhardt` sieht.
2. Die Pages-CMS-GitHub-App für dieses Repository freigeben, falls sie noch fehlt.
3. Das Repository öffnen und den Branch `main` wählen.
4. Collaborators öffnen und die E-Mail-Adresse von Michael Engelhardt eintragen.
5. Die Einladung senden. Er erhält einen Anmeldelink, sieht nur Aktuelles und den Bilderordner und kann `.pages.yml` nicht ändern.

## Verkauf und Miete

Nur Anhänger sind zum Kauf. Bauzaun und Absperrung haben keinen Kaufpreis und keinen Kauf-Button. Im Formular stehen unter „Kauf“ ausschließlich die Beispiel-Anhänger. Bauzaun, Absperrung und Mietpark sind Bildflächen unter `mieten/`, nicht eine Filterleiste.

Kühlanhänger vermietet AMK für Events. Im Mietpark stehen „Kühlanhänger“ und „Kühlanhänger für Events“, Preis auf Anfrage, nur zur Miete, nicht unter `kaufen/`. Massen stehen nicht auf den Seiten.

## Von der bestehenden Website übernommen

Gelesen wurden die öffentliche Seite [bauzaun-mieten.net](https://bauzaun-mieten.net/), das Menü, die Sitemap und die WordPress-Seiten, darunter Start, Absperrsysteme, Mieten/Kaufen, Service, Kontakt und Anfahrt, Über uns, Partner, Impressum, Datenschutz, AGB und Aktuelles.

Übernommen und neu formuliert:

- Name, Inhaber Michael Engelhardt, Adresse Oberer Kesselweg 2, 86744 Hainsfarth
- Mobil 0151 14803644, Telefon 09082 921777, Telefon II 09082 3296, Fax 09082 921102
- E-Mail nur `info@bauzaun-mieten.net`
- Zeiten: Montag bis Freitag 8:00–17:00 Uhr, weitere Termine nach Vereinbarung, auch am Wochenende und außerhalb der Geschäftszeiten
- Hinweis, vor einem Besuch einen Termin zu vereinbaren, weil das Team oft unterwegs ist
- Gründung 2011 durch Michael Engelhardt, gelernter Metallbaumeister, Ergänzung des väterlichen Betriebs (Schlosserei, Schmiede und Zaunbau)
- Anspruch, einer der führenden Anbieter von Absperrsystemen in Süddeutschland zu sein
- Partnernetz in Deutschland und im angrenzenden Raum
- Sortiment zur Miete: Bauzäune in verschiedenen Höhen und Festigkeiten, Bauzaunfüße, Türen oder Tore, Bauzaunschloss, Personengitter und Demogitter aus feuerverzinktem Stahl in verschiedenen Gewichtsklassen, klappbare Polizeigitter (Hamburger Gitter), Absturzsicherungen, Drahtgitterzaun, Sichtschutz aus Blech
- Zubehör: Notausgangsfahnen, Feuerlöscher, Kabelbrücken sowie Teile für Sicherheit, Stabilität, Transport, Sichtschutz und Zugangskontrolle
- Großflächige Transportfahrzeuge und Anhänger, Fahrzeuge mit großem Ladevolumen auch zur Miete für den Selbsttransport
- Kühlanhänger zur Miete für Events (Peter, 15.11.2026). Maße, Nutzlast und Preis fehlen noch
- Service: Beratung und Planung, Anlieferung, Aufbau, Instandhaltung, Abbau, Abtransport, eigene Leute, individuelle Absprachen, zentrale Abwicklung
- Zielgruppen nur als Band unter den Produkten: Privat, Firmen, Events
- Kennzahlen der alten Startseite: 1.000+ Kundinnen und Kunden, 200+ Produkte
- Keine Namen von Referenzkunden online; Kontakt zu Referenzen nur nach Rücksprache und Freigabe
- Angebot unverbindlich nach eigenen Vorgaben, keine öffentlichen Einzelpreise für Bauzaun und Absperrung
- Partner Bauzaun Nord / E.A.D. Mobilzaun GmbH, Dieter Blicke, Erichstr. 3, 30449 Hannover, 0511 2700815, www.mietzaun.de
- Partner bauzaun.net / Pizeu ltd., Barbarastr. 10, 53925 Kall, 02447 913542, Handy 0151 56011394 tagsüber, www.bauzaun.net

Die alte Angabe „7+ Jahre Erfahrung“ steht nicht mehr auf der Seite. Stattdessen steht das Gründungsjahr 2011.


## Produktkarten

Bauzaun und Absperrung folgen den gelesenen Seiten von Schwarzfeller. Die Texte sind neu formuliert. Deren Preise sind nicht übernommen. Bauzaun LIGHT fehlt, weil Schwarzfeller ihn nicht vermietet. Weg sind die alten Platzhalter ohne Maß auf den gelesenen Seiten: Kabelbrücke, Absturzsicherung, Personen- und Demogitter, Sammel-Zubehör. Neu dazu, nur zur Miete: Secure, XXL, Exklusivtür, Tor mit Drehgelenken, Holz-Sichtschutz, Plane, Strebe, Hochsicherheitsschelle, Polizeigitter Solid, Barriere, Absperrschranke, Verkehrsschilder.

Anhänger heißen nach dem Typ. Jede Anhängerkarte bleibt „Beispiel“. Foto und Eckdaten gehören zusammen und sind in `docs/bildquellen.md` belegt. Was eine Quelle nicht sagt, steht so auf der Seite.

## Weggelassen

- Alle Container: Baucontainer, Materialcontainer, Bürocontainer, Bauwagen. Keine Kachel, keine Seite, kein Formularfeld
- Dixi-Toiletten, Toilettenwagen und Sanitärcontainer
- Kauf von Bauzaun und Absperrung
- Platzhalter-Adresse `support@domainname.com`
- Theme-Demoinhalte (Tectxon, englische Teamseiten, erfundene Personen, `info@example.com`, Portfolio Öl und Gas)
- Leere Seite Aktuelles
- AGB: die alte Seite sagt nur „Diese Seite befindet sich zur Zeit in Überarbeitung.“
- Die alte Datenschutzerklärung (Google Analytics, YouTube, Google Fonts, reCAPTCHA, Datenschutzbeauftragter). Die neue Seite beschreibt nur Hosting, Kontakt, die Karte nach Einwilligung und die lokale Schrift. Ein Datenschutzbeauftragter ist nicht genannt
- Hinweis der EU-OS-Plattform. Die Plattform ist eingestellt
- Headerbild der alten Startseite, weil darin das Öl-Pumpen-Logo des Themes steckt
- Alte Mini-Grafiken von 2012

## Bilder

Jede verwendete Datei, ihre Quelle und die dazugehörigen Maße stehen in `docs/bildquellen.md` und im Impressum. Neben den Bildern steht kein Nachweis. Produktfotos von Schwarzfeller und das Händlerfoto des Kühlanhängers sind geladen; die Rechteklärung steht bei den offenen Fragen, nicht auf den Seiten. Wikimedia-Dateien der Anhänger tragen CC BY-SA. Das Logo bleibt das der bestehenden Website.

Der Planenanhänger ist `images/anhaenger-plane.webp`, 2440×1580. Quelle: Fiver, der Hellseher, Wikimedia Commons, Datei „STEMA HP 4050 (rear)“, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:STEMA_HP_4050_(rear).jpg und https://creativecommons.org/licenses/by-sa/4.0/deed.de. Für die Kachel beschnitten, Kennzeichen im Original bereits verdeckt, als WebP gespeichert. Das frühere Foto von Rüdiger Müller ist ersetzt.

`images/kuehlanhaenger-20.webp` (Händlerfoto PKW-Anhänger-Center mit Schriftzug www.pkw-anhaenger.center, Schild Ahrens und Marke Cibin) ist von den Seiten und aus `images/` entfernt. Ein frei lizenziertes Foto eines PKW-Kühlanhängers mit mindestens 1600 px Breite, ohne Wasserzeichen und ohne fremde Marke im Fokus, war in den geprüften CC-Beständen nicht zu finden. Beide Kühlanhänger-Karten zeigen deshalb vorerst `images/kuehlanhaenger-13.webp` (Herb Fahrzeugteile, 540×405). Das ist kein Bestand von AMK.

Die Kontaktkarte ist ohne Einwilligung `images/anfahrt-hainsfarth.webp`, 1600×900. Einmalig aus Kacheln von https://tile.openstreetmap.org/ zusammengesetzt, Zoom 16, nicht von Google. Namensnennung „© OpenStreetMap-Mitwirkende“, https://www.openstreetmap.org/copyright, ODbL. Nominatim und Photon liefern für „Oberer Kesselweg 2, 86744 Hainsfarth“ nur die Straße, nicht eine eigene Hausnummer: 48.9541035, 10.6229489 (OSM Way 91872453). Der Marker sitzt auf diesem Straßenpunkt.

Nach Einwilligung ersetzt `js/einwilligung.js` das Bild durch eine Leaflet-Karte. Leaflet 1.9.4 liegt unter `assets/leaflet/` (BSD-2-Clause), es gibt keinen Abruf eines Karten-CDN und keinen Google-API-Schlüssel. Google Maps bietet `gestureHandling` nur mit Schlüssel, und der Schlüssel ist ein kostenpflichtiger Dienst. Die Kacheln kommen erst dann von https://tile.openstreetmap.org/{z}/{x}/{y}.png. Das Mausrad zoomt ohne Strg, auf dem Handy zoomen zwei Finger, verschieben geht mit einem Finger. Das entspricht `gestureHandling: "greedy"`. Die Wahl steht in `localStorage` unter `amk-karte` (`ja` oder `nein`). „Cookie-Einstellungen“ im Fuß öffnet die Leiste erneut. Ablehnen zeigt wieder das ruhende Bild, die Adresse und „Route in Google Maps öffnen“. Der Link lautet `https://www.google.com/maps/dir/?api=1&destination=Oberer+Kesselweg+2,+86744+Hainsfarth` und öffnet einen neuen Tab. Kein iframe.

Nicht mehr eingebunden und aus `images/` entfernt: das alte Bauzaunfoto der bestehenden Website, das alte Sichtschutzfoto, der Motorradtransporter (Humbaur KFT) und der beladene offene Anhänger. Sie zeigten nicht den jeweiligen Typ. `images/baustelle.webp` liegt noch da und ist auf keiner Seite eingebunden.

## Farben und Kontrast

Hauptfarbe ist ein gedecktes Tannengrün `#1F4D3A`. Weiße Schrift darauf liegt bei etwa 9,6:1. Der Hover der Flächen ist `#16382B` (Weiß darauf etwa 12,9:1). Logo-Grau `#6E6D6D` bleibt der Fließtext (etwa 5,2:1), Überschriften `#3A3939`, Absetzflächen `#F3F7F9`.

Logo-Grün `#76B729` ist nur noch Akzent. Auf Weiß erreicht es etwa 2,45:1 und ist damit kein Text und keine große Fläche. Es steht auf der kleinen Marke „TL“ (Schrift `#1A1A1A`, etwa 7,1:1), als Strich der aktiven Fußleiste, als Hover-Ring an den Buttons und als Farbe der Link-Unterstreichung. Links und der Fokusring selbst sind `#1F4D3A`, der Link-Hover `#132E22`.

Unter 980 px liegt eine feste Fußleiste: Mieten, Kaufen, Kontakt, Anfrage, Anrufen (`tel:+499082921777`). Jede Fläche ist mindestens 48 px, die aktive Seite trägt `aria-current`, der Inhalt bekommt `padding-bottom` inklusive `env(safe-area-inset-bottom)`. Ab 980 px bleibt die Kopfnavigation mit drei Punkten plus Anfrage-Zeichen, die Fußleiste ist aus.

Die Schrift ist Manrope, lokal als WOFF2 unter `assets/fonts/`, Lizenz SIL OFL. Es sind keine Schriften von einem CDN eingebunden. Der Kopf ist durchgehend ein weißer Balken. Logo und Menü ändern beim Scrollen weder Größe noch Form.

Impressum und Datenschutz sind neu geschrieben. Eine USt-IdNr. steht auf der Seite nicht: die alte Seite ließ das Feld leer, und ohne Nummer ist die Zeile nicht einschlägig. § 18 Abs. 2 MStV steht nicht im Impressum. Für eine gewerbliche Produktseite wird er hier nicht als Pflicht behauptet. Die Angabe zum EU-US Data Privacy Framework ist nur der Verweis auf die öffentliche Liste vom 15.11.2026, keine eigene Zusage. Bildnachweise stehen im Impressum. Entwurf, vor Veröffentlichung rechtlich prüfen. Dieser Hinweis steht nur in dieser Datei.

## Bauzaun-Konfigurator

`mieten/bauzaun/` fragt Art (Standard, F1, Secure, XXL), Menge in Metern oder Feldern und den Mietzeitraum. Meter werden nicht in Felder umgerechnet: Standard und F1 sind 3.450 mm breit, Secure 3.472 mm, XXL 3.500 mm (Schwarzfeller). Betonfüße, Verbindungsschellen und Streben nach Bedarf stehen als inklusive, ohne Stückzahl. Sonderwünsche sind Häkchen mit „Aufpreis auf Anfrage“: Hochsicherheitsschellen, Bauzaunplane, Sichtschutz, Tür, Tor, Zusatzstreben. „In die Anfrage legen“ schreibt eine Position. Die Produktseiten bleiben unter „Einzelteile“, sie sind nicht mehr der Hauptweg. Die Mieten-Kachel verlinkt `bauzaun/`.

## Beispielpreise der Anhänger

Auf den Seiten steht bei Anhängern nur „Preis auf Anfrage“. Frühere Beispielbeträge (25 € pro Tag, 79 € pro Wochenende, Kauf 1.190 €, 2.450 € und 980 €) sind erfunden und nicht mehr sichtbar. 120 € pro Woche bleibt entfallen. Maße, Zuladung, Zulassung und Lieferzeit der Anhänger stehen ebenfalls nicht auf den Seiten, solange sie nicht von AMK belegt sind. Bildrechte stehen in `docs/bildquellen.md`. Bauzaun und Absperrung bleiben bei „Preis auf Anfrage“. Die Maße dort stammen aus den gelesenen Herstellerangaben.

Ein VDE-Badge gibt es nicht. Die gelesenen Schwarzfeller-Seiten nennen kein VDE, deshalb gibt es keinen VDE-Filter. TL steht nur an der Absperrschranke und nur für die Folie. Die Sortierung „Beliebt“ ist von den Seiten.

## Anfrage

„Zur Anfrage hinzufügen“ legt den Artikel in `localStorage` (`amk-wunsch`) oder erhöht die Menge. Es nimmt ihn nicht wieder herunter. Ein Hinweis zeigt „Weiter umsehen“ und „Zur Anfrage“. Die Übersicht unter `anfrage/` zeigt Bild, Name, Miete oder Kauf, Menge, Entfernen und „Preis auf Anfrage“. Eine Bauzaun-Konfiguration zeigt stattdessen Art, Menge, Zeitraum, „Inklusive“ und Extras, ohne zweiten Mengenregler. Liegt eine Miete darin, kommen Zeitraum von/bis, die Wahl „Lieferung, Aufbau und Abbau“ oder „Selbstabholung“, Einsatzort und PLZ dazu. Bei einzelnen Zaunartikeln zusätzlich Länge und Höhe (`laenge`, `hoehe`, `produkt`). Ist der Korb leer, stehen drei gleichwertige Wege: Mieten, Kaufen und „Individuelle Beratung anfragen“ (`anfrage/beratung/`: Anliegen, Ort, Zeitraum optional, Kontakt, dieselbe `mailto`-Zeile). Name, Firma (optional), Telefon, E-Mail und Nachricht bleiben. Absenden öffnet nur `mailto:info@bauzaun-mieten.net` mit der Liste. Der Satz daneben heißt „Ihr E-Mail-Programm öffnet sich“. Ohne JavaScript steht der Hinweis, an dieselbe Adresse zu schreiben. Die Angaben liegen zusätzlich unter `amk-anfrage-meta`. Das steht kurz im Datenschutz, ohne Banner.

## Offene Fragen an Peter

Aus der Struktur:

1. Kühlanhänger zur Miete sind bestätigt. Auf den Seiten stehen keine Massen und keine Preise. Das Foto mit dem Schriftzug pkw-anhaenger.center ist entfernt. Beide Karten nutzen vorerst das Foto von Herb Fahrzeugteile, 540 px breit. Welche echten Fahrzeuge, Fotos und Preise ersetzen das, und dürfen die Schwarzfeller- und Herb-Fotos veröffentlicht werden?
2. Welche Produkte sind tatsächlich VDE-zertifiziert? Die gelesenen Schwarzfeller-Seiten nennen kein VDE. TL steht dort nur bei der Folie der Absperrschranke.
3. Echte Preise fehlen. Auf der Seite steht „Preis auf Anfrage“. Welche Beträge, und sind MwSt. und Transport enthalten?
4. Der Hero-Satz ist festgelegt: „Auf uns ist Verlass. Auf unsere Zäune auch.“

Dazu:

5. Die Feldbreite 3,45 m ist die Schwarzfeller-Angabe zum Standardfeld. Stimmen Füße = Felder + 1, Schellen = Stöße und eine zusätzliche Schelle fürs Tor für die Montage von AMK? Die Höhe ändert die Stückzahl im Prototyp nicht.
6. Siehe Punkt 3. Erfundene Beispielbeträge stehen nicht mehr auf den Seiten.
7. Schellen stehen jetzt mit den Schwarzfeller-Maßen als eigene Mietkarte. Bleibt das so, oder sind sie nur Zubehör zum Feld?
8. Die Region Ries / Nordschwaben / Mittelfranken steht auf der alten Seite nicht. Dort steht Süddeutschland. Welche Formulierung soll bleiben?
9. Das VDE-Badge ist entfernt. Die Sortierung „Beliebt“ bleibt ein Platzhalter. Gibt es eine echte Sortierung, und welches Badge außer TL an der Folie soll bleiben?
10. Die USt-IdNr. ist unbekannt und steht nicht im Impressum. § 18 Abs. 2 MStV ist nicht als Pflicht gesetzt. Impressum und Datenschutz vor Veröffentlichung rechtlich prüfen. Die DPF-Zeile nur nach der Liste vom 15.11.2026, ohne eigene Zusage.
11. AGB der alten Seite sind nur „in Überarbeitung“. Sollen sie auf die neue Seite, und in welcher Fassung?
12. Der Link zum väterlichen Betrieb ist auf der alten Seite als `htttp://www.fahrzeugbau-engelhardt.de` geschrieben. Welche Adresse soll auf die neue Seite, falls überhaupt?
13. Partner Bauzaun Nord und bauzaun.net weiter öffentlich nennen?
14. Die Zahlen 1.000+ und 200+ stehen nicht auf der Seite. Die alte Seite beschriftet sie nicht.
15. Teamfotos gibt es nicht. Auf der Seite steht kein Platzhalter. Wer soll später zu sehen sein?
16. Soll die Anfrage später ein richtiges Formular werden, und bleibt `info@bauzaun-mieten.net` die einzige Adresse? Der Merkzettel liegt nur im Browser.
17. Die Karten zeigen Hersteller- und Händlerbeispiele, nicht den Bestand von AMK. Welche der Schwarzfeller-Artikel vermietet AMK wirklich, und welche Anhänger ersetzen die Beispielmodelle?

Festgelegt und nicht mehr offen: Bauzaun und Absperrung nur zur Miete, Verkauf nur Anhänger, Kühlanhänger nur zur Miete, keine Container, keine Dixi, keine Toilettenwagen, keine Sanitärcontainer. Hosting ist GitHub Pages unter `/amk-engelhardt/`, eingeschaltet wird es später aus `main`.
