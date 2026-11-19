# Gemeinsamer Katalog, Umschalter Mieten | Kaufen

Stand: Auftrag AU, 19.11.2026. Dieses Dokument ist das Konzept und die Funktionsliste der heutigen Mieten-Seiten. Die alten Seiten bleiben, bis die Liste hier abgedeckt ist.

## Konzept

Ein Katalog unter `kaufen/`. Unter der Überschrift steht der Umschalter **Mieten | Kaufen**, dieselbe Optik wie die Kachelbeschriftung (Rahmen, Schrift, aktiv grün). Der Modus steht in der Adresse als `?modus=miete` und wird gemerkt. Ohne Angabe gilt Kaufen, damit die bisherigen Kauf-Adressen bleiben. Leere Unterkategorien verschwinden aus Oberkacheln, Hover-Panel, Schriftzug-Leiste und Handy-Leiste.

Bilder, Texte, Maße und Kategorien sind gemeinsam. `data/katalog.json` trägt je Produkt `modi`. Jedes Produkt enthält `"kauf"`. `"miete"` steht nur bei der Testauswahl unten. Preise, Texte und die Kauf-Zubehörzuordnung bleiben unverändert.

Im Modus Mieten zeigt die bestehende Navigation (Oberkacheln, Hover-Panel, Schriftzug-Leiste, Handy-Leiste) nur Kategorien, in denen etwas mietbar ist. Leere Unterkategorien verschwinden. Der Wechsel bleibt in Kategorie und Produkt, wenn das Produkt mietbar ist, sonst in der nächsten Kategorie derselben Hauptgruppe.

Die Kachel, die Detailseite und die Karte „Deine Auswahl“ sind in beiden Modi dieselben Bausteine. Die Regeln unterscheiden sich:

- Kaufen: Stückzahl, beim Bauzaun der Komplett-Ständer nur auf der Detailseite, wie nach Auftrag AT.
- Mieten: Stückzahl, beim Anhänger keine Anzahl. Der Bauzaun ist ein einfaches Mengenfeld, ohne Komplett-Ständer. Folie, Schelle und Fuß sind eigene Mietpositionen. Der Hinweis zur verkehrsrechtlichen Anordnung bleibt bei der Verkehrsabsicherung. Der Zeitraum bleibt das eine Von/Bis der Anfrage (`js/zeitraum.js`), nicht ein Datum je Kachel. Wer zwei Zeiträume braucht, stellt zwei Anfragen, wie der Hinweis im Formular schon sagt.

Der Anfragekorb trennt die Blöcke „Miete“ und „Kauf“ wie heute. Links der Mietzeilen zeigen auf die Produktseite mit `?modus=miete`. Formular, Web3Forms und der Mailtext bleiben inhaltlich gleich.

Alte Mieten-Adressen leiten auf den Katalog mit `?modus=miete`. Die Seite `mieten/index.html` wird erst gelöscht, wenn diese Liste abgedeckt ist und die Löschgrenze hält.

## Mietbare Testauswahl

Artikelnummer, Kennung, Name. Anhänger haben im Katalog keine Artikelnummer.

| Nummer | Kennung | Name |
| --- | --- | --- |
| 10075 | `bauzaun-10075` | Bauzaun Profi 3,5 × 2,0 m |
| 10012 | `plane-10012` | Sichtschutzplane |
| 10002.1 | `zubehoer-10002-1` | Verbindungsschelle 2,5 mm |
| 10006 | `fuss-10006` | Kunststofffuß schwer 23 kg |
| 10024.1 | `schranke-10024-1` | Kunststoff Schrankenzaun mit Folie RA1 |
| 10024.3 | `schranke-10024-3` | Kunststoff Schrankenzaun mit Folie RA2 |
| 10026 | `absperrung-10026` | Absperrgitter leicht |
| – | `hochlader` | Hochlader |
| – | `planenanhaenger` | Planenanhänger |
| – | `kofferanhaenger` | Kofferanhänger |
| – | `fahrzeugtransporter` | Fahrzeugtransporter |
| – | `kuehlanhaenger` | Kühlanhänger |
| – | `kuehlanhaenger-events` | Kühlanhänger für Events |

Nur das Standardfeld 10075 ist mietbar. Die anderen Felder 3,5 × 2,0 m bleiben Kauf: 10075.1 engmaschig, 10075.3 mit Mittelrohr, 10076.0 Exklusiv, 10039.3 Profi Round, 10069.5 Round, 10069.10 bis 10069.13 Press, 10069.3 Profi Press mit Mittelrohr, 10069.1 Profi Press engmaschig, 10069.4 Round Masche 100 × 300 mm. Heute zeigt die Miete den Typ „standard“ auf genau „Bauzaun Profi 3,5 × 2,0 m“. Ob weitere Felder mietbar werden, ist eine offene Frage an AMK.

Schilder, Leitbake, weitere Gitter, Schwellen, Schleusen, Bühnen, Tore und das übrige Zubehör sind in diesem Test nur Kauf.

## Funktionsliste der heutigen Mieten-Seiten

Quelle: `mieten/index.html`, `js/mieten.js`, `js/bauzaun.js`, `js/auswahl.js` im Zweig `data-vorgang="miete"`, `js/schilder.js`, `js/zeitraum.js`, `js/anfrage.js`. Die Unterseiten `mieten/bauzaun/`, `mieten/verkehrssicherung/`, `mieten/absperrung/` und `mieten/mietpark/` sind schon Weiterleitungen.

