import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { besitzerKonfiguriert, istBesitzer } from "./besitzer";

const original = process.env.OWNER_EMAIL;

afterEach(() => {
  if (original === undefined) delete process.env.OWNER_EMAIL;
  else process.env.OWNER_EMAIL = original;
});

test("ohne OWNER_EMAIL: nicht konfiguriert, niemand ist Besitzer", () => {
  delete process.env.OWNER_EMAIL;
  assert.equal(besitzerKonfiguriert(), false);
  assert.equal(istBesitzer("irgendwer@example.com"), false);
  assert.equal(istBesitzer(""), false);
  assert.equal(istBesitzer(undefined), false);
});

test("leere oder nur aus Leerzeichen bestehende OWNER_EMAIL gilt als nicht gesetzt", () => {
  process.env.OWNER_EMAIL = "   ";
  assert.equal(besitzerKonfiguriert(), false);
  assert.equal(istBesitzer("   "), false);
});

test("Vergleich ignoriert Groß-/Kleinschreibung und Leerzeichen", () => {
  process.env.OWNER_EMAIL = "  Besitzer@Example.com ";
  assert.equal(besitzerKonfiguriert(), true);
  assert.equal(istBesitzer("besitzer@example.com"), true);
  assert.equal(istBesitzer(" BESITZER@EXAMPLE.COM "), true);
});

test("andere oder fehlende E-Mail ist nicht Besitzer", () => {
  process.env.OWNER_EMAIL = "besitzer@example.com";
  assert.equal(istBesitzer("anderer@example.com"), false);
  assert.equal(istBesitzer("besitzer@example.com.evil.de"), false);
  assert.equal(istBesitzer(null), false);
  assert.equal(istBesitzer(undefined), false);
});
