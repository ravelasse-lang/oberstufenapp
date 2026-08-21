import { NextResponse, type NextRequest } from "next/server";
import { erstelleServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const ziel = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await erstelleServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${ziel}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
