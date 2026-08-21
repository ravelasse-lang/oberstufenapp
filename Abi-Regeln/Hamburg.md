---
titel: "Abitur-Regeln Hamburg (Gymnasium / Studienstufe, Profiloberstufe)"
bundesland: Hamburg
stand_recherche: 2026-08-21
quelle_primaer: "Schulpräsentation Heinrich-Heine-Gymnasium Hamburg (~2018/19), Titel: 'Einbringverpflichtungen in der Profiloberstufe'"
quellen_abgleich:
  - "https://de.wikipedia.org/wiki/Abitur_in_Hamburg"
  - "https://abirechner.org/Hamburg.html"
  - "https://www.schuelerpilot.de/abirechner/hamburg"
---

> ⚠️ **Nicht amtlich.** Diese Datei ist eine recherchierte Referenz, keine
> offizielle Quelle. Vor Abitur-relevanten Entscheidungen unbedingt gegen die
> aktuelle Handreichung der eigenen Schule bzw. die Oberstufenberatung
> abgleichen — Regeln können sich ändern, und die Primärquelle hier ist von
> ca. 2018/19. Diese Datei ist die von Menschen gepflegte Referenz; die
> ausführbare Quelle für die App ist `lib/abitur/regeln.ts` (muss bei
> Änderungen hier manuell synchron gehalten werden).

## Block I — Kursergebnisse (max. 600 Punkte)

**Einzubringen:** mindestens 32, höchstens 40 Halbjahresergebnisse.

**Pflichtfächer mit je 4 Halbjahren:**
- Deutsch
- weitergeführte Fremdsprache als Kernfach
- Mathematik
- profilgebendes Fach (Abiturprüfungsfach)
- ein weiteres Abiturprüfungsfach
- ein künstlerisches Fach (Musik, Theater oder Kunst)
- ein gesellschaftswissenschaftliches Fach (PGW, Geschichte oder Geographie)
- eine Naturwissenschaft (Biologie, Chemie oder Physik)
- weitere Halbjahresergebnisse nach Wahl bis zur Gesamtzahl

**Doppelt gewertete Ergebnisse:**
- das profilgebende Fach, wenn es nicht als Kernfach belegt ist
- ein Kernfach mit erhöhtem Anforderungsniveau, das schriftliches oder
  mündliches Abiturprüfungsfach ist

**Regeln:**
- kein eingebrachtes Ergebnis darf 0 Punkte haben
- nicht mehr als 1/5 (20 %) der eingebrachten Ergebnisse darf unter 5 Punkte liegen
- mindestens 200 Punkte müssen in Block I erreicht werden

**Formel:**

```
E_I = (P / S) × 40
```

- `P` = Summe der Punkte (doppelt gewertete Ergebnisse zählen ihren Punktwert doppelt)
- `S` = Anzahl der eingebrachten Ergebnisse (doppelt gewertete zählen als 2)

## Block II — Abiturprüfungen (max. 300 Punkte)

**4 Prüfungsfächer (P1–P4),** jeweils ×5 gewertet:

```
E_II = 5 × (P1 + P2 + P3 + P4)
```

**Regeln:**
- mindestens 100 Punkte müssen in Block II erreicht werden
- in mindestens 2 der 4 Prüfungsfächer müssen mindestens 5 Punkte erreicht
  werden, davon mindestens eins auf erhöhtem Anforderungsniveau

**Prüfungsfächer-Auswahl:**
- 2 Kernfächer + profilgebendes Fach (falls nicht als Kernfach belegt) + 1 weiteres Fach
- alle drei Aufgabenfelder müssen abgedeckt sein
- mindestens 2 schriftliche Prüfungen auf erhöhtem Niveau, davon 1 Kernfach
- P1–P3 = schriftliche Prüfungen, P4 = mündliche Prüfung oder Präsentationsprüfung

## Gesamtergebnis

```
E = E_I + E_II
```

Minimum 300, Maximum 900 Punkte.

## Punkte-zu-Note-Umrechnungstabelle (0–900 → 1,0–4,0)

Bundeseinheitlicher Standard (KMK), auch für Hamburg gültig.

| Note | Punkte | Note | Punkte | Note | Punkte | Note | Punkte |
|---|---|---|---|---|---|---|---|
| 1,0 | 900–823 | 1,9 | 678–661 | 2,8 | 516–499 | 3,7 | 354–337 |
| 1,1 | 822–805 | 2,0 | 660–643 | 2,9 | 498–481 | 3,8 | 336–319 |
| 1,2 | 804–787 | 2,1 | 642–625 | 3,0 | 480–463 | 3,9 | 318–301 |
| 1,3 | 786–769 | 2,2 | 624–607 | 3,1 | 462–445 | 4,0 | 300 |
| 1,4 | 768–751 | 2,3 | 606–589 | 3,2 | 444–427 | | |
| 1,5 | 750–733 | 2,4 | 588–571 | 3,3 | 426–409 | | |
| 1,6 | 732–715 | 2,5 | 570–553 | 3,4 | 408–391 | | |
| 1,7 | 714–697 | 2,6 | 552–535 | 3,5 | 390–373 | | |
| 1,8 | 696–679 | 2,7 | 534–517 | 3,6 | 372–355 | | |

Unter 300 Punkten: nicht bestanden.

## Offene Punkte

Siehe [`AGENDA.md`](../AGENDA.md) — insbesondere die Kurswahl-Metadaten pro
Fach (fehlen noch) und die Mehrdeutigkeit bei der Doppelgewichtungsregel.
