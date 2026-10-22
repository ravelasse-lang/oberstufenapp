import { test } from "node:test";
import assert from "node:assert/strict";
import { WIKI_MARKER, wikiLinksZuText } from "./wiki-links";

const link = (text: string) => `[${text}](${WIKI_MARKER})`;

test("[[seite]] -> Seitenname als Begriff", () => {
  assert.equal(wikiLinksZuText("Siehe [[Mitose]] hier."), `Siehe ${link("Mitose")} hier.`);
});

test("[[seite#Abschnitt]] -> Abschnitt", () => {
  assert.equal(wikiLinksZuText("[[genetik#Meiose]]"), link("Meiose"));
});

test("[[seite#Abschnitt|Anzeigetext]] -> Anzeigetext", () => {
  assert.equal(wikiLinksZuText("[[genetik#Meiose|Reifeteilung]]"), link("Reifeteilung"));
});

test("escapetes Pipe in Tabellenzelle (\\|) zerlegt die Tabelle nicht", () => {
  const eingabe = "| Phase | Begriff |\n|---|---|\n| 1 | [[genetik#Mitose\\|Mitose]] |";
  const ergebnis = wikiLinksZuText(eingabe);
  assert.equal(ergebnis, `| Phase | Begriff |\n|---|---|\n| 1 | ${link("Mitose")} |`);
  assert.ok(!ergebnis.includes("[["));
});

test("Embeds ![[bild.png]] werden entfernt", () => {
  assert.equal(wikiLinksZuText("Vorher ![[bild.png]] nachher"), "Vorher  nachher");
});

test("leerer Anzeigetext ergibt nichts", () => {
  assert.equal(wikiLinksZuText("a [[seite#]] b"), "a  b");
  assert.equal(wikiLinksZuText("a [[seite|  ]] b"), "a  b");
});

test("Markdown-Sonderzeichen im Anzeigetext werden escaped", () => {
  assert.equal(wikiLinksZuText("[[x|a*b]]"), link("a\\*b"));
  assert.equal(wikiLinksZuText("[[x|a(b)]]"), link("a\\(b\\)"));
  assert.equal(wikiLinksZuText("[[x|<b>]]"), link("\\<b\\>"));
});

test("mehrere Links in einer Zeile und Text ohne Wiki-Links bleibt unverändert", () => {
  assert.equal(wikiLinksZuText("[[a]] und [[b]]"), `${link("a")} und ${link("b")}`);
  assert.equal(wikiLinksZuText("Kein Link, nur [Text](http://x.de)."), "Kein Link, nur [Text](http://x.de).");
});
