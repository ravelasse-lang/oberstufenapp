import { NextResponse, type NextRequest } from "next/server";
import { erstelleServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const ziel = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await erstelleServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    const erlaubteEmail = process.env.OWNER_EMAIL;
    if (!error && erlaubteEmail && data.user?.email !== erlaubteEmail) {
      // Zusätzliche Absicherung neben dem Supabase-Dashboard-Setting
      // ("Allow new user signups" deaktivieren): falls trotzdem eine fremde
      // Mail-Adresse eine Session bekommt, sofort wieder abmelden.
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login`);
    }

    if (!error) {
      return NextResponse.redirect(`${origin}${ziel}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
