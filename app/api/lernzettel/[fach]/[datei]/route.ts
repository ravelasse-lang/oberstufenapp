import { NextResponse, type NextRequest } from "next/server";
import { leseLernzettelDatei } from "@/lib/vault/lernzettel-archiv";

export const dynamic = "force-dynamic";

// Liefert eine Lernzettel-Datei (PDF/HTML) aus dem Ordner Lernzettel/<fach>/.
// Angemeldet sein muss man schon durch proxy.ts; Fach und Dateiname werden
// zusätzlich streng geprüft (nur [a-z0-9-], .pdf oder .html, kein Pfad).
export async function GET(
  _anfrage: NextRequest,
  { params }: { params: Promise<{ fach: string; datei: string }> }
) {
  const { fach, datei } = await params;
  const inhalt = await leseLernzettelDatei(fach, datei);
  if (!inhalt) return new NextResponse("Nicht gefunden", { status: 404 });

  const istPdf = datei.endsWith(".pdf");
  return new NextResponse(new Uint8Array(inhalt), {
    headers: {
      "Content-Type": istPdf ? "application/pdf" : "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${datei}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
      // HTML läuft in einer Sandbox ohne Zugriff auf die App (eigene Skripte wie das
      // Quiz funktionieren, Cookies/Sitzung der App bleiben unerreichbar).
      ...(istPdf ? {} : { "Content-Security-Policy": "sandbox allow-scripts allow-popups" }),
    },
  });
}
