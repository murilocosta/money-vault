import { LoginForm } from '@/components/auth/login-form';

interface Props {
  searchParams: Promise<{ registered?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { registered } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-sm">
        <LoginForm registered={registered === '1'} />
      </div>
    </main>
  );
}
