import { test } from "node:test";
import assert from "node:assert/strict";
import { istSlug } from "./slug";

test("gültige Slugs", () => {
  for (const s of ["biologie", "genetik", "block-1", "e2", "a"]) {
    assert.equal(istSlug(s), true, s);
  }
});

test("Pfad-Tricks und Sonderzeichen werden abgelehnt", () => {
  for (const s of [
    "",
    "..",
    "../etc",
    "a/b",
    "a\\b",
    "a.md",
    "Biologie",
    "bio logie",
    "bio_logie",
    "%2e%2e",
    "a\nb",
    "ä",
  ]) {
    assert.equal(istSlug(s), false, JSON.stringify(s));
  }
});
