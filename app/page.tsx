import Link from 'next/link';
import {
  Zap,
  Brain,
  Calendar,
  RefreshCw,
  ArrowRight,
  Shield,
  Clock,
  TrendingUp,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {}
      <nav
        className="fixed top-0 w-full z-50 border-b"
        style={{
          background: 'rgba(9, 9, 11, 0.8)',
          backdropFilter: 'blur(12px)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">CrunchAI</span>
          </div>
          <Link
            href="/login"
            className="btn-primary text-sm"
            style={{ padding: '8px 20px' }}
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(800px circle at 50% 20%, rgba(124, 58, 237, 0.12), transparent 50%)',
          }}
        />
        <div
          className="absolute top-1/4 -left-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: 'rgba(6, 182, 212, 0.05)',
            filter: 'blur(100px)',
          }}
        />

        <div className="max-w-4xl mx-auto text-center relative">
          {}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8 animate-fade-in"
            style={{
              background: 'var(--primary-glow)',
              color: 'var(--primary-light)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
            }}
          >
            <Brain className="w-4 h-4" />
            Powered by Gemini 2.5 · Truly Agentic AI
          </div>

          <h1
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            Stop procrastinating.
            <br />
            <span className="gradient-text">Start crunching.</span>
          </h1>

          <p
            className="text-xl md:text-2xl max-w-2xl mx-auto mb-10 animate-fade-in leading-relaxed"
            style={{
              color: 'var(--foreground-muted)',
              animationDelay: '0.2s',
            }}
          >
            CrunchAI is an AI agent that breaks down your tasks, builds sprint
            plans, and{' '}
            <span style={{ color: 'var(--accent-light)' }}>
              automatically replans
            </span>{' '}
            when life happens.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            <Link
              href="/login"
              className="btn-primary text-base"
              style={{
                padding: '14px 32px',
                fontSize: '1rem',
                borderRadius: 'var(--radius-xl)',
              }}
            >
              Start Planning Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <span
              className="text-sm"
              style={{ color: 'var(--foreground-subtle)' }}
            >
              No credit card · Free forever
            </span>
          </div>
        </div>
      </section>

      {}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              An agent, not a{' '}
              <span style={{ color: 'var(--foreground-subtle)' }}>
                reminder app
              </span>
            </h2>
            <p style={{ color: 'var(--foreground-muted)' }} className="text-lg">
              CrunchAI doesn&apos;t just remind you. It thinks, plans, and
              adapts.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: 'Agentic Planning',
                description:
                  'The AI calls multiple tools in sequence — breaking tasks into subtasks, estimating effort, scheduling sessions, and assessing risk. Real multi-step reasoning.',
                color: 'var(--primary)',
                glow: 'var(--primary-glow)',
              },
              {
                icon: Calendar,
                title: 'Smart Scheduling',
                description:
                  'Maps your work into time blocks that respect your availability. No marathon sessions. Proper breaks. Sessions fit your real life.',
                color: 'var(--accent)',
                glow: 'rgba(6, 182, 212, 0.15)',
              },
              {
                icon: RefreshCw,
                title: 'Auto-Replan',
                description:
                  'Missed a session? The agent fires automatically — compresses remaining work, re-schedules, and flags new risks. Zero effort from you.',
                color: 'var(--success)',
                glow: 'rgba(16, 185, 129, 0.15)',
              },
            ].map(({ icon: Icon, title, description, color, glow }) => (
              <div
                key={title}
                className="glass glass-hover p-6 transition-all duration-300"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: glow }}
                >
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section
        className="py-20 px-6"
        style={{ background: 'var(--background-secondary)' }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Watch the agent <span className="gradient-text">think</span>
            </h2>
            <p style={{ color: 'var(--foreground-muted)' }} className="text-lg">
              Every tool call is visible. You see exactly how decisions are made.
            </p>
          </div>

          {}
          <div
            className="glass p-6 font-mono text-sm space-y-3"
            style={{ maxWidth: '600px', margin: '0 auto' }}
          >
            {[
              {
                step: 1,
                tool: 'break_into_subtasks',
                result: '→ 5 subtasks created',
              },
              {
                step: 2,
                tool: 'estimate_effort',
                result: '→ Total: 6.5 hours',
              },
              {
                step: 3,
                tool: 'calculate_schedule',
                result: '→ 4 sessions scheduled',
              },
              {
                step: 4,
                tool: 'assess_risk',
                result: '→ ⚠️ Tight on June 28',
              },
            ].map(({ step, tool, result }, i) => (
              <div
                key={step}
                className="flex items-start gap-3 animate-fade-in"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <span
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: 'var(--primary-glow)',
                    color: 'var(--primary-light)',
                  }}
                >
                  {step}
                </span>
                <div>
                  <span style={{ color: 'var(--accent-light)' }}>{tool}()</span>
                  <span
                    className="ml-2"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {result}
                  </span>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--success-light)' }}>
                ✓ Sprint plan ready
              </span>
              <span
                className="ml-2"
                style={{ color: 'var(--foreground-subtle)' }}
              >
                (2.3s)
              </span>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '6', label: 'Agent Tools', icon: Brain },
              { value: '<10s', label: 'Plan Generation', icon: Clock },
              { value: '100%', label: 'Auto-Replan', icon: RefreshCw },
              { value: 'Free', label: 'Forever', icon: Shield },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center">
                <Icon
                  className="w-5 h-5 mx-auto mb-2"
                  style={{ color: 'var(--foreground-subtle)' }}
                />
                <div className="text-2xl font-bold gradient-text">{value}</div>
                <div
                  className="text-sm mt-1"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to stop winging it?
          </h2>
          <p
            className="text-lg mb-8"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Let an AI agent handle the planning so you can focus on doing.
          </p>
          <Link
            href="/login"
            className="btn-primary text-base"
            style={{
              padding: '14px 32px',
              fontSize: '1rem',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {}
      <footer
        className="py-8 px-6 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <span className="text-sm font-medium">CrunchAI</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
            Built for BlockseBlock Hackathon 2025
          </p>
        </div>
      </footer>
    </div>
  );
}
