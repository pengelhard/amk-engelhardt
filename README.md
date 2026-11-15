# AMK Engelhardt – Prototyp

Statische Testseite für AMK Engelhardt (Absperrungen Mieten Kaufen), Oberer Kesselweg 2, 86744 Hainsfarth. Kein Build, kein Framework. Alle Links sind relativ und funktionieren unter `/amk-engelhardt/`, sobald GitHub Pages aus dem Branch `main` eingeschaltet wird. Eine Pages-Action und eine Vercel-Konfiguration gibt es bewusst nicht. Die Datei `.nojekyll` liegt bereit.

Suchmaschinen sind ausgesperrt: `meta name="robots" content="noindex, nofollow"` auf jeder Seite und `robots.txt` mit `Disallow: /`. Oben auf jeder Seite steht „Prototyp – Testseite“. Zoomen ist nicht gesperrt (`width=device-width, initial-scale=1, viewport-fit=cover`, ohne `maximum-scale`).

An der bestehenden Website, an Domain, DNS oder E-Mail wurde nichts geändert.

## Seiten

Die Startadresse `index.html` ist der Einstieg. `mieten/` ist die Übersicht der drei Mietbereiche. `kaufen/anhaenger/` leitet auf den Verkaufskatalog `kaufen/` weiter.

| URL | Inhalt |
| --- | --- |
| `index.html` | Einstieg: Einsatzfoto, vier Bildflächen, drei Angaben |
| `mieten/` | Übersicht Mieten: Bauzaun, Absperrung, Anhänger |
| `mieten/bauzaun/`, `mieten/absperrung/`, `mieten/mietpark/` | Bildkacheln der Kategorie. Der Mengenrechner steht nur unter Bauzaun |
| `kaufen/` | Nur Verkaufsanhänger, ohne Filterleiste |
| `kaufen/anhaenger/<slug>/` | Detail eines Verkaufsanhängers |
| `produkt/<slug>/` | Detail eines Mietprodukts |
| `service/` | Full Service und die zwei genannten Partner |
| `anfrage/` | Formular, Merkzettel, `mailto` |
| `ueber-uns/` | Firma, Standort, Team-Platzhalter |
| `kontakt/` | Kontaktdaten, Zeiten, Terminabsprache, Kartenlink |
| `impressum/`, `datenschutz/` | Platzhalter |

Das Hauptmenü hat drei Punkte: Mieten, Kaufen, Kontakt. Das Telefon ist daneben ein eigener Button. Unter 980 px ersetzt eine Fußleiste mit Mieten, Kaufen, Kontakt und Anrufen das Menü. Service, Über uns, Anfrage, Impressum und Datenschutz bleiben in der Fußzeile erreichbar.

JavaScript ergänzt nur: Merkzettel in `localStorage`, Nachrechnen im Mengenrechner, Zusammensetzen der `mailto`-Nachricht. Die Seiten, die Kacheln und das Formular stehen im HTML. Ein VDE-Häkchen gibt es nicht, solange kein Artikel `data-vde="ja"` trägt.

## Verkauf und Miete

Nur Anhänger sind zum Kauf. Bauzaun und Absperrung haben keinen Kaufpreis und keinen Kauf-Button. Im Formular stehen unter „Kauf“ ausschließlich die Beispiel-Anhänger. Bauzaun, Absperrung und Mietpark sind Bildflächen unter `mieten/`, nicht eine Filterleiste.

Kühlanhänger vermietet AMK für Events. Im Mietpark stehen „Kühlanhänger 1,3 t“ und „Kühlanhänger 2,0 t“, beide Beispiel, Preis auf Anfrage, nur zur Miete, nicht unter `kaufen/`.

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
- Fertiger Impressums- und Datenschutztext. Beides sind Platzhalter. Die alte Datenschutzerklärung beschreibt Cookies und Analysewerkzeuge, die dieser Prototyp nicht nutzt
- Headerbild der alten Startseite, weil darin das Öl-Pumpen-Logo des Themes steckt
- Alte Mini-Grafiken von 2012

## Bilder

Jede verwendete Datei, ihre Quelle und die dazugehörigen Maße stehen in `docs/bildquellen.md`. Produktfotos von Schwarzfeller und Händlerfotos der Kühlanhänger sind nur für den Prototyp geladen. Wikimedia-Dateien der Anhänger tragen CC BY-SA. Das Logo bleibt das der bestehenden Website.

