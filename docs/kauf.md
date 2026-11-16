# Kaufsortiment

75 Kaufartikel. Die Seite `kaufen/` filtert sie im Browser, ohne Gerüst. Der Anfragekorb bleibt.

## Kategorien

Die Kategorie steht in `data/katalog.json` unter `shop`. Sie folgt der bisherigen Gruppe, nichts davon ist neu erfunden.

| `shop` | Anzeige | Woraus |
| --- | --- | --- |
| `bauzaune` | Bauzäune | Gruppen 2,0 m, 2,5 m, 1,2 m, Vorverzinkt |
| `zubehoer` | Zaunzubehör | Füße und Zubehör |
| `tore` | Türen & Tore | Tore |
| `sichtschutz` | Sichtschutz & Planen | Sichtschutz |
| `gitter` | Absperrgitter | Verkehrssicherung, Gruppe Gitter |
| `verkehr` | Verkehrssicherung | übrige Verkehrssicherung |
| `anhaenger` | Anhänger | Anhänger |

Leitkegel und Leuchten kommen im Bestand nicht vor und sind keine Kategorie. Farbe und Einsatzzweck stehen auf den Produktseiten nicht und sind keine Filter.

## Attribute

`attr` übernimmt nur Werte, die der Name, die Gruppe oder die Tabelle hergeben. Millimeter aus einer Maßzeile werden für den Filter in Meter umgerechnet, wenn die Zahl glatt aufgeht. Die Tabelle auf der Seite behält den Wortlaut.

Filter erscheinen erst, wenn die gewählte Kategorie mindestens zwei verschiedene Werte hat.

- Bauzäune: Breite, Höhe, Maschenweite, Drahtstärke, Standrohr, Oberfläche
- Zaunzubehör: Art, Fußart
- Türen & Tore: Höhe, Maschenweite
- Sichtschutz & Planen: Art
- Absperrgitter: Art
- Verkehrssicherung: Art, Länge, Höhe, Breite
- Anhänger: Art

Oberfläche ist Vollfeuerverzinkt, Verzinkt oder Vorverzinkt, und nur wenn das Wort in der Artikelüberschrift, im Absatz oder in der Seitenüberschrift „Vorverzinkte Zäune“ steht. Fußart ist Beton oder Kunststoff, und nur wenn der Name das sagt. Edelstahl steht nur bei der Schelle, die so heißt.

Suche trifft Name, Artikelnummer und Kennung. Sortierung ist Sortiment, Name oder Artikelnummer. Kategorie, Filter, Suche und Sortierung stehen in der Adresse (`?kat=bauzaune&masche=100+x+300`). Zurück im Browser stellt den Stand wieder her. `#bauzaun`, `#verkehrssicherung` und `#anhaenger` öffnen die passende Kategorie.

## Technische Daten

Auf der Kachel und auf der Artikelseite liegen die Tabellenzeilen der Produktseite unter „Technische Daten“. Ein Absatz der Produktseite liegt unter „Beschreibung“. Fehlt die Angabe, fehlt die Zeile. „Lieferumfang“ und „Passt zu“ gibt die Produktseite nicht her. „Das Paket“ ist eine Tabellenzeile mit einer Stückzahl und bleibt in der Tabelle.

Ein PDF wird als „Datenblatt (PDF)“ verlinkt, wenn die Produktseite eines zu diesem Artikel anbietet. Die Datei wird nicht kopiert. Die Liste steht in `docs/bildquellen.md`.

## Artikel ergänzen

1. Eintrag in `data/katalog.json`: `slug`, `name`, `code`, `shop`, `attr`, `specs`, `text`, `pdf`. `specs` ist die Tabelle als Paare, `text` sind die Absätze, `pdf` ist die Adresse oder `null`.
2. Kachel in `kaufen/index.html` mit demselben `data-slug`, dazu die `<details>` aus `specs`, `text` und `pdf`.
3. Seite `produkt/<slug>/index.html` im selben Aufbau. Formular `data-order` und `data-slug` unverändert lassen. Preis bleibt „Preis auf Anfrage“.
4. Steht ein neues PDF auf der Produktseite, die Adresse in `docs/bildquellen.md` eintragen und auf der Seite verlinken. Die Datei nicht herunterladen.

`attr` nur setzen, wenn der Wert im Namen, in `specs` oder in der genannten Seitenüberschrift steht.
