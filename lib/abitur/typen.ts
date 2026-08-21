export type BlockIEintrag = {
  fachId: string;
  halbjahr: 1 | 2 | 3 | 4;
  punkte: number;
  wirdEingebracht: boolean;
  zaehltDoppelt: boolean;
};

export type PruefungsArt = "schriftlich" | "muendlich" | "praesentation";

export type PruefungsEintrag = {
  position: 1 | 2 | 3 | 4;
  fachId: string;
  art: PruefungsArt;
  punkte: number | null;
};

export type BlockIErgebnis = {
  punkte: number;
  anzahlEingebracht: number;
  bestanden: boolean;
  warnungen: string[];
};

export type BlockIIErgebnis = {
  punkte: number;
  bestanden: boolean;
  warnungen: string[];
};

export type AbiturErgebnis = {
  blockI: BlockIErgebnis;
  blockII: BlockIIErgebnis;
  gesamtpunkte: number;
  note: number | null;
  bestanden: boolean;
};