Nicht mehr eingebunden und aus `images/` entfernt: das alte Bauzaunfoto der bestehenden Website, das alte Sichtschutzfoto, der Motorradtransporter (Humbaur KFT) und der beladene offene Anhänger. Sie zeigten nicht den jeweiligen Typ. `images/baustelle.webp` liegt noch da und ist auf keiner Seite eingebunden.

## Farben und Kontrast

Hauptfarbe ist ein gedecktes Tannengrün `#1F4D3A`. Weiße Schrift darauf liegt bei etwa 9,6:1. Der Hover der Flächen ist `#16382B` (Weiß darauf etwa 12,9:1). Logo-Grau `#6E6D6D` bleibt der Fließtext (etwa 5,2:1), Überschriften `#3A3939`, Absetzflächen `#F3F7F9`.

Logo-Grün `#76B729` ist nur noch Akzent. Auf Weiß erreicht es etwa 2,45:1 und ist damit kein Text und keine große Fläche. Es steht auf den kleinen Marken „Beispiel“ und „TL“ (Schrift `#1A1A1A`, etwa 7,1:1), als Strich der aktiven Fußleiste, als Hover-Ring an den Buttons und als Farbe der Link-Unterstreichung. Links und der Fokusring selbst sind `#1F4D3A`, der Link-Hover `#132E22`.

Unter 980 px liegt eine feste Fußleiste: Mieten, Kaufen, Kontakt, Anrufen (`tel:+499082921777`). Jede Fläche ist mindestens 48 px, die aktive Seite trägt `aria-current`, der Inhalt bekommt `padding-bottom` inklusive `env(safe-area-inset-bottom)`. Ab 980 px bleibt die Kopfnavigation mit drei Punkten, die Fußleiste ist aus.

Die Schrift ist Manrope, lokal als WOFF2 unter `assets/fonts/`, Lizenz SIL OFL. Es sind keine Schriften von einem CDN eingebunden. Der Kopf liegt über dem Foto und wird beim Scrollen weiß.

## Mengenrechner

Die Feldlänge ist die Breite des offenen Bauzauns Standard bei Schwarzfeller: 3.450 mm, also 3,45 m. Quelle: https://www.schwarzfeller.de/bauzaun/offene-bauzaune/ Felder = Meter geteilt durch 3,45, aufgerundet. XXL ist 3.500 mm breit und fällt nicht unter diese Rechnung. Füße bei einer geraden Strecke = Felder plus 1 und Schellen = Stöße bleiben Annahmen, plus eine Schelle, wenn ein Tor gewählt ist. Die Höhe ändert die Stückzahl nicht. Für 35 m ohne Tor steht im HTML: 11 Felder, 12 Füße, 10 Schellen. Der Rechner ist eingeklappt und auf `mieten/bauzaun/` geöffnet.

## Beispielpreise der Anhänger

Jeder Betrag ist erfunden, mit Zeitraum oder als Kaufpreis beschriftet, und auf der Karte als Beispiel markiert:

- Hochlader 750 kg, Miete: 25 € pro Tag, erfunden
- Planenanhänger, Miete: 79 € pro Wochenende, erfunden
- Kofferanhänger, Miete: auf Anfrage
- Kühlanhänger 1,3 t und Kühlanhänger 2,0 t, Miete: auf Anfrage
- Hochlader 750 kg, Kauf: 1.190 €, erfunden
- Fahrzeugtransporter, Kauf: 2.450 €, erfunden
- Kofferanhänger, Kauf: 980 €, erfunden

Der frühere Betrag 120 € pro Woche hing an „Offener Anhänger, Woche“ und ist entfallen. Das sind keine Preise von AMK. MwSt. und Transport sind darin nicht geregelt. Dieselben Angaben liegen in `data/anhaenger.js`. Eckdaten und Bildrechte stehen in `docs/bildquellen.md`. Bauzaun und Absperrung bleiben bei „Preis auf Anfrage“.

Ein VDE-Badge gibt es nicht. Die gelesenen Schwarzfeller-Seiten nennen kein VDE, deshalb gibt es keinen VDE-Filter. TL steht nur an der Absperrschranke und nur für die Folie. Die Sortierung „Beliebt“ ist von den Seiten.

