import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const OEFFENTLICHE_PFADE = ["/login", "/auth/callback"];

export async function proxy(request: NextRequest) {
  let antwort = NextResponse.next({ request });

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    // .env.local/.env in Vercel ist unvollständig (siehe dokumentation/setup.md).
    // WICHTIG: hier NICHT einfach durchlassen — das wäre ein kompletter
    // Login-Bypass (genau das ist beim ersten Vercel-Deploy passiert, als eine
    // der beiden Variablen fehlte). Login-Seite bleibt erreichbar (harmlos,
    // zeigt nur ein Formular), alles andere wird blockiert.
    if (request.nextUrl.pathname.startsWith("/login")) {
      return antwort;
    }
    return new NextResponse(
      "Server ist nicht korrekt konfiguriert (fehlende Supabase-Umgebungsvariablen).",
      { status: 500 }
    );
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          antwort = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            antwort.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.is_anonymous) {
    const { data: sitzung } = await supabase
      .from("gast_sitzungen")
      .select("gastcodes(aktiv)")
      .eq("anon_user_id", user.id)
      .maybeSingle();
    const gastcodeEintrag = sitzung?.gastcodes as
      | { aktiv: boolean }
      | { aktiv: boolean }[]
      | null
      | undefined;
    const codeNochAktiv = Boolean(
      Array.isArray(gastcodeEintrag) ? gastcodeEintrag[0]?.aktiv : gastcodeEintrag?.aktiv
    );
    if (!codeNochAktiv) {
      // Code wurde deaktiviert oder gelöscht (cascade löscht dann auch die
      // gast_sitzungen-Zeile) - Gast wird sofort ausgeloggt, nicht erst beim
      // nächsten Login-Versuch.
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  const istOeffentlich = OEFFENTLICHE_PFADE.some((pfad) =>
    request.nextUrl.pathname.startsWith(pfad)
  );

  if (!user && !istOeffentlich) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (user && request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return antwort;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
