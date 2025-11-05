'use client';

import { useEffect, useState } from 'react';
import styles from './PrivacyNoticeModal.module.css';

interface PrivacyNoticeModalProps {
  onAccept: () => void;
}

export default function PrivacyNoticeModal({ onAccept }: PrivacyNoticeModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has already accepted
    const hasAccepted = localStorage.getItem('privacy-accepted');
    if (!hasAccepted) {
      setShow(true);
    } else {
      // If already accepted, immediately call onAccept
      onAccept();
    }
  }, [onAccept]);

  const handleAccept = () => {
    localStorage.setItem('privacy-accepted', 'true');
    setShow(false);
    onAccept();
  };

  if (!show) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Privacy & Data Protection</h2>
          <p className={styles.subtitle}>Your privacy is our priority</p>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h3>🔒 What We Store</h3>
            <p>
              Your Google account is <strong>only used for verification</strong>. We store:
            </p>
            <ul>
              <li>Your unique Firebase UID (anonymous identifier)</li>
              <li>Your daily 8-digit anonymous ID</li>
              <li>Your connection tokens and streaks</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h3>🚫 What We Never Store</h3>
            <ul>
              <li>Your Google email address</li>
              <li>Your Google profile name</li>
              <li>Your Google profile photo</li>
              <li>Any personal identifying information</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h3>⏰ Ephemeral by Design</h3>
            <ul>
              <li>All chat messages are deleted at midnight</li>
              <li>Your daily ID resets every 24 hours</li>
              <li>Only connection streaks persist</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h3>🎯 Age Requirement</h3>
            <p>
              You must be <strong>at least 13 years old</strong> to use GhostMate.
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={handleAccept} className={styles.acceptButton}>
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
}

