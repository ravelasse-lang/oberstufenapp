export type Aufgabenfeld = "I" | "II" | "III";
export type Niveau = "grundlegend" | "erhoeht";

export type Fach = {
  slug: string;
  name: string;
  akzentfarbe: string;
  aktiv: boolean;
  /** Ist dieses Fach Teil der formalen Abitur-Berechnung (Block I/II)? */
  abiturRelevant: boolean;
  aufgabenfeld?: Aufgabenfeld;
  niveau?: Niveau;
  istKernfach?: boolean;
  istProfilgebend?: boolean;
  /**
   * Zählt doppelt in Block I. Bewusst NICHT automatisch aus Niveau/Kernfach
   * abgeleitet, sondern explizit gesetzt — die Regel "Kernfach mit erhöhtem
   * Niveau, das Prüfungsfach ist" ist laut Recherche mehrdeutig (siehe
   * AGENDA.md). Aktuell nur für Biologie (profilgebend + erhöht) gesetzt.
   */
  zaehltDoppelt?: boolean;
};

export const faecher: Fach[] = [
  {
    slug: "biologie",
    name: "Biologie",
    akzentfarbe: "#2E7D32",
    aktiv: true,
    abiturRelevant: true,
    aufgabenfeld: "III",
    niveau: "erhoeht",
    istProfilgebend: true,
    zaehltDoppelt: true,
  },
  {
    slug: "chemie",
    name: "Chemie",
    akzentfarbe: "#EF6C00",
    aktiv: true,
    abiturRelevant: true,
    aufgabenfeld: "III",
    niveau: "grundlegend",
  },
  {
    slug: "psychologie",
    name: "Psychologie",
    akzentfarbe: "#8E24AA",
    aktiv: false,
    abiturRelevant: true,
    aufgabenfeld: "II",
    niveau: "grundlegend",
  },
  {
    slug: "seminarkurs",
    name: "Seminar(kurs)",
    akzentfarbe: "#546E7A",
    aktiv: false,
    abiturRelevant: true,
    niveau: "grundlegend",
  },
  {
    slug: "deutsch",
    name: "Deutsch",
    akzentfarbe: "#C62828",
    aktiv: false,
    abiturRelevant: true,
    aufgabenfeld: "I",
    niveau: "erhoeht",
    istKernfach: true,
  },
  {
    slug: "englisch",
    name: "Englisch",
    akzentfarbe: "#1565C0",
    aktiv: false,
    abiturRelevant: true,
    aufgabenfeld: "I",
    niveau: "erhoeht",
    istKernfach: true,
  },
  {
    slug: "mathe",
    name: "Mathe",
    akzentfarbe: "#00838F",
    aktiv: false,
    abiturRelevant: true,
    aufgabenfeld: "III",
    niveau: "grundlegend",
    istKernfach: true,
  },
  {
    slug: "cambridge",
    name: "Cambridge Zertifikat",
    akzentfarbe: "#283593",
    aktiv: false,
    // Kein regulärer Halbjahreskurs (externes Zertifikat/AG) - siehe AGENDA.md.
    abiturRelevant: false,
  },
  {
    slug: "theater",
    name: "Theater",
    akzentfarbe: "#AD1457",
    aktiv: false,
    abiturRelevant: true,
    aufgabenfeld: "I",
    niveau: "grundlegend",
  },
  {
    slug: "geschichte",
    name: "Geschichte",
    akzentfarbe: "#6D4C41",
    aktiv: false,
    abiturRelevant: true,
    aufgabenfeld: "II",
    niveau: "grundlegend",
  },
  {
    slug: "recht",
    name: "Rechtswissenschaft",
    akzentfarbe: "#37474F",
    aktiv: false,
    abiturRelevant: true,
    aufgabenfeld: "II",
    niveau: "grundlegend",
  },
  {
    slug: "philosophie",
    name: "Philosophie",
    akzentfarbe: "#4527A0",
    aktiv: false,
    abiturRelevant: true,
    aufgabenfeld: "II",
    niveau: "grundlegend",
  },
  {
    slug: "sport",
    name: "Sport",
    akzentfarbe: "#2E7D32",
    aktiv: false,
    abiturRelevant: true,
    niveau: "grundlegend",
  },
];

export function findeFach(slug: string): Fach | undefined {
  return faecher.find((fach) => fach.slug === slug);
}

/** Fach-Name mit eA/gA-Kürzel, falls ein Niveau bekannt ist. */
export function fachAnzeigename(fach: Fach): string {
  if (fach.niveau === "erhoeht") return `${fach.name} (eA)`;
  if (fach.niveau === "grundlegend") return `${fach.name} (gA)`;
  return fach.name;
}
