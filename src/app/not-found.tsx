import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.ambient} aria-hidden />
      <main className={styles.card}>
        <span className={styles.badge}>Error 404 · Off the map</span>
        <div className={styles.ghost} aria-hidden>
          👻
        </div>
        <h1 className={styles.title}>This room vanished with the sunrise</h1>
        <p className={styles.subtitle}>
          The link you followed dissolved with yesterday&apos;s connections. Let&apos;s
          guide you back to a living conversation or start fresh with a new match.
        </p>

        <section className={styles.grid}>
          <article className={styles.insight}>
            <h3>Reconnect instantly</h3>
            <p>
              Head to your dashboard to pick up where you left off, explore new
              daily IDs, and see who&apos;s online right now.
            </p>
          </article>
          <article className={styles.insight}>
            <h3>Peek community stories</h3>
            <p>
              Browse featured stories to feel the vibe, discover highlights, and get
              inspired before your next chat.
            </p>
          </article>
        </section>

        <div className={styles.actions}>
          <Link href="/" className={styles.primaryAction}>
            Return to dashboard
          </Link>
          <Link href="/stories" className={styles.secondaryAction}>
            Explore stories
          </Link>
        </div>

        <p className={styles.meta}>
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