### Navigation

- Drei Oberkacheln: Bauzaun & Absperrgitter, Verkehrsabsicherung & Schilder, Anhänger. Klick setzt `?gruppe`.
- Unter Bauzaun fünf Kacheln: Bauzaun, Absperrgitter, Bodenleitschwellen, Schleusen, Bühnen. Adresse `?gruppe=zaun&teil=`.
- `js/mieten.js` `readUrl` / `writeUrl` / `render`. Alte Werte `teil=leit` und Zeichen-Teile werden umgesetzt. `popstate` liest die Adresse neu.
- Keine Schriftzug-Leiste, kein Hover-Panel, keine Handy-Leiste. Das übernimmt der gemeinsame Katalog aus dem Kauf.

### Bauzaun-Konfigurator

Aufrufer: Formular `#bauzaun-konfig`, gebaut von `js/bauzaun.js`.

- Vier Typen über `AMK_TYPWAHL.card` mit Modus Länge: standard = Bauzaun Profi 3,5 × 2,0 m, f1 = Bauzaun Profi 3,5 × 1,2 m, secure = Bauzaun Profi engmaschig 3,5 × 2,0 m, xxl = Bauzaun Profi Exklusiv 3,5 × 2,5 m.
- Umschalter Meter oder Felder, Feld `#menge-*`.
- Satz „Standardzubehör inklusive: Füße, Schellen, Streben nach Bedarf.“
- Sonderzubehör als Häkchen: Lauftor/Tür, Einfahrtstor, Sichtschutzplane, Sicherheitsschellen, Schwere Füße, Straßenverkehr/Absicherung.
- Aufklapp „Weiteres Zubehör auf Anfrage“ und Bemerkung.
- Kasten „Ihre Auswahl“, Kurztext, Liste, Preis auf Anfrage, Knopf „In den Anfragekorb“.
- Speichern als `miete:bauzaun:{key}` mit `konfig` (Art, Menge, Einheit, Extras, Bemerkung), `qty` 1. Abwählen löscht die Zeile.

Im gemeinsamen Katalog entfällt dieser Konfigurator für die Testauswahl. Sichtbar ist nur 10075 als einfache Menge. Plane, Schelle 2,5 mm und der schwere Fuß sind eigene Kacheln. Die vier Typen und die Meter-Eingabe bleiben eine offene Frage, siehe oben.

### Geräte, Schilder, Anhänger

- `#miete-geraet` mit `data-auswahl` und `data-vorgang="miete"` für Gitter, Schwellen, Schleuse, Bühne. `js/auswahl.js` malt die flache Zeile `.pick`, nicht die Kauf-Kachel. Menge erscheint nach dem Häkchen. Kennung `miete:{slug}`. Anhänger ohne Mengenfeld (`sammel`).
- Verkehrs-Hinweis und Häkchen `#genehmigung-miete`. Kennung `miete:genehmigung`, Name „Anordnung durch AMK beantragen lassen“.
- `#miete-absperrung` listet Schranken und Leitbaken. Satz „Ständer und Fußplatten sind beim Mieten dabei.“
- `#miete-schilder` mit `data-vorgang="miete"`. `js/schilder.js` schreibt `miete:schild:{id}` und `miete:schild:hinweis`. Die Kauf-Kachel bleibt dort aus.
- `#miete-anhaenger` ohne Anzahl.
- Kasten `#miete-verkehr-summe`, Titel „Ihre Auswahl“. Knopf `#miete-verkehr-korb` schickt die Formulare, oder setzt den Fokus auf die erste Wahl, wenn nichts gewählt ist.
- `amk-teil` und `amk-zeichen` schreiben die Adresse. `jumpTo` springt zur Schild- oder Geräte-Leiste.

Im gemeinsamen Katalog nutzen dieselben Produkte die Kauf-Kachel und „Deine Auswahl“. Die Kennung bleibt `miete:`. Anhänger bleiben ohne Anzahl. Der Genehmigungshinweis bleibt bei der Verkehrsabsicherung. Schilder sind in der Testauswahl nicht mietbar, der Schild-Zweig von `js/schilder.js` bleibt für die alte Seite.

### Zeitraum und Korb

- `js/zeitraum.js` prüft Von/Bis: nicht in der Vergangenheit, Ende nicht vor Anfang. Gebunden an `#von`/`#bis` und an `form[data-order]`.
- Die Felder stehen im Anfrageformular unter „Zeitraum und Anfahrt“, dazu Leistung, Einsatzort, PLZ. Pflicht nur, wenn eine Mietzeile im Korb liegt (`js/anfrage.js`).
- Der Korb gruppiert „Miete“, „Kauf“, „Weiteres“. Kauf-Ständer bleiben eine Gruppe. Mietzeilen mit `konfig` zeigen Art, Menge und „Standardzubehör inklusive“.
- `artikelHref` / `editHref`: Kauf zeigt auf die Produktseite, viele Mietzeilen noch auf `mieten/`. Das wird für Katalog-Slugs auf `produkt/{slug}/?modus=miete` gelegt. Der Mailtext bleibt.

### Was die alte Seite danach noch kann

Solange `mieten/index.html` nicht gelöscht ist, bleiben Konfigurator, Meter/Felder, Sonderzubehör-Häkchen und die Schild-Miete im Quelltext. Die Adresse leitet auf den Katalog um, sobald der Umschalter die Testauswahl zeigt. Löschen erst danach und nur unter der Grenze von 300 Zeilen.
