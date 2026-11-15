# AMK Engelhardt – Prototyp

Statische Testseite für AMK Engelhardt (Absperrungen Mieten Kaufen), Oberer Kesselweg 2, 86744 Hainsfarth. Kein Build, kein Framework. Alle Links sind relativ und funktionieren unter `/amk-engelhardt/`, sobald GitHub Pages aus dem Branch `main` eingeschaltet wird. Eine Pages-Action und eine Vercel-Konfiguration gibt es bewusst nicht. Die Datei `.nojekyll` liegt bereit.

Suchmaschinen sind ausgesperrt: `meta name="robots" content="noindex, nofollow"` auf jeder Seite und `robots.txt` mit `Disallow: /`. Oben auf jeder Seite steht „Prototyp – Testseite“. Zoomen ist nicht gesperrt (`width=device-width, initial-scale=1`).

An der bestehenden Website, an Domain, DNS oder E-Mail wurde nichts geändert.

## Seiten

Die Startadresse `index.html` leitet ohne JavaScript auf `mieten/` weiter. `kaufen/anhaenger/` leitet auf den Verkaufskatalog `kaufen/` weiter.

| URL | Inhalt |
| --- | --- |
| `mieten/` | Filteransicht Bauzaun, Absperrung, Mietpark |
| `mieten/bauzaun/`, `mieten/absperrung/`, `mieten/mietpark/` | Dieselbe Ansicht mit gesetztem Filter, auch ohne JavaScript |
| `kaufen/` | Nur Verkaufsanhänger, ohne Filterleiste |
| `kaufen/anhaenger/<slug>/` | Detail eines Verkaufsanhängers |
| `produkt/<slug>/` | Detail eines Mietprodukts |
| `service/` | Full Service und die zwei genannten Partner |
| `anfrage/` | Formular, Merkzettel, `mailto` |
| `ueber-uns/` | Firma, Standort, Team-Platzhalter |
| `kontakt/` | Kontaktdaten, Zeiten, Terminabsprache, Kartenlink |
| `impressum/`, `datenschutz/` | Platzhalter |

JavaScript ergänzt nur: Live-Filter und VDE-Häkchen, Merkzettel in `localStorage`, Nachrechnen im Mengenrechner, Zusammensetzen der `mailto`-Nachricht. Mieten und Kaufen sind echte Links. Die Filterseiten, die Produktkarten und das Formular stehen im HTML.

## Verkauf und Miete

Nur Anhänger sind zum Kauf. Bauzaun und Absperrung haben keinen Kaufpreis und keinen Kauf-Button. Im Formular stehen unter „Kauf“ ausschließlich die Beispiel-Anhänger. Die Filter Bauzaun, Absperrung und Mietpark gibt es nur unter `mieten/`.

Kühlanhänger vermietet AMK für Events. Zwei Karten im Mietpark sind Beispiele, der Preis ist „auf Anfrage“, beide sind nur zur Miete und fehlen unter `kaufen/`.

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

Die alte Angabe „7+ Jahre Erfahrung“ steht nicht mehr auf der Seite. Stattdessen steht das Gründungsjahr 2011. Schellen stehen in der Struktur, auf der alten Website aber nicht als eigenes Produkt. Die Karte ist deshalb als Platzhalter gekennzeichnet.

## Weggelassen

- Alle Container: Baucontainer, Materialcontainer, Bürocontainer, Bauwagen. Keine Kachel, keine Seite, kein Formularfeld
- Dixi-Toiletten, Toilettenwagen und Sanitärcontainer
- Kauf von Bauzaun und Absperrung
- Platzhalter-Adresse `support@domainname.com`
- Theme-Demoinhalte (Tectxon, englische Teamseiten, erfundene Personen, `info@example.com`, Portfolio Öl und Gas)
- Leere Seite Aktuelles
- AGB: die alte Seite sagt nur „Diese Seite befindet sich zur Zeit in Überarbeitung.“
- Fertiger Impressums- und Datenschutztext. Beides sind Platzhalter. Die alte Datenschutzerklärung beschreibt Cookies und Analysewerkzeuge, die dieser Prototyp nicht nutzt
- Headerbild der alten Startseite, weil darin das Öl-Pumpen-Logo des Themes steckt
- Alte Mini-Grafiken von 2012

## Bilder

