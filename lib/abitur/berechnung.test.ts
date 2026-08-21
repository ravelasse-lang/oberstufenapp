import { test } from "node:test";
import assert from "node:assert/strict";
import {
  berechneBlockI,
  berechneBlockII,
  berechneGesamtabitur,
  punkteZuNote,
} from "./berechnung";
import type { BlockIEintrag, PruefungsEintrag } from "./typen";

function eintrag(
  punkte: number,
  wirdEingebracht = true,
  zaehltDoppelt = false
): BlockIEintrag {
  return { fachId: "test", halbjahr: 1, punkte, wirdEingebracht, zaehltDoppelt };
}

test("Block I: 32 einfache Ergebnisse à 10 Punkte -> 400 Punkte, bestanden", () => {
  const eintraege = Array.from({ length: 32 }, () => eintrag(10));
  const ergebnis = berechneBlockI(eintraege);
  assert.equal(ergebnis.punkte, 400);
  assert.equal(ergebnis.anzahlEingebracht, 32);
  assert.equal(ergebnis.bestanden, true);
  assert.deepEqual(ergebnis.warnungen, []);
});

test("Block I: doppelt gewertete Ergebnisse fließen korrekt in P und S ein", () => {
  const eintraege = [
    ...Array.from({ length: 4 }, () => eintrag(12, true, true)),
    ...Array.from({ length: 28 }, () => eintrag(8)),
  ];
  const ergebnis = berechneBlockI(eintraege);
  // P = 4*12*2 + 28*8 = 96 + 224 = 320, S = 4*2 + 28 = 36
  // E_I = (320/36)*40 = 355.5555... -> gerundet 355.56
  assert.equal(ergebnis.punkte, 355.56);
  assert.equal(ergebnis.bestanden, true);
});

test("Block I: weniger als 32 eingebrachte Ergebnisse erzeugt Warnung", () => {
  const eintraege = Array.from({ length: 20 }, () => eintrag(10));
  const ergebnis = berechneBlockI(eintraege);
  assert.equal(ergebnis.bestanden, false);
  assert.ok(ergebnis.warnungen.some((w) => w.includes("mindestens 32")));
});

test("Block I: 0-Punkte-Eintrag erzeugt Warnung", () => {
  const eintraege = [...Array.from({ length: 31 }, () => eintrag(10)), eintrag(0)];
  const ergebnis = berechneBlockI(eintraege);
  assert.ok(ergebnis.warnungen.some((w) => w.includes("0 Punkte")));
});

test("Block I: mehr als 20% unter 5 Punkte erzeugt Warnung", () => {
  const eintraege = [
    ...Array.from({ length: 25 }, () => eintrag(10)),
    ...Array.from({ length: 7 }, () => eintrag(3)),
  ];
  const ergebnis = berechneBlockI(eintraege);
  assert.ok(ergebnis.warnungen.some((w) => w.includes("höchstens 20%")));
});

test("Block I: nicht eingebrachte Ergebnisse zählen nicht mit", () => {
  const eintraege = [
    ...Array.from({ length: 32 }, () => eintrag(10)),
    eintrag(0, false), // gestrichen, darf trotz 0 Punkten nicht warnen
  ];
  const ergebnis = berechneBlockI(eintraege);
  assert.equal(ergebnis.anzahlEingebracht, 32);
  assert.deepEqual(ergebnis.warnungen, []);
});

function pruefung(position: 1 | 2 | 3 | 4, punkte: number | null): PruefungsEintrag {
  return { position, fachId: "test", art: "schriftlich", punkte };
}

test("Block II: 4 Prüfungen à 10 Punkte -> 200 Punkte, bestanden", () => {
  const ergebnis = berechneBlockII([
    pruefung(1, 10),
    pruefung(2, 10),
    pruefung(3, 10),
    pruefung(4, 10),
  ]);
  assert.equal(ergebnis.punkte, 200);
  assert.equal(ergebnis.bestanden, true);
});

test("Block II: fehlende Prüfungsfächer erzeugen Warnung, nicht bestanden", () => {
  const ergebnis = berechneBlockII([pruefung(1, 10), pruefung(2, 10)]);
  assert.equal(ergebnis.bestanden, false);
  assert.ok(ergebnis.warnungen.some((w) => w.includes("2 von 4")));
});

test("Block II: weniger als 2 Fächer mit >=5 Punkten erzeugt Warnung", () => {
  const ergebnis = berechneBlockII([
    pruefung(1, 4),
    pruefung(2, 3),
    pruefung(3, 10),
    pruefung(4, 2),
  ]);
  assert.ok(ergebnis.warnungen.some((w) => w.includes("mindestens 2")));
});

test("punkteZuNote: Randwerte stimmen mit KMK-Tabelle überein", () => {
  assert.equal(punkteZuNote(900), 1.0);
  assert.equal(punkteZuNote(823), 1.0);
  assert.equal(punkteZuNote(822), 1.1);
  assert.equal(punkteZuNote(660), 2.0);
  assert.equal(punkteZuNote(480), 3.0);
  assert.equal(punkteZuNote(300), 4.0);
  assert.equal(punkteZuNote(299), null);
});

test("Gesamtabitur: vollständiges, bestandenes Beispiel", () => {
  const blockIEintraege = Array.from({ length: 36 }, () => eintrag(9));
  const pruefungen: PruefungsEintrag[] = [
    pruefung(1, 9),
    pruefung(2, 9),
    pruefung(3, 9),
    pruefung(4, 9),
  ];
  const ergebnis = berechneGesamtabitur(blockIEintraege, pruefungen);
  assert.equal(ergebnis.bestanden, true);
  assert.ok(ergebnis.note !== null);
});
