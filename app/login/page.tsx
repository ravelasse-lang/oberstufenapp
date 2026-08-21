"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { erstelleBrowserClient } from "@/lib/supabase/client";

const eingabeKlasse =
  "w-full rounded-xl border border-border bg-transparent px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-accent";
const buttonKlasse =
  "w-full rounded-full bg-accent px-3.5 py-2.5 text-[14px] font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50";

export default function LoginSeite() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "sendet" | "gesendet" | "fehler">("idle");
  const [fehlerText, setFehlerText] = useState("");
  const [pruefStatus, setPruefStatus] = useState<"idle" | "prueft" | "fehler">("idle");
  const [pruefFehler, setPruefFehler] = useState("");

  const [gastModus, setGastModus] = useState(false);
  const [gastCode, setGastCode] = useState("");
  const [gastStatus, setGastStatus] = useState<"idle" | "prueft" | "fehler">("idle");
  const [gastFehler, setGastFehler] = useState("");

  async function magicLinkAnfordern(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sendet");

    const supabase = erstelleBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setFehlerText(`${error.message} (Status ${error.status ?? "?"})`);
      setStatus("fehler");
    } else {
      setStatus("gesendet");
    }
  }

  async function codeBestaetigen(e: React.FormEvent) {
    e.preventDefault();
    setPruefStatus("prueft");
    setPruefFehler("");

    const supabase = erstelleBrowserClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error) {
      setPruefFehler(error.message);
      setPruefStatus("fehler");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  async function gastLoginVersuchen(e: React.FormEvent) {
    e.preventDefault();
    setGastStatus("prueft");
    setGastFehler("");

    const supabase = erstelleBrowserClient();
    const { error: anonError } = await supabase.auth.signInAnonymously();
    if (anonError) {
      setGastFehler(anonError.message);
      setGastStatus("fehler");
      return;
    }

    const { data, error } = await supabase.rpc("gast_login", {
      eingegebener_code: gastCode.trim(),
    });

    if (error || !data) {
      await supabase.auth.signOut();
      setGastFehler("Ungültiger oder deaktivierter Code.");
      setGastStatus("fehler");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-6">
      <div className="w-full max-w-[340px] space-y-7">
        <div className="space-y-1.5 text-center">
          <h1 className="text-[22px] font-semibold tracking-tight">
            {gastModus ? "Gast-Zugang" : "Anmelden"}
          </h1>
          <p className="text-[14px] text-muted">
            {gastModus
              ? "Trag den Code ein, den du bekommen hast."
              : "Wir schicken dir einen Login-Link + Code per E-Mail."}
          </p>
        </div>

        {gastModus ? (
          <form onSubmit={gastLoginVersuchen} className="space-y-3">
            <input
              type="text"
              required
              placeholder="Gast-Code"
              value={gastCode}
              onChange={(e) => setGastCode(e.target.value)}
              className={eingabeKlasse}
            />
            <button type="submit" disabled={gastStatus === "prueft"} className={buttonKlasse}>
              {gastStatus === "prueft" ? "Wird geprüft…" : "Als Gast ansehen"}
            </button>
            {gastStatus === "fehler" && (
              <p className="text-[13px] text-red-500">{gastFehler}</p>
            )}
          </form>
        ) : status === "gesendet" ? (
          <form onSubmit={codeBestaetigen} className="space-y-3">
            <p className="rounded-2xl border border-border bg-surface/60 p-4 text-center text-[13px] text-foreground">
              Mail an <strong>{email}</strong> verschickt. Klick den Link
              darin, oder gib den 6-stelligen Code aus der Mail hier ein.
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="6-stelliger Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`${eingabeKlasse} text-center tracking-[0.3em]`}
            />
            <button type="submit" disabled={pruefStatus === "prueft"} className={buttonKlasse}>
              {pruefStatus === "prueft" ? "Wird geprüft…" : "Code bestätigen"}
            </button>
            {pruefFehler && <p className="text-[13px] text-red-500">{pruefFehler}</p>}
          </form>
        ) : (
          <form onSubmit={magicLinkAnfordern} className="space-y-3">
            <input
              type="email"
              required
              placeholder="deine@email.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={eingabeKlasse}
            />
            <button type="submit" disabled={status === "sendet"} className={buttonKlasse}>
              {status === "sendet" ? "Wird gesendet…" : "Login-Link senden"}
            </button>
            {status === "fehler" && (
              <p className="text-[13px] text-red-500">{fehlerText}</p>
            )}
          </form>
        )}

        <button
          type="button"
          onClick={() => {
            setGastModus((v) => !v);
            setGastFehler("");
            setGastStatus("idle");
          }}
          className="w-full text-center text-[13px] text-muted hover:text-foreground"
        >
          {gastModus ? "← Zurück zum normalen Login" : "Ich habe einen Gast-Code"}
        </button>
      </div>
    </div>
  );
}
