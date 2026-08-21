// Transkription der Regeln aus /Abi-Regeln/Hamburg.md - bei Änderungen dort
// bitte auch hier synchron halten (und umgekehrt).

export const BLOCK_I_MIN_ERGEBNISSE = 32;
export const BLOCK_I_MAX_ERGEBNISSE = 40;
export const BLOCK_I_MIN_PUNKTE = 200;
export const BLOCK_I_MAX_PUNKTE = 600;
export const BLOCK_I_MAX_ANTEIL_UNTER_5_PUNKTE = 0.2;

export const BLOCK_II_MIN_PUNKTE = 100;
export const BLOCK_II_MAX_PUNKTE = 300;
export const BLOCK_II_MIN_FAECHER_MIT_5_PUNKTEN = 2;

export const GESAMT_MIN_PUNKTE = 300;
export const GESAMT_MAX_PUNKTE = 900;

// Punkte-zu-Note-Umrechnungstabelle (0-900 -> 1,0-4,0), bundeseinheitlich (KMK).
// Absteigend sortiert, `von`/`bis` inklusiv.
export const PUNKTE_ZU_NOTE_TABELLE: { von: number; bis: number; note: number }[] = [
  { von: 823, bis: 900, note: 1.0 },
  { von: 805, bis: 822, note: 1.1 },
  { von: 787, bis: 804, note: 1.2 },
  { von: 769, bis: 786, note: 1.3 },
  { von: 751, bis: 768, note: 1.4 },
  { von: 733, bis: 750, note: 1.5 },
  { von: 715, bis: 732, note: 1.6 },
  { von: 697, bis: 714, note: 1.7 },
  { von: 679, bis: 696, note: 1.8 },
  { von: 661, bis: 678, note: 1.9 },
  { von: 643, bis: 660, note: 2.0 },
  { von: 625, bis: 642, note: 2.1 },
  { von: 607, bis: 624, note: 2.2 },
  { von: 589, bis: 606, note: 2.3 },
  { von: 571, bis: 588, note: 2.4 },
  { von: 553, bis: 570, note: 2.5 },
  { von: 535, bis: 552, note: 2.6 },
  { von: 517, bis: 534, note: 2.7 },
  { von: 499, bis: 516, note: 2.8 },
  { von: 481, bis: 498, note: 2.9 },
  { von: 463, bis: 480, note: 3.0 },
  { von: 445, bis: 462, note: 3.1 },
  { von: 427, bis: 444, note: 3.2 },
  { von: 409, bis: 426, note: 3.3 },
  { von: 391, bis: 408, note: 3.4 },
  { von: 373, bis: 390, note: 3.5 },
  { von: 355, bis: 372, note: 3.6 },
  { von: 337, bis: 354, note: 3.7 },
  { von: 319, bis: 336, note: 3.8 },
  { von: 301, bis: 318, note: 3.9 },
  { von: 300, bis: 300, note: 4.0 },
];
