/**
 * Liest den Text eines PDFs seitenweise (im Browser, mit pdf.js). GoodNotes-PDFs enthalten bei
 * Handschrift eine ungenaue Texterkennung; sie wird mitgenommen, wie sie ist.
 * pdf.js wird erst bei Bedarf geladen (groß) und läuft in einem Web-Worker.
 */
export async function leseSeitenTexte(daten: ArrayBuffer): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const dokument = await pdfjs.getDocument({ data: new Uint8Array(daten) }).promise;
  const seiten: string[] = [];
  try {
    for (let i = 1; i <= dokument.numPages; i++) {
      const seite = await dokument.getPage(i);
      const inhalt = await seite.getTextContent();
      const text = inhalt.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        // Postgres akzeptiert weder NUL noch einzelne Surrogat-Zeichen im Text.
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
        .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      seiten.push(text.slice(0, 30000));
    }
  } finally {
    await dokument.destroy();
  }
  return seiten;
}