| Datei | Herkunft |
| --- | --- |
| `assets/logo.png` | Logo der bestehenden Website, `https://bauzaun-mieten.net/wp-content/uploads/2018/11/AMK_Engelhardt_Logo.png`, auch als Favicon |
| `images/bauzaun.webp` | bestehende Website, `.../2018/11/Bauzaun.jpg`, nur Prototyp, als WebP verkleinert |
| `images/bauzaun-sichtschutz.webp` | bestehende Website, `.../2018/11/bauzaun-2.jpg`, nur Prototyp, als WebP verkleinert |
| `images/baustelle.webp` | bestehende Website, `.../2018/11/Baustellenabsicherung.jpg`, nur Prototyp, als WebP verkleinert |
| `images/anhaenger-offen.webp` | Humbaur GmbH, Wikimedia Commons, [Datei](https://commons.wikimedia.org/wiki/File:Humbaur_Hochlader_HU.jpg), CC BY-SA 4.0. Beispielbild, kein AMK-Fahrzeug. Dieselbe Datei steht auch an den Kühlanhängern, dort mit dem Hinweis, dass es kein Kühlanhänger ist |
| `images/anhaenger-plane.webp` | Rüdiger Müller, Wikimedia Commons, [Datei](https://commons.wikimedia.org/wiki/File:PKW-Anh%C3%A4nger.jpg), CC BY-SA 4.0. Beispielbild |
| `images/anhaenger-transport.webp` | Humbaur GmbH, Wikimedia Commons, [Datei](https://commons.wikimedia.org/wiki/File:Humbaur_KFT.jpg), CC BY-SA 3.0. Beispielbild |
| `images/anhaenger-einsatz.webp` | Ra Boe / Wikipedia, Wikimedia Commons, [Datei](https://commons.wikimedia.org/wiki/File:PKW_Anh%C3%A4nger_2011-by-RaBoe-01.jpg), CC BY-SA 3.0 de. Beispielbild |

Eigene Fotos sollen später aus dem Drive-Ordner „04_PE-Dienstleistungen/Webseiten/AMK Engelhardt/Upload AMK Engelhardt (geteilt)“ kommen. Mehrere Gitter nutzen bis dahin das Bauzaunfoto, mit Hinweis, dass es nicht das jeweilige Produkt zeigt.

## Farben und Kontrast

Logo-Grün `#76B729` ist die Akzentfarbe für Buttons, Banner und Markierungen. Logo-Grau `#6E6D6D` ist die Fließtextfarbe. Der Rest der Seite ist weiß, Flächen zum Absetzen nutzen `#F3F7F9`.

`#76B729` auf Weiß erreicht nur etwa 2,45:1 und liegt damit unter WCAG AA. Deshalb:

- Button-Fläche bleibt `#76B729`, die Schrift darauf ist `#1A1A1A` (etwa 7,1:1). Hover `#58990B` bleibt mit dieser Schrift bei etwa 4,95:1.
- Links und der Tastaturfokus nutzen `#3F6E08` (etwa 6,1:1 auf Weiß).
- Überschriften nutzen ein dunkleres Grau `#3A3939`, der Fließtext bleibt beim Logo-Grau (etwa 5,2:1 auf Weiß).

Es sind keine Schriften von einem CDN eingebunden.

## Mengenrechner

Die alte Website nennt keine Feldlänge. Die Rechnung benutzt die gekennzeichnete Annahme 3,50 m je Feld. Felder = Meter geteilt durch 3,50, aufgerundet. Füße bei einer geraden Strecke = Felder plus 1. Schellen = Stöße zwischen den Feldern, plus eine Schelle, wenn ein Tor gewählt ist. Die Höhe ändert die Stückzahl nicht. Für 35 m steht das Ergebnis schon im HTML: 10 Felder, 11 Füße, 9 Schellen. Der Rechner ist eingeklappt und auf `mieten/bauzaun/` geöffnet. Der Button „Übernehmen in Anfrage“ hängt Länge, Höhe und Tor an die Anfrage-Adresse.

## Beispielpreise der Anhänger

Jeder Betrag ist erfunden, mit Zeitraum oder als Kaufpreis beschriftet, und auf der Karte als Beispiel markiert:

- Offener Anhänger, Miete: 25 € pro Tag
- Anhänger mit Plane, Miete: 79 € pro Wochenende
- Offener Anhänger, Miete: 120 € pro Woche
- Offener Anhänger, Kauf: 1.190 €
- Fahrzeugtransporter, Kauf: 2.450 €
- Offener Anhänger im Einsatz, Kauf: 980 €
- Kühlanhänger, Miete: Preis auf Anfrage
- Kühlanhänger, weiteres Beispiel, Miete: Preis auf Anfrage

Das sind keine Preise von AMK. MwSt. und Transport sind darin nicht geregelt. Dieselben Angaben liegen in `data/anhaenger.js`. Nutzlast, Maße und Führerscheinklasse sind Platzhalter. Bauzaun und Absperrung bleiben bei „Preis auf Anfrage“.

Ein Badge „VDE – Beispiel“ hängt nur an Personen- und Demogitter, damit das Häkchen „nur VDE-zertifiziert“ etwas zu filtern hat. Die alte Website nennt keine Zertifizierung. Die Sortierung „Beliebt“ ist ein Platzhalter, keine echte Reihenfolge.

## Anfrage

Sichtbar ohne JavaScript: Bereich Miete oder Kauf, Produkte, Zaunlänge, Zeitraum von/bis, Lieferadresse, Lieferung, Aufbau, Abbau, Name, Telefon, E-Mail, Nachricht, Datenschutz-Häkchen. Der Zeitraum ist für die Miete gedacht. Absenden öffnet nur `mailto:info@bauzaun-mieten.net`. Es geht nichts an einen Server oder an Dritte. Ein Hinweis auf der Seite sagt, dass das ein Prototyp ist. Der Merkzettel im Kopf zählt nur mit JavaScript.

## Offene Fragen an Peter

Aus der Struktur:

1. Kühlanhänger zur Miete für Events sind bestätigt. Gilt der Mietpark sonst nur für Anhänger, oder kommen weitere Geräte dazu? Welche echten Kühlanhänger, Fotos, Maße und Preise ersetzen die zwei Beispielkarten?
2. Welche Produkte sind tatsächlich VDE-zertifiziert, und nach welcher Norm?
3. Preise anzeigen (Miete pro Tag oder Woche, Kauf) oder überall „auf Anfrage“?
4. Welchen Claim soll der Hero tragen?

Dazu:

5. Stimmt die Annahme 3,50 m je Feld, Füße = Felder + 1, Schellen = Stöße, und eine zusätzliche Schelle fürs Tor? Die Höhe ändert die Stückzahl im Prototyp nicht.
6. Die Beispielpreise der Anhänger (25 € pro Tag, 79 € pro Wochenende, 120 € pro Woche, Kauf 1.190 €, 2.450 € und 980 €) sind erfunden. Welche echten Preise, Zeiträume und ob MwSt. und Transport enthalten sind, sollen sie ersetzen?
7. Schellen stehen in der Struktur, auf der alten Website aber nicht. Eigenes Produkt, Zubehör oder streichen?
8. Die Region Ries / Nordschwaben / Mittelfranken steht auf der alten Seite nicht. Dort steht Süddeutschland. Welche Formulierung soll bleiben?
9. Das VDE-Badge und die Sortierung „Beliebt“ sind Platzhalter. Welche Produkte tragen ein echtes Badge, und gibt es eine echte Sortierung?
10. Impressum und Datenschutz brauchen fertige Texte. Auf der alten Seite steht die Überschrift zur Umsatzsteuer-Identifikationsnummer, eine Nummer selbst ist dort nicht eingetragen.
11. AGB der alten Seite sind nur „in Überarbeitung“. Sollen sie auf die neue Seite, und in welcher Fassung?
12. Der Link zum väterlichen Betrieb ist auf der alten Seite als `htttp://www.fahrzeugbau-engelhardt.de` geschrieben. Welche Adresse soll auf die neue Seite, falls überhaupt?
13. Partner Bauzaun Nord und bauzaun.net weiter öffentlich nennen?
14. Die Kennzahlen 1.000+ Kundinnen und Kunden und 200+ Produkte so lassen?
15. Teamfotos folgen. Wer soll auf der Seite stehen?
16. Soll die Anfrage später ein richtiges Formular werden, und bleibt `info@bauzaun-mieten.net` die einzige Adresse? Der Merkzettel liegt nur im Browser.
17. Konkrete Höhen, Festigkeiten, Nutzlasten, Maße und Führerscheinklassen stehen auf der alten Seite nicht.

Festgelegt und nicht mehr offen: Bauzaun und Absperrung nur zur Miete, Verkauf nur Anhänger, Kühlanhänger nur zur Miete, keine Container, keine Dixi, keine Toilettenwagen, keine Sanitärcontainer. Hosting ist GitHub Pages unter `/amk-engelhardt/`, eingeschaltet wird es später aus `main`.
