import 'server-only';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session?.userId) redirect('/login');
  return session.userId;
}
