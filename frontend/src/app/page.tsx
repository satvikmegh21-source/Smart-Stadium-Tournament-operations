'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Map, 
  Ticket, 
  ShieldCheck, 
  Activity, 
  Users, 
  ArrowRight, 
  Play, 
  Building2, 
  CircleDot, 
  AlertTriangle, 
  UtensilsCrossed 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'organizers' | 'stadiums' | 'spectators'>('organizers');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-radial-dark relative overflow-x-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header/Navbar */}
      <header className="sticky top-0 z-50 glass-dark border-b border-white/5 px-6 lg:px-16 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">ARENA</span>
            <span className="text-indigo-400 font-medium text-xs block tracking-widest mt-[-2px]">OPERATIONS</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-indigo-400 transition-colors">Modules</a>
          <a href="#solutions" className="hover:text-indigo-400 transition-colors">Solutions</a>
          <a href="#metrics" className="hover:text-indigo-400 transition-colors">Analytics</a>
          <a href="/api-docs" target="_blank" className="hover:text-indigo-400 transition-colors">API docs</a>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <Link 
              href={user.role === 'SUPER_ADMIN' ? '/dashboard/admin' : '/dashboard'}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium text-sm shadow-md hover:shadow-indigo-500/25 hover:opacity-90 transition-all flex items-center gap-2"
            >
              Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                className="text-slate-300 hover:text-white font-medium text-sm transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/signup"
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm border border-white/10 hover:border-white/20 transition-all"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6 lg:px-16 text-center max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide uppercase mb-8 shadow-sm shadow-indigo-500/5"
        >
          <CircleDot className="h-3 w-3 animate-pulse text-indigo-400" />
          Next-Gen Stadium Management
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1] max-w-5xl mx-auto"
        >
          Automate Tournaments & <br />
          <span className="text-gradient">Stadium Operations</span> In Real-Time
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto mb-10 font-normal leading-relaxed"
        >
          The complete cloud operating system mapping league setups, digital twin stadium grounds, smart ticketing, incident response protocols, and unified stakeholder panels.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
        >
          <Link 
            href="/signup" 
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:scale-[1.02] hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2"
          >
            Get Started Now
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link 
            href="/login" 
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
          >
            <Play className="h-4 w-4 fill-current text-indigo-400" />
            Sign In Panel
          </Link>
        </motion.div>

        {/* Dashboard Preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden glass border border-white/10 shadow-2xl shadow-indigo-500/10 p-2"
        >
          <div className="rounded-2xl overflow-hidden bg-slate-900 border border-white/5 aspect-[16/10] relative flex">
            {/* Mock Dashboard Layout */}
            <div className="w-1/4 border-r border-white/5 bg-slate-950 p-4 hidden md:block text-left">
              <div className="h-6 w-24 bg-white/10 rounded mb-8" />
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 w-full bg-white/5 rounded mb-4 flex items-center gap-2 px-2">
                  <div className="h-3 w-3 bg-white/10 rounded-full" />
                  <div className="h-2 w-16 bg-white/10 rounded" />
                </div>
              ))}
            </div>
            <div className="flex-1 p-6 flex flex-col justify-between text-left">
              <div className="flex justify-between items-center mb-6">
                <div className="h-8 w-48 bg-white/10 rounded" />
                <div className="h-8 w-24 bg-indigo-500/20 rounded border border-indigo-500/30" />
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="h-3 w-12 bg-white/10 rounded mb-2" />
                    <div className="h-6 w-20 bg-white/20 rounded" />
                  </div>
                ))}
              </div>
              <div className="flex-1 rounded-xl bg-white/5 border border-white/5 p-4 flex items-center justify-center relative">
                <div className="text-center">
                  <Activity className="h-8 w-8 text-indigo-400 mx-auto mb-2 animate-pulse" />
                  <div className="h-3 w-32 bg-white/10 rounded mx-auto" />
                </div>
                {/* Floating Widget */}
                <div className="absolute right-4 bottom-4 p-3 rounded-lg bg-indigo-600 text-white text-xs font-semibold flex items-center gap-2 shadow-lg">
                  <ShieldCheck className="h-4 w-4" /> Live Operational Check: OK
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Modules Grid */}
      <section id="features" className="py-24 px-6 lg:px-16 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Enterprise Feature Modules</h2>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
            A modular system supporting standard and specialized operational needs.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Card 1: Tournaments */}
          <motion.div variants={itemVariants} className="p-8 rounded-3xl glass-dark border border-white/5 card-hover">
            <div className="p-3 bg-violet-600/10 rounded-2xl border border-violet-500/20 w-fit mb-6">
              <Trophy className="h-6 w-6 text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Tournament Module</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Define formats (League, Knockout, Round Robin). Dynamic points table updates, automatic fixtures generation, referee assignment, and live score logging.
            </p>
          </motion.div>

          {/* Card 2: Stadium Grounds */}
          <motion.div variants={itemVariants} className="p-8 rounded-3xl glass-dark border border-white/5 card-hover">
            <div className="p-3 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 w-fit mb-6">
              <Building2 className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Stadium Facility Management</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ground configuration, seat zoning, maintenance logs, parking occupancy, emergency exit mapping, and IoT diagnostic status metrics.
            </p>
          </motion.div>

          {/* Card 3: Ticket Booking */}
          <motion.div variants={itemVariants} className="p-8 rounded-3xl glass-dark border border-white/5 card-hover">
            <div className="p-3 bg-cyan-600/10 rounded-2xl border border-cyan-500/20 w-fit mb-6">
              <Ticket className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Smart Ticketing</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Online dynamic booking with interactive seat selection, secure Stripe checkout, automated secure QR pass creation, and scanner validation routes.
            </p>
          </motion.div>

          {/* Card 4: Live Matches */}
          <motion.div variants={itemVariants} className="p-8 rounded-3xl glass-dark border border-white/5 card-hover">
            <div className="p-3 bg-rose-600/10 rounded-2xl border border-rose-500/20 w-fit mb-6">
              <Activity className="h-6 w-6 text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Match Event Center</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Track live feeds, player substitutions, match events (goals, yellow/red cards), VAR reviews, and referee performance metrics.
            </p>
          </motion.div>

          {/* Card 5: Role-Based Workspaces */}
          <motion.div variants={itemVariants} className="p-8 rounded-3xl glass-dark border border-white/5 card-hover">
            <div className="p-3 bg-emerald-600/10 rounded-2xl border border-emerald-500/20 w-fit mb-6">
              <Users className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Unified RBAC Portals</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Separate modules for Players (medical records, statistics), Coaches (training sessions), Vendors (inventory, sales log), and Sponsors (ad slots).
            </p>
          </motion.div>

          {/* Card 6: Operations & Safety */}
          <motion.div variants={itemVariants} className="p-8 rounded-3xl glass-dark border border-white/5 card-hover">
            <div className="p-3 bg-amber-600/10 rounded-2xl border border-amber-500/20 w-fit mb-6">
              <ShieldCheck className="h-6 w-6 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Security & Response</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Visitor logs, incident reports with severity mapping, real-time safety warnings, and instant dispatcher routes for medical teams.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Solutions Interactive Tabs */}
      <section id="solutions" className="py-24 px-6 lg:px-16 max-w-7xl mx-auto border-t border-white/5 bg-slate-950">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">Customized For Every Stakeholder</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Our role-based workspaces mean everyone has access to the exact logs, tools, and interfaces they need to deliver operations.
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setActiveTab('organizers')}
                className={`p-5 rounded-2xl text-left border transition-all duration-300 flex items-center gap-4 ${
                  activeTab === 'organizers' 
                    ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/5' 
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Trophy className={`h-5 w-5 ${activeTab === 'organizers' ? 'text-indigo-400' : 'text-slate-400'}`} />
                <div>
                  <h4 className="font-bold text-base">Organizers & Admins</h4>
                  <p className="text-xs opacity-80 mt-1">Configure leagues, view revenue reports, and manage credentials.</p>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('stadiums')}
                className={`p-5 rounded-2xl text-left border transition-all duration-300 flex items-center gap-4 ${
                  activeTab === 'stadiums' 
                    ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/5' 
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Map className={`h-5 w-5 ${activeTab === 'stadiums' ? 'text-indigo-400' : 'text-slate-400'}`} />
                <div>
                  <h4 className="font-bold text-base">Stadium Managers & Staff</h4>
                  <p className="text-xs opacity-80 mt-1">Audit security alerts, log repairs, and manage entrance gates.</p>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('spectators')}
                className={`p-5 rounded-2xl text-left border transition-all duration-300 flex items-center gap-4 ${
                  activeTab === 'spectators' 
                    ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/5' 
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Ticket className={`h-5 w-5 ${activeTab === 'spectators' ? 'text-indigo-400' : 'text-slate-400'}`} />
                <div>
                  <h4 className="font-bold text-base">Spectators & Teams</h4>
                  <p className="text-xs opacity-80 mt-1">Buy tickets, view interactive schedules, and track player performance.</p>
                </div>
              </button>
            </div>
          </div>

          <div className="lg:w-1/2 w-full h-[400px] rounded-3xl glass border border-white/10 overflow-hidden relative flex items-center justify-center p-8 bg-slate-900/40">
            {activeTab === 'organizers' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full text-left space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <span className="text-white font-bold text-lg">Super Admin Console</span>
                  <span className="px-3 py-1 bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-semibold rounded-full">Secure Auth</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center text-sm">
                    <span className="text-slate-300">Revenue (Monthly)</span>
                    <span className="text-indigo-400 font-bold">$124,500</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center text-sm">
                    <span className="text-slate-300">Total Registered Users</span>
                    <span className="text-white font-bold">12,450</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center text-sm">
                    <span className="text-slate-300">Active Security Incidents</span>
                    <span className="text-red-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> 0 Pending
                    </span>
                  </div>
                </div>
                <Link href="/login" className="w-full block py-3 text-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors mt-6">
                  Access Portal
                </Link>
              </motion.div>
            )}

            {activeTab === 'stadiums' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full text-left space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <span className="text-white font-bold text-lg">Stadium Operations Hub</span>
                  <span className="px-3 py-1 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-xs font-semibold rounded-full">Facility Status</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center text-sm">
                    <span className="text-slate-300">Gate 4 Attendance</span>
                    <span className="text-cyan-400 font-bold">87% Capacity</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center text-sm">
                    <span className="text-slate-300">Ground Lighting</span>
                    <span className="text-green-400 font-bold">OPERATIONAL</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center text-sm">
                    <span className="text-slate-300">Ambulance Standby</span>
                    <span className="text-white font-bold">2 Active</span>
                  </div>
                </div>
                <Link href="/login" className="w-full block py-3 text-center bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-semibold transition-colors mt-6">
                  Staff Sign In
                </Link>
              </motion.div>
            )}

            {activeTab === 'spectators' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full text-left space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <span className="text-white font-bold text-lg">Interactive Ticketing</span>
                  <span className="px-3 py-1 bg-purple-500/15 text-purple-400 border border-purple-500/30 text-xs font-semibold rounded-full">Match Day</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center text-sm">
                    <span className="text-slate-300">Championship Finals Ticket</span>
                    <span className="text-purple-400 font-bold">Seats Available</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center text-sm">
                    <span className="text-slate-300">Dynamic Base Price</span>
                    <span className="text-white font-bold">$45.00</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center text-sm">
                    <span className="text-slate-300">Food Vendor Ordering</span>
                    <span className="text-green-400 font-bold flex items-center gap-1">
                      <UtensilsCrossed className="h-3.5 w-3.5" /> Ready
                    </span>
                  </div>
                </div>
                <Link href="/login" className="w-full block py-3 text-center bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-colors mt-6">
                  Book Tickets
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section id="metrics" className="py-24 px-6 lg:px-16 max-w-7xl mx-auto border-t border-white/5 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-16">Platform Statistics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="p-6 rounded-2xl glass-dark border border-white/5">
            <Trophy className="h-8 w-8 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-3xl font-extrabold text-white mb-2">150+</h3>
            <p className="text-slate-400 text-sm">Tournaments Managed</p>
          </div>
          <div className="p-6 rounded-2xl glass-dark border border-white/5">
            <Building2 className="h-8 w-8 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-3xl font-extrabold text-white mb-2">45</h3>
            <p className="text-slate-400 text-sm">Connected Stadiums</p>
          </div>
          <div className="p-6 rounded-2xl glass-dark border border-white/5">
            <Ticket className="h-8 w-8 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-3xl font-extrabold text-white mb-2">1.2M</h3>
            <p className="text-slate-400 text-sm">Tickets Issued</p>
          </div>
          <div className="p-6 rounded-2xl glass-dark border border-white/5">
            <ShieldCheck className="h-8 w-8 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-3xl font-extrabold text-white mb-2">99.9%</h3>
            <p className="text-slate-400 text-sm">Safety Response Rating</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-16 max-w-5xl mx-auto text-center">
        <div className="p-12 md:p-16 rounded-3xl bg-gradient-to-r from-violet-900/60 to-indigo-900/60 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_60%)] pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">Ready to Coordinate Arena Operations?</h2>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Deploy secure role portals for organizers, security dispatchers, medical teams, vendors, ref, and media. Get started immediately.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold transition-all shadow-md shadow-white/5 flex items-center justify-center gap-2">
              Create Super Admin
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-transparent text-white border border-white/20 hover:border-white/30 font-bold transition-all flex items-center justify-center">
              Login to Panel
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 lg:px-16 max-w-7xl mx-auto text-center md:flex md:justify-between md:items-center text-slate-500 text-xs">
        <div className="mb-4 md:mb-0">
          <span className="font-extrabold text-sm tracking-wide text-white">ARENA</span>
          <p className="mt-1">© 2026 Arena Operations. All rights reserved.</p>
        </div>
        <div className="flex justify-center gap-6">
          <Link href="/login" className="hover:text-slate-300">Sign In</Link>
          <Link href="/signup" className="hover:text-slate-300">Register</Link>
          <a href="/api-docs" target="_blank" className="hover:text-slate-300">API Documentation</a>
        </div>
      </footer>
    </div>
  );
}
