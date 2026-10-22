// Slugs kommen aus der URL und landen in Dateipfaden: nur Kleinbuchstaben,
// Ziffern und Bindestriche zulassen (verhindert "../"-Tricks).
export function istSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}
