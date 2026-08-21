export type NotenTyp = "muendlich" | "schriftlich" | "zwischennote" | "zeugnisnote";

export const notenTypLabel: Record<NotenTyp, string> = {
  muendlich: "Mündlich",
  schriftlich: "Schriftlich",
  zwischennote: "Zwischennote",
  zeugnisnote: "Zeugnisnote",
};

export type Note = {
  id: string;
  fach_id: string;
  typ: NotenTyp;
  wert: number;
  bezeichnung: string | null;
  datum: string;
};
