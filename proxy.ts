import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const OEFFENTLICHE_PFADE = ["/login", "/auth/callback"];

export async function proxy(request: NextRequest) {
  let antwort = NextResponse.next({ request });

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    // .env.local ist noch nicht befüllt (siehe dokumentation/setup.md) -
    // Seiten trotzdem ohne Auth-Prüfung anzeigen, statt hart abzustürzen.
    return antwort;
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
