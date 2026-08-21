import type {
  AbiturErgebnis,
  BlockIEintrag,
  BlockIErgebnis,
  BlockIIErgebnis,
  PruefungsEintrag,
} from "@/lib/abitur/typen";
import {
  BLOCK_I_MAX_ANTEIL_UNTER_5_PUNKTE,
  BLOCK_I_MAX_ERGEBNISSE,
  BLOCK_I_MIN_ERGEBNISSE,
  BLOCK_I_MIN_PUNKTE,
  BLOCK_II_MIN_FAECHER_MIT_5_PUNKTEN,
  BLOCK_II_MIN_PUNKTE,
  GESAMT_MAX_PUNKTE,
  GESAMT_MIN_PUNKTE,
  PUNKTE_ZU_NOTE_TABELLE,
} from "@/lib/abitur/regeln";

export function berechneBlockI(eintraege: BlockIEintrag[]): BlockIErgebnis {
  const eingebracht = eintraege.filter((e) => e.wirdEingebracht);
  const warnungen: string[] = [];

  if (eingebracht.length < BLOCK_I_MIN_ERGEBNISSE) {
    warnungen.push(
      `Nur ${eingebracht.length} von mindestens ${BLOCK_I_MIN_ERGEBNISSE} nötigen Ergebnissen eingebracht.`
    );
  }
  if (eingebracht.length > BLOCK_I_MAX_ERGEBNISSE) {
    warnungen.push(
      `${eingebracht.length} Ergebnisse eingebracht, erlaubt sind höchstens ${BLOCK_I_MAX_ERGEBNISSE}.`
    );
  }

  const nullPunkteEintraege = eingebracht.filter((e) => e.punkte === 0);
  if (nullPunkteEintraege.length > 0) {
    warnungen.push(
      `${nullPunkteEintraege.length} eingebrachte Ergebnisse haben 0 Punkte — das ist nicht erlaubt.`
    );
  }

  const unter5 = eingebracht.filter((e) => e.punkte < 5).length;
  if (eingebracht.length > 0 && unter5 / eingebracht.length > BLOCK_I_MAX_ANTEIL_UNTER_5_PUNKTE) {
    warnungen.push(
      `${unter5} von ${eingebracht.length} Ergebnissen unter 5 Punkte — erlaubt sind höchstens 20%.`
    );
  }

  let p = 0;
  let s = 0;
  for (const eintrag of eingebracht) {
    const gewichtung = eintrag.zaehltDoppelt ? 2 : 1;
    p += eintrag.punkte * gewichtung;
    s += gewichtung;
  }

  const punkte = s === 0 ? 0 : Math.round(((p / s) * 40 + Number.EPSILON) * 100) / 100;

  if (punkte < BLOCK_I_MIN_PUNKTE) {
    warnungen.push(`Block I: ${punkte} Punkte, mindestens ${BLOCK_I_MIN_PUNKTE} nötig.`);
  }

  return {
    punkte,
    anzahlEingebracht: eingebracht.length,
    bestanden: warnungen.length === 0,
    warnungen,
  };
}

export function berechneBlockII(pruefungen: PruefungsEintrag[]): BlockIIErgebnis {
  const warnungen: string[] = [];
  const vollstaendig = pruefungen.filter((p) => p.punkte !== null);

  if (vollstaendig.length < 4) {
    warnungen.push(
      `${vollstaendig.length} von 4 Prüfungsfächern mit Punkten eingetragen.`
    );
  }

  const punkte = 5 * vollstaendig.reduce((summe, p) => summe + (p.punkte ?? 0), 0);

  const mit5Punkten = vollstaendig.filter((p) => (p.punkte ?? 0) >= 5).length;
  if (vollstaendig.length === 4 && mit5Punkten < BLOCK_II_MIN_FAECHER_MIT_5_PUNKTEN) {
    warnungen.push(
      `Nur in ${mit5Punkten} Prüfungsfächern mindestens 5 Punkte — nötig sind mindestens ${BLOCK_II_MIN_FAECHER_MIT_5_PUNKTEN}.`
    );
  }

  if (vollstaendig.length === 4 && punkte < BLOCK_II_MIN_PUNKTE) {
    warnungen.push(`Block II: ${punkte} Punkte, mindestens ${BLOCK_II_MIN_PUNKTE} nötig.`);
  }

  return {
    punkte,
    bestanden: vollstaendig.length === 4 && warnungen.length === 0,
    warnungen,
  };
}

export function punkteZuNote(gesamtpunkte: number): number | null {
  if (gesamtpunkte < GESAMT_MIN_PUNKTE) return null;
  const eintrag = PUNKTE_ZU_NOTE_TABELLE.find(
    (e) => gesamtpunkte >= e.von && gesamtpunkte <= e.bis
  );
  return eintrag?.note ?? null;
}

export function berechneGesamtabitur(
  blockIEintraege: BlockIEintrag[],
  pruefungen: PruefungsEintrag[]
): AbiturErgebnis {
  const blockI = berechneBlockI(blockIEintraege);
  const blockII = berechneBlockII(pruefungen);
  const gesamtpunkte = Math.round(blockI.punkte + blockII.punkte);

  return {
    blockI,
    blockII,
    gesamtpunkte: Math.min(gesamtpunkte, GESAMT_MAX_PUNKTE),
    note: blockI.bestanden && blockII.bestanden ? punkteZuNote(gesamtpunkte) : null,
    bestanden: blockI.bestanden && blockII.bestanden && gesamtpunkte >= GESAMT_MIN_PUNKTE,
  };
}
