import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { useStore } from "@/lib/store/store";
import { useHydrated } from "@/lib/store/hooks";
import { getSession, signIn } from "@/lib/auth/session";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — IssueLyst" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const users = useStore((s) => s.users);
  const workspace = useStore((s) => s.workspace);
  const project = useStore((s) => s.project);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getSession()) navigate({ to: "/app", replace: true });
  }, [navigate]);

  const doSignIn = (userId: string) => {
    setBusy(true);
    signIn(userId);
    setTimeout(() => navigate({ to: "/app", replace: true }), 250);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const user = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
    );
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
    <div className="grid min-h-screen grid-cols-1 bg-surface lg:grid-cols-[1.05fr_1fr] lg:bg-rail">
      {/* Brand panel — solid ink */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-rail p-12 text-rail-fg lg:flex">
        <div className="relative flex items-center gap-2.5">
          <LogoMark size={30} />
          <span className="font-display text-[20px] font-extrabold tracking-[-0.025em]">IssueLyst</span>
        </div>
        <div className="relative max-w-[520px]">
          <p className="font-display text-[46px] font-extrabold leading-[1.04] tracking-[-0.04em]">
            A focused, desktop-grade issue tracker for engineering teams.
          </p>
          <p className="mt-6 max-w-[440px] text-[15.5px] leading-relaxed text-rail-muted">
            Dense lists, an instant board, keyboard-first navigation, and a detail
            drawer that never loses your place. Built to move at the speed of thought.
          </p>
        </div>
        <div className="relative flex items-center gap-2 font-display text-[13px] font-semibold text-rail-muted">
          <span className="inline-block h-2 w-2 rounded-full bg-accent ring-2 ring-rail-hover" />
          {workspace.name} workspace · {project.name}
        </div>
      </div>

      {/* Form — paper, set into the ink with a rounded edge like the app frame */}
      <div className="flex items-center justify-center bg-surface px-6 py-12 lg:rounded-l-[28px]">
        <div className="anim-scale-in w-full max-w-[380px]">
          <div className="mb-10 lg:hidden">
            <LogoMark size={30} />
          </div>
          <h1 className="font-display text-[34px] font-extrabold leading-none tracking-[-0.035em]">Sign in</h1>
          <p className="mt-2.5 text-[14.5px] text-text-muted">Welcome back. Sign in to continue.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
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
            {error && <p className="font-display text-[13px] font-semibold text-danger">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? <Loader2 size={16} strokeWidth={2.4} className="animate-spin" /> : <>Sign in <ArrowRight size={16} strokeWidth={2.4} /></>}
            </button>
          </form>

          <div className="my-7 flex items-center gap-3 font-display text-[12.5px] font-semibold text-text-subtle">
            <span className="h-px flex-1 bg-border" /> Or use a demo account <span className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-1">
            {(hydrated ? users : []).slice(0, 5).map((u) => (
              <button
                key={u.id}
                onClick={() => doSignIn(u.id)}
                disabled={busy}
                className="group flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2 text-left transition-[background-color,transform] duration-150 hover:bg-surface-2 active:scale-[0.99]"
              >
                <Avatar user={u} size="lg" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[14px] font-bold tracking-[-0.01em] text-text">{u.name}</span>
                  <span className="block truncate text-[12px] text-text-subtle">{u.email}</span>
                </span>
                <span className="rounded-[6px] bg-surface-2 px-1.5 py-0.5 font-display text-[11px] font-semibold capitalize text-text-muted shadow-[inset_0_0_0_1px_var(--border)] group-hover:bg-surface">
                  {u.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-display text-[13px] font-semibold text-text-muted">{label}</span>
      {children}
    </label>
  );
}
