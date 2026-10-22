import { test } from "node:test";
import assert from "node:assert/strict";
import { sichererZiel } from "./ziel";

test("interne Pfade bleiben erhalten", () => {
  assert.equal(sichererZiel("/"), "/");
  assert.equal(sichererZiel("/noten"), "/noten");
  assert.equal(sichererZiel("/faecher/biologie?x=1#a"), "/faecher/biologie?x=1#a");
});

test("fehlend oder leer -> Startseite", () => {
  assert.equal(sichererZiel(null), "/");
  assert.equal(sichererZiel(undefined), "/");
  assert.equal(sichererZiel(""), "/");
});

test("externe Ziele und Tricks -> Startseite", () => {
  for (const s of ["@evil.de", "//evil.de", "https://evil.de", "evil.de", "/\\evil.de", "\\\\evil.de", "/a\nb", "javascript:alert(1)"]) {
    assert.equal(sichererZiel(s), "/", JSON.stringify(s));
  }
});
