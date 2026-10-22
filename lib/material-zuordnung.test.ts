import { test } from "node:test";
import assert from "node:assert/strict";
import { ordneMaterialZu } from "./material-zuordnung";

const bio = (n: string) => ordneMaterialZu("biologie", n).ordner;

test("Biologie: echte Dateinamen landen im richtigen Ordner", () => {
  assert.match(bio("Informationstext DNA-Struktur.pdf"), /1 · DNA-Struktur/);
  assert.match(bio("DNA-Struktur und Chromosomen.pdf"), /1 · DNA-Struktur/);
  assert.match(bio("Informationstext  Transformations-Experiment.pdf"), /1 · DNA-Struktur/);
  assert.match(bio("DNA-Isolation Experiment.pdf"), /1 · DNA-Struktur/);
  assert.match(bio("Informationstext Replikation.pdf"), /2 · Replikation/);
  assert.match(bio("Zellzyklus.pdf"), /3 · Zellzyklus/);
  assert.match(bio("Informationstext Meiose.pdf"), /3 · Zellzyklus/);
  assert.match(bio("Vom Gen zum Merkmal Proteinbiosynthese.pdf"), /4 · Proteinbiosynthese/);
  assert.match(bio("Informationstexte Vom Gen zum Merkmal, Transkription, Translation.pdf"), /4 · Proteinbiosynthese/);
  assert.match(bio("Informationstext Prozessierung der mRNA.pdf"), /4 · Proteinbiosynthese/);
  assert.match(bio("Proteinbiosynthese bei Pro- und Eukaryoten.pdf"), /4 · Proteinbiosynthese/);
  assert.match(bio("Informationstext Genregulation bei Prokaryoten.pdf"), /5 · Genregulation/);
  assert.match(bio("RNA-Interferenz Ein Beispiel für Genregulation bei Eukaryoten.pdf"), /5 · Genregulation/);
  assert.match(bio("Interferenz.pdf"), /5 · Genregulation/);
  assert.match(bio("Mutationen2.pdf"), /6 · Mutationen/);
  assert.match(bio("Tierische und Pflanzliche Zellen (Wiederholung 10).pdf"), /7 · Zellbiologie/);
  assert.match(bio("Bakterien und Viren - auch Lebewesen.pdf"), /7 · Zellbiologie/);
  assert.match(bio("Genetik Klausur 12.pdf"), /8 · Klausur/);
  assert.match(bio("BIO-Arbeitsheft .pdf"), /8 · Klausur/);
  assert.match(bio("Bildschirmfoto 2026-10-07 um 21.05.14.png"), /9 · Notizen/);
});

test("Halbjahr 1 für Genetik, unbekannte Dateien und andere Fächer: Sonstiges", () => {
  assert.equal(ordneMaterialZu("biologie", "Zellzyklus.pdf").halbjahr, 1);
  assert.deepEqual(ordneMaterialZu("biologie", "Etwas anderes.pdf"), { ordner: "Sonstiges", halbjahr: null });
  assert.deepEqual(ordneMaterialZu("chemie", "Zellzyklus.pdf"), { ordner: "Sonstiges", halbjahr: null });
});
