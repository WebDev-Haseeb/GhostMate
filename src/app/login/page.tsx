'use client';

/**
 * Landing & Login Page
 * 
 * Beautiful first impression with hero section, features, testimonials, and authentication
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import PrivacyNoticeModal from '@/components/PrivacyNoticeModal';
import styles from './login.module.css';

export default function LandingPage() {
  const router = useRouter();
  const { signInWithGoogle, user, loading: authLoading } = useAuth();
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect to home if already signed in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleSignIn = async () => {
    if (!privacyAccepted) return;

    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please try again.');
      setLoading(false);
    }
  };


  // If user is signed in, show nothing (redirecting)
  if (user) {
    return null;
  }

  const isAuthenticating = authLoading || loading;

  return (
    <>
      <PrivacyNoticeModal onAccept={() => setPrivacyAccepted(true)} />
      
      <div className={styles.container}>
        {/* Floating Ghost Elements */}
        <div className={styles.floatingGhosts}>
          <img src="/favicon.svg" alt="" className={styles.floatingGhost} style={{ top: '10%', left: '5%' }} />
          <span className={styles.floatingGhost} style={{ top: '20%', right: '10%' }}>🌙</span>
          <span className={styles.floatingGhost} style={{ bottom: '15%', left: '8%' }}>✨</span>
          <span className={styles.floatingGhost} style={{ top: '60%', right: '5%' }}>💬</span>
        </div>

        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.ghostIcon}>
              <img src="/favicon.svg" alt="GhostMate" />
            </div>
            <h1 className={styles.title}>
              Ghost<span className={styles.titleAccent}>Mate</span>
            </h1>
            <p className={styles.tagline}>
              Anonymous Conversations, Real Connections
            </p>
            <p className={styles.subtitle}>
              Connect anonymously. Chat freely. Disappear daily. <br/>
              Every conversation resets at midnight for true spontaneity.
            </p>

            {error && (
              <div className={styles.error}>
                <span className={styles.errorIcon}>⚠️</span>
                {error}
              </div>
            )}

            <button
              onClick={handleSignIn}
              disabled={!privacyAccepted || isAuthenticating}
              className={styles.ctaButton}
            >
              {isAuthenticating ? (
                <span className={styles.loadingText}>
                  <span className={styles.spinner}></span>
                  {authLoading ? 'Checking session...' : 'Connecting...'}
                </span>
              ) : (
                <>
                  <svg className={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            {!privacyAccepted && (
              <p className={styles.hint}>
                👆 Please accept the privacy notice to continue
              </p>
            )}
          </div>
        </section>

        {/* Stats Section */}
        <section className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>100%</div>
              <div className={styles.statLabel}>Anonymous</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>5</div>
              <div className={styles.statLabel}>Daily Chats</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>24h</div>
              <div className={styles.statLabel}>Reset Cycle</div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className={styles.howItWorks}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          
          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepIcon}>🎭</div>
              <h3 className={styles.stepTitle}>Get Your Daily ID</h3>
              <p className={styles.stepDescription}>
                Every day at midnight, you get a unique 8-digit ID. Share it to start conversations anonymously.
              </p>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepIcon}>💬</div>
              <h3 className={styles.stepTitle}>Start Chatting</h3>
              <p className={styles.stepDescription}>
                Enter someone's ID or use Random Connect. Chat with up to 5 people daily with complete anonymity.
              </p>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepIcon}>⭐</div>
              <h3 className={styles.stepTitle}>Favorite Connections</h3>
              <p className={styles.stepDescription}>
                Found someone special? Add them to favorites. If they favorite you back, create a mutual connection!
              </p>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepIcon}>🔥</div>
              <h3 className={styles.stepTitle}>Build Streaks</h3>
              <p className={styles.stepDescription}>
                Maintain connections by re-favoriting daily. Build and preserve your conversation streaks over time.
              </p>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>5</div>
              <div className={styles.stepIcon}>📖</div>
              <h3 className={styles.stepTitle}>Share Stories</h3>
              <p className={styles.stepDescription}>
                Highlight memorable messages as stories. Mutual highlights get featured anonymously for 48 hours.
              </p>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNumber}>6</div>
              <div className={styles.stepIcon}>🌙</div>
              <h3 className={styles.stepTitle}>Reset at Midnight</h3>
              <p className={styles.stepDescription}>
                All messages vanish. IDs change. Start fresh daily. Only connection streaks persist forever.
              </p>
            </div>
          </div>
        </section>

        {/* Features Highlight */}
        <section className={styles.featuresSection}>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔐</div>
              <h3 className={styles.featureTitle}>True Privacy</h3>
              <p className={styles.featureText}>
                No names, no profiles, no history. Your identity stays hidden while you connect authentically.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>⚡</div>
              <h3 className={styles.featureTitle}>Instant Connections</h3>
              <p className={styles.featureText}>
                Random Connect pairs you instantly with active users. No waiting, just spontaneous conversations.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎨</div>
              <h3 className={styles.featureTitle}>Beautiful Experience</h3>
              <p className={styles.featureText}>
                Dark theme, smooth animations, and ghost-themed design make every interaction delightful.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Promise Section */}
        <section className={styles.privacySection}>
          <div className={styles.privacyCard}>
            <div className={styles.privacyIcon}>🔒</div>
            <h3 className={styles.privacyTitle}>Privacy First, Always</h3>
            <p className={styles.privacyText}>
              Your Google account is only for verification. We never share your data or reveal your identity. 
              Everything resets daily, keeping your conversations truly ephemeral.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <p className={styles.footerText}>
            By continuing, you agree to our{' '}
            <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
            {' '}and{' '}
            <Link href="/terms" className={styles.footerLink}>Terms of Use</Link>
            , and confirm you are at least 13 years old.
          </p>
          <div className={styles.footerLinks}>
            <Link href="/privacy" className={styles.legalLink}>Privacy Policy</Link>
            <span className={styles.separator}>•</span>
            <Link href="/terms" className={styles.legalLink}>Terms of Use</Link>
          </div>
          <p className={styles.footerCopyright}>
            © {new Date().getFullYear()} GhostMate. Made with ❤️ for anonymous connections.
          </p>
        </footer>
      </div>
    </>
  );
}
