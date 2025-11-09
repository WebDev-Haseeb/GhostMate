import type { Metadata } from "next";
import ChatContainer from '@/components/ChatContainer';
import { formatDailyId } from '@/lib/dailyId';

function getDisplayId(rawId: string): { displayId: string; shareableId: string } {
  const decoded = decodeURIComponent(rawId || '').trim();
  const numericOnly = decoded.replace(/\D/g, '').slice(0, 8);

  if (numericOnly.length === 8) {
    return {
      displayId: formatDailyId(numericOnly),
      shareableId: numericOnly,
    };
  }

  const sanitized = decoded.replace(/[^\w-]/g, '').slice(0, 32);
  const fallback = sanitized || 'GhostMate User';
  return {
    displayId: fallback,
    shareableId: fallback,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ otherDailyId: string }>;
}): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ghostmate.online';
  const { otherDailyId } = await params;
  const { displayId, shareableId } = getDisplayId(otherDailyId);

  const title = `Chat with ${displayId}`;
  const description =
    'Open a secure, anonymous conversation on GhostMate. Daily IDs reset every night for complete privacy.';
  const url = `${baseUrl}/chat/${encodeURIComponent(shareableId)}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'GhostMate',
      url,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    other: {
      'twitter:url': url,
    },
  };
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ otherDailyId: string }>;
}) {
  const { otherDailyId } = await params;
  const { shareableId } = getDisplayId(otherDailyId);

  return <ChatContainer otherDailyId={shareableId} />;
}
