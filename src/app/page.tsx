"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useLanguage } from '@/components/language-provider';

export default function RootPage() {
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const redirectUser = async () => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    };

    redirectUser();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="card rounded-2xl px-6 py-5 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--brand)]" />
        <p className="mt-3 text-sm text-[var(--ink-600)]">{t('root_redirect')}</p>
      </div>
    </div>
  );
}
