import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/brand/logo";
import { Link } from "@tanstack/react-router";
import { requestAccess } from "@/lib/server/request-access";
import { Shot } from "./shot";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import s from "./landing.module.css";

/* ── Reveal-on-scroll helper ─────────────────────────────────────── */
const reveal: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/* ── The lifecycle of issue #142, looping in the hero ────────────── */
const HERO_STAGES = [
  { key: "Reported", status: "Open", color: "var(--blue)", activity: "Reported by Ahmed Raza", pulse: false },
  { key: "Triaged", status: "Triaged", color: "var(--amber)", activity: "Priority set — Urgent", pulse: false },
  { key: "In Progress", status: "In Progress", color: "var(--amber)", activity: "3 comments · Izhan Ali", pulse: true },
  { key: "Review", status: "In Review", color: "var(--violet)", activity: "PR linked · awaiting review", pulse: true },
  { key: "Resolved", status: "Done", color: "var(--green)", activity: "Fixed in v2.8.1", pulse: false },
];

const HERO_MINIS = [
  { id: "128", name: "iOS keyboard covers composer", color: "var(--amber)", meta: "In progress" },
  { id: "135", name: "Mentions don't notify offline", color: "var(--red)", meta: "Urgent" },
  { id: "122", name: "Drag handle hard to discover", color: "var(--violet)", meta: "Review" },
];

type CtaState =
  | { kind: "idle" | "sending" }
  | { kind: "sent" | "error"; message: string };

function CtaForm({ id }: { id: string }) {
  const [state, setState] = useState<CtaState>({ kind: "idle" });

  if (state.kind === "sent") {
    return (
      <p className={`${s.ctaStatus} ${s.ctaStatusOk}`} role="status">
        <Check size={14} strokeWidth={2.5} />
        {state.message}
      </p>
    );
  }

  return (
    <div className={s.ctaBlock}>
      <form
        className={s.ctaForm}
        onSubmit={async (e) => {
          e.preventDefault();
          const email = String(new FormData(e.currentTarget).get("email") ?? "");
          setState({ kind: "sending" });
          try {
            await requestAccess({ data: { email } });
            setState({ kind: "sent", message: `Thanks — we'll be in touch at ${email}.` });
          } catch (err) {
            setState({
              kind: "error",
              message: err instanceof Error ? err.message : "Something went wrong. Try again.",
            });
          }
        }}
      >
        <input
          className={s.ctaInput}
          type="email"
          name="email"
          aria-label="Work email"
          placeholder="you@team.dev"
          autoComplete="email"
          required
          id={id}
        />
        <button className={s.ctaBtn} type="submit" disabled={state.kind === "sending"}>
          {state.kind === "sending" ? "Sending…" : "Request access"}
          <ArrowRight size={16} strokeWidth={2.2} />
        </button>
      </form>
      {state.kind === "error" && (
        <p className={`${s.ctaStatus} ${s.ctaStatusErr}`} role="alert">
          {state.message}
        </p>
      )}
    </div>
  );
}

function CtaGroup({ id }: { id: string }) {
  return (
    <div className={s.ctaGroup}>
      <CtaForm id={id} />
      <p className={s.ctaAlt}>
        or{" "}
        <Link className={s.ctaAltLink} to="/app">
          view the live demo
          <ArrowRight size={13} strokeWidth={2.2} />
        </Link>
      </p>
    </div>
  );
}

