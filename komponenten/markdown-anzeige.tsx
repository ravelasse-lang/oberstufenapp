import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Marker-Ziel für ehemalige Obsidian-Wiki-Links (siehe wikiLinksZuText).
const WIKI_MARKER = "#wiki-begriff";

function mdEscape(text: string): string {
  return text.replace(/[\\`*_{}[\]<>()#+!|~]/g, "\\$&");
}

/**
 * Wandelt Obsidian-Wiki-Links VOR dem Markdown-Parsing um, damit ein
 * escapetes Pipe (`\|`) in Tabellenzellen die Tabelle nicht zerlegt.
 *   [[seite]]                        -> seite
 *   [[seite#Abschnitt]]              -> Abschnitt
 *   [[seite#Abschnitt|Anzeigetext]]  -> Anzeigetext   (auch mit `\|`)
 * Das Ergebnis wird als Markdown-Link auf einen Marker ausgegeben und
 * später als hervorgehobener Begriff (kein klickbarer Link) gerendert.
 */
export function wikiLinksZuText(markdown: string): string {
  return markdown.replace(/(!?)\[\[([^\]]+?)\]\]/g, (_voll, embed: string, innen: string) => {
    // Obsidian-Embeds (![[bild.png]]) gibt es in der App nicht: weglassen,
    // statt ein kaputtes <img> zu erzeugen.
    if (embed) return "";
    // Anzeigetext = alles nach dem letzten `|` bzw. `\|`
    const pipe = innen.lastIndexOf("|");
    let text: string;
    if (pipe !== -1) {
      text = innen.slice(pipe + 1);
    } else {
      const raute = innen.indexOf("#");
      text = raute !== -1 ? innen.slice(raute + 1) : innen;
    }
    text = text.replace(/\s+/g, " ").trim();
    if (!text) return "";
    return `[${mdEscape(text)}](${WIKI_MARKER})`;
  });
}

// Die Seite hat selbst schon ein <h1> (Thementitel) und ein <h2> ("Lernzettel"):
// Markdown-Überschriften deshalb eine Ebene tiefer ausgeben (Optik bleibt gleich).
const komponenten: Components = {
  h1: ({ children }) => (
    <h2 className="mb-4 mt-8 text-[22px] font-semibold tracking-tight text-foreground first:mt-0">
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h3 className="mb-3 mt-8 border-b border-border pb-2 text-[18px] font-semibold tracking-tight text-foreground first:mt-0">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="mb-2 mt-6 text-[15px] font-semibold text-foreground first:mt-0">
      {children}
    </h4>
  ),
  h4: ({ children }) => (
    <h5 className="mb-2 mt-5 text-[14px] font-semibold text-foreground first:mt-0">
      {children}
    </h5>
  ),
  p: ({ children }) => <p className="my-3 first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ className, children }) => (
    <ul
      className={`my-3 space-y-1.5 ${
        className?.includes("contains-task-list")
          ? "list-none pl-0"
          : "list-disc pl-5 marker:text-muted"
      }`}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1.5 pl-5 marker:text-muted">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  input: ({ type, checked }) =>
    type === "checkbox" ? (
      <input
        type="checkbox"
        checked={checked}
        disabled
        readOnly
        className="mr-2 size-3.5 translate-y-0.5 accent-[var(--accent)]"
      />
    ) : null,
  blockquote: ({ children }) => (
    <blockquote className="my-4 rounded-r-xl border-l-2 border-border bg-surface/60 px-4 py-2 text-muted [&_p]:my-1">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-border" />,
  a: ({ href, children }) => {
    if (href === WIKI_MARKER) {
      return (
        <span className="font-semibold text-accent underline decoration-border decoration-dotted underline-offset-4">
          {children}
        </span>
      );
    }
    // Blockierte (leere) Links nur als Text, nicht als <a href="">.
    if (!href) return <span>{children}</span>;
    const extern = /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        {...(extern ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="text-accent underline underline-offset-2 hover:opacity-80"
      >
        {children}
      </a>
    );
  },
  code: ({ className, children }) =>
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-[12.5px] text-foreground">
        {children}
      </code>
    ),
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-xl border border-border bg-surface p-3 font-mono text-[12.5px] leading-relaxed [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-left text-[13px]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface">{children}</thead>,
  tr: ({ children }) => (
    <tr className="border-b border-border last:border-b-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 align-top font-semibold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 align-top text-foreground">{children}</td>
  ),
};

export function MarkdownAnzeige({ inhalt }: { inhalt: string }) {
  return (
    <div className="break-words text-[14px] leading-relaxed text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={komponenten}
        // Kein rehype-raw: rohes HTML im Markdown wird nicht als HTML gerendert.
      >
        {wikiLinksZuText(inhalt)}
      </ReactMarkdown>
    </div>
  );
}
