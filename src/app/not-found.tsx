import Link from "next/link";
import "./not-found.css";

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
    </div>
  );
}

