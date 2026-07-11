'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Mail, Lock, User, ShieldCheck, AlertCircle, ArrowRight, Loader2, Key } from 'lucide-react';

export default function SignupPage() {
  const { register, verifyOtpToken } = useAuth();
  const router = useRouter();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SPECTATOR');
  
  // UX flows
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{ otp: string } | null>(null);

  // OTP Verification States
  const [otp, setOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = (await register(email, password, name, role)) as { data?: { debug?: { otp?: string } } };
      setSuccess(true);
      if (res.data?.debug?.otp) {
        setDebugInfo({ otp: res.data.debug.otp });
      }
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string })?.message || 'Registration failed. Please check the values.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setError(null);
    setVerifyingOtp(true);

    try {
      await verifyOtpToken(email, otp);
      // Wait a moment and redirect to login
      router.push('/login?verified=true');
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string })?.message || 'Verification failed. Please check the OTP.';
      setError(errorMsg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Roles array matching Enum
  const roles = [
    { value: 'SPECTATOR', label: 'Spectator / Fan' },
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'TOURNAMENT_ORGANIZER', label: 'Tournament Organizer' },
    { value: 'STADIUM_MANAGER', label: 'Stadium Manager' },
    { value: 'TEAM_MANAGER', label: 'Team Manager' },
    { value: 'COACH', label: 'Coach' },
    { value: 'PLAYER', label: 'Player' },
    { value: 'REFEREE', label: 'Referee' },
    { value: 'SECURITY_STAFF', label: 'Security Staff' },
    { value: 'MEDICAL_STAFF', label: 'Medical Staff' },
    { value: 'VENDOR', label: 'Food / Stall Vendor' },
    { value: 'SPONSOR', label: 'Sponsor' },
    { value: 'MEDIA', label: 'Media / Press' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[10%] w-[30%] h-[30%] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <Link href="/" className="flex items-center justify-center gap-3 group">
          <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">ARENA</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          {success ? 'Verify your account' : 'Create a new account'}
        </h2>
        {!success && (
          <p className="mt-2 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
              Sign In
            </Link>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="glass-dark border border-white/5 py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!success ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                  Full Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  Email Address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                    placeholder="Min 8 characters"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-300">
                  Select Role Portal
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck className="h-4 w-4 text-slate-500" />
                  </div>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-slate-900/60 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm appearance-none"
                  >
                    {roles.map((r) => (
                      <option key={r.value} value={r.value} className="bg-slate-950 text-white">
                        {r.label}
                      </option>
                    ))}
                  </select>
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
                      Register Account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Verification Flow (OTP check) */
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm text-center">
                We have sent a verification code to <strong>{email}</strong>. Please enter the OTP to activate your account.
              </div>

              {debugInfo && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1 font-mono">
                  <div className="font-semibold text-center uppercase tracking-wide mb-1 border-b border-amber-500/20 pb-1">
                    🔧 Development Debug Info
                  </div>
                  <div>OTP Sent: <strong>{debugInfo.otp}</strong></div>
                </div>
              )}

              <form onSubmit={handleOtpVerify} className="space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-slate-300 text-center">
                    Enter 6-Digit OTP
                  </label>
                  <div className="mt-2 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      id="otp"
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-slate-900/60 text-white text-center font-bold tracking-widest placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-lg"
                      placeholder="000000"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifyingOtp || otp.length !== 6}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all items-center gap-2"
                >
                  {verifyingOtp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Verify OTP
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
