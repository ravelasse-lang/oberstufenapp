import { TodoListe } from "@/komponenten/todo-liste";

export const dynamic = "force-dynamic";

export default function TodosSeite() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-14">
      <div className="mb-10">
        <h1 className="text-[24px] font-semibold tracking-tight">To-Dos</h1>
        <p className="mt-1.5 text-[14px] text-muted">
          Fächerübergreifende Aufgabenliste — auf jedem Gerät synchron.
        </p>
      </div>
      <TodoListe />
    </div>
  );
}
