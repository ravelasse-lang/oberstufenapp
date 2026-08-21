"use client";

import { useState } from "react";
import { erstelleBrowserClient } from "@/lib/supabase/client";

export default function LoginSeite() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sendet" | "gesendet" | "fehler">("idle");
  const [fehlerText, setFehlerText] = useState("");

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

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-6">
      <div className="w-full max-w-[340px] space-y-7">
        <div className="space-y-1.5 text-center">
          <h1 className="text-[22px] font-semibold tracking-tight">
            Anmelden
          </h1>
          <p className="text-[14px] text-muted">
            Wir schicken dir einen Login-Link per E-Mail.
          </p>
        </div>

        {status === "gesendet" ? (
          <p className="rounded-2xl border border-border bg-surface/60 p-4 text-center text-[14px] text-foreground">
            Link verschickt an <strong>{email}</strong>. Öffne dein
            E-Mail-Postfach und klicke auf den Link.
          </p>
        ) : (
          <form onSubmit={magicLinkAnfordern} className="space-y-3">
            <input
              type="email"
              required
              placeholder="deine@email.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-transparent px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-accent"
            />
            <button
              type="submit"
              disabled={status === "sendet"}
              className="w-full rounded-full bg-accent px-3.5 py-2.5 text-[14px] font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {status === "sendet" ? "Wird gesendet…" : "Login-Link senden"}
            </button>
            {status === "fehler" && (
              <p className="text-[13px] text-red-500">{fehlerText}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
