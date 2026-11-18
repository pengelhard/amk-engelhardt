# Kaufsortiment

75 Kaufartikel. Die Seite `kaufen/` filtert sie im Browser, ohne Gerüst. Der Anfragekorb bleibt.

## Hauptgruppen

Oben auf `kaufen/` stehen vier Einstiege. Die Adresse trägt `gruppe`.

| `gruppe` | Anzeige | `shop` |
| --- | --- | --- |
| `zaun` | Bauzaun & Absperrgitter | `bauzaune`, `zubehoer`, `tore`, `sichtschutz`, `gitter` |
| `schilder` | Verkehrsschilder | `schilder` |
| `absperrung` | Verkehrsabsperreinrichtungen | `verkehr` |
| `anhaenger` | Anhänger | `anhaenger` |

In Bauzaun & Absperrgitter bleiben die bisherigen Unterkategorien als Chips. Bauzäune, Zaunzubehör, Türen und Sichtschutz bleiben im Filterkatalog. Absperrgitter, Verkehrsabsperreinrichtungen und Anhänger nutzen dieselbe Auswahl wie die Miete (`js/auswahl.js`): Unterkategorie als Pills, darunter Typ-Karten mit Bild und Anzahl. `#bauzaun`, `#verkehrssicherung` und `#anhaenger` öffnen die passende Hauptgruppe. `?kat=gitter` öffnet die Typ-Karten der Absperrgitter.

## Kategorien

Die Kategorie steht in `data/katalog.json` unter `shop`. Sie folgt der bisherigen Gruppe, nichts davon ist neu erfunden.

| `shop` | Anzeige | Woraus |
| --- | --- | --- |
| `bauzaune` | Bauzäune | Gruppen 2,0 m, 2,5 m, 1,2 m, Vorverzinkt |
| `zubehoer` | Zaunzubehör | Füße und Zubehör |
| `tore` | Türen & Tore | Tore |
| `sichtschutz` | Sichtschutz & Planen | Sichtschutz |
| `gitter` | Absperrgitter | Verkehrssicherung, Gruppe Gitter |
| `schilder` | Verkehrsschilder | bisheriger Sammelposten, jetzt die Auswahlliste |
| `verkehr` | Verkehrsabsperreinrichtungen | Schranken, Baken, Betonschwellen, Schleusen, Bühnen |
| `anhaenger` | Anhänger | Anhänger |

Leitkegel und Leuchten kommen im Bestand nicht vor und sind keine Kategorie. Farbe und Einsatzzweck stehen auf den Produktseiten nicht und sind keine Filter.

## Verkehrsschilder

KK Service führt keine einzelnen Verkehrszeichen. Die Liste folgt den von Peter genannten StVO-Zeichen, mit der amtlichen Bezeichnung. Keine Artikelnummer, kein Preis, kein Bestand. Die Symbole sind eigene, schlichte SVG, keine Fremdbilder.

Z 123, Z 120, Z 121-10, Z 121-20, Z 208, Z 308, Z 222, Z 250, Z 260, Z 267, Z 274 mit 30, 50 und 70, Z 276, Z 283, Z 286, Z 259, Z 454, Z 455, Z 457.

Z 208 heißt amtlich „Vorrang vor dem Gegenverkehr“, Z 308 „Vorrang des Gegenverkehrs“. Z 259 heißt amtlich „Verbot für Fußgänger“. Z 625 und Leitkegel fehlen, weil sie im Sortiment nicht vorkommen.

Die Zeichen stehen unter drei Pills, gebildet aus der bestehenden Liste, ohne neue Zeichen: Gefahrzeichen (Z 123, Z 120, Z 121-10, Z 121-20), Vorschriftzeichen (Z 208, Z 308, Z 222, Z 250, Z 260, Z 267, Z 274 mit 30, 50 und 70, Z 276, Z 283, Z 286, Z 259), Richtzeichen (Z 454, Z 455, Z 457, alles Umleitungen). Zusatzzeichen und Aufstellvorrichtungen kommen in der Liste nicht vor und sind keine Pills.

Typ-Karten sind Mehrfachauswahl und kommen aus einer Komponente (`js/typwahl.js`), auf der Miet- und auf der Kaufseite. Das Mengenfeld steht in der Karte und ist erst sichtbar, wenn der Typ angehakt ist. Der Fokus springt dann in dieses Feld. Abwählen blendet es aus und nimmt die Zeile aus dem Anfragekorb. Beim Bauzaun enthält das Feld Meter oder Felder, sonst die Stückzahl. Standardzubehör hängt an jeder Bauzaun-Position.

Jedes angehakte Zeichen geht mit Anzahl als eigene Zeile in den Anfragekorb (`kauf:schild:…` oder `miete:schild:…`). Das Feld „Größe, Folie, Ständer“ liegt darunter und wird, wenn es gefüllt ist, als Hinweiszeile mitgenommen. Es steht nur in dieser Gruppe und auf `produkt/verkehrsschilder/`, nicht in der Übersicht.

Die vier Gruppen und die Zeichenliste sind die gemeinsame Quelle für Miete und Kauf (`js/gruppen.js`, `js/schilder.js`, `js/auswahl.js`). Auf `mieten/` liegt der Bauzaun-Konfigurator in Bauzaun & Absperrgitter, Standardzubehör inklusive, Sonderzubehör optional. Absperrgitter, Verkehrsabsperreinrichtungen und Anhänger kommen aus `data/katalog.json`. Die Pills folgen `attr.art`: Absperrschranken, Leitbaken, Betonleitschwellen, Schleusen, Bühne, und bei den Anhängern Hochlader, Planenanhänger, Kofferanhänger, Fahrzeugtransporter, Kühlanhänger. Bei der Miete kommt der Zeitraum dazu. Beides landet im selben Anfragekorb, Miete mit `miete:`, Kauf mit `kauf:`.

