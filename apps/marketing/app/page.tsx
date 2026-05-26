import { UpdatesSection } from "@/components/updates-section";
import { WaitlistForm } from "@/components/waitlist-form";
import { ContentCountsStrip } from "@/components/content-counts-strip";

/* ─── Static data ─── */
const exams = [
  {
    name: "CSE Professional",
    sub: "& Subprofessional",
    desc: "Verbal, analytical, numerical, general info — full coverage of the Civil Service Exam.",
    icon: "🏛️",
    color: "from-blue-600/10 to-blue-500/5",
    border: "border-blue-200",
  },
  {
    name: "LET Elementary",
    sub: "& Secondary",
    desc: "Gen Ed, Professional Ed, and major-specific content for aspiring teachers.",
    icon: "📚",
    color: "from-emerald-600/10 to-emerald-500/5",
    border: "border-emerald-200",
  },
  {
    name: "PNLE",
    sub: "Philippine Nursing",
    desc: "5-part board simulation with competency tracking and NLE-style mock exams.",
    icon: "🩺",
    color: "from-rose-600/10 to-rose-500/5",
    border: "border-rose-200",
  },
];

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
      </svg>
    ),
    title: "PasaPath Daily Plan",
    desc: "Personalized study roadmap that adapts to your weak spots every day — from diagnostic to exam day.",
    badge: "Most loved",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    ),
    title: "Mistake Bank",
    desc: "Every wrong answer is saved and scheduled for review. Master it or it keeps coming back.",
    badge: null,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    ),
    title: "Taglish Explanations",
    desc: "Gets agad — explanations in Filipino English so it clicks faster than pure English textbook language.",
    badge: null,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
    title: "Verified Content",
    desc: "Human-reviewed questions with source notes. Report errors in one tap — fixed by our content team.",
    badge: null,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: "Readiness Score",
    desc: "Know exactly where you stand. Live score that updates as you practice — no fake progress.",
    badge: null,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
      </svg>
    ),
    title: "Offline Mode",
    desc: "Download question packs and review anywhere — no signal, no problem. Great for commuters.",
    badge: null,
  },
];

const steps = [
  { n: "01", title: "Pick your exam", desc: "CSE, LET, or PNLE — tell us your target date and daily study time." },
  { n: "02", title: "Take the diagnostic", desc: "40-question adaptive quiz that maps your baseline across all subjects." },
  { n: "03", title: "Follow PasaPath daily", desc: "Your personalized plan updates every day based on what you got right and wrong." },
  { n: "04", title: "Pass the board", desc: "Track readiness, simulate the real exam, and walk in confident." },
];

const pricing = [
  {
    tier: "Free",
    price: "₱0",
    period: "forever",
    items: ["20 practice questions/day", "Diagnostic exam", "1 mini-mock per week", "7-day mistake history", "Basic PasaPath"],
    highlight: false,
    cta: "Start free",
  },
  {
    tier: "Plus",
    price: "₱999",
    period: "per year",
    items: ["Unlimited questions", "Full PasaPath for all exams", "Unlimited mock exams", "Full mistake history", "AI tutor (Taglish)", "No ads"],
    highlight: true,
    cta: "Join beta waitlist",
  },
  {
    tier: "Exam Pass",
    price: "₱499–599",
    period: "one exam · 6 months",
    items: ["Single exam unlock", "Offline question pack", "Full mock simulation", "AI tutor access"],
    highlight: false,
    cta: "Get exam pass",
  },
];

