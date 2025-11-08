/**
 * useHighlights Hook
 * 
 * Manages message highlight state and operations for a chat
 * - Tracks highlight status for all messages in the chat
 * - Provides toggle function for adding/removing highlights
 * - Real-time listeners for mutual highlight detection
 * - Handles queued story creation when mutual highlights occur
 */

import { useState, useEffect, useCallback } from 'react';
import {
  addHighlight,
  removeHighlight,
  listenToMessageHighlightStatus,
  getUserHighlight
} from '@/lib/highlightsService';
import { sendSystemMessage } from '@/lib/chatService';
import type {
  MessageHighlightStatus,
  CreateHighlightInput
} from '@/types/highlights';
import type { Message } from '@/types/chat';

interface UseHighlightsProps {
  userId: string | null;          // Firebase UID of current user
  otherUserId: string | null;     // Firebase UID of other user
  chatId: string | null;          // Chat ID
  myDailyId: string | null;       // Current user's daily ID
  otherDailyId: string | null;    // Other user's daily ID
  messages: Message[];            // All messages in the chat
}

interface UseHighlightsReturn {
  highlightStatuses: Map<string, MessageHighlightStatus>;
  toggleHighlight: (messageId: string, message: Message) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useHighlights({
  userId,
  otherUserId,
  chatId,
  myDailyId,
  otherDailyId,
  messages
}: UseHighlightsProps): UseHighlightsReturn {
  const [highlightStatuses, setHighlightStatuses] = useState<Map<string, MessageHighlightStatus>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set up real-time listeners for all messages
  useEffect(() => {
    if (!userId || !otherUserId || !chatId || messages.length === 0) {
      return;
    }

    const unsubscribers: (() => void)[] = [];

    // Listen to highlight status for each message
    messages.forEach((message) => {
      if (message.isSystemMessage) {
        return; // Don't highlight system messages
      }
      
      const unsubscribe = listenToMessageHighlightStatus(
        userId,
        otherUserId,
        message.id,
        chatId,
        (status) => {
          setHighlightStatuses((prev) => {
            const next = new Map(prev);
            next.set(message.id, status);
            return next;
          });
        }
      );

      unsubscribers.push(unsubscribe);
    });

    // Cleanup listeners
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [userId, otherUserId, chatId, messages]);

  // Toggle highlight for a message
  const toggleHighlight = useCallback(
    async (messageId: string, message: Message) => {
      if (!userId || !otherUserId || !chatId || !myDailyId || !otherDailyId) {
        setError('Missing required data for highlighting');
        return;
      }

      if (message.isSystemMessage) {
        setError('Cannot highlight system messages');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Check if already highlighted
        const existingHighlight = await getUserHighlight(userId, messageId);

        if (existingHighlight) {
          // Remove highlight
          const result = await removeHighlight(userId, messageId, chatId);
          
          if (!result.success) {
            setError(result.message || 'Failed to remove highlight');
          } else {
            await sendSystemMessage(
              chatId,
              `☆ ${myDailyId} removed a highlight`
            );
          }
        } else {
          // Add highlight
          const input: CreateHighlightInput = {
            userId,
            chatId,
            messageId,
            messageText: message.text,
            messageTimestamp: message.timestamp,
            otherUserId,
            otherUserDailyId: otherDailyId,
            senderDailyId: message.senderId,
            recipientDailyId: message.recipientId
          };

          const result = await addHighlight(input);

          if (!result.success) {
            setError(result.message || 'Failed to add highlight');
          } else {
            await sendSystemMessage(
              chatId,
              `⭐ ${myDailyId} highlighted a message`
            );
          }
          // Note: Mutual highlights are automatically queued for admin review
        }
      } catch (err: any) {
        console.error('Error toggling highlight:', err);
        setError(err.message || 'Failed to toggle highlight');
      } finally {
        setLoading(false);
      }
    },
    [userId, otherUserId, chatId, myDailyId, otherDailyId]
  );

  return {
    highlightStatuses,
    toggleHighlight,
    loading,
    error
  };
}

