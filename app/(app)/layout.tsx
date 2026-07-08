'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Spinner } from '@/components/ui';
import {
  IconBouquet,
  IconCatalog,
  IconDashboard,
  IconExpenses,
  IconLogout,
} from '@/components/icons';

const NAV = [
  { href: '/dashboard', label: 'Дашборд', icon: IconDashboard },
  { href: '/catalog', label: 'Каталог', icon: IconCatalog },
  { href: '/bouquets', label: 'Букети', icon: IconBouquet },
  { href: '/expenses', label: 'Витрати', icon: IconExpenses },
];

function Wordmark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-bloom text-white shadow-soft">
        <IconBouquet width={20} height={20} />
      </span>
      <span className="leading-none">
        <span className="block font-display text-xl font-semibold tracking-tight text-ink">MONO</span>
        <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint">Студія</span>
      </span>
    </Link>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace('/login');
  }, [ready, user, router]);

  if (!ready || !user) return <Spinner label="Готуємо студію…" />;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface/60 px-4 py-6 backdrop-blur lg:flex">
        <div className="px-2">
          <Wordmark />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                  active ? 'bg-bloom-tint text-bloom-ink' : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-bloom" />}
                <Icon width={20} height={20} className={active ? 'text-bloom' : 'text-ink-faint group-hover:text-ink-soft'} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 border-t border-line pt-4">
          <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-sunk text-sm font-semibold text-ink-soft">
              {(user.displayName || user.email)[0]?.toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink">{user.displayName || 'Власниця'}</div>
              <div className="truncate text-xs text-ink-faint">{user.email}</div>
            </div>
            <button
              onClick={logout}
              aria-label="Вийти"
              title="Вийти"
              className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-faint transition-colors hover:bg-clay-tint hover:text-clay-ink"
            >
              <IconLogout width={18} height={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar (brand + logout) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/85 px-4 py-3 backdrop-blur lg:hidden">
        <Wordmark />
        <button
          onClick={logout}
          aria-label="Вийти"
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-ink-faint transition-colors hover:bg-clay-tint hover:text-clay-ink"
        >
          <IconLogout width={20} height={20} />
        </button>
      </header>

      {/* Content */}
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-10 lg:pt-10">{children}</div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Навігація"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-16px_rgba(60,40,34,0.28)] backdrop-blur lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
          {NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className="flex flex-1 flex-col items-center gap-1 py-2"
              >
                <span
                  className={`grid h-8 w-16 place-items-center rounded-full transition-colors duration-150 ${
                    active ? 'bg-bloom-tint text-bloom' : 'text-ink-faint'
                  }`}
                >
                  <Icon width={22} height={22} />
                </span>
                <span className={`text-[11px] font-medium ${active ? 'text-bloom-ink' : 'text-ink-faint'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
