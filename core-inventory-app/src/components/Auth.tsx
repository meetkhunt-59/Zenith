import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ArrowRightLeft, Boxes, Loader2, ShieldCheck } from 'lucide-react';

type AuthView = 'sign_in' | 'sign_up' | 'forgot_password' | 'reset_password';

const viewCopy: Record<AuthView, { title: string; copy: string; action: string }> = {
  sign_in: {
    title: 'Sign in to Zenith',
    copy: 'Access your real-time inventory dashboard, stock operations, and warehouse controls.',
    action: 'Continue to dashboard',
  },
  sign_up: {
    title: 'Create your workspace',
    copy: 'Start a fresh Zenith account for product setup, warehouse flows, and stock visibility.',
    action: 'Create account',
  },
  forgot_password: {
    title: 'Request reset code',
    copy: 'Enter your email and we will send the recovery code needed for the OTP-based password reset flow.',
    action: 'Send reset code',
  },
  reset_password: {
    title: 'Verify code and update password',
    copy: 'Enter the 6-digit code from your email, then choose a new password to return to the dashboard.',
    action: 'Set new password',
  },
};

export default function Auth() {
  const [view, setView] = useState<AuthView>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const copy = viewCopy[view];

  const resetFeedback = () => {
    setError(null);
    setMessage(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetFeedback();

    if (!email || ((view === 'sign_in' || view === 'sign_up') && !password)) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      if (view === 'sign_in') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else if (view === 'sign_up') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setMessage('Registration successful. Please check your email to verify the account.');
      } else if (view === 'forgot_password') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        setMessage('Password reset code sent. Check your email for the 6-digit recovery code.');
        setView('reset_password');
      } else if (view === 'reset_password') {
        if (!otp || otp.trim().length < 6) {
          throw new Error('Enter the 6-digit code from your email.');
        }
        if (!newPassword || newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters.');
        }
        if (newPassword !== confirmNewPassword) {
          throw new Error('New passwords do not match.');
        }

        const { error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: otp.trim(),
          type: 'recovery',
        });
        if (verifyError) throw verifyError;

        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
        if (updateError) throw updateError;

        setMessage('Password updated. You can now sign in with the new password.');
        setOtp('');
        setPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setView('sign_in');
      }
    } catch (err: unknown) {
      const nextMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'message' in err && typeof (err as { message: unknown }).message === 'string'
            ? (err as { message: string }).message
            : 'An error occurred during authentication.';
      setError(nextMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-stage flex items-center justify-center">
      <div className="app-panel relative z-10 grid w-full max-w-[1320px] overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden min-h-[840px] flex-col justify-between bg-[linear-gradient(160deg,#112027_0%,#153742_54%,#1b5866_100%)] px-10 py-10 text-white lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <img src="/icon.svg" alt="Zenith" className="h-11 w-11 rounded-2xl border border-white/10 bg-white/95 p-2" />
              <div>
                <div className="text-lg font-extrabold tracking-tight">Zenith</div>
                <div className="text-sm font-medium text-white/65">Modern inventory management system</div>
              </div>
            </div>

            <div className="mt-16 max-w-xl">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-white/50">
                Real-time stock operations
              </div>
              <h1 className="mt-4 text-5xl font-extrabold leading-[1.05] tracking-tight">
                Calm, premium control for every warehouse movement.
              </h1>
              <p className="mt-6 text-base font-medium leading-7 text-white/72">
                Zenith replaces scattered sheets and manual registers with one polished operational hub for receipts, delivery orders, transfers, and stock adjustments.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[22px] bg-white/8 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-emerald-200">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="mt-4 text-sm font-bold">Secure auth</div>
                  <div className="mt-1 text-sm font-medium text-white/60">Sign up, sign in, OTP reset</div>
                </div>
                <div className="rounded-[22px] bg-white/8 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sky-200">
                    <ArrowRightLeft size={18} />
                  </div>
                  <div className="mt-4 text-sm font-bold">Stock flows</div>
                  <div className="mt-1 text-sm font-medium text-white/60">Receipts, deliveries, transfers</div>
                </div>
                <div className="rounded-[22px] bg-white/8 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-amber-200">
                    <Boxes size={18} />
                  </div>
                  <div className="mt-4 text-sm font-bold">Cycle counts</div>
                  <div className="mt-1 text-sm font-medium text-white/60">Adjustments and ledger accuracy</div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.26em] text-emerald-200/80">
                Core workflow
              </div>
              <div className="mt-4 grid gap-3">
                {[
                  'Receive goods from suppliers and validate inbound stock',
                  'Pick, pack, and ship outgoing delivery orders',
                  'Move stock between warehouses, racks, and production',
                  'Record physical counts and update the stock ledger',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/6 px-4 py-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-300" />
                    <span className="text-sm font-medium text-white/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-[780px] items-center bg-white/72 px-4 py-6 sm:px-8 lg:px-10">
          <div className="mx-auto flex w-full max-w-[520px] flex-col gap-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  resetFeedback();
                  setView('sign_in');
                }}
                className="btn-ghost !px-0"
              >
                <ArrowLeft size={16} />
                {view === 'sign_in' ? 'Authentication' : 'Back to sign in'}
              </button>
              <div className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--color-brand-green)]">
                Email access only
              </div>
            </div>

            <div className="surface-card">
              <div className="section-label">Zenith access</div>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
                {copy.title}
              </h2>
              <p className="mt-3 max-w-lg text-sm font-medium leading-6 text-slate-500">
                {copy.copy}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetFeedback();
                    setView('sign_in');
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    view === 'sign_in'
                      ? 'bg-slate-950 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetFeedback();
                    setView('sign_up');
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    view === 'sign_up'
                      ? 'bg-slate-950 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  Create account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetFeedback();
                    setView('forgot_password');
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    view === 'forgot_password' || view === 'reset_password'
                      ? 'bg-emerald-50 text-[var(--color-brand-green)]'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  Reset password
                </button>
              </div>

              <form onSubmit={handleAuth} className="mt-8 space-y-5">
                {error && (
                  <div className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    {message}
                  </div>
                )}

                <div>
                  <label className="field-label">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@company.com"
                    className="field-input"
                    required
                  />
                </div>

                {(view === 'sign_in' || view === 'sign_up') && (
                  <div>
                    <label className="field-label">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="field-input"
                      required
                    />
                  </div>
                )}

                {view === 'reset_password' && (
                  <>
                    <div>
                      <label className="field-label">Recovery code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\s/g, ''))}
                        placeholder="6-digit code"
                        className="field-input font-mono-ui tracking-[0.28em]"
                        required
                      />
                    </div>
                    <div>
                      <label className="field-label">New password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Create a new password"
                        className="field-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="field-label">Confirm new password</label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirm the new password"
                        className="field-input"
                        required
                      />
                    </div>
                  </>
                )}

                {view === 'sign_in' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        resetFeedback();
                        setView('forgot_password');
                      }}
                      className="text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {copy.action}
                </button>
              </form>

              <div className="mt-6 rounded-[24px] border border-slate-200/80 bg-[#f7faf8] p-4">
                <div className="section-label">Authentication coverage</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[18px] bg-white px-4 py-3">
                    <div className="text-sm font-bold text-slate-900">Sign up</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">Create a new workspace</div>
                  </div>
                  <div className="rounded-[18px] bg-white px-4 py-3">
                    <div className="text-sm font-bold text-slate-900">Log in</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">Return to the dashboard</div>
                  </div>
                  <div className="rounded-[18px] bg-white px-4 py-3">
                    <div className="text-sm font-bold text-slate-900">OTP reset</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">Recover access securely</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center text-sm font-medium text-slate-500">
                {view === 'sign_in' ? (
                  <>
                    Need an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        resetFeedback();
                        setView('sign_up');
                      }}
                      className="font-bold text-slate-900"
                    >
                      Create one here
                    </button>
                  </>
                ) : (
                  <>
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        resetFeedback();
                        setView('sign_in');
                      }}
                      className="font-bold text-slate-900"
                    >
                      Sign in instead
                    </button>
                  </>
                )}
                {view === 'reset_password' && (
                  <>
                    {' '}
                    or{' '}
                    <button
                      type="button"
                      onClick={() => {
                        resetFeedback();
                        setView('forgot_password');
                      }}
                      className="font-bold text-[var(--color-brand-green)]"
                    >
                      resend the code
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
