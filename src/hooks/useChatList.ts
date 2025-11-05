/**
 * useChatList Hook - Manage list of all user's chats
 */

import { useState, useEffect } from 'react';
import { Chat, ChatListItem } from '@/types/chat';
import { getUserChats } from '@/lib/chatService';
import { getOtherParticipantId } from '@/lib/chatUtils';

interface UseChatListProps {
  dailyId: string | null;
}

interface UseChatListReturn {
  chats: ChatListItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing user's chat list
 */
export function useChatList({ dailyId }: UseChatListProps): UseChatListReturn {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChats = async () => {
    if (!dailyId) {
      setChats([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userChats = await getUserChats(dailyId);
      
      // Transform to ChatListItem format
      const chatListItems: ChatListItem[] = userChats.map((chat) => ({
        chatId: chat.chatId,
        otherUserDailyId: getOtherParticipantId(chat.chatId, dailyId),
        lastMessage: chat.lastMessage,
        lastMessageTimestamp: chat.lastMessageTimestamp,
        unreadCount: 0 // TODO: Implement unread count
      }));

      setChats(chatListItems);
    } catch (err) {
      console.error('Error loading chats:', err);
      setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  // Load chats on mount and when dailyId changes
  useEffect(() => {
    loadChats();
  }, [dailyId]);

  return {
    chats,
    loading,
    error,
    refresh: loadChats
  };
}

