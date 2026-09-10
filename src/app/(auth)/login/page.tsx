"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { useStore } from "@/lib/store/store";
import { useHydrated } from "@/lib/store/hooks";
import { getSession, signIn } from "@/lib/auth/session";

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const users = useStore((s) => s.users);
  const workspace = useStore((s) => s.workspace);
  const project = useStore((s) => s.project);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getSession()) router.replace("/app");
  }, [router]);

  const doSignIn = (userId: string) => {
    setBusy(true);
    signIn(userId);
    setTimeout(() => router.replace("/app"), 250);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      setError("No account matches that email. Try a demo account below.");
      return;
    }
    if (password.length < 1) {
      setError("Enter your password.");
      return;
    }
    doSignIn(user.id);
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-surface-2 p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--border-strong) 1px, transparent 0)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse at 30% 20%, black, transparent 75%)",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <LogoMark size={26} />
          <span className="font-serif text-[19px] font-semibold tracking-[-0.01em]">Projex</span>
        </div>
        <div className="relative max-w-md">
          <p className="font-serif text-[26px] font-medium leading-[1.32] tracking-[-0.01em] text-text">
            A focused, desktop-grade issue tracker for engineering teams.
          </p>
          <p className="mt-4 text-[14px] leading-relaxed text-text-muted">
            Dense lists, an instant board, keyboard-first navigation, and a detail
            drawer that never loses your place. Built to move at the speed of thought.
          </p>
        </div>
        <div className="relative flex items-center gap-2 font-mono text-[11px] text-text-subtle">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
          {workspace.name} workspace · {project.name}
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          <div className="mb-8 lg:hidden">
            <LogoMark size={26} />
          </div>
          <h1 className="font-serif text-[22px] font-semibold tracking-[-0.01em]">Sign in</h1>
          <p className="mt-1 text-[13.5px] text-text-muted">Welcome back. Sign in to continue.</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-3.5">
            <Field label="Email">
              <input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@meridian.dev"
                className="input"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </Field>
            {error && <p className="text-[12.5px] text-danger">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <>Sign in <ArrowRight size={15} /></>}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-wide text-text-subtle">
            <span className="h-px flex-1 bg-border" /> Or use a demo account <span className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-1">
            {(hydrated ? users : []).slice(0, 5).map((u) => (
              <button
                key={u.id}
                onClick={() => doSignIn(u.id)}
                disabled={busy}
                className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border hover:bg-surface-hover"
              >
                <Avatar user={u} size="lg" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-text">{u.name}</span>
                  <span className="block truncate font-mono text-[11px] text-text-subtle">{u.email}</span>
                </span>
                <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase text-text-subtle">
                  {u.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          height: 40px;
          border-radius: 9px;
          border: 1px solid transparent;
          background: var(--surface-2);
          padding: 0 12px;
          font-size: 13.5px;
          color: var(--text);
          transition: border-color 150ms, box-shadow 150ms, background 150ms;
        }
        .input::placeholder { color: var(--text-subtle); }
        .input:hover:not(:focus) { background: var(--surface-hover); }
        .input:focus { outline: none; background: var(--surface); border-color: var(--ring); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 24%, transparent); }
        .btn-primary {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          height: 38px; border-radius: 8px; background: var(--primary); color: var(--primary-fg);
          font-size: 13.5px; font-weight: 500; transition: background 150ms;
        }
        .btn-primary:hover { background: var(--primary-hover); }
        .btn-primary:disabled { opacity: 0.6; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-text-muted">{label}</span>
      {children}
    </label>
  );
}
