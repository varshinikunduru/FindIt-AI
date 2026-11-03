import { useState, type FormEvent } from 'react';
import { ArrowRight, Loader2, PackageSearch } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { errorTextClass, inputClass, labelClass, primaryButtonClass } from '@/lib/styles';

type Mode = 'signIn' | 'signUp';

const HERO_IMAGE_URL =
  'https://images.pexels.com/photos/7963845/pexels-photo-7963845.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signIn');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === 'signUp';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (isSignUp && displayName.trim().length < 2) {
      setError('Please enter your name (at least 2 characters).');
      return;
    }

    setSubmitting(true);
    const result = isSignUp
      ? await signUp(displayName.trim(), email.trim(), password)
      : await signIn(email.trim(), password);
    setSubmitting(false);

    if (result) setError(result);
  };

  const switchMode = () => {
    setError(null);
    setMode(isSignUp ? 'signIn' : 'signUp');
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src={HERO_IMAGE_URL}
          alt="A person searching through a bag for a lost item"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-stone-950/10" />
        <div className="absolute bottom-0 left-0 right-0 p-12">
          <p className="max-w-md text-3xl font-bold leading-tight text-white">
            Lost something? Someone may have found it.
          </p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-stone-200">
            Report what you lost or found, search the community board, and verify ownership before anything changes hands.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md animate-fade-up">
          <a href="#/" className="mb-10 inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white dark:bg-teal-400 dark:text-stone-950">
              <PackageSearch className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-tight">FindIt AI</span>
          </a>

          <h1 className="text-3xl font-bold tracking-tight">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            {isSignUp
              ? 'Join the community to report items and submit claims.'
              : 'Sign in to browse, report, and manage your claims.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {isSignUp && (
              <div>
                <label htmlFor="display-name" className={labelClass}>Full name</label>
                <input
                  id="display-name"
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputClass}
                  placeholder="Jordan Lee"
                  maxLength={60}
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <input
                id="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
                minLength={6}
                required
              />
            </div>

            {error && (
              <p role="alert" className={`${errorTextClass} animate-scale-in`}>
                {error}
              </p>
            )}

            <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-full py-3`}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create account' : 'Sign in'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-stone-600 dark:text-stone-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              type="button"
              onClick={switchMode}
              className="font-medium text-teal-700 underline-offset-4 transition hover:underline dark:text-teal-400"
            >
              {isSignUp ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
