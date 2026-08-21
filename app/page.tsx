import { faecher } from "@/lib/faecher-daten";
import { FachKarte } from "@/komponenten/fach-karte";
import { GesamtFortschritt } from "@/komponenten/gesamt-fortschritt";
import { erstelleServerClient } from "@/lib/supabase/server";

function nameAusEmail(email: string | undefined | null) {
  if (!email) return "";
  const lokal = email.split("@")[0] ?? "";
  const erstesWort = lokal.split(/[._-]/)[0] ?? lokal;
  return erstesWort.charAt(0).toUpperCase() + erstesWort.slice(1);
}

export default async function UebersichtsSeite() {
  const supabase = await erstelleServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const name = nameAusEmail(user?.email);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-8">
        <p className="text-[14px] text-muted">
          Hallo{name ? `, ${name}` : ""} 👋
        </p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight">
          Deine Fächer
        </h1>
      </div>
      <GesamtFortschritt />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {faecher.map((fach) => (
          <FachKarte key={fach.slug} fach={fach} />
        ))}
      </div>
    </div>
  );
}
