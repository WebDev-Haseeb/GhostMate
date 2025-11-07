'use client';

import Link from 'next/link';
import styles from './terms.module.css';

export default function TermsOfUsePage() {
  return (
    <div className={styles.container}>
      {/* Floating Ghost Elements */}
      <div className={styles.floatingGhosts}>
        <span className={styles.floatingGhost}>👻</span>
        <span className={styles.floatingGhost}>📜</span>
        <span className={styles.floatingGhost}>⚖️</span>
        <span className={styles.floatingGhost}>✨</span>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <Link href="/login" className={styles.backLink}>
            ← Back to GhostMate
          </Link>
          <div className={styles.icon}>👻</div>
          <h1 className={styles.title}>Terms of Use</h1>
          <p className={styles.lastUpdated}>Last Updated: November 7, 2025</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Agreement to Terms</h2>
          <p className={styles.text}>
            By accessing or using GhostMate, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our service.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Service Description</h2>
          <p className={styles.text}>
            GhostMate is an anonymous chat platform where:
          </p>
          <ul className={styles.list}>
            <li>Users receive a unique daily ID that resets at midnight (PKT)</li>
            <li>All chat messages are automatically deleted daily</li>
            <li>Up to 5 new chat connections can be initiated per day</li>
            <li>Users can create favorites and maintain connection streaks</li>
            <li>Mutually highlighted messages may be featured as anonymous stories</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Eligibility</h2>
          <p className={styles.text}>
            You must be at least 13 years old to use GhostMate. By using our service, you represent and warrant that you meet this age requirement.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>User Conduct</h2>
          
          <h3 className={styles.subheading}>Acceptable Use</h3>
          <p className={styles.text}>
            You agree to use GhostMate for lawful purposes only. When using our service, you will:
          </p>
          <ul className={styles.list}>
            <li>Treat other users with respect</li>
            <li>Engage in genuine, authentic conversations</li>
            <li>Respect others' anonymity</li>
            <li>Report inappropriate behavior</li>
          </ul>

          <h3 className={styles.subheading}>Prohibited Activities</h3>
          <p className={styles.text}>
            The following activities are strictly prohibited:
          </p>
          <ul className={styles.list}>
            <li>Harassment, bullying, or threatening other users</li>
            <li>Sharing illegal content or engaging in illegal activities</li>
            <li>Attempting to deanonymize or identify other users</li>
            <li>Spamming, advertising, or promotional content</li>
            <li>Sharing explicit sexual content or soliciting such content</li>
            <li>Impersonating others or creating fake identities</li>
            <li>Attempting to hack, disrupt, or compromise the service</li>
            <li>Using automated tools or bots</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Anonymity & Privacy</h2>
          
          <h3 className={styles.subheading}>Your Responsibility</h3>
          <p className={styles.text}>
            While GhostMate provides anonymity by design, you are responsible for:
          </p>
          <ul className={styles.list}>
            <li>Not sharing personal information in chats</li>
            <li>Not attempting to reveal your identity</li>
            <li>Understanding that anything you share may be screenshot or copied</li>
            <li>Accepting that anonymity does not protect illegal activities</li>
          </ul>

          <h3 className={styles.subheading}>Our Commitment</h3>
          <p className={styles.text}>
            We commit to:
          </p>
          <ul className={styles.list}>
            <li>Never revealing user identities to other users</li>
            <li>Automatically deleting all messages daily</li>
            <li>Maintaining minimal user data</li>
            <li>Cooperating with law enforcement when legally required</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Content & Stories</h2>
          
          <h3 className={styles.subheading}>User-Generated Content</h3>
          <p className={styles.text}>
            You retain ownership of any content you share. However, by using GhostMate, you grant us a license to:
          </p>
          <ul className={styles.list}>
            <li>Display your messages to your chat partners</li>
            <li>Feature mutually highlighted messages as anonymous stories</li>
            <li>Store messages temporarily until midnight deletion</li>
          </ul>

          <h3 className={styles.subheading}>Stories Feature</h3>
          <p className={styles.text}>
            When both users highlight a message:
          </p>
          <ul className={styles.list}>
            <li>The message enters an admin review queue</li>
            <li>If approved, it's displayed anonymously for 48 hours</li>
            <li>No identifying information is attached to stories</li>
            <li>You cannot delete approved stories once published</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Daily Limits & Resets</h2>
          <p className={styles.text}>
            GhostMate operates on a 24-hour cycle:
          </p>
          <ul className={styles.list}>
            <li><strong>Chat Limit:</strong> 5 new chat initiations per day</li>
            <li><strong>Daily Reset:</strong> Occurs at midnight (Pakistan Standard Time)</li>
            <li><strong>ID Change:</strong> Your 8-digit ID changes daily</li>
            <li><strong>Message Deletion:</strong> All messages are permanently deleted at midnight</li>
            <li><strong>Connection Streaks:</strong> Persist across days if maintained</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Account Termination</h2>
          
          <h3 className={styles.subheading}>Your Right to Leave</h3>
          <p className={styles.text}>
            You may stop using GhostMate at any time by simply signing out. Your data will be automatically deleted at the next midnight reset.
          </p>

          <h3 className={styles.subheading}>Our Right to Terminate</h3>
          <p className={styles.text}>
            We reserve the right to suspend or terminate your access to GhostMate if you:
          </p>
          <ul className={styles.list}>
            <li>Violate these Terms of Use</li>
            <li>Engage in prohibited activities</li>
            <li>Compromise the safety or experience of other users</li>
            <li>Attempt to abuse or exploit the service</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Disclaimers</h2>
          
          <h3 className={styles.subheading}>Service Availability</h3>
          <p className={styles.text}>
            GhostMate is provided "as is" without warranties of any kind. We do not guarantee:
          </p>
          <ul className={styles.list}>
            <li>Uninterrupted service availability</li>
            <li>Error-free operation</li>
            <li>Security of communications beyond our design</li>
            <li>Compatibility with all devices or browsers</li>
          </ul>

          <h3 className={styles.subheading}>User Interactions</h3>
          <p className={styles.text}>
            We are not responsible for:
          </p>
          <ul className={styles.list}>
            <li>Content shared by other users</li>
            <li>Behavior or actions of other users</li>
            <li>Relationships formed through the platform</li>
            <li>Emotional or psychological impact of conversations</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Limitation of Liability</h2>
          <p className={styles.text}>
            To the maximum extent permitted by law, GhostMate and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Changes to Terms</h2>
          <p className={styles.text}>
            We may update these Terms of Use from time to time. Continued use of GhostMate after changes constitutes acceptance of the updated terms. We will update the "Last Updated" date to reflect any changes.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Governing Law</h2>
          <p className={styles.text}>
            These Terms shall be governed by and construed in accordance with the laws of Pakistan, without regard to its conflict of law provisions.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Contact & Reporting</h2>
          <p className={styles.text}>
            If you encounter violations of these terms or need to report abuse, please contact us through the app's support channels. We take reports seriously and investigate all claims.
          </p>
        </div>

        <div className={styles.footer}>
          <Link href="/login" className={styles.ctaButton}>
            Back to GhostMate
          </Link>
          <Link href="/privacy" className={styles.textLink}>
            Read Privacy Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}

