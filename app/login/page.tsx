"use client"; // form + state, jadi jalan di browser

// URL "/login". Hanya Anda yang punya akun (pendaftaran publik dimatikan di Supabase).

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, signOut, useSignedIn } from "@/lib/entries";

const input = "box-border min-h-14 w-full border-[1.5px] border-ink bg-paper px-5 text-base";

export default function LoginPage() {
  const router = useRouter();
  const signedIn = useSignedIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn(email, password);
      router.push("/tracker");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk.");
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-md pt-16 md:pt-22">
      <p className="mb-3.5 font-mono text-[13px] tracking-[0.12em] text-terracotta">OWNER ONLY</p>
      <h1 className="font-display text-6xl leading-[0.95] tracking-[-0.03em]">Sign in</h1>

      {signedIn ? (
        <div className="mt-10 flex flex-col gap-4 font-serif text-lg">
          <p>You are signed in.</p>
          <button
            type="button"
            onClick={() => signOut()}
            className="min-h-12 w-fit cursor-pointer rounded-full border-[1.5px] border-ink px-6 text-sm font-medium"
          >
            Sign out
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-10 flex flex-col gap-5">
          <input
            type="email"
            required
            autoComplete="email"
            aria-label="Email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={input}
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            aria-label="Password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={input}
          />
          {error && <p role="alert" className="font-serif text-base text-terracotta">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="min-h-14 cursor-pointer rounded-full bg-terracotta px-9 text-base font-semibold text-on-accent disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}
    </section>
  );
}
