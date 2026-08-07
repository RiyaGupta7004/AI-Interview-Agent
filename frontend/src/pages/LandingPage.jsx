import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const featureCards = [
  {
    title: "Adaptive Interview",
    description: "AI adjusts question difficulty based on responses and candidate performance.",
    accent: "from-cyan-500/20 to-blue-500/20",
  },
  {
    title: "Candidate Profiling",
    description: "Uses candidate history and curriculum context to personalize the interview path.",
    accent: "from-violet-500/20 to-fuchsia-500/20",
  },
  {
    title: "Curriculum Driven",
    description: "Questions are generated and ranked from the structured curriculum dataset.",
    accent: "from-emerald-500/20 to-teal-500/20",
  },
  {
    title: "Real-time Evaluation",
    description: "Technical reasoning, communication quality, and confidence are evaluated continuously.",
    accent: "from-amber-500/20 to-orange-500/20",
  },
  {
    title: "AI Report",
    description: "Generates strengths, weaknesses, hiring recommendation, and a learning roadmap.",
    accent: "from-rose-500/20 to-pink-500/20",
  },
  {
    title: "Multi-Agent Architecture",
    description: "Planner, adaptive engine, prompt builder, and AI services work together as one system.",
    accent: "from-indigo-500/20 to-cyan-500/20",
  },
];

const steps = [
  "Choose Candidate",
  "Adaptive Interview",
  "AI Evaluation",
  "Personalized Report",
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-20 mb-10 rounded-full border border-slate-700/70 bg-slate-900/60 px-4 py-3 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
          <nav className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/30">
                AI
              </div>
              <span className="text-lg font-semibold tracking-tight text-white">
                AI Interview Agent
              </span>
            </div>

            <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="transition hover:text-cyan-300">
                GitHub
              </a>
              <a href="#about" className="transition hover:text-cyan-300">
                About
              </a>
              <Link
                to="/interview"
                className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 font-medium text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/20"
              >
                Start Interview
              </Link>
            </div>
          </nav>
        </header>

        <main>
          <section className="relative overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900/80 px-6 py-12 shadow-[0_30px_80px_rgba(2,6,23,0.9)] backdrop-blur-sm sm:px-10 lg:px-14 lg:py-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.25),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.18),_transparent_30%)]" />

            <div className="relative grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.24em] text-cyan-200">
                  Hackathon Demo
                </div>

                <h1 className="max-w-xl text-4xl font-black tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
                  Adaptive AI Interview Agent
                </h1>

                <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                  An AI-powered interview platform that adapts to the candidate&apos;s knowledge level, evaluates responses, and generates personalized interview reports with learning recommendations.
                </p>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link
                    to="/interview"
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:brightness-110"
                  >
                    Start Interview
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/70 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:text-cyan-200"
                  >
                    View Features
                  </a>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative"
              >
                <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-transparent blur-2xl" />
                <div className="relative rounded-[28px] border border-slate-700/80 bg-slate-900/70 p-5 shadow-2xl shadow-slate-950/60 backdrop-blur-xl">
                  <div className="rounded-[24px] border border-slate-700 bg-slate-950/80 p-5">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Live Interview</p>
                        <h2 className="mt-2 text-xl font-semibold text-white">Candidate Signal</h2>
                      </div>
                      <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-300">
                        Online
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { label: "Technical Depth", value: 86 },
                        { label: "Reasoning", value: 79 },
                        { label: "Communication", value: 92 },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                            <span>{item.label}</span>
                            <span>{item.value}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-800">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.value}%` }}
                              transition={{ duration: 0.9, ease: "easeOut" }}
                              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Recommendation</p>
                      <div className="mt-2 text-lg font-semibold text-cyan-200">Strong Hire</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          <section id="features" className="mt-20">
            <div className="mb-10 text-center">
              <p className="text-xs uppercase tracking-[0.34em] text-cyan-300">Platform Features</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Built for adaptive, high-signal technical hiring
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featureCards.map((card, index) => (
                <motion.article
                  key={card.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  whileHover={{ y: -6 }}
                  className={`rounded-[26px] border border-slate-700/80 bg-gradient-to-br ${card.accent} p-[1px] shadow-xl shadow-slate-950/30`}
                >
                  <div className="h-full rounded-[25px] border border-slate-700/80 bg-slate-950/85 p-6 backdrop-blur-xl">
                    <div className="mb-5 h-12 w-12 rounded-2xl bg-slate-900/80 ring-1 ring-slate-700/80" />
                    <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{card.description}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </section>

          <section id="about" className="mt-20 rounded-[30px] border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm sm:p-8 lg:p-10">
            <div className="mb-10 text-center">
              <p className="text-xs uppercase tracking-[0.32em] text-cyan-300">How It Works</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                From candidate selection to personalized hiring insight
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {steps.map((step, index) => (
                <div key={step} className="relative">
                  <div className="rounded-[24px] border border-slate-700 bg-slate-950/80 p-5 shadow-lg shadow-slate-950/30">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-sm font-bold text-slate-950">
                      {index + 1}
                    </div>
                    <div className="text-lg font-semibold text-white">{step}</div>
                  </div>
                  {index < steps.length - 1 ? (
                    <div className="hidden justify-center py-3 text-cyan-300 xl:flex">↓</div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer className="mt-20 rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 text-center shadow-xl shadow-slate-950/30 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Built for Hackathon</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-300">
            {['React', 'Node.js', 'Express', 'Groq/OpenAI', 'Tailwind'].map((item) => (
              <span key={item} className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1.5">
                {item}
              </span>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}

export default LandingPage;
