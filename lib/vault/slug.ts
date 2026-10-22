// Slugs kommen aus der URL und landen in Dateipfaden: nur Kleinbuchstaben,
// Ziffern und Bindestriche zulassen (verhindert "../"-Tricks).
export function istSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

// Dateinamen für ausgelieferte Lernzettel-Dateien: nur Kleinbuchstaben, Ziffern,
// Bindestriche und ein einzelner Punkt vor der Endung (kein "..", kein "/").
export function istLernzettelDateiname(name: string): boolean {
  return /^[a-z0-9][a-z0-9-]*\.(pdf|html)$/.test(name);
}
