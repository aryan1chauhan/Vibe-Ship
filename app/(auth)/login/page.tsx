'use client';

import { createClient } from '@/lib/supabase/client';
import { Zap, ArrowRight, Brain, Calendar, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--background)' }}
    >
      {}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(800px circle at 50% 30%, rgba(124, 58, 237, 0.08), transparent 50%)',
        }}
      />

      <div className="w-full max-w-md relative animate-fade-in">
        {}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: 'var(--gradient-primary)',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome to <span className="gradient-text">CrunchAI</span>
          </h1>
          <p style={{ color: 'var(--foreground-muted)' }}>
            Your AI agent that manages your time
          </p>
        </div>

        {}
        <div className="glass p-8">
          {}
          <div className="space-y-3 mb-8">
            {[
              { icon: Brain, text: 'AI breaks tasks into sprint plans' },
              { icon: Calendar, text: 'Auto-schedules your work sessions' },
              { icon: RefreshCw, text: 'Replans when you miss a session' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--primary-glow)' }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: 'var(--primary-light)' }}
                  />
                </div>
                <span
                  className="text-sm"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>

          {}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer"
            style={{
              background: 'white',
              color: '#1f1f1f',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f0f0';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <p
            className="text-xs text-center mt-4"
            style={{ color: 'var(--foreground-subtle)' }}
          >
            Free to use · No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}
