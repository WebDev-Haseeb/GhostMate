'use client';

/**
 * Onboarding Guide Component
 * 
 * Centered informational guide for new users
 */

import { useState } from 'react';
import styles from './OnboardingTour.module.css';

interface OnboardingStep {
  icon: string;
  title: string;
  description: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    icon: '🎭',
    title: 'Welcome to GhostMate!',
    description: 'Connect anonymously with others through daily IDs. Every conversation is fresh, and everything resets at midnight.'
  },
  {
    icon: '🎭',
    title: 'Your Daily ID',
    description: 'Every day at midnight, you get a unique 8-digit ID. Share it with anyone to start a conversation. Your identity stays completely anonymous.'
  },
  {
    icon: '💬',
    title: 'Start Chatting',
    description: 'Enter someone\'s Daily ID to chat with them, or use Random Connect to meet someone new instantly. You can start up to 5 conversations daily.'
  },
  {
    icon: '⭐',
    title: 'Build Connections',
    description: 'Favorite someone you enjoyed chatting with. If they favorite you back, you create a mutual connection with a streak counter!'
  },
  {
    icon: '🌙',
    title: 'Daily Reset',
    description: 'At midnight, all messages vanish and IDs change. Only your connection streaks persist. Re-favorite daily to keep the streak alive!'
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <>
      {/* Dark Overlay */}
      <div className={styles.overlay} />

      {/* Centered Modal */}
      <div className={styles.modal}>
        {/* Icon */}
        <div className={styles.iconContainer}>
          <span className={styles.icon}>{step.icon}</span>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <h2 className={styles.title}>{step.title}</h2>
          <p className={styles.description}>{step.description}</p>
        </div>

        {/* Progress Dots */}
        <div className={styles.dotsContainer}>
          {ONBOARDING_STEPS.map((_, index) => (
            <div
              key={index}
              className={`${styles.dot} ${index === currentStep ? styles.dotActive : ''} ${index < currentStep ? styles.dotCompleted : ''}`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <button onClick={handleSkip} className={styles.skipButton}>
            Skip
          </button>

          <button onClick={handleNext} className={styles.nextButton}>
            {isLastStep ? 'Get Started!' : 'Next'}
          </button>
        </div>
      </div>
    </>
  );
}