## Anfrage

Sichtbar ohne JavaScript: Bereich Miete oder Kauf, Produkte, Zaunlänge, Zeitraum von/bis, Lieferadresse, Lieferung, Aufbau, Abbau, Name, Telefon, E-Mail, Nachricht, Datenschutz-Häkchen. Der Zeitraum ist für die Miete gedacht. Absenden öffnet nur `mailto:info@bauzaun-mieten.net`. Es geht nichts an einen Server oder an Dritte. Ein Hinweis auf der Seite sagt, dass das ein Prototyp ist. Der Merkzettel im Kopf zählt nur mit JavaScript.

## Offene Fragen an Peter

Aus der Struktur:

1. Kühlanhänger zur Miete sind bestätigt. Die Karten „Kühlanhänger 1,3 t“ (Unsinn UKT C6) und „Kühlanhänger 2,0 t“ (Temared Cooler 3015/2C) sind Beispiele mit Händlerangaben, nicht der Bestand von AMK. Welche echten Fahrzeuge, Fotos und Preise ersetzen sie?
2. Welche Produkte sind tatsächlich VDE-zertifiziert? Die gelesenen Schwarzfeller-Seiten nennen kein VDE. TL steht dort nur bei der Folie der Absperrschranke.
3. Preise anzeigen (Miete pro Tag oder Woche, Kauf) oder überall „auf Anfrage“?
4. Welchen Claim soll der Hero tragen?

Dazu:

5. Die Feldbreite 3,45 m ist die Schwarzfeller-Angabe zum Standardfeld. Stimmen Füße = Felder + 1, Schellen = Stöße und eine zusätzliche Schelle fürs Tor für die Montage von AMK? Die Höhe ändert die Stückzahl im Prototyp nicht.
6. Die Beispielpreise (25 € pro Tag, 79 € pro Wochenende, Kauf 1.190 €, 2.450 € und 980 €) sind erfunden. 120 € pro Woche ist entfallen. Welche echten Preise sollen sie ersetzen, und sind MwSt. und Transport enthalten?
7. Schellen stehen jetzt mit den Schwarzfeller-Maßen als eigene Mietkarte. Bleibt das so, oder sind sie nur Zubehör zum Feld?
8. Die Region Ries / Nordschwaben / Mittelfranken steht auf der alten Seite nicht. Dort steht Süddeutschland. Welche Formulierung soll bleiben?
9. Das VDE-Badge ist entfernt. Die Sortierung „Beliebt“ bleibt ein Platzhalter. Gibt es eine echte Sortierung, und welches Badge außer TL an der Folie soll bleiben?
10. Impressum und Datenschutz brauchen fertige Texte. Auf der alten Seite steht die Überschrift zur Umsatzsteuer-Identifikationsnummer, eine Nummer selbst ist dort nicht eingetragen.
11. AGB der alten Seite sind nur „in Überarbeitung“. Sollen sie auf die neue Seite, und in welcher Fassung?
12. Der Link zum väterlichen Betrieb ist auf der alten Seite als `htttp://www.fahrzeugbau-engelhardt.de` geschrieben. Welche Adresse soll auf die neue Seite, falls überhaupt?
13. Partner Bauzaun Nord und bauzaun.net weiter öffentlich nennen?
14. Die Kennzahlen 1.000+ Kundinnen und Kunden und 200+ Produkte so lassen?
15. Teamfotos folgen. Wer soll auf der Seite stehen?
16. Soll die Anfrage später ein richtiges Formular werden, und bleibt `info@bauzaun-mieten.net` die einzige Adresse? Der Merkzettel liegt nur im Browser.
17. Die Karten zeigen Hersteller- und Händlerbeispiele, nicht den Bestand von AMK. Welche der Schwarzfeller-Artikel vermietet AMK wirklich, und welche Anhänger ersetzen die Beispielmodelle?

Festgelegt und nicht mehr offen: Bauzaun und Absperrung nur zur Miete, Verkauf nur Anhänger, Kühlanhänger nur zur Miete, keine Container, keine Dixi, keine Toilettenwagen, keine Sanitärcontainer. Hosting ist GitHub Pages unter `/amk-engelhardt/`, eingeschaltet wird es später aus `main`.
