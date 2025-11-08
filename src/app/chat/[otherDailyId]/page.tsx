import ChatContainer from '@/components/ChatContainer';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ otherDailyId: string }>;
}) {
  const { otherDailyId } = await params;

  return <ChatContainer otherDailyId={decodeURIComponent(otherDailyId)} />;
}
