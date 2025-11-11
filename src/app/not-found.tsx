'use client';

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="nf-wrapper">
      <div className="nf-ambient" aria-hidden />
      <main className="nf-card">
        <span className="nf-badge">Error 404 · Off the map</span>
        <div className="nf-ghost" aria-hidden>
          👻
        </div>
        <h1 className="nf-title">This room vanished with the sunrise</h1>
        <p className="nf-subtitle">
          The link you followed dissolved with yesterday&apos;s connections. Let&apos;s
          guide you back to a living conversation or start fresh with a new match.
        </p>

        <section className="nf-grid">
          <article className="nf-insight">
            <h3>Reconnect instantly</h3>
            <p>
              Head to your dashboard to pick up where you left off, explore new
              daily IDs, and see who&apos;s online right now.
            </p>
          </article>
          <article className="nf-insight">
            <h3>Peek community stories</h3>
            <p>
              Browse featured stories to feel the vibe, discover highlights, and get
              inspired before your next chat.
            </p>
          </article>
        </section>

        <div className="nf-actions">
          <Link href="/" className="nf-primaryAction">
            Return to dashboard
          </Link>
          <Link href="/stories" className="nf-secondaryAction">
            Explore stories
          </Link>
        </div>

        <p className="nf-meta">
          Still lost? Review our{" "}
          <Link href="/privacy" prefetch={false}>
            Privacy Policy
          </Link>{" "}
          or{" "}
          <Link href="/terms" prefetch={false}>
            Terms of Use
          </Link>
          .
        </p>
      </main>

      <style jsx global>{`
        .nf-wrapper {
          position: relative;
          min-height: 100vh;
          padding: clamp(var(--space-xl), 8vw, var(--space-2xl));
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: radial-gradient(
              140% 120% at 50% 0%,
              rgba(123, 104, 238, 0.22),
              transparent 55%
            ),
            radial-gradient(
              60% 80% at 20% 80%,
              rgba(84, 58, 183, 0.2),
              transparent 70%
            ),
            var(--background-primary);
        }

        .nf-ambient {
          position: absolute;
          inset: 0;
          pointer-events: none;
          mix-blend-mode: screen;
          opacity: 0.5;
          background:
            radial-gradient(20rem 20rem at 20% 20%, rgba(123, 104, 238, 0.35), transparent),
            radial-gradient(18rem 18rem at 80% 60%, rgba(255, 140, 0, 0.2), transparent),
            radial-gradient(14rem 16rem at 50% 90%, rgba(0, 191, 255, 0.18), transparent);
          filter: blur(18px);
          animation: nfAmbientDrift 14s ease-in-out infinite alternate;
        }

        @keyframes nfAmbientDrift {
          0% {
            transform: translate3d(-2%, 2%, 0) scale(1);
          }

          100% {
            transform: translate3d(2%, -2%, 0) scale(1.05);
          }
        }

        .nf-card {
          position: relative;
          width: min(680px, 100%);
          padding: clamp(var(--space-xl), 5vw, var(--space-2xl));
          border-radius: clamp(var(--radius-xl), 3vw, 1.5rem);
          background: rgba(15, 15, 28, 0.85);
          border: 1px solid rgba(123, 104, 238, 0.25);
          box-shadow:
            0 30px 60px rgba(10, 10, 10, 0.35),
            0 0 8px rgba(123, 104, 238, 0.35);
          backdrop-filter: blur(16px);
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: clamp(var(--space-lg), 3vw, var(--space-xl));
          animation: nfFadeUp 450ms ease 60ms both;
        }

        @keyframes nfFadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .nf-badge {
          align-self: center;
          display: inline-flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-xs) var(--space-md);
          border-radius: 999px;
          background: rgba(123, 104, 238, 0.16);
          border: 1px solid rgba(123, 104, 238, 0.35);
          font-size: 0.95rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--foreground-secondary);
        }

        .nf-ghost {
          font-size: clamp(3rem, 10vw, 4.5rem);
          animation: nfGhostBob 3.2s ease-in-out infinite;
        }

        @keyframes nfGhostBob {
          0%,
          100% {
            transform: translateY(-4px);
          }

          50% {
            transform: translateY(6px);
          }
        }

        .nf-title {
          font-size: clamp(2rem, 6vw, 3rem);
          margin: 0;
        }

        .nf-subtitle {
          max-width: 38ch;
          margin: 0 auto;
          color: var(--foreground-secondary);
          font-size: clamp(1rem, 2.8vw, 1.1rem);
        }

        .nf-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-md);
          text-align: left;
        }

        .nf-insight {
          padding: var(--space-md);
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(123, 104, 238, 0.12);
        }

        .nf-insight h3 {
          font-size: 1.05rem;
          margin-bottom: var(--space-sm);
        }

        .nf-insight p {
          margin: 0;
          color: var(--foreground-secondary);
          font-size: 0.95rem;
        }

        .nf-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: var(--space-md);
        }

        .nf-primaryAction,
        .nf-secondaryAction {
          position: relative;
          padding: var(--space-sm) var(--space-lg);
          border-radius: var(--radius-lg);
          font-weight: 600;
          font-size: 1rem;
          min-width: 180px;
          transition:
            box-shadow var(--transition-base),
            border-color var(--transition-base),
            background var(--transition-base),
            color var(--transition-fast);
          will-change: box-shadow;
        }

        .nf-primaryAction {
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          color: #ffffff;
          box-shadow: 0 12px 24px rgba(123, 104, 238, 0.35);
        }

        .nf-primaryAction:hover,
        .nf-primaryAction:focus-visible {
          color: #ffffff;
          box-shadow: 0 18px 34px rgba(123, 104, 238, 0.5);
        }

        .nf-secondaryAction {
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--foreground-primary);
          background: rgba(255, 255, 255, 0.04);
          box-shadow: 0 8px 18px rgba(10, 10, 15, 0.3);
        }

        .nf-secondaryAction:hover,
        .nf-secondaryAction:focus-visible {
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 10px 22px rgba(10, 10, 15, 0.36);
        }

        .nf-meta {
          font-size: 0.95rem;
          color: var(--foreground-secondary);
        }

        .nf-meta a {
          color: var(--accent-secondary);
          font-weight: 600;
        }

        .nf-meta a:hover {
          color: #ffffff;
        }

        @media (max-width: 768px) {
          .nf-wrapper {
            padding: var(--space-xl) var(--space-md);
          }

          .nf-card {
            padding: clamp(var(--space-lg), 6vw, var(--space-xl));
          }

          .nf-grid {
            grid-template-columns: 1fr;
            gap: var(--space-sm);
          }

          .nf-primaryAction,
          .nf-secondaryAction {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .nf-wrapper {
            padding: var(--space-lg) var(--space-sm);
          }

          .nf-card {
            gap: var(--space-lg);
          }

          .nf-subtitle {
            font-size: 1rem;
          }

          .nf-insight {
            padding: var(--space-sm) var(--space-md);
          }
        }
      `}</style>
    </div>
  );
}

