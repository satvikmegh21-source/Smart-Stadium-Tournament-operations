'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  Briefcase, 
  Store, 
  Plus, 
  Loader2, 
  Check, 
  AlertTriangle,
  UserCheck,
  TrendingUp
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Vendor {
  id: string;
  businessName: string;
  stallNumber: string | null;
  user: { name: string; email: string };
}

interface Sponsor {
  id: string;
  companyName: string;
  logoUrl: string | null;
  user: { name: string; email: string };
}

export default function PartnershipsPage() {
  const { user } = useAuth();

  // Data states
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [vendorUsers, setVendorUsers] = useState<UserItem[]>([]);
  const [sponsorUsers, setSponsorUsers] = useState<UserItem[]>([]);

  // UX states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Forms inputs
  const [businessName, setBusinessName] = useState('');
  const [stallNumber, setStallNumber] = useState('');
  const [selectedVendorUserId, setSelectedVendorUserId] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [selectedSponsorUserId, setSelectedSponsorUserId] = useState('');

  const fetchData = async () => {
    try {
      const [vendorsRes, sponsorsRes] = await Promise.all([
        api.get('/partnerships/vendors'),
        api.get('/partnerships/sponsors')
      ]);
      setVendors(vendorsRes.data.data);
      setSponsors(sponsorsRes.data.data);
    } catch (e) {
      console.error('Error fetching partnerships data', e);
    }
  };

  const fetchUsersList = async () => {
    // Only load users if user has access to create partnerships
    const allowed = ['SUPER_ADMIN', 'STADIUM_MANAGER', 'TOURNAMENT_ORGANIZER'].includes(user?.role || '');
    if (!allowed) return;

    try {
      const res = await api.get('/admin/users');
      const allUsers = res.data.data as UserItem[];
      setVendorUsers(allUsers.filter(u => u.role === 'VENDOR'));
      setSponsorUsers(allUsers.filter(u => u.role === 'SPONSOR'));
    } catch (e) {
      console.error('Error fetching users', e);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchData(), fetchUsersList()]).finally(() => setLoading(false));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Create Vendor Lease
  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !selectedVendorUserId) return;
    setSubmitting(true);
    setActionError(null);

    try {
      await api.post('/partnerships/vendors', {
        userId: selectedVendorUserId,
        businessName,
        stallNumber
      });
      setActionSuccess('Vendor registered successfully.');
      setBusinessName('');
      setStallNumber('');
      setSelectedVendorUserId('');
      setShowVendorModal(false);
      fetchData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Vendor creation failed';
      setActionError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Create Sponsor Contract
  const handleSponsorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !selectedSponsorUserId) return;
    setSubmitting(true);
    setActionError(null);

    try {
      await api.post('/partnerships/sponsors', {
        userId: selectedSponsorUserId,
        companyName,
        logoUrl: logoUrl || undefined
      });
      setActionSuccess('Sponsor configured successfully.');
      setCompanyName('');
      setLogoUrl('');
      setSelectedSponsorUserId('');
      setShowSponsorModal(false);
      fetchData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Sponsorship creation failed';
      setActionError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const isStaffOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'STADIUM_MANAGER';
  const isOrganizerOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'TOURNAMENT_ORGANIZER';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-indigo-400" /> Commercial Partnerships
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage stadium food/retail vendor leases and tournament sponsor contracts.</p>
        </div>
        <div className="flex gap-2">
          {isStaffOrAdmin && (
            <button
              onClick={() => setShowVendorModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/10"
            >
              <Store className="h-4 w-4" /> Add Vendor
            </button>
          )}
          {isOrganizerOrAdmin && (
            <button
              onClick={() => setShowSponsorModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
            >
              <Plus className="h-4 w-4" /> Add Sponsor
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
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

      {loading ? (
        <div className="p-20 text-center text-slate-500 glass rounded-3xl">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" /> Syncing contract ledgers...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Vendors Box */}
          <div className="p-6 rounded-3xl glass border border-white/5 space-y-4">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Store className="h-5 w-5 text-indigo-400" /> Stadium Vendor Leases
            </h2>
            <div className="space-y-4">
              {vendors.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">No food or merchandise booths registered.</div>
              ) : (
                vendors.map((v) => (
                  <div key={v.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center text-left">
                    <div>
                      <h4 className="font-bold text-white text-xs">{v.businessName}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                        <span>Proprietor: {v.user.name}</span>
                        <span>•</span>
                        <span>Stall: {v.stallNumber || 'N/A'}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/25 text-[8px] font-bold uppercase tracking-wider">
                      Leased
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sponsors Box */}
          <div className="p-6 rounded-3xl glass border border-white/5 space-y-4">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-400" /> Tournament Sponsors
            </h2>
            <div className="space-y-4">
              {sponsors.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">No brand contracts active.</div>
              ) : (
                sponsors.map((s) => (
                  <div key={s.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center text-left">
                    <div>
                      <h4 className="font-bold text-white text-xs">{s.companyName}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                        <span>Liaison: {s.user.name}</span>
                        <span>•</span>
                        <span className="text-indigo-400 font-bold uppercase tracking-wider text-[9px]">Official Sponsor</span>
                      </div>
                    </div>
                    {s.logoUrl && (
                      <img src={s.logoUrl} alt={s.companyName} className="h-8 w-16 object-contain filter brightness-75 hover:brightness-100 transition-all" /> // eslint-disable-line @next/next/no-img-element
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* Add Vendor Lease Modal popup */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm" onClick={() => setShowVendorModal(false)} />
          <div className="relative w-full max-w-sm bg-slate-900 border border-white/5 rounded-3xl p-6 text-left space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Store className="h-5 w-5 text-indigo-400" /> Add Food/Retail Vendor Lease
            </h3>
            
            <form onSubmit={handleVendorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select Proprietor Account</label>
                <select
                  required
                  value={selectedVendorUserId}
                  onChange={(e) => setSelectedVendorUserId(e.target.value)}
                  className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                >
                  <option value="">Select vendor user</option>
                  {vendorUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Business Name</label>
                <input
                  required
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="E.g. Burger Stand Arena B"
                  className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Stall / Booth Designation</label>
                <input
                  type="text"
                  value={stallNumber}
                  onChange={(e) => setStallNumber(e.target.value)}
                  placeholder="E.g. Stall 14"
                  className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
                <button type="button" onClick={() => setShowVendorModal(false)} className="px-4 py-2 bg-white/5 rounded-lg text-slate-300 text-xs font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                  {submitting && <Loader2 className="h-3 w-3 animate-spin" />} Lease stall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Sponsor Contract Modal popup */}
      {showSponsorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm" onClick={() => setShowSponsorModal(false)} />
          <div className="relative w-full max-w-sm bg-slate-900 border border-white/5 rounded-3xl p-6 text-left space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-400" /> Configure Sponsor Contract
            </h3>
            
            <form onSubmit={handleSponsorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select Sponsor User Account</label>
                <select
                  required
                  value={selectedSponsorUserId}
                  onChange={(e) => setSelectedSponsorUserId(e.target.value)}
                  className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                >
                  <option value="">Select sponsor user</option>
                  {sponsorUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Company / Brand Name</label>
                <input
                  required
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="E.g. Nike Inc."
                  className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Brand Logo URL (Optional)</label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
                <button type="button" onClick={() => setShowSponsorModal(false)} className="px-4 py-2 bg-white/5 rounded-lg text-slate-300 text-xs font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                  {submitting && <Loader2 className="h-3 w-3 animate-spin" />} Sign Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
