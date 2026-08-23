import { LernzettelAnfrageFormular } from "@/komponenten/lernzettel-anfrage-formular";

export const dynamic = "force-dynamic";

export default function LernzettelAnfragenSeite() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-14">
      <div className="mb-10">
        <h1 className="text-[24px] font-semibold tracking-tight">Lernzettel anfordern</h1>
        <p className="mt-1.5 text-[14px] text-muted">
          Sag, zu welchem Thema du einen Lernzettel möchtest — Claude
          verarbeitet die Anfrage automatisch oder auf Zuruf im Chat.
        </p>
      </div>
      <LernzettelAnfrageFormular />
    </div>
  );
}
