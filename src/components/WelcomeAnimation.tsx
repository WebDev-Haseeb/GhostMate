'use client';

/**
 * Welcome Animation Component
 * 
 * Beautiful animated welcome screen shown to first-time users
 */

import { useState, useEffect } from 'react';
import styles from './WelcomeAnimation.module.css';

interface WelcomeAnimationProps {
  onComplete: () => void;
  userName?: string | null;
}

export default function WelcomeAnimation({ onComplete, userName }: WelcomeAnimationProps) {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Step 1: Ghost appears (0-1.5s)
    const step1Timer = setTimeout(() => setStep(1), 100);
    
    // Step 2: Welcome text (1.5-3s)
    const step2Timer = setTimeout(() => setStep(2), 1500);
    
    // Step 3: Feature highlights (3-5.5s)
    const step3Timer = setTimeout(() => setStep(3), 3000);
    
    // Step 4: Fade out and complete (5.5-6s)
    const fadeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 5500);
    
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 6000);

    return () => {
      clearTimeout(step1Timer);
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`${styles.overlay} ${!isVisible ? styles.fadeOut : ''}`}>
      <div className={styles.content}>
        {/* Step 1: Ghost Animation */}
        <div className={`${styles.ghostContainer} ${step >= 1 ? styles.visible : ''}`}>
          <div className={styles.ghost}>👻</div>
        </div>

        {/* Step 2: Welcome Text */}
        {step >= 2 && (
          <div className={styles.welcomeText}>
            <h1 className={styles.title}>
              Welcome to Ghost<span className={styles.accent}>Mate</span>!
            </h1>
            {userName && (
              <p className={styles.subtitle}>
                Get ready for anonymous conversations
              </p>
            )}
          </div>
        )}

        {/* Step 3: Feature Highlights */}
        {step >= 3 && (
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🎭</span>
              <span className={styles.featureText}>Get your daily ID</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>💬</span>
              <span className={styles.featureText}>Chat anonymously</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🌙</span>
              <span className={styles.featureText}>Reset at midnight</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

