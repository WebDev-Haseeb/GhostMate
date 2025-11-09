/**
 * Admin Maintenance Utilities
 *
 * Consolidated helpers for destructive maintenance operations that should
 * only be triggered from the true admin panel.
 */

import { ref, get, set, update } from 'firebase/database';
import {
  collection,
  collectionGroup,
  getDocs,
  deleteDoc,
  doc,
  FirestoreError,
  DocumentReference
} from 'firebase/firestore';
import { database, db } from './firebase';
import { getTodayMidnight } from './dailyId';

export interface DeleteChatsResult {
  deletedChats: number;
  deletedMessages: number;
}

export interface DeleteAllDataResult {
  deletedChats: DeleteChatsResult;
  collections: Array<{ collection: string; deleted: number; error?: string }>;
  highlightUsers: number;
  highlightMessages: number;
  highlightError?: string;
}

async function deleteCollectionDocs(
  collectionPath: string
): Promise<{ deleted: number; error?: string }> {
  try {
    const snapshot = await getDocs(collection(db, collectionPath));

    if (snapshot.empty) {
      return { deleted: 0 };
    }

    await Promise.all(snapshot.docs.map((docSnapshot) => deleteDoc(docSnapshot.ref)));
    return { deleted: snapshot.size };
  } catch (error: any) {
    const firestoreError = error as FirestoreError;
    return {
      deleted: 0,
      error:
        firestoreError.code === 'permission-denied'
          ? 'permission-denied'
          : firestoreError.message || 'unknown-error'
    };
  }
}

async function deleteAllHighlights(): Promise<{
  users: number;
  messages: number;
  error?: string;
}> {
  try {
    const messagesSnapshot = await getDocs(collectionGroup(db, 'messages'));

    const highlightMessageDocs = messagesSnapshot.docs.filter((messageDoc) => {
      const parentDoc = messageDoc.ref.parent.parent;
      return parentDoc?.parent?.id === 'highlights';
    });

    const parentDocs = new Set<DocumentReference>();

    await Promise.all(
      highlightMessageDocs.map(async (messageDoc) => {
        const parentDoc = messageDoc.ref.parent.parent;
        if (parentDoc) {
          parentDocs.add(parentDoc);
        }
        await deleteDoc(messageDoc.ref);
      })
    );

    await Promise.all(Array.from(parentDocs).map((parentDoc) => deleteDoc(parentDoc)));

    return { users: parentDocs.size, messages: highlightMessageDocs.length };
  } catch (error: any) {
    const firestoreError = error as FirestoreError;
    return {
      users: 0,
      messages: 0,
      error:
        firestoreError.code === 'permission-denied'
          ? 'permission-denied'
          : firestoreError.message || 'unknown-error'
    };
  }
}

export async function deleteAllChats(): Promise<DeleteChatsResult> {
  const chatsRef = ref(database, 'chats');
  const snapshot = await get(chatsRef);

  let deletedChats = 0;
  let deletedMessages = 0;

  if (snapshot.exists()) {
    const chatsData = snapshot.val() as Record<string, any>;
    deletedChats = Object.keys(chatsData).length;

    Object.values(chatsData).forEach((chat: any) => {
      if (chat && typeof chat === 'object' && chat.messages) {
        deletedMessages += Object.keys(chat.messages).length;
      }
    });
  }

  await Promise.all([
    set(chatsRef, null),
    set(ref(database, 'userUnread'), null)
  ]);

  return { deletedChats, deletedMessages };
}

export async function deleteExpiredChats(): Promise<DeleteChatsResult> {
  const chatsRef = ref(database, 'chats');
  const snapshot = await get(chatsRef);

  if (!snapshot.exists()) {
    return { deletedChats: 0, deletedMessages: 0 };
  }

  const chatsData = snapshot.val() as Record<string, any>;
  const midnight = getTodayMidnight().getTime();

  const updates: Record<string, any> = {};
  let deletedChats = 0;
  let deletedMessages = 0;

  Object.entries(chatsData).forEach(([chatId, chatValue]) => {
    const chat = chatValue as any;
    const messages = chat?.messages || {};
    const messageEntries = Object.entries(messages) as Array<[string, any]>;

    if (messageEntries.length === 0) {
      updates[`chats/${chatId}`] = null;
      deletedChats += 1;
      return;
    }

    const freshMessages = messageEntries.filter(([, message]) => message?.timestamp >= midnight);

    if (freshMessages.length === 0) {
      updates[`chats/${chatId}`] = null;
      deletedChats += 1;
      deletedMessages += messageEntries.length;
      return;
    }

    messageEntries.forEach(([messageId, message]) => {
      if (message?.timestamp < midnight) {
        updates[`chats/${chatId}/messages/${messageId}`] = null;
        deletedMessages += 1;
      }
    });

    const latestMessage = freshMessages
      .map(([, message]) => message)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
      .pop();

    if (latestMessage) {
      updates[`chats/${chatId}/lastMessage`] = (latestMessage.text || '').slice(0, 100);
      updates[`chats/${chatId}/lastMessageTimestamp`] = latestMessage.timestamp || Date.now();
      updates[`chats/${chatId}/updatedAt`] = Date.now();
    }
  });

  if (Object.keys(updates).length > 0) {
    await update(ref(database), updates);
  }

  return { deletedChats, deletedMessages };
}

export async function deleteAllAppData(): Promise<DeleteAllDataResult> {
  const deletedChats = await deleteAllChats();

  const collectionsToDelete = [
    'users',
    'dailyIds',
    'userFavorites',
    'connections',
    'dailyConnectionChecks',
    'presence',
    'queuedStories',
    'approvedStories'
  ];

  const collections: Array<{ collection: string; deleted: number; error?: string }> = [];

  for (const collectionName of collectionsToDelete) {
    const { deleted, error } = await deleteCollectionDocs(collectionName);
    collections.push({ collection: collectionName, deleted, error });
  }

  const { users: highlightUsers, messages: highlightMessages, error: highlightError } =
    await deleteAllHighlights();

  return {
    deletedChats,
    collections,
    highlightUsers,
    highlightMessages,
    highlightError
  };
}


