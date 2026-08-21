export type Ressource = {
  titel: string;
  url: string;
};

export type ThemaFrontmatter = {
  titel: string;
  fach: string;
  halbjahr?: number;
  ressourcen?: Ressource[];
};

export type ThemaMeta = ThemaFrontmatter & {
  slug: string;
  hatLernzettel: boolean;
};
