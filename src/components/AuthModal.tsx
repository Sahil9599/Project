import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Shield, Mail, Key, UserPlus, LogIn, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'signin',
}) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsDemo } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      if (msg.includes('auth/invalid-credential')) {
        setError('Invalid credentials. Check your email or create a new account.');
      } else if (msg.includes('auth/email-already-in-use')) {
        setError('This email is already registered. Try signing in instead.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInAsDemo();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-200 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-white mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-neutral-100">
            {mode === 'signin' ? 'Sign in to DocuMorph' : 'Create personal account'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Access secure cloud storage and track your conversion history with personal User ID privacy.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Google Sign-in */}
        <button
          type="button"
          onClick={handleGoogleSubmit}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-xl text-xs font-semibold border border-neutral-700/60 transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-neutral-400">
            <span className="bg-neutral-900 px-3">or credentials</span>
          </div>
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-neutral-100 hover:bg-white text-neutral-950 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {mode === 'signin' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleDemoSubmit}
            disabled={loading}
            className="w-full py-2 px-3 text-xs text-neutral-300 hover:text-white bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800/80 rounded-lg transition-colors flex items-center justify-between"
          >
            <span>Launch Quick Private Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center justify-between text-xs text-neutral-400 mt-2">
            <span>
              {mode === 'signin'
                ? "Don't have an account?"
                : 'Already have an account?'}
            </span>
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="text-neutral-200 hover:underline font-medium"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="mt-4 p-2.5 rounded-lg bg-neutral-950/40 border border-neutral-800/60 flex items-start gap-2 text-[11px] text-neutral-400">
          <Shield className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
          <span>
            Strict User Isolation: Every converted file is partitioned under your unique User ID so your data remains strictly private.
          </span>
        </div>
      </div>
    </div>
  );
};
