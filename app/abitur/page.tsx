import { AbiturUebersicht } from "@/komponenten/abitur-uebersicht";

export const dynamic = "force-dynamic";

export default function AbiturSeite() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-14">
      <div className="mb-10">
        <h1 className="text-[24px] font-semibold tracking-tight">Abitur</h1>
        <p className="mt-1.5 text-[14px] text-muted">
          Halbjahresergebnisse einbringen/streichen und deinen aktuellen
          Abischnitt live sehen (Hamburger Regeln, siehe{" "}
          <code>Abi-Regeln/Hamburg.md</code>).
        </p>
      </div>
      <AbiturUebersicht />
    </div>
  );
}
