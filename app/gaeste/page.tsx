import { redirect } from "next/navigation";
import { erstelleServerClient } from "@/lib/supabase/server";
import { GaesteVerwaltung } from "@/komponenten/gaeste-verwaltung";

export const dynamic = "force-dynamic";

export default async function GaesteSeite() {
  const supabase = await erstelleServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) redirect("/");

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold tracking-tight">
          Gäste-Zugänge
        </h1>
        <p className="mt-1.5 text-[14px] text-muted">
          Codes für Besucher — sie können alles ansehen, aber nichts ändern.
          &quot;Rauswerfen&quot; sperrt den Zugriff sofort.
        </p>
      </div>
      <GaesteVerwaltung />
    </div>
  );
}
