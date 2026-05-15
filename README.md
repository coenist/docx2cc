# DOCX naar IMS Common Cartridge voor Orion

Deze webpagina zet een Microsoft Word-document (`.docx`) om naar een **IMS Common Cartridge 1.3** ZIP-bestand dat geïmporteerd kan worden in **Orion**, de digitale leeromgeving van HOGENT:

[https://orion.hogent.be](https://orion.hogent.be)

De toepassing is bedoeld om cursusmateriaal dat in één Word-document staat snel op te splitsen in afzonderlijke hoofdstukken. Elk hoofdstuk wordt omgezet naar een aparte HTML-pagina, inclusief afbeeldingen, tabellen en formules waar mogelijk.

De gegenereerde ZIP bevat een `imsmanifest.xml`, HTML-bestanden per hoofdstuk en een `course/assets/` map met de gebruikte afbeeldingen en formulebestanden.

> Deze converter is ook beschikbaar via [https://geo.hogent.be/docx2cc](https://geo.hogent.be/docx2cc).

---

## Doelstelling

De tool helpt docenten om bestaand cursusmateriaal in Microsoft Word sneller om te zetten naar leerinhoud die hoofdstuk per hoofdstuk in Orion kan worden geïmporteerd.

In plaats van één groot PDF- of Word-document aan te bieden, wordt de inhoud opgesplitst in aparte HTML-pagina’s. Hierdoor kan de cursusinhoud beter geïntegreerd worden in de leeromgeving.

---

## Belangrijkste functies

- Volledig client-side: het Word-document wordt niet geüpload naar een server.
- DOCX-bestand wordt in de browser verwerkt.
- Automatische opsplitsing op basis van hoofdstuktitels.
- Export naar IMS Common Cartridge 1.3.
- Importeerbaar in Orion.
- Preview van hoofdstukken vóór export.
- Mogelijkheid om hoofdstukken al dan niet mee te nemen in de export.
- Afbeeldingen worden geëxtraheerd en toegevoegd aan de assets-map.
- TIFF/TIF-afbeeldingen worden automatisch omgezet naar PNG.
- EMF/WMF-afbeeldingen worden gedetecteerd en gemeld.
- Inline formules worden waar mogelijk omgezet naar SVG.
- Tabellen worden gestyled voor betere leesbaarheid in HTML.

---

## Bestandsstructuur

De toepassing bestaat uit een HTML-pagina, een CSS-bestand en verschillende JavaScript-modules.

Voorbeeldstructuur:

```text
convert_docx2cc/
├── index.html
├── README.md
├── css/
│   └── styles.css
└── js/
    ├── app.js
    ├── config.js
    ├── docx-processor.js
    ├── html-helpers.js
    ├── ims-package.js
    ├── math.js
    ├── media.js
    ├── state.js
    ├── ui.js
    └── utils.js
```

---

## Vereisten

De toepassing draait volledig in de browser, maar moet wel via een lokale of online webserver worden geopend. Rechtstreeks openen via ``file://`` wordt afgeraden, omdat ES-modules en externe bibliotheken dan vaak niet correct werken.

Aanbevolen browser:

- Google Chrome
- Microsoft Edge
- Firefox

Safari werkt gedeeltelijk, maar Chrome of Edge wordt aanbevolen voor het testen van het uiteindelijke resultaat.

---

## Externe JavaScript-bibliotheken

De toepassing gebruikt onder andere:

- Mammoth.js voor DOCX naar HTML
- JSZip voor het lezen en aanmaken van ZIP-bestanden
- FileSaver.js voor het downloaden van de ZIP
- MathJax voor het renderen van formules naar SVG
- UTIF.js voor het omzetten van TIFF/TIF naar PNG

Deze bibliotheken worden in ``index.html`` via CDN geladen.

---

## Lokaal testen

Start in de projectmap een eenvoudige lokale webserver:

```bash
python3 -m http.server 8000
```

Open daarna in de browser:

```bash
http://localhost:8000/
```

Of, wanneer de bestanden in een submap staan:

```bash
http://localhost:8000/convert_docx2cc/
```

---

## Gebruik

1. Open de webpagina in de browser.
2. Kies een ``.docx``-bestand.
3. Klik op Verwerk DOCX.
4. Controleer de gevonden hoofdstukken.
5. Bekijk de preview per hoofdstuk.
6. Vink hoofdstukken uit die niet geëxporteerd moeten worden.
7. Klik op Maak ZIP en download.
8. Importeer de ZIP in Orion als Common Cartridge.

---

## Hoofdstukken herkennen

De tool splitst het Word-document op basis van hoofdstukkoppen.

Gebruik in Word bij voorkeur één van deze stijlen voor hoofdstukken:

- ``Heading 1``
- ``Kop 1``
- ``Titel 1``

Elke paragraaf met een dergelijke stijl wordt als nieuw hoofdstuk beschouwd. Subkoppen kunnen bijvoorbeeld gebruikmaken van:

- ``Heading 2``
- ``Kop 2``
- ``Heading 3``
- ``Kop 3``

Deze worden niet gebruikt om aparte bestanden te maken, maar blijven binnen het hoofdstuk behouden.

---

## Selecteren van hoofdstukken

Na verwerking verschijnt links een lijst met hoofdstukken. Elk hoofdstuk heeft een checkbox.

- Aangevinkte hoofdstukken worden opgenomen in de ZIP.
- Niet-aangevinkte hoofdstukken worden niet opgenomen.
- Assets die enkel door niet-geselecteerde hoofdstukken gebruikt worden, worden niet toegevoegd aan de export.

Er zijn ook knoppen om alle hoofdstukken in één keer te selecteren of te deselecteren.

---

## Output

De gegenereerde ZIP bevat typisch:

```text
imsmanifest.xml
course/
├── 01-inleiding.html
├── 02-hoofdstuk.html
├── 03-hoofdstuk.html
└── assets/
    ├── image_....png
    ├── media_....png
    └── math_....svg
```

De HTML-bestanden verwijzen relatief naar de assets:

```html
<img src="assets/image_....png">
```

Het manifest verwijst naar de HTML-bestanden en de nodige assets.

---

## Importeren in Orion

Importeer de gedownloade ZIP in Orion via de importfunctie voor leerinhoud.

1. Ga naar de cursus waarbinnen de inhoud moet worden geïmporteerd.
2. Klik ``Beheer`` --> ``Cursus import/export``
3. Selecteer ``Onderdelen importeren`` en volg de stappen.

Na enkele minuten zal de geïmporteerde inhoud als nieuwe eenheid in de cursus verschijnen. Mocht er om de een of andere reden iets foutgelopen zijn, kan het logboek bekeken worden.

---

## Afbeeldingen

Afbeeldingen uit het Word-document worden geëxtraheerd en in de ZIP geplaatst onder:

```text
course/assets/
```

Ondersteunde webformaten zijn onder andere:

- PNG
- JPG/JPEG
- GIF
- SVG
- WebP

**TIFF/TIF:** TIFF- en TIF-afbeeldingen worden automatisch omgezet naar PNG. Dit is nodig omdat Chrome en veel leeromgevingen TIFF niet betrouwbaar weergeven. De toepassing toont een melding met:

- originele bestandsnaam
- nieuwe PNG-bestandsnaam
- eventueel gevonden bijschrift

**EMF/WMF:** EMF- en WMF-afbeeldingen worden wel toegevoegd aan de assets-map, maar worden meestal niet correct weergegeven in browsers of in Orion. De toepassing toont hiervoor een waarschuwing. Indien mogelijk wordt ook het bijschrift of de tekst in de buurt van de figuur weergegeven. Voor een betrouwbaar resultaat worden EMF/WMF-afbeeldingen best vooraf in Word of LibreOffice omgezet naar PNG of SVG.

---

## Bijschriften bij figuren

De tool probeert bijschriften bij afbeeldingen automatisch te detecteren. Dit gebeurt op basis van:

- Word-stijl ``Caption`` of ``Bijschrift``
- tekst die begint met ``Figuur``, ``Fig.``, ``Figure``, ``Afbeelding`` of ``Illustratie``
- tekst net vóór of net na de afbeelding

Deze informatie wordt vooral gebruikt in waarschuwingen voor EMF/WMF- en TIFF/TIF-afbeeldingen.

---

## Formules

De toepassing probeert formules zichtbaar te maken door ze om te zetten naar SVG-afbeeldingen.

Ondersteund:

- eenvoudige inline TeX-formules tussen ``$...$``
- veel voorkomende Word-formules in OMML-formaat
- breuken
- subscripts en superscripts
- wortels
- eenvoudige Griekse letters
- eenvoudige sommen en integralen
- eenvoudige matrices

Niet alle complexe Word-formules kunnen perfect worden geconverteerd. Wanneer een formule niet correct wordt omgezet, kan de formule vereenvoudigd worden in Word of vervangen worden door TeX-notatie.

---

## Tabellen

Tabellen worden automatisch gestyled voor gebruik in HTML.

Regels:

- Tabellen met slechts één rij krijgen geen zichtbare randen.
- Tabellen met meerdere rijen krijgen een duidelijke tabelstijl.
- De eerste rij wordt als hoofding beschouwd.
- De tekst in de hoofding wordt vet weergegeven.
- De horizontale rand onder de hoofding wordt dikker weergegeven.
- Elke even datarij krijgt een lichtgrijze achtergrond.

Complexe Word-tabellen kunnen afwijken van de originele lay-out. Vooral samengevoegde cellen, geneste tabellen, zwevende objecten of zeer specifieke Word-opmaak kunnen beperkt ondersteund zijn.

---

## Privacy

De toepassing werkt volledig in de browser. Het geselecteerde DOCX-bestand wordt niet geüpload naar een server. Alle verwerking gebeurt lokaal in de browser van de gebruiker. 

> Let wel op: de externe JavaScript-bibliotheken worden via CDN geladen. Wie volledige controle wil, kan deze bibliotheken lokaal downloaden en vanuit de eigen server aanbieden.

---

## Beperkingen

Deze tool is bedoeld voor snelle omzetting van Word-cursusmateriaal naar leerinhoud. Het is geen volledige Word-renderer.

Mogelijke beperkingen:

- complexe Word-layout wordt niet altijd exact behouden
- tekstvakken kunnen ontbreken of anders weergegeven worden
- zwevende figuren kunnen anders geplaatst worden
- SmartArt wordt niet altijd goed verwerkt
- EMF/WMF wordt niet zichtbaar weergegeven
- zeer complexe Word-formules kunnen fout of vereenvoudigd worden
- inhoud uit kopteksten en voetteksten wordt niet altijd opgenomen
- paginanummers, sectie-eindes en Word-specifieke paginalay-out worden genegeerd

Voor het beste resultaat is het aanbevolen om het Word-document vooraf zo semantisch mogelijk op te bouwen met stijlen zoals ``Kop 1``, ``Kop 2``, ``Bijschrift``, enzovoort.

---

## Aanbevolen voorbereiding van het Word-document

Voor een vlotte conversie:

1. Gebruik ``Kop 1`` voor elk hoofdstuk.
2. Gebruik ``Kop 2`` en ``Kop 3`` voor subsecties.
3. Vermijd tekstvakken voor belangrijke inhoud.
4. Vermijd zwevende afbeeldingen wanneer mogelijk.
5. Zet EMF/WMF-afbeeldingen vooraf om naar PNG of SVG.
6. Gebruik gewone Word-bijschriften voor figuren.
7. Controleer tabellen na conversie in de preview.
8. Controleer de hoofdstukselectie vóór export.

---

## Ontwikkelnotities

De toepassing is opgesplitst in modules:

- ``app.js``: Startpunt van de applicatie. Verwerkt de gebruikersinteractie, start de conversie en activeert de download.
- ``config.js``: Centrale instellingen, zoals de rootmap in de ZIP en de titel van de contentmap.
- ``docx-processor.js``: Verwerkt het DOCX-bestand, roept Mammoth aan en bouwt de hoofdstukken op.
- ``html-helpers.js``: Bevat functies voor HTML-opbouw, hoofdstukdetectie, tabelstyling en image-detectie.
- ``ims-package.js``: Maakt het IMS-manifest en de uiteindelijke ZIP.
- ``math.js``: Verwerkt inline TeX en Word-formules waar mogelijk naar SVG.
- ``media.js``: Verwerkt afbeeldingen, media uit word/media/, TIFF-conversie en EMF/WMF-detectie.
- ``state.js``: Beheert gedeelde runtime-status zoals hoofdstukken, assets en geselecteerde hoofdstukken.
- ``ui.js``: Beheert de interface, preview, waarschuwingen en logging.
- ``utils.js``: Bevat algemene hulpfuncties.

---

## Troubleshooting

**De pagina werkt niet wanneer ik het bestand dubbelklik**

Gebruik een lokale webserver:

```batch
python3 -m http.server 8000
```

Open daarna de pagina via ``http://localhost:8000/``.

**Niet alle afbeeldingen zijn zichtbaar**

Controleer de waarschuwingen. Mogelijke oorzaken:

- EMF/WMF-afbeeldingen
- afbeeldingen in tekstvakken
- gekoppelde afbeeldingen
- afbeeldingen in kop- of voetteksten
- SmartArt of gegroepeerde objecten

**TIFF-afbeeldingen zijn niet zichtbaar**

TIFF-afbeeldingen worden normaal automatisch naar PNG geconverteerd. Controleer de log. Als conversie mislukt, kan het TIFF-bestand een compressievariant gebruiken die niet ondersteund wordt door de browserbibliotheek.

**Formules worden niet correct weergegeven**

Gebruik eenvoudige Word-formules of TeX-notatie tussen ``$...$``. Complexe Word-formules kunnen beperkt ondersteund zijn.

**De ZIP importeert niet correct in Orion**

Controleer of het ZIP-bestand deze structuur bevat:

```text
imsmanifest.xml
course/
course/assets/
```

---

## Licentie en gebruik

Deze tool is bedoeld voor intern of educatief gebruik binnen HOGENT. Controleer bij publicatie of de gebruikte externe bibliotheken en CDN’s passen binnen het ICT- en privacybeleid van de instelling.

> **De auteur van deze converter is op geen enkele manier verantwoordelijk voor eventuele fouten bij de conversie of importeren in Orion.**

---

## Contact / onderhoud

Deze toepassing werd ontwikkeld om Microsoft Word-cursusmateriaal snel om te zetten naar importeerbare Common Cartridge-inhoud voor Orion.

Bij verdere uitbreiding kunnen onder andere volgende verbeteringen overwogen worden:

- betere ondersteuning voor tekstvakken
- betere ondersteuning voor kop- en voetteksten
- export van niet-geplaatste afbeeldingen naar een aparte controlepagina
- validatie van het IMS-manifest vóór download
- lokale bundeling van alle externe bibliotheken