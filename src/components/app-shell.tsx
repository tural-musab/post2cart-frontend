"use client";

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useLanguage } from './language-provider';
import { LanguageToggle } from './language-toggle';

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-[var(--brand)] text-white shadow'
          : 'text-[var(--ink-700)] hover:bg-white hover:text-[var(--ink-900)]'
      }`}
    >
      {label}
    </Link>
  );
}

export function AppShell({
  title,
  subtitle,
  children,
  rightSlot,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  const { t } = useLanguage();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <div className="app-shell min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="card rounded-3xl p-5 md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-[var(--line)] bg-white px-3 py-2">
                <Image
                  src="/brand/logo-p2c.jpg"
                  width={512}
                  height={279}
                  alt="Post2Cart"
                  className="h-12 w-auto rounded-lg object-contain"
                />
              </div>
              <div>
                <p className="text-sm text-[var(--ink-500)]">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              {rightSlot}
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink-700)] hover:text-[var(--ink-900)]"
              >
                <LogOut className="h-4 w-4" />
                {t('auth_signout')}
              </button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <NavLink href="/dashboard" label={t('nav_dashboard')} />
            <NavLink href="/onboarding" label={t('nav_onboarding')} />
            <NavLink href="/automation-ops" label={t('nav_automation_ops')} />
            <NavLink href="/settings" label={t('nav_settings')} />
          </div>
          <div className="mt-5">
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">{title}</h1>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
