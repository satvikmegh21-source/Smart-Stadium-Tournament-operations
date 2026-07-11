'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  Users, 
  Activity, 
  Terminal, 
  TrendingUp, 
  Search, 
  Filter, 
  UserCog, 
  Loader2, 
  Check, 
  AlertTriangle,
  Megaphone,
  Bell
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  action: string;
  ipAddress: string | null;
  device: string | null;
  details: string | null;
  timestamp: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

interface Metrics {
  totalUsers: number;
  activeSessions: number;
  totalAuditLogs: number;
  roleDistribution: Record<string, number>;
}

export default function AdminDashboardPage() {
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  
  // UX states
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  
  // Search / Filters / Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);

  // Role modification states
  const [modifyingUserId, setModifyingUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Announcement Mock state
  const [announcement, setAnnouncement] = useState('');
  const [announcementLoading, setAnnouncementLoading] = useState(false);

  // Load metrics
  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const res = await api.get('/admin/metrics');
      setMetrics(res.data.data.metrics);
    } catch (e) {
      console.error('Error fetching metrics', e);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Load Users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/admin/users', {
        params: {
          page: usersPage,
          limit: 8,
          search,
          role: roleFilter || undefined,
        }
      });
      setUsers(res.data.data.users);
      setUsersTotalPages(res.data.data.pagination.totalPages);
    } catch (e) {
      console.error('Error fetching users', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load Logs
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.get('/admin/logs', {
        params: {
          page: logsPage,
          limit: 8,
        }
      });
      setLogs(res.data.data.logs);
      setLogsTotalPages(res.data.data.pagination.totalPages);
    } catch (e) {
      console.error('Error fetching logs', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, usersPage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchLogs();
  }, [logsPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle changing user roles
  const handleRoleChange = async (userId: string, newRole: string) => {
    setModifyingUserId(userId);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.post('/admin/update-role', { userId, role: newRole });
      setActionSuccess('Role updated successfully.');
      // Refresh
      fetchUsers();
      fetchMetrics();
      fetchLogs();
      // Clear message after 3s
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update role';
      setActionError(errorMsg);
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setModifyingUserId(null);
    }
  };

  // Handle sending announcement (mocked)
  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcement) return;
    setAnnouncementLoading(true);
    setTimeout(() => {
      setAnnouncementLoading(false);
      setAnnouncement('');
      setActionSuccess('Platform announcement dispatched to all active channels.');
      fetchLogs(); // logs would record system actions
      setTimeout(() => setActionSuccess(null), 3000);
    }, 1000);
  };

  const availableRoles = [
    'SPECTATOR',
    'SUPER_ADMIN',
    'TOURNAMENT_ORGANIZER',
    'STADIUM_MANAGER',
    'TEAM_MANAGER',
    'COACH',
    'PLAYER',
    'REFEREE',
    'SECURITY_STAFF',
    'MEDICAL_STAFF',
    'VENDOR',
    'SPONSOR',
    'MEDIA',
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Super Admin Console</h1>
          <p className="text-slate-400 text-sm mt-1">Manage global system access control, audit activity logs, and monitor infrastructure metrics.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { fetchMetrics(); fetchUsers(); fetchLogs(); }} 
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold border border-white/5 transition-all"
          >
            Sync Data
          </button>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm flex items-center gap-3">
          <Check className="h-5 w-5 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Metrics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl glass border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Users</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              {loadingMetrics ? <Loader2 className="h-5 w-5 animate-spin" /> : metrics?.totalUsers || 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/15 text-indigo-400">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="p-6 rounded-2xl glass border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Active Sessions</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              {loadingMetrics ? <Loader2 className="h-5 w-5 animate-spin" /> : metrics?.activeSessions || 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-green-500/15 text-green-400">
            <Activity className="h-6 w-6 animate-pulse" />
          </div>
        </div>

        <div className="p-6 rounded-2xl glass border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Audit Logs</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              {loadingMetrics ? <Loader2 className="h-5 w-5 animate-spin" /> : metrics?.totalAuditLogs || 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-violet-500/15 text-violet-400">
            <Terminal className="h-6 w-6" />
          </div>
        </div>

        <div className="p-6 rounded-2xl glass border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Database Status</span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 mt-2.5 inline-block">
              CONNECTED
            </span>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-400">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: User Management & Sidebar Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User Management Table */}
        <div className="lg:col-span-2 p-6 rounded-3xl glass-dark border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserCog className="h-5 w-5 text-indigo-400" /> User Credentials & RBAC
              </h2>
              
              {/* Search & Filter Inputs */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 translate-y-[-50%]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setUsersPage(1); }}
                    placeholder="Search name/email"
                    className="pl-9 pr-3 py-1.5 w-full border border-white/10 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>
                <div className="relative">
                  <Filter className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 translate-y-[-50%]" />
                  <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setUsersPage(1); }}
                    className="pl-9 pr-4 py-1.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs appearance-none"
                  >
                    <option value="">All Roles</option>
                    {availableRoles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="pb-3 pr-2">User Details</th>
                    <th className="pb-3 px-2">Assigned Role</th>
                    <th className="pb-3 px-2">Verified</th>
                    <th className="pb-3 pl-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading users database...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        No registered users found matching the query.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 pr-2">
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{u.email}</div>
                        </td>
                        <td className="py-3.5 px-2">
                          <select
                            disabled={modifyingUserId === u.id}
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {availableRoles.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isVerified 
                              ? 'bg-green-500/15 text-green-400 border border-green-500/20' 
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          }`}>
                            {u.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                          </span>
                        </td>
                        <td className="py-3.5 pl-2 text-right">
                          <span className="text-[10px] text-slate-500">
                            Registered: {new Date(u.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {usersTotalPages > 1 && (
            <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-6">
              <span className="text-[10px] text-slate-500">Page {usersPage} of {usersTotalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={usersPage === 1 || loadingUsers}
                  onClick={() => setUsersPage(p => p - 1)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-slate-300 text-xs font-semibold disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={usersPage === usersTotalPages || loadingUsers}
                  onClick={() => setUsersPage(p => p + 1)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-slate-300 text-xs font-semibold disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Widgets (Announcements & Role Distributions) */}
        <div className="space-y-6">
          
          {/* Dispatch Announcement Card */}
          <div className="p-6 rounded-3xl glass border border-white/5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Megaphone className="h-5 w-5 text-indigo-400" /> Platform Broadcaster
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Broadcast critical warnings, stadium status updates, or weather announcements to all stakeholder screens.
            </p>
            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <textarea
                required
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                rows={3}
                placeholder="Alert text here (e.g. Warning: Heavy rain expected at Ground B starting 18:00)..."
                className="w-full p-3 border border-white/10 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-xs transition-all"
              />
              <button
                type="submit"
                disabled={announcementLoading || !announcement}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/15 disabled:opacity-50"
              >
                {announcementLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Broadcast Alert
                    <Bell className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Role Distributions Widget */}
          <div className="p-6 rounded-3xl glass border border-white/5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-indigo-400" /> Stakeholder Breakdown
            </h2>
            <div className="space-y-3.5">
              {loadingMetrics ? (
                <div className="text-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </div>
              ) : !metrics || Object.keys(metrics.roleDistribution).length === 0 ? (
                <p className="text-slate-500 text-xs">No role distribution data available.</p>
              ) : (
                Object.entries(metrics.roleDistribution).map(([roleName, count]) => {
                  const percentage = Math.max(5, Math.min(100, (count / metrics.totalUsers) * 100));
                  return (
                    <div key={roleName} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold">
                        <span className="text-slate-400">{roleName}</span>
                        <span className="text-white">{count} users</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-1.5 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Activity Logs */}
      <div className="p-6 rounded-3xl glass-dark border border-white/5">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
          <Terminal className="h-5 w-5 text-indigo-400" /> Infrastructure Activity Logs
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 font-bold uppercase tracking-wider">
                <th className="pb-3 pr-2">Log Action</th>
                <th className="pb-3 px-2">Triggered By</th>
                <th className="pb-3 px-2">IP / Agent</th>
                <th className="pb-3 px-2">Extra Details</th>
                <th className="pb-3 pl-2 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {loadingLogs ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading activity logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-2 font-bold text-indigo-400">{log.action}</td>
                    <td className="py-3 px-2 text-white">
                      {log.user ? `${log.user.name} (${log.user.role})` : 'SYSTEM'}
                      <div className="text-[9px] text-slate-500">{log.user?.email || ''}</div>
                    </td>
                    <td className="py-3 px-2 text-slate-400">
                      <div>{log.ipAddress || '127.0.0.1'}</div>
                      <div className="text-[9px] text-slate-500 truncate max-w-[120px]">{log.device || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-2 text-slate-300 max-w-[200px] truncate">{log.details || '-'}</td>
                    <td className="py-3 pl-2 text-right text-slate-500 text-[10px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logsTotalPages > 1 && (
          <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-6">
            <span className="text-[10px] text-slate-500">Page {logsPage} of {logsTotalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={logsPage === 1 || loadingLogs}
                onClick={() => setLogsPage(p => p - 1)}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-slate-300 text-xs font-semibold disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={logsPage === logsTotalPages || loadingLogs}
                onClick={() => setLogsPage(p => p + 1)}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-slate-300 text-xs font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
