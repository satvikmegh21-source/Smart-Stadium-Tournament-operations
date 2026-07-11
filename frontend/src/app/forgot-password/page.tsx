'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import api from '../../services/api';
import { Trophy, Mail, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [debugToken, setDebugToken] = useState<string | null>(null);

  // Reset fields
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccess(true);
      if (res.data?.data?.debug?.resetToken) {
        setDebugToken(res.data.data.debug.resetToken);
        setToken(res.data.data.debug.resetToken); // autofill token for dev convenience
      }
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Request failed. Please check the email.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPassword) return;
    setError(null);
    setResetLoading(true);

    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setResetSuccess(true);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Password reset failed. Token may be invalid/expired.';
      setError(errorMsg);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <Link href="/" className="flex items-center justify-center gap-3 group">
          <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">ARENA</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Or{' '}
          <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            return to Sign In
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="glass-dark border border-white/5 py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!success && !resetSuccess ? (
            /* Forgot Password Request Form */
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  Email address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Send Reset Instructions
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : !resetSuccess ? (
            /* Reset Password Form */
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>Instructions sent. Please verify the reset token below.</span>
              </div>

              {debugToken && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono break-all">
                  🔧 Debug Reset Token: <strong>{debugToken}</strong>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleResetPassword}>
                <div>
                  <label htmlFor="token" className="block text-sm font-medium text-slate-300">
                    Reset Token
                  </label>
                  <input
                    id="token"
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="block w-full px-3 py-3 border border-white/10 rounded-xl bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm font-mono"
                    placeholder="Enter reset token"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-slate-300">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full px-3 py-3 border border-white/10 rounded-xl bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                    placeholder="Min 8 characters"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all items-center gap-2"
                >
                  {resetLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Update Password
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Reset Success View */
            <div className="text-center space-y-6">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex flex-col items-center gap-2">
                <CheckCircle2 className="h-8 w-8" />
                <span className="font-bold">Password Reset Successful!</span>
                <span className="text-xs text-slate-400 mt-1">You can now sign in with your new password.</span>
              </div>
              <Link
                href="/login"
                className="w-full block text-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
