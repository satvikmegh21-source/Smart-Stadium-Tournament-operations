'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  ShieldAlert, 
  Loader2, 
  Check, 
  AlertTriangle,
  Info,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Reporter {
  name: string;
  email: string;
}

interface Incident {
  id: string;
  location: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'LOGGED' | 'INVESTIGATING' | 'RESOLVED';
  actionTaken: string | null;
  createdAt: string;
  reportedBy: Reporter;
}

export default function IncidentsPage() {
  const { user } = useAuth();
  
  // Data states
  const [incidents, setIncidents] = useState<Incident[]>([]);

  // UX states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form states
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [type, setType] = useState<'SAFETY' | 'MEDICAL'>('SAFETY');

  // Resolution states
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [resolveStatus, setResolveStatus] = useState<'LOGGED' | 'INVESTIGATING' | 'RESOLVED'>('INVESTIGATING');
  const [actionDetails, setActionDetails] = useState('');

  const fetchIncidents = async () => {
    // Only fetch for staff/admin
    const isStaffOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'STADIUM_MANAGER';
    if (!isStaffOrAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/incidents');
      setIncidents(res.data.data);
    } catch (e) {
      console.error('Error fetching incidents', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Submit Incident
  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !description) return;
    setSubmitting(true);
    setActionError(null);

    try {
      await api.post('/incidents', {
        location,
        description,
        priority,
        type
      });
      setActionSuccess('Emergency/incident reported. Stadium dispatch team has been notified.');
      setLocation('');
      setDescription('');
      fetchIncidents();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Report failed';
      setActionError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Resolution
  const handleResolveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    setSubmitting(true);
    setActionError(null);

    try {
      await api.post(`/incidents/${selectedIncident.id}/resolve`, {
        status: resolveStatus,
        details: actionDetails
      });
      setActionSuccess('Incident status updated.');
      setSelectedIncident(null);
      setActionDetails('');
      fetchIncidents();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Resolution update failed';
      setActionError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const isStaffOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'STADIUM_MANAGER';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-red-500 animate-bounce" /> Stadium Incident Room
          </h1>
          <p className="text-slate-400 text-sm mt-1">Report emergencies, safety issues, or track incident queues in real time.</p>
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

      {/* Grid split: reporter form vs dispatcher list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Report Incident form (Available to all users) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-3xl glass border border-white/5 text-left relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(239,68,68,0.05)_0%,transparent_55%)] pointer-events-none" />
            <h2 className="text-lg font-extrabold text-white mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" /> Report Hazard / Emergency
            </h2>
            <p className="text-xs text-slate-400 mb-6">Need immediate medical attention or spotted a safety hazard? Notify stadium staff.</p>

            <form onSubmit={handleSubmitIncident} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Issue Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('SAFETY')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      type === 'SAFETY' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-slate-950 border-white/10 text-slate-500'
                    }`}
                  >
                    Safety/Hazards
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('MEDICAL')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      type === 'MEDICAL' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-slate-950 border-white/10 text-slate-500'
                    }`}
                  >
                    Medical Aid
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Location Zone / Sector</label>
                <input
                  required
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="E.g. Section B, Row 12, Seat 4"
                  className="w-full p-3 border border-white/10 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Severity Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')}
                  className="w-full p-3 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                >
                  <option value="LOW">Low (Nuisance)</option>
                  <option value="MEDIUM">Medium (Attention required)</option>
                  <option value="HIGH">High (Immediate check-up)</option>
                  <option value="CRITICAL">Critical (Life threatening emergency)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  className="w-full p-3 border border-white/10 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/15 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Raise Alarm / Report'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Dispatch Operations list (restricted to staff/admin) */}
        <div className="lg:col-span-2 space-y-6">
          {!isStaffOrAdmin ? (
            <div className="p-16 text-center text-slate-500 glass rounded-3xl flex flex-col items-center justify-center gap-2">
              <Info className="h-10 w-10 text-slate-600" />
              <p className="text-sm">Spectator workspace. Security and Medical logs require stadium operations permissions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Active Incident Queue</h2>
              {loading ? (
                <div className="p-20 text-center text-slate-500 glass rounded-3xl">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" /> Fetching active incidents...
                </div>
              ) : incidents.length === 0 ? (
                <div className="p-16 text-center text-slate-500 glass rounded-3xl text-xs flex flex-col items-center justify-center gap-2">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <span>All clear. No safety or medical issues in the queue.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {incidents.map((inc) => (
                    <div key={inc.id} className="p-5 rounded-2xl glass-dark border border-white/5 hover:border-white/10 transition-all text-left space-y-4">
                      
                      {/* Ticket Header */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold mr-2 uppercase ${
                            inc.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/25 animate-pulse' :
                            inc.severity === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                            'bg-indigo-600/10 text-indigo-400'
                          }`}>
                            {inc.severity} Severity
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                            inc.status === 'RESOLVED' ? 'bg-green-500/10 text-green-400 border border-green-500/25' :
                            inc.status === 'INVESTIGATING' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' :
                            'bg-slate-950 text-slate-400'
                          }`}>{inc.status}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-semibold flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(inc.createdAt).toLocaleTimeString()}</span>
                      </div>

                      {/* Content */}
                      <div>
                        <p className="text-xs text-white leading-relaxed font-semibold">{inc.description}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-wide">
                          <MapPin className="h-3.5 w-3.5 text-red-500" /> Location: {inc.location}
                        </div>
                      </div>

                      {/* Reporter details */}
                      <div className="text-[10px] text-slate-500 border-t border-white/5 pt-3 flex justify-between items-center">
                        <span>Reported by: <strong>{inc.reportedBy?.name || 'Spectator'}</strong></span>
                        {inc.actionTaken && <span className="text-indigo-400 font-mono text-[9px]">Resolved: &ldquo;{inc.actionTaken}&rdquo;</span>}
                      </div>

                      {/* Dispatch resolution buttons */}
                      {inc.status !== 'RESOLVED' && (
                        <div className="flex justify-end pt-2 border-t border-white/5">
                          <button
                            onClick={() => { setSelectedIncident(inc); setResolveStatus(inc.status === 'LOGGED' ? 'INVESTIGATING' : 'RESOLVED'); }}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                          >
                            Update Dispatch
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Resolution Update modal popup */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm" onClick={() => setSelectedIncident(null)} />
          <div className="relative w-full max-w-md bg-slate-900 shadow-2xl border border-white/5 rounded-3xl p-6 text-left space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-indigo-400" /> Dispatch Update Panel
            </h3>
            <p className="text-xs text-slate-400">Log actions taken for incident ticket: <strong>{selectedIncident.id.slice(0,8)}</strong> at location <strong>{selectedIncident.location}</strong></p>
            
            <form onSubmit={handleResolveIncident} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Action Status</label>
                <select
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value as 'LOGGED' | 'INVESTIGATING' | 'RESOLVED')}
                  className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                >
                  <option value="LOGGED">Logged</option>
                  <option value="INVESTIGATING">Investigating / Dispatched</option>
                  <option value="RESOLVED">Resolved / All Clear</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Resolution Notes / Action Details</label>
                <textarea
                  required
                  value={actionDetails}
                  onChange={(e) => setActionDetails(e.target.value)}
                  placeholder="Describe action taken (e.g. Paramedics dispatched, zone evacuated, issue cleared)..."
                  rows={3}
                  className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
                <button type="button" onClick={() => setSelectedIncident(null)} className="px-4 py-2 bg-white/5 rounded-lg text-slate-300 text-xs font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
