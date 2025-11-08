'use client';

import Link from 'next/link';
import styles from './privacy.module.css';

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.container}>
      {/* Floating Ghost Elements */}
      <div className={styles.floatingGhosts}>
        <img src="/favicon.svg" alt="" className={styles.floatingGhost} />
        <span className={styles.floatingGhost}>🔒</span>
        <span className={styles.floatingGhost}>✨</span>
        <span className={styles.floatingGhost}>🌙</span>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <Link href="/login" className={styles.backLink}>
            ← Back to GhostMate
          </Link>
          <div className={styles.icon}>
            <img src="/favicon.svg" alt="GhostMate" />
          </div>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.lastUpdated}>Last Updated: November 7, 2025</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Introduction</h2>
          <p className={styles.text}>
            Welcome to GhostMate. We are committed to protecting your privacy and providing a truly anonymous chatting experience. This Privacy Policy explains how we collect, use, and protect your information.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Information We Collect</h2>
          
          <h3 className={styles.subheading}>Authentication Information</h3>
          <p className={styles.text}>
            When you sign in with Google, we collect only your Google user ID for authentication purposes. We do NOT collect or store:
          </p>
          <ul className={styles.list}>
            <li>Your name</li>
            <li>Your email address</li>
            <li>Your profile picture</li>
            <li>Any other personal information from your Google account</li>
          </ul>

          <h3 className={styles.subheading}>Daily ID</h3>
          <p className={styles.text}>
            We generate a unique 8-digit numeric ID for you daily. This ID:
          </p>
          <ul className={styles.list}>
            <li>Cannot be traced back to your Google account</li>
            <li>Changes every day at midnight (PKT)</li>
            <li>Is automatically deleted after 24 hours</li>
          </ul>

          <h3 className={styles.subheading}>Chat Messages</h3>
          <p className={styles.text}>
            All chat messages are:
          </p>
          <ul className={styles.list}>
            <li>Stored temporarily in our database</li>
            <li>Automatically deleted at midnight daily</li>
            <li>Never backed up or archived</li>
            <li>Completely ephemeral by design</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>How We Use Your Information</h2>
          <p className={styles.text}>
            We use your information solely for:
          </p>
          <ul className={styles.list}>
            <li><strong>Authentication:</strong> Verifying you are a unique user</li>
            <li><strong>Daily IDs:</strong> Generating your anonymous daily identifier</li>
            <li><strong>Chat Functionality:</strong> Enabling real-time anonymous conversations</li>
            <li><strong>Connection Tracking:</strong> Managing favorites and streaks</li>
            <li><strong>Story Features:</strong> Displaying mutually highlighted messages</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Data Retention & Deletion</h2>
          
          <h3 className={styles.subheading}>Automatic Daily Deletion</h3>
          <p className={styles.text}>
            Every day at midnight (Pakistan Standard Time):
          </p>
          <ul className={styles.list}>
            <li>All chat messages are permanently deleted</li>
            <li>All daily IDs are deleted and regenerated</li>
            <li>Chat history is completely erased</li>
          </ul>

          <h3 className={styles.subheading}>What Persists</h3>
          <p className={styles.text}>
            Only the following data persists beyond the daily reset:
          </p>
          <ul className={styles.list}>
            <li>Your Google user ID (for authentication only)</li>
            <li>Connection streaks (anonymous count only)</li>
            <li>Approved stories (for 48 hours only)</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Third-Party Services</h2>
          
          <h3 className={styles.subheading}>Google Authentication</h3>
          <p className={styles.text}>
            We use Google Sign-In for authentication. Google may collect data according to their own privacy policy. We only receive your Google user ID – no other information.
          </p>

          <h3 className={styles.subheading}>Firebase</h3>
          <p className={styles.text}>
            We use Google Firebase for data storage and real-time messaging. Firebase security rules ensure:
          </p>
          <ul className={styles.list}>
            <li>Users can only access their own data</li>
            <li>Messages are encrypted in transit</li>
            <li>No unauthorized access to conversations</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Privacy Rights</h2>
          <p className={styles.text}>
            You have the right to:
          </p>
          <ul className={styles.list}>
            <li><strong>Access:</strong> Request information about data we store (minimal as it is)</li>
            <li><strong>Deletion:</strong> Sign out and all your active data is deleted at midnight</li>
            <li><strong>Anonymity:</strong> Your real identity is never revealed to other users</li>
            <li><strong>Opt-Out:</strong> Simply stop using GhostMate; your data auto-deletes daily</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Security</h2>
          <p className={styles.text}>
            We implement industry-standard security measures:
          </p>
          <ul className={styles.list}>
            <li>HTTPS encryption for all communications</li>
            <li>Firebase security rules preventing unauthorized access</li>
            <li>No storage of personally identifiable information</li>
            <li>Regular security audits and updates</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Children's Privacy</h2>
          <p className={styles.text}>
            GhostMate is intended for users aged 13 and older. We do not knowingly collect information from children under 13. If you believe a child under 13 has used our service, please contact us immediately.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Changes to This Policy</h2>
          <p className={styles.text}>
            We may update this Privacy Policy from time to time. We will notify users of any material changes by updating the "Last Updated" date at the top of this policy.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Contact Us</h2>
          <p className={styles.text}>
            If you have any questions about this Privacy Policy or our privacy practices, please contact us through the app's support channels.
          </p>
        </div>

        <div className={styles.footer}>
          <Link href="/login" className={styles.ctaButton}>
            Back to GhostMate
          </Link>
          <Link href="/terms" className={styles.textLink}>
            Read Terms of Use →
          </Link>
        </div>
      </div>
    </div>
  );
}

