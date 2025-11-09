/**
 * useChat Hook - Real-time chat state management
 */

import { useState, useEffect, useCallback } from 'react';
import { Message, Chat, NewMessage } from '@/types/chat';
import { 
  createOrGetChat, 
  sendMessage as sendMessageService, 
  listenToMessages,
  getChat,
  resetUnreadCount
} from '@/lib/chatService';

interface UseChatProps {
  myDailyId: string;
  otherDailyId: string;
}

interface UseChatReturn {
  chatId: string | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  sending: boolean;
}

/**
 * Hook for managing a one-to-one chat
 */
export function useChat({ myDailyId, otherDailyId }: UseChatProps): UseChatReturn {
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Initialize chat
  useEffect(() => {
    let isMounted = true;

    async function initChat() {
      try {
        setLoading(true);
        setError(null);
        
        const id = await createOrGetChat(myDailyId, otherDailyId);
        
        if (isMounted) {
          setChatId(id);
        }
      } catch (err) {
        console.error('Error initializing chat:', err);
        if (isMounted) {
          setError('Failed to initialize chat');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (myDailyId && otherDailyId) {
      initChat();
    }

    return () => {
      isMounted = false;
    };
  }, [myDailyId, otherDailyId]);

  // Listen to messages
  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = listenToMessages(chatId, (newMessages) => {
      setMessages(newMessages);
    });

    return () => {
      unsubscribe();
    };
  }, [chatId]);

  useEffect(() => {
    if (!chatId || !myDailyId) {
      return;
    }

    const markAsRead = () => {
      resetUnreadCount(chatId, myDailyId).catch((err) => {
        console.error('Failed to reset unread count:', err);
      });
    };

    markAsRead();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        markAsRead();
      }
    };

    window.addEventListener('focus', markAsRead);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', markAsRead);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [chatId, myDailyId]);

  // Send message
  const sendMessage = useCallback(async (text: string) => {
    if (!chatId || !myDailyId || !otherDailyId) {
      throw new Error('Chat not initialized');
    }

    try {
      setSending(true);
      setError(null);

      const newMessage: NewMessage = {
        text,
        recipientId: otherDailyId
      };

      await sendMessageService(chatId, myDailyId, newMessage);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      throw err;
    } finally {
      setSending(false);
    }
  }, [chatId, myDailyId, otherDailyId]);

  return {
    chatId,
    messages,
    loading,
    error,
    sendMessage,
    sending
  };
}

