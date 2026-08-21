"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

function keinUpdate() {
  return () => {};
}

function useIstImBrowserMontiert() {
  return useSyncExternalStore(keinUpdate, () => true, () => false);
}

export function ThemeUmschalter() {
  const { resolvedTheme, setTheme } = useTheme();
  const montiert = useIstImBrowserMontiert();

  if (!montiert) return <div className="h-7 w-7" />;

  const istDunkel = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(istDunkel ? "light" : "dark")}
      aria-label="Dark Mode umschalten"
      className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground"
    >
      {istDunkel ? "☀️" : "🌙"}
    </button>
  );
}
