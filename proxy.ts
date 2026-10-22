import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { besitzerKonfiguriert, istBesitzer } from "@/lib/auth/besitzer";

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

  // Redirect, der die von Supabase gesetzten Cookies (Token-Refresh, signOut)
  // mitnimmt - sonst gehen sie bei NextResponse.redirect verloren.
  function umleiten(ziel: string) {
    const umleitung = NextResponse.redirect(new URL(ziel, request.url));
    antwort.cookies.getAll().forEach((cookie) => umleitung.cookies.set(cookie));
    return umleitung;
  }

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
      // Auf /login nicht erneut umleiten (Schleifenschutz, falls signOut scheitert).
      if (request.nextUrl.pathname.startsWith("/login")) {
        return antwort;
      }
      return umleiten("/login");
    }
  }

  // Besitzer-Prüfung für den OTP-Pfad: verifyOtp läuft rein clientseitig und
  // umgeht die Prüfung im Callback; Signups sind wegen der Gast-Logins offen.
  // Ohne OWNER_EMAIL keine Sperre (bewusst fail-open, wie im Callback; Umstellung
  // auf fail-closed steht als offener Punkt in AGENDA.md).
  if (
    user &&
    !user.is_anonymous &&
    besitzerKonfiguriert() &&
    !istBesitzer(user.email)
  ) {
    await supabase.auth.signOut();
    // Auf /login nicht erneut umleiten (Schleifenschutz, falls signOut scheitert).
    if (request.nextUrl.pathname.startsWith("/login")) {
      return antwort;
    }
    return umleiten("/login");
  }

  const istOeffentlich = OEFFENTLICHE_PFADE.some((pfad) =>
    request.nextUrl.pathname.startsWith(pfad)
  );

  if (!user && !istOeffentlich) {
    return umleiten("/login");
  }

  if (user && request.nextUrl.pathname.startsWith("/login")) {
    return umleiten("/");
  }

  return antwort;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
