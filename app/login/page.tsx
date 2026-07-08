'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button, Field, Input, Alert } from '@/components/ui';
import { IconBouquet, IconSparkle } from '@/components/icons';

export default function LoginPage() {
  const { login, user, ready } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('owner@mono.local');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace('/dashboard');
  }, [ready, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка входу');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-bloom lg:block">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(900px 500px at 20% 10%, rgba(255,255,255,0.16), transparent 55%), radial-gradient(700px 600px at 90% 90%, rgba(169,118,31,0.35), transparent 55%)',
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <IconBouquet width={24} height={24} />
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight">MONO</span>
          </div>
          <div className="max-w-md">
            <h1 className="font-display text-4xl font-semibold leading-tight text-white">
              Кожен букет — на видноті.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-white/80">
              Брудний і чистий дохід, навар по кожній квітці, борги й витрати — рахуються самі,
              щойно ви складаєте букет.
            </p>
            <div className="mt-8 flex items-center gap-2 text-sm text-white/70">
              <IconSparkle width={18} height={18} />
              Студія квіткової майстерні · Самбір
            </div>
          </div>
          <div className="text-xs text-white/50">© {new Date().getFullYear()} MONO · облік доходів</div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-bloom text-white shadow-soft">
                <IconBouquet width={22} height={22} />
              </span>
              <span className="font-display text-2xl font-semibold text-ink">MONO</span>
            </div>
          </div>

          <h2 className="font-display text-2xl font-semibold text-ink">Вітаємо у студії</h2>
          <p className="mt-1.5 text-sm text-ink-soft">Увійдіть, щоб продовжити облік доходів.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Email">
              <Input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Пароль">
              <div className="relative">
                <Input
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-16"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-xs font-medium text-ink-faint hover:text-bloom-ink"
                >
                  {show ? 'Сховати' : 'Показати'}
                </button>
              </div>
            </Field>

            {error && <Alert>{error}</Alert>}

            <Button type="submit" disabled={loading} className="w-full" size="md">
              {loading ? 'Вхід…' : 'Увійти'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