/* ─── Dashboard mockup component ─── */
function DashboardMockup() {
  return (
    <div className="relative">
      {/* Glow behind card */}
      <div className="absolute -inset-4 rounded-[2rem] bg-[var(--rn-blue)] opacity-20 blur-2xl" />
      <div className="relative rounded-2xl border border-white/10 bg-[var(--rn-hero-surface)] p-5 shadow-2xl">
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">CSE Professional</p>
            <p className="mt-0.5 font-[family-name:var(--font-syne)] text-sm font-bold text-white">Magandang umaga, Maria! 👋</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-[var(--rn-gold)]/15 px-3 py-1.5 text-xs font-bold text-[var(--rn-gold)]">
            🔥 12 araw streak
          </span>
        </div>

        {/* Stats row */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {[
            { label: "Readiness", val: "68%", color: "text-[var(--rn-blue-light)]" },
            { label: "Ngayon", val: "14 Q", color: "text-emerald-400" },
            { label: "Days left", val: "106", color: "text-white" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/5 bg-white/5 p-2.5 text-center">
              <p className={`text-base font-extrabold ${s.color}`}>{s.val}</p>
              <p className="mt-0.5 text-[10px] text-white/40">{s.label}</p>
            </div>
          ))}
        </div>

        {/* PasaPath card */}
        <div className="rounded-xl border border-[var(--rn-blue)]/30 bg-gradient-to-br from-[var(--rn-blue)] to-[#1539a8] p-4">
          <div className="flex items-center justify-between">
            <p className="font-[family-name:var(--font-syne)] text-sm font-bold text-white">Today&apos;s PasaPath</p>
            <span className="text-[10px] text-white/60">~30 min · 3 tasks</span>
          </div>
          <ul className="mt-3 space-y-2">
            {[
              { done: true,  label: "Numerical — Word problems (12)" },
              { done: false, label: "Mistake Bank review (5)" },
              { done: false, label: "Logic basics — new topic" },
            ].map((task) => (
              <li key={task.label} className="flex items-center gap-2.5 text-xs text-white/90">
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] ${task.done ? "border-[var(--rn-gold)] bg-[var(--rn-gold)] text-[var(--rn-hero-bg)]" : "border-white/30"}`}>
                  {task.done ? "✓" : ""}
                </span>
                <span className={task.done ? "line-through opacity-50" : ""}>{task.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick actions */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          {["Practice", "Mock", "Mistakes", "Flashcards"].map((a) => (
            <button key={a} className="rounded-lg border border-white/10 bg-white/5 py-2 text-[10px] font-semibold text-white/70 transition hover:bg-white/10">
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function Home() {
  return (
    <div className="min-h-screen">

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--rn-hero-bg)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--rn-blue)] text-sm font-extrabold text-white shadow-lg shadow-[var(--rn-blue)]/30">
              RN
            </span>
            <span className="font-[family-name:var(--font-syne)] text-lg font-extrabold text-white">
              ReviewNatin
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-white/60 md:flex">
            <a href="#exams"    className="transition hover:text-white">Exams</a>
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#how"      className="transition hover:text-white">How it works</a>
            <a href="#pricing"  className="transition hover:text-white">Pricing</a>
          </nav>
          <a
            href="#waitlist"
            className="rounded-full bg-[var(--rn-gold)] px-5 py-2 text-sm font-bold text-[#060d1f] shadow-lg shadow-[var(--rn-gold)]/20 transition hover:brightness-110"
          >
            Join beta →
          </a>
        </div>
      </header>

      <main>

        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-[var(--rn-hero-bg)] px-6 pb-24 pt-16 md:pt-24">
          {/* Grid + glow bg */}
          <div className="hero-grid absolute inset-0 opacity-100" />
          <div className="pointer-events-none absolute -right-40 top-0 h-[600px] w-[600px] rounded-full bg-[var(--rn-blue)] opacity-20 blur-[120px]" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-[400px] w-[400px] rounded-full bg-[var(--rn-gold)] opacity-10 blur-[100px]" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2">
            {/* Left */}
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--rn-blue)]/30 bg-[var(--rn-blue)]/10 px-4 py-2 text-xs font-semibold text-[var(--rn-blue-light)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--rn-gold)]" />
                🇵🇭 Philippine Licensure Reviewer · Beta Coming Soon
              </div>
              <h1 className="font-[family-name:var(--font-syne)] text-5xl font-extrabold leading-[1.08] tracking-tight text-white md:text-6xl lg:text-7xl">
                Review together.
                <br />
                <span className="gradient-text">Pass together.</span>
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-white/60">
                The Filipino-first mobile reviewer with PasaPath — your araw-araw na study plan from diagnostic to exam day.
              </p>

              {/* Stats chips */}
              <div className="mt-7 flex flex-wrap gap-3">
                {[
                  { icon: "✦", label: "Free to start" },
                  { icon: "📋", label: "CSE · LET · PNLE" },
                  { icon: "🇵🇭", label: "Taglish explanations" },
                ].map((s) => (
                  <span key={s.label} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                    <span>{s.icon}</span>
                    {s.label}
                  </span>
                ))}
              </div>

              {/* Waitlist form */}
              <div id="waitlist" className="mt-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
                  Join the beta waitlist
                </p>
                <WaitlistForm dark />
              </div>
            </div>

            {/* Right — dashboard mockup */}
            <div className="hidden md:block">
              <DashboardMockup />
            </div>
          </div>
        </section>

        {/* ── CONTENT COUNTS (only shows if 100+ questions) ── */}
        <ContentCountsStrip />

        {/* ── TRUST STRIP ── */}
        <section className="border-y border-[var(--rn-muted)]/15 bg-white px-6 py-6">
          <div className="mx-auto max-w-6xl">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-[var(--rn-muted)]">
              Designed for Filipinos preparing for
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-6">
              {[
                { name: "Civil Service Exam", short: "CSE", color: "text-blue-600 bg-blue-50" },
                { name: "Licensure Exam for Teachers", short: "LET", color: "text-emerald-600 bg-emerald-50" },
                { name: "Nursing Licensure Exam", short: "PNLE", color: "text-rose-600 bg-rose-50" },
              ].map((e) => (
                <span key={e.short} className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold ${e.color}`}>
                  <span className="text-base">{e.short}</span>
                  <span className="font-normal opacity-70">— {e.name}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── EXAMS ── */}
        <section id="exams" className="bg-[var(--rn-bg)] px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--rn-blue)]">Phase 1 coverage</p>
              <h2 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold text-[var(--rn-text)] md:text-4xl">
                Built for the boards you&apos;re taking
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[var(--rn-muted)]">
                Depth first — comprehensive content for three major boards before we expand.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {exams.map((e) => (
                <article
                  key={e.name}
                  className={`card-glow rounded-2xl border bg-gradient-to-br ${e.color} ${e.border} bg-white p-7`}
                >
                  <span className="text-4xl">{e.icon}</span>
                  <h3 className="mt-4 font-[family-name:var(--font-syne)] text-xl font-extrabold text-[var(--rn-text)]">
                    {e.name}
                    <br />
                    <span className="text-sm font-normal text-[var(--rn-muted)]">{e.sub}</span>
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--rn-muted)]">{e.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="bg-white px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--rn-blue)]">What makes it different</p>
              <h2 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold text-[var(--rn-text)] md:text-4xl">
                Built for how Filipinos review
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="card-glow relative rounded-2xl border border-[var(--rn-bg)] bg-[var(--rn-bg)] p-6">
                  {f.badge ? (
                    <span className="absolute right-4 top-4 rounded-full bg-[var(--rn-gold)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--rn-text)]">
                      {f.badge}
                    </span>
                  ) : null}
                  <div className="icon-bg mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-[var(--rn-blue)]">
                    {f.icon}
                  </div>
                  <h3 className="font-[family-name:var(--font-syne)] text-base font-bold text-[var(--rn-text)]">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--rn-muted)]">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how" className="relative overflow-hidden bg-[var(--rn-hero-bg)] px-6 py-20">
          <div className="hero-grid absolute inset-0 opacity-50" />
          <div className="pointer-events-none absolute right-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-[var(--rn-blue)] opacity-15 blur-[100px]" />
          <div className="relative mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--rn-blue-light)]">The process</p>
              <h2 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold text-white md:text-4xl">
                From sign-up to <span className="gradient-text">board passer</span>
              </h2>
            </div>
            <div className="grid gap-px md:grid-cols-4">
              {steps.map((s, i) => (
                <div key={s.n} className="relative flex flex-col items-center p-6 text-center">
                  {i < steps.length - 1 && (
                    <div className="absolute right-0 top-10 hidden h-0.5 w-1/2 bg-gradient-to-r from-[var(--rn-blue)]/50 to-transparent md:block" />
                  )}
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--rn-blue)]/30 bg-[var(--rn-blue)]/10 font-[family-name:var(--font-syne)] text-lg font-extrabold text-[var(--rn-blue-light)]">
                    {s.n}
                  </div>
                  <h3 className="font-[family-name:var(--font-syne)] text-base font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="bg-[var(--rn-bg)] px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--rn-blue)]">Pricing</p>
              <h2 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold text-[var(--rn-text)] md:text-4xl">
                Simple, honest pricing
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-[var(--rn-muted)]">
                Start free. Upgrade when you need more. No surprise charges.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {pricing.map((p) =>
                p.highlight ? (
                  <div
                    key={p.tier}
                    className="card-shine relative order-first rounded-2xl border-2 border-[var(--rn-blue)] bg-[var(--rn-blue)] p-7 shadow-xl shadow-[var(--rn-blue)]/30 md:order-none md:-translate-y-3"
                  >
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[var(--rn-gold)] px-4 py-1 text-xs font-bold text-[#060d1f]">
                      Most popular
                    </span>
                    <h3 className="font-[family-name:var(--font-syne)] text-xl font-extrabold text-white">{p.tier}</h3>
                    <div className="mt-3 flex items-end gap-1.5">
                      <span className="text-4xl font-extrabold text-[var(--rn-gold)]">{p.price}</span>
                      <span className="mb-1 text-sm text-white/60">{p.period}</span>
                    </div>
                    <ul className="mt-5 space-y-2.5 text-sm text-white/80">
                      {p.items.map((i) => (
                        <li key={i} className="flex items-center gap-2.5">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--rn-gold)]/20 text-[9px] text-[var(--rn-gold)]">✓</span>
                          {i}
                        </li>
                      ))}
                    </ul>
                    <a
                      href="#waitlist"
                      className="mt-7 block rounded-xl bg-[var(--rn-gold)] py-3 text-center text-sm font-bold text-[#060d1f] transition hover:brightness-110"
                    >
                      {p.cta}
                    </a>
                  </div>
                ) : (
                  <div
                    key={p.tier}
                    className="card-glow rounded-2xl border border-[var(--rn-bg)] bg-white p-7"
                  >
                    <h3 className="font-[family-name:var(--font-syne)] text-xl font-extrabold text-[var(--rn-text)]">{p.tier}</h3>
                    <div className="mt-3 flex items-end gap-1.5">
                      <span className="text-3xl font-extrabold text-[var(--rn-blue)]">{p.price}</span>
                      <span className="mb-1 text-sm text-[var(--rn-muted)]">{p.period}</span>
                    </div>
                    <ul className="mt-5 space-y-2.5 text-sm text-[var(--rn-muted)]">
                      {p.items.map((i) => (
                        <li key={i} className="flex items-center gap-2.5">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--rn-blue)]/10 text-[9px] text-[var(--rn-blue)]">✓</span>
                          {i}
                        </li>
                      ))}
                    </ul>
                    <a
                      href="#waitlist"
                      className="mt-7 block rounded-xl border border-[var(--rn-blue)]/20 py-3 text-center text-sm font-bold text-[var(--rn-blue)] transition hover:bg-[var(--rn-blue)] hover:text-white"
                    >
                      {p.cta}
                    </a>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* ── UPDATES (shows only when there's content) ── */}
        <UpdatesSection />

        {/* ── FINAL CTA ── */}
        <section className="relative overflow-hidden bg-[var(--rn-hero-bg)] px-6 py-20">
          <div className="hero-grid absolute inset-0 opacity-50" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--rn-blue)] opacity-20 blur-[100px]" />
          <div className="relative mx-auto max-w-2xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--rn-blue-light)]">
              Ready to pasa?
            </p>
            <h2 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold leading-tight text-white md:text-5xl">
              Your board exam is
              <br />
              <span className="gradient-text">waiting for you.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-lg text-white/60">
              Join the beta waitlist. Be the first to access ReviewNatin when we launch.
            </p>
            <div className="mt-8">
              <WaitlistForm dark centered />
            </div>
            <p className="mt-4 text-xs text-white/30">
              Free to join · No credit card needed · Unsubscribe anytime
            </p>
          </div>
        </section>

        {/* ── DISCLAIMER ── */}
        <section className="border-t border-[var(--rn-muted)]/15 bg-white px-6 py-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--rn-muted)]">Disclaimer</p>
            <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-[var(--rn-muted)]">
              ReviewNatin is an independent study tool and is not affiliated with, endorsed by, or authorized by the
              Civil Service Commission (CSC), Professional Regulation Commission (PRC), or any government agency.
              No pass guarantee. For official registration:{" "}
              <a href="https://www.csc.gov.ph" className="text-[var(--rn-blue)] underline underline-offset-2">csc.gov.ph</a>
              {" · "}
              <a href="https://online.prc.gov.ph" className="text-[var(--rn-blue)] underline underline-offset-2">online.prc.gov.ph</a>.
            </p>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[var(--rn-muted)]/15 bg-[var(--rn-hero-bg)] px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--rn-blue)] text-xs font-extrabold text-white">
              RN
            </span>
            <span className="font-[family-name:var(--font-syne)] font-bold text-white/80">ReviewNatin</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-white/40">
            <a href="/privacy"      className="transition hover:text-white/80">Privacy</a>
            <a href="/terms"        className="transition hover:text-white/80">Terms</a>
            <a href="/disclaimers"  className="transition hover:text-white/80">Disclaimers</a>
            <a href="/subscribe"    className="transition hover:text-white/80">Pricing</a>
          </nav>
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} ReviewNatin · reviewnatinph.com
          </p>
        </div>
      </footer>
    </div>
  );
}
