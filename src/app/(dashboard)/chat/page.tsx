import { redirect } from 'next/navigation';
import { randomUUID } from 'crypto';

export default function ChatIndexPage() {
  redirect(`/chat/${randomUUID()}`);
}
