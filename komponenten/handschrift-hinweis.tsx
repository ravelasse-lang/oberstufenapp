/**
 * Erinnerung bei Lernzetteln: Was nur handschriftlich oder auf Papier existiert (z. B. in
 * Deutsch), steht nicht in der App und fehlt deshalb im Lernzettel.
 */
export function HandschriftHinweis() {
  return (
    <div
      role="note"
      className="rounded-2xl border border-border bg-surface px-4 py-3 text-[13px] leading-relaxed text-foreground"
    >
      <span aria-hidden="true">✍️ </span>
      <strong className="font-semibold">Handschriftliche Notizen nicht vergessen!</strong> Was du nur auf
      Papier oder im Heft hast (z. B. in Deutsch), steht nicht in der App und fehlt deshalb hier. Lern
      es zusätzlich mit.
    </div>
  );
}