## Attribute

`attr` übernimmt nur Werte, die der Name, die Gruppe oder die Tabelle hergeben. Millimeter aus einer Maßzeile werden für den Filter in Meter umgerechnet, wenn die Zahl glatt aufgeht. Die Tabelle auf der Seite behält den Wortlaut.

Filter erscheinen erst, wenn die gewählte Kategorie mindestens zwei verschiedene Werte hat.

- Bauzäune: Breite, Höhe, Maschenweite, Drahtstärke, Standrohr, Oberfläche
- Zaunzubehör: Art, Fußart
- Türen & Tore: Höhe, Maschenweite
- Sichtschutz & Planen: Art

Absperrgitter, Verkehrsabsperreinrichtungen und Anhänger haben keine Attributfilter. Die Auswahl läuft über die Pills und die Typ-Karten. Im Kauf führen Bild und Name der Typkarte und jedes Schild auf die Produktseite. Die Checkbox bleibt die Auswahl. In der Miete gibt es diese Links nicht. Die langen Datenblöcke der Katalogkacheln bleiben im HTML und sind im Kaufbrett ausgeblendet.

Oberfläche ist Vollfeuerverzinkt, Verzinkt oder Vorverzinkt, und nur wenn das Wort in der Artikelüberschrift, im Absatz oder in der Seitenüberschrift „Vorverzinkte Zäune“ steht. Fußart ist Beton oder Kunststoff, und nur wenn der Name das sagt. Edelstahl steht nur bei der Schelle, die so heißt.

Suche trifft Name, Artikelnummer und Kennung, bei den Schildern Nummer und Name. Absperrgitter, Verkehrsabsperreinrichtungen und Anhänger haben keine Suche. Sortierung ist Sortiment, Name oder Artikelnummer. Gruppe, Unterkategorie, Filter, Suche und Sortierung stehen in der Adresse (`?gruppe=zaun&kat=bauzaune&masche=100+x+300`). Die gewählte Pill steht als `teil` in der Adresse. Zurück im Browser stellt den Stand wieder her.

## Technische Daten

Auf der Kachel liegen die Tabellenzeilen unter „Technische Daten“, ein Absatz unter „Beschreibung“. Auf der Produktseite stehen dieselben Blöcke offen, ohne Extra-Klick (`js/produkt.js`). Fehlt die Angabe, fehlt die Zeile. „Das Paket“ bleibt eine Tabellenzeile mit einer Stückzahl.

„Lieferumfang“ erscheint nur, wenn `lieferung` im Katalog eine Liste von Sätzen ist. „Passt dazu“ verlinkt die Slugs in `zubehoer` auf ihre Produktseiten. Fehlt die Liste, fehlt der Block. Kein Produkt trägt diese Listen bisher, deshalb bleibt der Block weg. Anhänger ohne Tabelle im Katalog zeigen die Eckdaten aus `data/anhaenger-eckdaten.js`, dieselbe Tabelle wie an der Typkarte.

Ein PDF wird als „Datenblatt (PDF)“ verlinkt, wenn die Produktseite eines zu diesem Artikel anbietet. Die Datei wird nicht kopiert. Die Liste steht in `docs/bildquellen.md`.

## Artikel ergänzen

1. Eintrag in `data/katalog.json`: `slug`, `name`, `code`, `shop`, `attr`, `specs`, `text`, `pdf`. `specs` ist die Tabelle als Paare, `text` sind die Absätze, `pdf` ist die Adresse oder `null`.
2. Kachel in `kaufen/index.html` mit demselben `data-slug`, dazu die `<details>` aus `specs`, `text` und `pdf`.
3. Seite `produkt/<slug>/index.html` im selben Aufbau. Formular `data-order` und `data-slug` unverändert lassen. Preis bleibt „Preis auf Anfrage“.
4. Steht ein neues PDF auf der Produktseite, die Adresse in `docs/bildquellen.md` eintragen und auf der Seite verlinken. Die Datei nicht herunterladen.

`attr` nur setzen, wenn der Wert im Namen, in `specs` oder in der genannten Seitenüberschrift steht.

## Bilder und Zeichnungen

Die Galerie liest `data/katalog.json`. Ohne `bilder` nimmt sie `bild` und `bildSmall`. Ein zweites Bild oder eine Zeichnung ist eine Datei plus ein Eintrag, sonst nichts.

```json
"bilder": [
  {"src": "images/kk/bauzaun-10075.webp", "small": "images/kk/bauzaun-10075-640.webp", "w": 1200, "h": 675, "alt": "Bauzaun Profi 3,5 × 2,0 m"}
],
"zeichnungen": [
  {"src": "images/kk/bauzaun-10075-zeichnung.webp", "w": 1200, "h": 800, "alt": "Zeichnung Bauzaun Profi"}
]
```

`src` ist der Pfad ab der Wurzel. `small` ist die kleinere Datei, optional. Steht `bilder`, ersetzt die Liste das einzelne `bild`, das erste Bild also mit aufnehmen. `zeichnungen` kommen dahinter und tragen in der Galerie die Kennzeichnung Zeichnung. Fehlt beides außer `bild`, zeigt die Seite nur das eine Bild, ohne Hinweistext.

Der Pflegebereich unter `.pages.yml` schreibt nur Aktuelles (`data/aktuelles.json` und `images/aktuelles/`). Produktbilder legt er nicht an. Dafür bleiben Datei und Eintrag in `data/katalog.json`.
