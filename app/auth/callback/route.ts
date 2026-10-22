import { NextResponse, type NextRequest } from "next/server";
import { erstelleServerClient } from "@/lib/supabase/server";
import { istBesitzer } from "@/lib/auth/besitzer";
import { sichererZiel } from "@/lib/auth/ziel";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const ziel = sichererZiel(searchParams.get("next"));

  if (code) {
    const supabase = await erstelleServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && !istBesitzer(data.user?.email)) {
      // Signups müssen für anonyme Gäste offen bleiben; deshalb darf jede fremde
      // Mail-Adresse (oder fehlende OWNER_EMAIL = fail-closed) hier keine Session behalten.
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login`);
    }

    if (!error) {
      return NextResponse.redirect(`${origin}${ziel}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
