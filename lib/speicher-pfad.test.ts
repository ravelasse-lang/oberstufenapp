import { test } from "node:test";
import assert from "node:assert/strict";
import { sichererSpeicherName } from "./speicher-pfad";

test("Umlaute, Leerzeichen und Sonderzeichen werden ersetzt", () => {
  assert.equal(
    sichererSpeicherName("RNA-Interferenz Ein Beispiel für Genregulation bei Eukaryoten.pdf"),
    "RNA-Interferenz_Ein_Beispiel_fur_Genregulation_bei_Eukaryoten.pdf"
  );
  assert.equal(sichererSpeicherName("BIO-Arbeitsheft .pdf"), "BIO-Arbeitsheft_.pdf");
  assert.equal(
    sichererSpeicherName("Bildschirmfoto 2026-10-07 um 21.05.14.png"),
    "Bildschirmfoto_2026-10-07_um_21.05.14.png"
  );
  assert.equal(sichererSpeicherName("Straße [Kopie] (1).pdf"), "Strasse_Kopie_1_.pdf");
});

test("keine Pfadtricks, nie leer, Endung bleibt", () => {
  assert.ok(!sichererSpeicherName("../../etc/passwd").includes("/"));
  assert.ok(!sichererSpeicherName("..\\x").includes("\\"));
  assert.equal(sichererSpeicherName("日本語"), "datei");
  assert.equal(sichererSpeicherName(""), "datei");
  assert.ok(sichererSpeicherName("a".repeat(300) + ".pdf").endsWith(".pdf"));
});