function HeroFlow() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(reduce ? 4 : 0);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setActive((a) => (a + 1) % HERO_STAGES.length), 2200);
    return () => clearInterval(t);
  }, [reduce]);

  const stage = HERO_STAGES[active];
  const resolved = active === HERO_STAGES.length - 1;

  return (
    <motion.div
      className={s.flowPanel}
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
    >
      <div className={s.flowPanelHead}>
        <span className={s.flowPanelTitle}>Issue Flow</span>
        <div className={s.flowWin}>
          <span /><span /><span />
        </div>
      </div>

      {/* Stage rail */}
      <div className={s.rail}>
        {HERO_STAGES.map((st, i) => (
          <div className={s.railStage} key={st.key}>
            <div className={s.railLine}>
              <motion.div
                className={s.railLineFill}
                style={{ background: st.color }}
                initial={false}
                animate={{ scaleX: i <= active ? 1 : 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className={`${s.railLabel} ${i <= active ? s.railLabelOn : ""}`}>
              {st.key}
            </span>
          </div>
        ))}
      </div>

      {/* Featured card */}
      <div className={s.card}>
        <div className={s.cardGlow} style={{ background: stage.color }} />
        <div className={s.cardTop}>
          <span className={s.cardId}>#142</span>
          <span className={s.statusPill}>
            <span className={s.statusDot} style={{ background: stage.color }} />
            {stage.status}
          </span>
        </div>
        <h3 className={s.cardTitle}>Authentication redirect loops after session expiry</h3>
        <div className={s.chipRow}>
          <span className={s.chip}>Bug</span>
          <span className={s.chip}>Auth</span>
          <span className={s.chip}>Regression</span>
        </div>
        <div className={s.cardFoot}>
          <span className={s.avatar} style={{ background: "color-mix(in srgb, var(--blue) 22%, transparent)" }}>
            AR
          </span>
          <motion.span
            key={active}
            className={s.activityText}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {stage.pulse && <span className={s.pulse} style={{ color: stage.color }} />}
            {resolved && <Check size={13} strokeWidth={2.5} style={{ color: stage.color }} />}
            {stage.activity}
          </motion.span>
        </div>
      </div>

      {/* Ambient issue stream */}
      <div className={s.miniStack}>
        {HERO_MINIS.map((m) => (
          <div className={s.mini} key={m.id}>
            <span className={s.miniDot} style={{ background: m.color }} />
            <span className={s.miniId}>#{m.id}</span>
            <span className={s.miniName}>{m.name}</span>
            <span className={s.miniMeta}>{m.meta}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Core interaction timeline data ──────────────────────────────── */
const TIMELINE = [
  { n: "01", stage: "Capture", snippet: "“iOS login redirects to the wrong screen”", meta: ["Reported"], color: "var(--blue)" },
  { n: "02", stage: "Assign", snippet: "Routed to an owner in one interaction.", meta: ["Ahmed", "High", "Mobile"], color: "var(--amber)" },
  { n: "03", stage: "Build", snippet: "Work happens where the context lives.", meta: ["In Progress", "3 comments"], color: "var(--amber)" },
  { n: "04", stage: "Review", snippet: "The fix arrives attached to the issue.", meta: ["PR linked", "Awaiting review"], color: "var(--violet)" },
  { n: "05", stage: "Resolve", snippet: "Closed with the version that shipped it.", meta: ["Fixed in v2.8.1"], color: "var(--green)" },
];

const STATS = [
  { num: 12, label: "Open", color: "var(--blue)" },
  { num: 4, label: "In progress", color: "var(--amber)" },
  { num: 3, label: "In review", color: "var(--violet)" },
  { num: 7, label: "Assigned to you", color: "var(--ink)" },
  { num: 2, label: "Blocked", color: "var(--red)" },
];

const TEAM = [
  { initials: "AR", name: "Ahmed Raza", work: "5 active", bars: 5, color: "var(--blue)" },
  { initials: "IA", name: "Izhan Ali", work: "4 active", bars: 4, color: "var(--amber)" },
  { initials: "LV", name: "Lena Vogel", work: "3 active", bars: 3, color: "var(--violet)" },
  { initials: "SW", name: "Sara Whitfield", work: "2 active", bars: 2, color: "var(--green)" },
  { initials: "MC", name: "Marcus Cole", work: "2 active", bars: 2, color: "var(--red)" },
];

const FADE_OUT = ["Projects", "Docs", "Goals", "CRM", "Automations", "Reports"];

const LADDER = [
  { name: "Team", count: "1 team" },
  { name: "Workspace", count: "Meridian" },
  { name: "Project", count: "Engineering" },
  { name: "Issues", count: "18 open" },
];

export function LandingPage() {
  const shotRef = useRef<HTMLDivElement>(null);

  return (
    <div className={s.root}>
      {/* ════════ HERO ════════ */}
      <header className={s.wrap}>
        <nav className={s.nav}>
          <a className={s.navBrand} href="/">
            <LogoMark size={26} />
            <span>IssueLyst</span>
          </a>
          <div className={s.navLinks}>
            <a className={s.navLink} href="#how">How it works</a>
            <a className={s.navLink} href="#product">Product</a>
            <Link className={s.navDemo} to="/app">
              View demo
              <ArrowRight size={14} strokeWidth={2.2} />
            </Link>
          </div>
        </nav>

        <div className={s.hero}>
          <motion.h1
            className={`${s.display} ${s.heroHeadline}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            Every issue.<br />
            <span className={s.heroAccent}>One clear flow.</span>
          </motion.h1>

          <motion.p
            className={s.heroSub}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className={s.heroSubLead}>Made for teams who want to move fast.</span>
            Capture, prioritize, discuss, and ship issues in one focused workspace
            with native AI built in&nbsp;— without the noise of everything else.
          </motion.p>

          <motion.div
            className={s.heroActions}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <CtaGroup id="hero-email" />
          </motion.div>

          <div className={s.heroVisual}>
            <HeroFlow />
          </div>
        </div>
      </header>

      {/* ════════ PROBLEM ════════ */}
      <section className={s.section} id="problem">
        <div className={s.wrap}>
          <Reveal>
            <span className={s.kicker}>The problem</span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className={s.hugeStatement} style={{ marginTop: 22 }}>
              Issues shouldn&rsquo;t disappear into the noise.
            </h2>
          </Reveal>

          <div className={s.problemFlow}>
            <Reveal className={s.sources}>
              {[
                { n: "Slack", s: "#eng-bugs" },
                { n: "Email", s: "fwd: re: re:" },
                { n: "Spreadsheets", s: "tracker_v7.xlsx" },
              ].map((src) => (
                <div className={s.source} key={src.n}>
                  <span className={s.sourceName}>{src.n}</span>
                  <span className={s.sourceSub}>{src.s}</span>
                </div>
              ))}
            </Reveal>

            <div className={s.connector} />
            <Reveal>
              <p className={s.lostQ}>&ldquo;Where is this bug?&rdquo;</p>
            </Reveal>
            <div className={s.connector} />
            <Reveal>
              <span className={s.lostCtx}>Lost context</span>
            </Reveal>
          </div>

          <div className={s.problemResolve}>
            <Reveal>
              <p className={s.resolveLine}>
                Bring the issue, the conversation, and ownership into <b>one place.</b>
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════════ CORE INTERACTION ════════ */}
      <section className={s.section} id="how">
        <div className={s.wrap}>
          <div className={s.sectionHead}>
            <Reveal><span className={`${s.kicker} ${s.kickerDot}`} style={{ color: "var(--amber)" }}><span style={{ color: "var(--ink-3)" }}>Assigned</span></span></Reveal>
            <Reveal delay={0.05}>
              <h2 className={s.display} style={{ fontSize: "clamp(2rem, 4vw, 3.1rem)" }}>
                From &ldquo;someone reported it&rdquo; to &ldquo;it&rsquo;s resolved.&rdquo;
              </h2>
            </Reveal>
          </div>

          <div className={s.timeline}>
            <div className={s.tlSpine} />
            {TIMELINE.map((t, i) => (
              <Reveal key={t.n} className={s.tlStage} delay={i * 0.08}>
                <div className={`${s.tlNode} ${s.tlNodeActive}`} style={{ boxShadow: `0 0 0 4px color-mix(in srgb, ${t.color} 12%, transparent)` }}>
                  {t.n}
                </div>
                <div className={s.tlCard}>
                  <span className={s.tlStageName} style={{ color: t.color }}>{t.stage}</span>
                  <span className={s.tlSnippet}>{t.snippet}</span>
                  <span className={s.tlMeta}>
                    {t.meta.map((m) => (
                      <span className={s.tlTag} key={m}>{m}</span>
                    ))}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ PRODUCT SHOTS ════════ */}
      <section className={s.section} id="product">
        <div className={s.wrap}>
          <div className={s.sectionHead}>
            <Reveal><span className={`${s.kicker} ${s.kickerDot}`} style={{ color: "var(--amber)" }}><span style={{ color: "var(--ink-3)" }}>In Progress</span></span></Reveal>
            <Reveal delay={0.05}>
              <h2 className={s.display} style={{ fontSize: "clamp(2.1rem, 4.4vw, 3.4rem)" }}>
                A workspace built around the issue.
              </h2>
            </Reveal>
          </div>

          <Reveal>
            <div className={s.shotWrap} ref={shotRef}>
              <div className={s.shotBar}>
                <span /><span /><span />
                <span className={s.shotUrl}>issuelyst.app/engineering/issue/142</span>
              </div>
              <Shot
                className={s.shotImg}
                src="/landing/app-issue.png"
                alt="IssueLyst issue detail — description, comments, activity and inline fields together"
                width={1440}
                height={900}
                priority
              />
            </div>
          </Reveal>

          <div className={s.annots}>
            {[
              { n: "01", t: "Everything in context", b: "Description, comments, activity, ownership and history stay together — never scattered across tabs." },
              { n: "02", t: "Change anything inline", b: "Status, priority, labels and assignees are always one interaction away, right where you're reading." },
              { n: "03", t: "Move fast", b: "Keyboard shortcuts and instant, optimistic interactions keep the workflow moving at the speed of thought." },
            ].map((a, i) => (
              <Reveal key={a.n} delay={i * 0.08} className={s.annot}>
                <span className={s.annotNum}>{a.n}</span>
                <span className={s.annotTitle}>{a.t}</span>
                <span className={s.annotBody}>{a.b}</span>
              </Reveal>
            ))}
          </div>

          <div className={s.shotDuo}>
            <Reveal>
              <div className={s.shotWrap}>
                <div className={s.shotBar}><span /><span /><span /><span className={s.shotUrl}>List · grouped by status</span></div>
                <Shot className={s.shotImg} src="/landing/app-list.png" alt="IssueLyst dense list view grouped by status" width={1440} height={900} />
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className={s.shotWrap}>
                <div className={s.shotBar}><span /><span /><span /><span className={s.shotUrl}>Board · drag to move</span></div>
                <Shot className={s.shotImg} src="/landing/app-board.png" alt="IssueLyst kanban board across workflow columns" width={1440} height={900} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════════ WHITEBOARDS ════════ */}
      <section className={s.section} id="whiteboards">
        <div className={s.wrap}>
          <div className={s.sectionHead}>
            <Reveal><span className={`${s.kicker} ${s.kickerDot}`} style={{ color: "var(--blue)" }}><span style={{ color: "var(--ink-3)" }}>Before it&rsquo;s an issue</span></span></Reveal>
            <Reveal delay={0.05}>
              <h2 className={s.display} style={{ fontSize: "clamp(2.1rem, 4.4vw, 3.4rem)" }}>
                Plan on the board.<br />Ship it as issues.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className={s.growSub}>
                Whiteboards for the planning, triage and retros that happen
                before a ticket exists — live in the same workspace as the work.
              </p>
            </Reveal>
          </div>

          <Reveal>
            <div className={s.shotWrap}>
              <div className={s.shotBar}>
                <span /><span /><span />
                <span className={s.shotUrl}>issuelyst.app/engineering/whiteboards?board=wb_q3</span>
              </div>
              <Shot
                className={s.shotImg}
                src="/landing/app-whiteboard.png"
                alt="IssueLyst whiteboard — sticky notes, ink and shapes on a live planning board"
                width={2000}
                height={1193}
              />
            </div>
          </Reveal>

          <div className={s.annots}>
            {[
              { n: "01", t: "A real canvas", b: "Sticky notes, shapes, freehand ink, text and images — not a single embedded doc." },
              { n: "02", t: "One board per conversation", b: "A planning session, a retro, a triage sweep — as many boards as the work needs, each a click away." },
              { n: "03", t: "Never a separate app", b: "Share a link the same way you'd share an issue, and see who else is looking at it right now." },
            ].map((a, i) => (
              <Reveal key={a.n} delay={i * 0.08} className={s.annot}>
                <span className={s.annotNum}>{a.n}</span>
                <span className={s.annotTitle}>{a.t}</span>
                <span className={s.annotBody}>{a.b}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ SPEED ════════ */}
      <section className={s.section} id="speed">
        <div className={s.wrap}>
          <div className={s.sectionHead}>
            <Reveal><span className={s.kicker}>Speed</span></Reveal>
            <Reveal delay={0.05}>
              <h2 className={s.display} style={{ fontSize: "clamp(2.1rem, 4.4vw, 3.4rem)" }}>
                Less clicking. More fixing.
              </h2>
            </Reveal>
          </div>

          <div className={s.speedGrid}>
            <Reveal>
              <div className={s.shotWrap} style={{ marginTop: 0 }}>
                <div className={s.shotBar}><span /><span /><span /><span className={s.shotUrl}>⌘K · command palette</span></div>
                <Shot className={s.shotImg} src="/landing/app-palette.png" alt="Command palette searching issues by keyword" width={1440} height={900} />
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className={s.keysPanel}>
                <span className={s.keysTitle}>Keyboard-first</span>
                {[
                  { k: "C", l: "Create issue" },
                  { k: "⌘ K", l: "Search anything" },
                  { k: "E", l: "Edit inline" },
                  { k: "⌘ ↵", l: "Resolve" },
                ].map((row) => (
                  <div className={s.keyRow} key={row.l}>
                    <span className={s.keyLabel}>{row.l}</span>
                    <span className={s.kbd}>{row.k}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════════ OPERATING PICTURE ════════ */}
      <section className={s.section} id="picture">
        <div className={s.wrap}>
          <div className={s.sectionHead}>
            <Reveal><span className={`${s.kicker} ${s.kickerDot}`} style={{ color: "var(--violet)" }}><span style={{ color: "var(--ink-3)" }}>In Review</span></span></Reveal>
            <Reveal delay={0.05}>
              <h2 className={s.display} style={{ fontSize: "clamp(2.1rem, 4.4vw, 3.4rem)" }}>
                Know what needs attention.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className={s.growSub}>Your team&rsquo;s operating picture — visibility without a single meeting.</p>
            </Reveal>
          </div>

          <div className={s.pictureGrid}>
            <Reveal>
              <div className={s.statList}>
                <span className={s.kicker} style={{ marginBottom: 8 }}>Today</span>
                {STATS.map((st) => (
                  <div className={s.statRow} key={st.label}>
                    <span className={s.statNum}>{st.num}</span>
                    <span className={s.statLabel}>{st.label}</span>
                    <span className={s.statDot} style={{ background: st.color }} />
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className={s.teamPanel}>
                <div className={s.teamHead}>Team · across issues</div>
                {TEAM.map((m) => (
                  <div className={s.teamRow} key={m.initials}>
                    <span className={s.avatar} style={{ background: `color-mix(in srgb, ${m.color} 22%, transparent)` }}>{m.initials}</span>
                    <span className={s.teamName}>{m.name}</span>
                    <span className={s.teamBars}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <i key={i} style={i < m.bars ? { background: m.color } : undefined} />
                      ))}
                    </span>
                    <span className={s.teamWork}>{m.work}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════════ FOCUS ════════ */}
      <section className={s.section} id="focus">
        <div className={s.wrap}>
          <div className={s.focus}>
            <Reveal><span className={s.kicker} style={{ margin: "0 auto" }}>Focused by design</span></Reveal>
            <div className={s.focusFadeList} style={{ marginTop: 40 }}>
              {FADE_OUT.map((f, i) => (
                <motion.span
                  key={f}
                  className={s.focusFadeItem}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 0.5 - i * 0.06 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                >
                  {f}
                </motion.span>
              ))}
              <motion.span
                className={s.focusCross}
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 0.8, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                ✕
              </motion.span>
            </div>
            <Reveal delay={0.1}>
              <div className={s.focusKeep}>Just issues.</div>
            </Reveal>
            <Reveal delay={0.15}>
              <p className={s.focusSub}>
                Everything you need to move engineering work forward.
                Nothing competing for attention.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════════ GROW ════════ */}
      <section className={s.section} id="grow">
        <div className={s.wrap}>
          <div className={s.growGrid}>
            <Reveal className={s.ladder}>
              {LADDER.map((l, i) => (
                <div key={l.name}>
                  <div className={`${s.ladderStep} ${i === LADDER.length - 1 ? s.ladderStepLast : ""}`}>
                    <div className={s.ladderBox}>
                      <span className={s.ladderName}>{l.name}</span>
                      <span className={s.ladderCount}>{l.count}</span>
                    </div>
                  </div>
                  {i < LADDER.length - 1 && <div className={s.ladderConn}><i /></div>}
                </div>
              ))}
            </Reveal>

            <div className={s.growCopy}>
              <Reveal><span className={s.kicker}>Built for teams, ready to grow</span></Reveal>
              <Reveal delay={0.05}>
                <h2 className={s.growLine}>Small team today.<br />Built for what&rsquo;s next.</h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className={s.growSub}>
                  Start with one team and one project. The structure is already
                  here — expand into more the moment you need to.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ FINAL CTA ════════ */}
      <section className={s.wrap}>
        <div className={s.finalCta}>
          <div className={s.finalTrail}>
            <em style={{ color: "var(--green)" }}>Resolved</em>
            <i />
          </div>
          <Reveal>
            <h2 className={`${s.display} ${s.finalHead}`}>Ready to clear the queue?</h2>
          </Reveal>
          <Reveal delay={0.08}>
            <CtaGroup id="final-email" />
          </Reveal>
        </div>
      </section>

      <footer className={`${s.wrap}`}>
        <div className={s.footer}>
          <span>IssueLyst — from report to resolved.</span>
          <div className={s.footLinks}>
            <a href="#how">How it works</a>
            <a href="#product">Product</a>
            <a href="/app">View demo</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
