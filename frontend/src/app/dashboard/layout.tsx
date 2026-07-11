'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { 
  Trophy, 
  LayoutDashboard, 
  Building2, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  User,
  Shield,
  Activity,
  Ticket
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sidebarLinks = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['*'] },
    { href: '/dashboard/admin', label: 'Admin Panel', icon: Shield, roles: ['SUPER_ADMIN'] },
    { href: '/dashboard/tournaments', label: 'Tournaments', icon: Trophy, roles: ['SUPER_ADMIN', 'TOURNAMENT_ORGANIZER', 'SPECTATOR', 'COACH', 'PLAYER'] },
    { href: '/dashboard/stadiums', label: 'Stadiums', icon: Building2, roles: ['SUPER_ADMIN', 'STADIUM_MANAGER', 'SPECTATOR'] },
    { href: '/dashboard/matches', label: 'Matches', icon: Activity, roles: ['*'] },
    { href: '/dashboard/tickets', label: 'Tickets', icon: Ticket, roles: ['*'] },
    { href: '/dashboard/users', label: 'Stakeholders', icon: Users, roles: ['SUPER_ADMIN', 'TOURNAMENT_ORGANIZER'] },
  ];

  // Filter links by user role
  const filteredLinks = sidebarLinks.filter(link => {
    if (link.roles.includes('*')) return true;
    return user ? link.roles.includes(user.role) : false;
  });

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-white/5 text-slate-300">
        {/* Brand */}
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-lg shadow-md group-hover:scale-105 transition-transform">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white">ARENA</span>
              <span className="text-[10px] text-indigo-400 font-medium block tracking-widest mt-[-2px]">OPERATIONS</span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/15'
                    : 'hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Profile / Logout */}
        <div className="p-4 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-semibold text-sm">
              {user?.name ? user.name[0].toUpperCase() : <User className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Loading...'}</p>
              <span className="text-[10px] font-medium text-slate-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full mt-0.5 inline-block truncate max-w-full">
                {user?.role || 'SPECTATOR'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 rounded-xl text-sm font-semibold transition-all border border-transparent"
          >
            <LogOut className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-white" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Header - Mobile */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between bg-slate-900 border-b border-white/5 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-lg">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-lg text-white">ARENA</span>
          </Link>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white focus:outline-none"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative flex flex-col w-64 bg-slate-900 h-full border-r border-white/5 text-slate-300">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <span className="font-extrabold text-lg text-white">ARENA</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              
              <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                {filteredLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/15'
                          : 'hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <div className="h-9 w-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-semibold text-sm">
                    {user?.name ? user.name[0].toUpperCase() : <User className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                    <span className="text-[10px] font-medium text-slate-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full mt-0.5 inline-block">
                      {user?.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 rounded-xl text-sm font-semibold transition-all border border-transparent"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 lg:p-10 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
