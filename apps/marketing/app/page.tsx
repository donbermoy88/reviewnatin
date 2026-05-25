import { UpdatesSection } from "@/components/updates-section";
import { WaitlistForm } from "@/components/waitlist-form";
import { ContentCountsStrip } from "@/components/content-counts-strip";

const exams = [
  { name: "CSE Professional & Subprofessional", desc: "Civil Service — verbal, analytical, numerical" },
  { name: "LET Elementary & Secondary", desc: "Licensure for Teachers — Gen Ed, Prof Ed, majors" },
  { name: "PNLE (Nursing)", desc: "5-part board simulation with competency tracking" },
];

const features = [
  { title: "PasaPath", desc: "Araw-araw na study plan mula diagnostic hanggang exam day." },
  { title: "Mistake Bank", desc: "Lahat ng maling sagot — balikan hanggang master mo." },
  { title: "Taglish explanations", desc: "Gets agad, parang may tutor na nagpapaliwanag." },
  { title: "Verified content", desc: "Human-reviewed questions. I-report ang mali sa isang tap." },
];

const pricing = [
  { tier: "Free", price: "₱0", items: ["20 questions/day", "Diagnostic", "1 mini-mock/week", "7-day mistake history"] },
  { tier: "Exam Pass", price: "₱499–599", items: ["Full question bank", "Unlimited mocks", "Offline pack", "6 months access"], highlight: false },
  { tier: "Plus", price: "₱999/yr", items: ["All exams", "Full PasaPath", "Priority updates", "No ads"], highlight: true },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--rn-blue)] text-lg font-bold text-white">
            RN
          </span>
          <span className="font-[family-name:var(--font-syne)] text-xl font-extrabold text-[var(--rn-blue)]">
            ReviewNatin
          </span>
        </div>
        <nav className="hidden gap-8 text-sm font-medium text-[var(--rn-muted)] md:flex">
          <a href="#exams" className="hover:text-[var(--rn-blue)]">Exams</a>
          <a href="#features" className="hover:text-[var(--rn-blue)]">Features</a>
          <a href="#pricing" className="hover:text-[var(--rn-blue)]">Pricing</a>
        </nav>
        <a
          href="#download"
          className="rounded-full bg-[var(--rn-gold)] px-5 py-2.5 text-sm font-bold text-[var(--rn-text)] shadow-sm transition hover:brightness-95"
        >
          Get the app
        </a>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 pb-20 pt-8 md:pt-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[var(--rn-gold)] opacity-20 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-64 w-64 rounded-full bg-[var(--rn-blue)] opacity-15 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-3 inline-block rounded-full bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--rn-blue)] shadow-sm">
                Philippines · CSE · LET · PNLE
              </p>
              <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold leading-tight text-[var(--rn-text)] md:text-5xl lg:text-6xl">
                Review together.
                <br />
                <span className="text-[var(--rn-blue)]">Pass together.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-[var(--rn-muted)]">
                The Filipino-first mobile reviewer with PasaPath — your daily roadmap from weak spots to exam day.
              </p>
              <div className="mt-8 flex flex-wrap gap-4" id="download">
                <span className="rounded-xl border border-[var(--rn-muted)]/30 bg-white px-6 py-3 text-sm font-semibold text-[var(--rn-muted)]">
                  App Store — beta soon
                </span>
                <span className="rounded-xl border border-[var(--rn-muted)]/30 bg-white px-6 py-3 text-sm font-semibold text-[var(--rn-muted)]">
                  Google Play — beta soon
                </span>
              </div>
              <WaitlistForm />
            </div>
            <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-xl shadow-[var(--rn-blue)]/10">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--rn-muted)]">Dashboard preview</span>
                <span className="rounded-full bg-[var(--rn-gold)] px-3 py-1 text-xs font-bold">🔥 12 streak</span>
              </div>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-[6px] border-[var(--rn-blue)] text-xl font-extrabold text-[var(--rn-blue)]">
                  68%
                </div>
                <div>
                  <p className="font-bold">106 days before CSE</p>
                  <p className="text-sm text-[var(--rn-muted)]">Almost ready</p>
                </div>
              </div>
              <div className="rounded-2xl bg-[var(--rn-blue)] p-5 text-white">
                <p className="font-[family-name:var(--font-syne)] text-lg font-bold">PasaPath · Today</p>
                <p className="mt-1 text-sm opacity-90">~30 min · 3 tasks</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>○ Numerical — word problems (12)</li>
                  <li>○ Mistake Bank (5)</li>
                  <li>○ New: Logic basics</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <ContentCountsStrip />

        <section id="exams" className="bg-white px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold">Phase 1 exams</h2>
            <p className="mt-2 text-[var(--rn-muted)]">Depth first — more boards coming after launch.</p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {exams.map((e) => (
                <article key={e.name} className="rounded-2xl border border-[var(--rn-bg)] bg-[var(--rn-bg)] p-6">
                  <h3 className="font-bold text-[var(--rn-blue)]">{e.name}</h3>
                  <p className="mt-2 text-sm text-[var(--rn-muted)]">{e.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold">Built for how Filipinos review</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {features.map((f) => (
                <div key={f.title} className="rounded-2xl bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-[var(--rn-blue)]">{f.title}</h3>
                  <p className="mt-2 text-[var(--rn-muted)]">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-white px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold">Simple pricing</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {pricing.map((p) => (
                <div
                  key={p.tier}
                  className={`rounded-2xl border p-6 ${p.highlight ? "border-[var(--rn-blue)] bg-[var(--rn-blue)] text-white" : "border-[var(--rn-bg)] bg-[var(--rn-bg)]"}`}
                >
                  <h3 className="text-xl font-bold">{p.tier}</h3>
                  <p className={`mt-2 text-2xl font-extrabold ${p.highlight ? "text-[var(--rn-gold)]" : "text-[var(--rn-blue)]"}`}>
                    {p.price}
                  </p>
                  <ul className={`mt-4 space-y-2 text-sm ${p.highlight ? "opacity-90" : "text-[var(--rn-muted)]"}`}>
                    {p.items.map((i) => (
                      <li key={i}>✓ {i}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <UpdatesSection />

        <section className="border-t border-[var(--rn-muted)]/20 px-6 py-12">
          <div className="mx-auto max-w-3xl text-center text-sm text-[var(--rn-muted)]">
            <p className="font-semibold text-[var(--rn-text)]">Disclaimer</p>
            <p className="mt-2 leading-relaxed">
              ReviewNatin is an independent study tool and is not affiliated with, endorsed by, or authorized by the
              Civil Service Commission (CSC), Professional Regulation Commission (PRC), or any government agency. No
              pass guarantee. For official registration:{" "}
              <a href="https://www.csc.gov.ph" className="text-[var(--rn-blue)] underline">
                csc.gov.ph
              </a>
              ,{" "}
              <a href="https://online.prc.gov.ph" className="text-[var(--rn-blue)] underline">
                online.prc.gov.ph
              </a>
              .
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--rn-muted)]/20 px-6 py-8 text-center text-sm text-[var(--rn-muted)]">
        <nav className="mb-3 flex flex-wrap justify-center gap-4">
          <a href="/privacy" className="hover:text-[var(--rn-blue)]">
            Privacy
          </a>
          <a href="/terms" className="hover:text-[var(--rn-blue)]">
            Terms
          </a>
          <a href="/disclaimers" className="hover:text-[var(--rn-blue)]">
            Disclaimers
          </a>
        </nav>
        © {new Date().getFullYear()} ReviewNatin · reviewnatinph.com
      </footer>
    </div>
  );
}
