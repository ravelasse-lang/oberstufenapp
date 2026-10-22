import { test } from "node:test";
import assert from "node:assert/strict";
import { elternPfad } from "./eltern-pfad";

test("Zurück führt auf die übergeordnete Seite", () => {
  assert.equal(elternPfad("/faecher/biologie/datei/abc"), "/faecher/biologie/hochladen");
  assert.equal(elternPfad("/faecher/biologie/hochladen"), "/faecher/biologie");
  assert.equal(elternPfad("/faecher/biologie/themen/genetik"), "/faecher/biologie/themen");
  assert.equal(elternPfad("/faecher/biologie/themen"), "/faecher/biologie");
  assert.equal(elternPfad("/faecher/biologie/lernzettel"), "/faecher/biologie");
  assert.equal(elternPfad("/faecher/biologie"), "/");
  assert.equal(elternPfad("/suche"), "/");
  assert.equal(elternPfad("/todos"), "/");
  assert.equal(elternPfad("/"), "/");
});
