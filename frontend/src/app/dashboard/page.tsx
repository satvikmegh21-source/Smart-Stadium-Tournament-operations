'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trophy, ShieldAlert, Building2, Ticket, Sparkles, User, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverviewPage() {
  const { user } = useAuth();

  const featuresList = [
    { name: 'Tournament Brackets', desc: 'League standings, Berger fixtures, and scores.', status: 'Active', link: '/dashboard/tournaments', icon: Trophy, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { name: 'Seat & Venue Maps', desc: 'Interactive matches ticketing and checkout layouts.', status: 'Active', link: '/dashboard/tickets', icon: Ticket, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { name: 'Live Match Center', desc: 'Live scoreboard, updates timeline logs, and goals.', status: 'Active', link: '/dashboard/matches', icon: Building2, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { name: 'Realtime Dispatch & Alerts', desc: 'Live push feeds, emergency alarms, and notifications.', status: 'Active', link: '/dashboard/notifications', icon: ShieldAlert, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-violet-900/40 via-indigo-900/40 to-slate-900/40 border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15)_0%,transparent_50%)]" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="h-4 w-4" /> Smart Stadium Platform
            </div>
            <h1 className="text-3xl font-extrabold text-white">Welcome back, {user?.name || 'Spectator'}!</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              You are signed in as <span className="text-indigo-300 font-semibold">{user?.role}</span>. Explore stadium maps, book seats, and watch matches.
            </p>
          </div>
          <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/15">
              <User className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Profile Status</span>
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${user?.isVerified ? 'bg-green-500' : 'bg-amber-500'}`} />
                {user?.isVerified ? 'Verified Active' : 'Pending Verification'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Alerts */}
      {!user?.isVerified && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>Your email verification is currently pending. Please check your inbox or register screen to submit your OTP.</span>
          </div>
          <Link href="/signup" className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all shadow-md">
            Verify Now
          </Link>
        </div>
      )}

      {/* Matches Grid Mock Preview */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-400" /> Live & Upcoming Fixtures
          </h2>
          <span className="text-xs text-slate-500">Auto-updating realtime</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl glass-dark border border-white/5 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" /> Live Match
              </span>
              <span className="text-xs text-slate-500">Arena Ground A</span>
            </div>
            <div className="flex justify-between items-center my-4 px-4">
              <div className="text-center w-1/3">
                <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2 border border-white/5 shadow-md">FCB</div>
                <span className="text-sm font-semibold text-white block">FC Barcelona</span>
              </div>
              <div className="text-center w-1/3">
                <span className="text-2xl font-extrabold text-white">2 - 1</span>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold mt-1">74th Min</span>
              </div>
              <div className="text-center w-1/3">
                <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2 border border-white/5 shadow-md">RMA</div>
                <span className="text-sm font-semibold text-white block">Real Madrid</span>
              </div>
            </div>
            <div className="border-t border-white/5 pt-4 mt-2 flex justify-between items-center text-xs text-slate-500">
              <span>Referee: Mark Clattenburg</span>
              <span className="px-2.5 py-1 rounded bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-semibold">Watch Stream</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-dark border border-white/5 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Upcoming</span>
              <span className="text-xs text-slate-500">Stadium Center Pit</span>
            </div>
            <div className="flex justify-between items-center my-4 px-4">
              <div className="text-center w-1/3">
                <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2 border border-white/5 shadow-md">ARS</div>
                <span className="text-sm font-semibold text-white block">Arsenal FC</span>
              </div>
              <div className="text-center w-1/3">
                <span className="text-sm font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">July 15</span>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold mt-1.5">20:30 UTC</span>
              </div>
              <div className="text-center w-1/3">
                <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2 border border-white/5 shadow-md">CHE</div>
                <span className="text-sm font-semibold text-white block">Chelsea FC</span>
              </div>
            </div>
            <div className="border-t border-white/5 pt-4 mt-2 flex justify-between items-center text-xs text-slate-500">
              <span>Referee: Michael Oliver</span>
              <Link href="/dashboard/tickets" className="px-2.5 py-1 rounded bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-semibold">Buy Ticket</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Active Modules List */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">Operations Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuresList.map((f, i) => {
            const Icon = f.icon;
            return (
              <Link href={f.link} key={i} className="hover:scale-[1.02] hover:border-white/10 transition-all flex flex-col justify-between p-6 rounded-2xl glass-dark border border-white/5 relative overflow-hidden text-left">
                <div className="absolute top-2 right-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                  {f.status}
                </div>
                <div>
                  <div className={`p-2.5 rounded-xl ${f.bg} ${f.color} w-fit mb-4`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">{f.name}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
                <div className="border-t border-white/5 pt-4 mt-4 text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                  Click to launch →
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
