import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, ArrowLeft, Triangle } from 'lucide-react';

export default function Auth() {
  const [view, setView] = useState<'sign_in' | 'sign_up' | 'forgot_password'>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!email || (view !== 'forgot_password' && !password)) {
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
        setMessage('Registration successful! Please check your email to verify.');
      } else if (view === 'forgot_password') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (resetError) throw resetError;
        setMessage('OTP / Password reset link sent! Please check your email.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-[1200px] h-[800px] bg-white rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.06)] flex overflow-hidden border border-slate-100">
        
        {/* Left Side: Auth Form */}
        <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-16 relative">
          <button className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors w-fit group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to home
          </button>

          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
            <div className="mb-8 hidden lg:block">
              {/* Logo graphic mimicking the image */}
              <div className="flex gap-1 items-end w-8 h-8 mb-4">
                <div className="w-4 h-4 bg-slate-900 transform -rotate-45"></div>
                <div className="w-4 h-4 bg-slate-400 rounded-full"></div>
              </div>
            </div>

            <h1 className="text-[32px] font-bold text-slate-900 tracking-tight leading-tight mb-2">
              {view === 'sign_in' ? 'Sign in to your account' : 
               view === 'sign_up' ? 'Create an account' : 'Reset password'}
            </h1>
            <p className="text-sm font-medium text-slate-500 mb-8">
              {view === 'sign_in' ? 'Please continue to sign in to your business account' : 
               view === 'sign_up' ? 'Enter your details to register a new account' :
               'Enter your email to receive a password reset OTP/link'}
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
              {error && <div className="text-xs font-semibold text-red-500 bg-red-50 p-3 rounded-lg">{error}</div>}
              {message && <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 p-3 rounded-lg">{message}</div>}

              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  required
                />
              </div>

              {view !== 'forgot_password' && (
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                    required
                  />
                </div>
              )}

              {view === 'sign_in' && (
                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={() => setView('forgot_password')}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#18181b] hover:bg-black text-white rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 disabled:opacity-70 mt-4"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {view === 'forgot_password' ? 'Send Reset Instructions' : 'Continue'}
              </button>
            </form>

            <div className="relative flex items-center py-6">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink-0 mx-4 text-[10px] font-bold tracking-widest text-slate-300 uppercase">Or</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <div className="space-y-3">
              <button 
                type="button" 
                className="w-full py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2"
              >
                {/* SVG Google Logo */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <button 
                type="button" 
                className="w-full py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2"
              >
                {/* SVG Discord Logo */}
                <svg className="w-5 h-5" fill="#5865F2" viewBox="0 0 127.14 96.36">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77.7,77.7,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                </svg>
                Continue with Discord
              </button>
            </div>
            
            <div className="mt-8 text-center space-x-4">
               {view !== 'sign_in' && (
                 <button 
                    type="button"
                    onClick={() => setView('sign_in')}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Back to Sign in
                  </button>
               )}
               {view !== 'sign_up' && (
                 <button 
                    type="button"
                    onClick={() => setView('sign_up')}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Create an account
                  </button>
               )}
            </div>
          </div>
          
        </div>

        {/* Right Side: Decorative Graphic Art */}
        <div className="hidden lg:block w-1/2 p-4">
          <div className="w-full h-full rounded-[20px] bg-[#111111] overflow-hidden relative">
            {/* The Black & White Geometric Grid Pattern */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-80 backdrop-grayscale mix-blend-screen">
              {Array.from({ length: 36 }).map((_, i) => {
                // Generate varied geometric shapes to match the image abstraction
                const shapeType = i % 7;
                return (
                  <div key={i} className="border-[0.5px] border-white/5 flex items-center justify-center relative overflow-hidden bg-white/5 max-h-32">
                    {shapeType === 0 && <div className="w-1/2 h-1/2 rounded-full bg-white/20"></div>}
                    {shapeType === 1 && <div className="w-3/4 h-3/4 bg-white/10 transform rotate-45"></div>}
                    {shapeType === 2 && <Triangle size={40} className="text-white/30 fill-white/10" />}
                    {shapeType === 3 && (
                      <div className="grid grid-cols-2 gap-1">
                        <div className="w-3 h-3 rounded-full bg-white/40"></div>
                        <div className="w-3 h-3 rounded-full bg-white/40"></div>
                        <div className="w-3 h-3 rounded-full bg-white/40"></div>
                        <div className="w-3 h-3 rounded-full bg-white/40"></div>
                      </div>
                    )}
                    {shapeType === 4 && <div className="w-full h-1/2 bg-white/10 absolute bottom-0"></div>}
                    {shapeType === 5 && <div className="w-1/2 h-full bg-white/10 absolute left-0"></div>}
                    {shapeType === 6 && <div className="w-2/3 h-2/3 rounded-tl-[100%] bg-white/20 absolute bottom-0 right-0"></div>}
                  </div>
                );
              })}
            </div>
            {/* Dark overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent"></div>
          </div>
        </div>

      </div>
    </div>
  );
}
