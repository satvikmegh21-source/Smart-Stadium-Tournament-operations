'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  Users, 
  Heart, 
  Ban, 
  TrendingUp, 
  Search, 
  Filter, 
  Edit3, 
  Loader2, 
  Check, 
  AlertTriangle,
  Info,
  Calendar
} from 'lucide-react';

interface User {
  name: string;
  email: string;
}

interface Team {
  id: string;
  name: string;
}

interface TransferLog {
  fromTeamId: string | null;
  fromTeamName: string;
  toTeamId: string | null;
  toTeamName: string;
  date: string;
  details: string;
}

interface Player {
  id: string;
  userId: string;
  position: string | null;
  jerseyNumber: number | null;
  birthDate: string | null;
  fitnessStatus: 'FIT' | 'INJURED' | 'RECOVERING';
  medicalHistory: string | null;
  availability: boolean;
  suspensionEnd: string | null;
  transferHistory: TransferLog[] | null;
  user: User;
  team: Team | null;
}

export default function PlayersPage() {
  const { user } = useAuth();
  
  // Data states
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // UX states
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [fitnessFilter, setFitnessFilter] = useState('');

  // Editing states
  const [activeForm, setActiveForm] = useState<'profile' | 'fitness' | 'suspension' | 'transfer' | null>(null);

  // Forms inputs
  const [position, setPosition] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState(0);
  const [birthDate, setBirthDate] = useState('');
  const [availability, setAvailability] = useState(true);
  const [fitnessStatus, setFitnessStatus] = useState<'FIT' | 'INJURED' | 'RECOVERING'>('FIT');
  const [medicalNote, setMedicalNote] = useState('');
  const [suspensionEnd, setSuspensionEnd] = useState('');
  const [toTeamId, setToTeamId] = useState('');

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/players', {
        params: {
          search,
          fitnessStatus: fitnessFilter || undefined
        }
      });
      setPlayers(res.data.data);
      if (res.data.data.length > 0 && !selectedPlayer) {
        setSelectedPlayer(res.data.data[0]);
      }
    } catch (e) {
      console.error('Error fetching players', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      setTeams(res.data.data);
    } catch (e) {
      console.error('Error fetching teams', e);
    }
  };

  useEffect(() => {
    fetchPlayers();
    fetchTeams();
  }, [search, fitnessFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setActiveForm(null);
    setActionError(null);
    
    // Autofill forms
    setPosition(player.position || '');
    setJerseyNumber(player.jerseyNumber || 0);
    setBirthDate(player.birthDate ? new Date(player.birthDate).toISOString().split('T')[0] : '');
    setAvailability(player.availability);
    setFitnessStatus(player.fitnessStatus);
    setSuspensionEnd(player.suspensionEnd ? new Date(player.suspensionEnd).toISOString().split('T')[0] : '');
  };

  // Submit Profile Changes (Self, Manager, Admin)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await api.put(`/players/${selectedPlayer.id}`, {
        position: position || undefined,
        jerseyNumber: jerseyNumber || undefined,
        birthDate: birthDate ? new Date(birthDate).toISOString() : undefined,
        availability
      });
      setActionSuccess('Profile updated successfully.');
      setSelectedPlayer({ ...selectedPlayer, ...res.data.data });
      fetchPlayers();
      setActiveForm(null);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Update failed';
      setActionError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Fitness Updates (Medical, Coach, Admin)
  const handleUpdateFitness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await api.post(`/players/${selectedPlayer.id}/fitness`, {
        fitnessStatus,
        medicalHistory: medicalNote || undefined
      });
      setActionSuccess('Fitness details logged successfully.');
      setMedicalNote('');
      setSelectedPlayer({ ...selectedPlayer, ...res.data.data });
      fetchPlayers();
      setActiveForm(null);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Update failed';
      setActionError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Suspension Details (Organizer, Admin)
  const handleUpdateSuspension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await api.post(`/players/${selectedPlayer.id}/suspension`, {
        suspensionEnd: suspensionEnd ? new Date(suspensionEnd).toISOString() : null
      });
      setActionSuccess('Suspension status updated.');
      setSelectedPlayer({ ...selectedPlayer, ...res.data.data });
      fetchPlayers();
      setActiveForm(null);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Update failed';
      setActionError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Transfer Details (Manager, Admin)
  const handleUpdateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await api.post(`/players/${selectedPlayer.id}/transfer`, {
        toTeamId: toTeamId || null,
        transferDate: new Date().toISOString(),
        details: 'Transferred via Dashboard'
      });
      setActionSuccess('Player transfer completed successfully.');
      setToTeamId('');
      setSelectedPlayer({ ...selectedPlayer, ...res.data.data });
      fetchPlayers();
      setActiveForm(null);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Transfer failed';
      setActionError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Permissions helpers
  const isSelf = selectedPlayer?.userId === user?.id;
  const isManagerOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'TEAM_MANAGER';
  const isMedicalOrCoachOrAdmin = ['SUPER_ADMIN', 'COACH', 'MEDICAL_STAFF'].includes(user?.role || '');
  const isOrganizerOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'TOURNAMENT_ORGANIZER';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-indigo-400" /> Players Directory
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review player statistics, update medical checkups, and log transfer schedules.</p>
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

      {/* Split grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left column: Players List with Search & filter */}
        <div className="lg:col-span-1 space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 translate-y-[-50%]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name/email"
                className="pl-9 pr-3 py-2 w-full border border-white/10 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
              />
            </div>
            <div className="relative">
              <Filter className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 translate-y-[-50%]" />
              <select
                value={fitnessFilter}
                onChange={(e) => setFitnessFilter(e.target.value)}
                className="pl-9 pr-4 py-2 w-full border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs appearance-none"
              >
                <option value="">All Fitness States</option>
                <option value="FIT">FIT</option>
                <option value="INJURED">INJURED</option>
                <option value="RECOVERING">RECOVERING</option>
              </select>
            </div>
          </div>

          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1 mt-6">Roster Players</h2>
          {loading ? (
            <div className="p-8 text-center text-slate-500 glass rounded-2xl">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading profiles...
            </div>
          ) : players.length === 0 ? (
            <div className="p-8 text-center text-slate-500 glass rounded-2xl text-xs">
              No players found.
            </div>
          ) : (
            <div className="space-y-3.5">
              {players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPlayer(p)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                    selectedPlayer?.id === p.id
                      ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-xs truncate">{p.user.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      p.fitnessStatus === 'FIT' ? 'bg-green-500/15 text-green-400 border border-green-500/25' :
                      p.fitnessStatus === 'INJURED' ? 'bg-red-500/15 text-red-400 border border-red-500/25' :
                      'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                    }`}>
                      {p.fitnessStatus}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    <span>{p.team?.name || 'Free Agent'}</span>
                    <span>{p.position || 'N/A'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Player full Details Card */}
        <div className="lg:col-span-3">
          {!selectedPlayer ? (
            <div className="p-20 text-center text-slate-500 glass rounded-3xl flex flex-col items-center justify-center gap-2">
              <Info className="h-10 w-10 text-slate-600" />
              <p className="text-sm">Select a player from the directory to review details and log fitness/suspension checkups.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Profile Card Header */}
              <div className="p-6 rounded-3xl glass border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(99,102,241,0.1)_0%,transparent_50%)] pointer-events-none" />
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-extrabold text-base">
                    {selectedPlayer.jerseyNumber ? `#${selectedPlayer.jerseyNumber}` : '#'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-white">{selectedPlayer.user.name}</h2>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>{selectedPlayer.user.email}</span>
                      <span>•</span>
                      <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px]">{selectedPlayer.position || 'No Position'}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-300">{selectedPlayer.team?.name || 'Free Agent'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 z-10 flex-wrap">
                  {(isSelf || isManagerOrAdmin) && (
                    <button
                      onClick={() => setActiveForm(activeForm === 'profile' ? null : 'profile')}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                    </button>
                  )}
                  {isMedicalOrCoachOrAdmin && (
                    <button
                      onClick={() => setActiveForm(activeForm === 'fitness' ? null : 'fitness')}
                      className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-xs font-semibold text-green-400 flex items-center gap-1.5"
                    >
                      <Heart className="h-3.5 w-3.5" /> Log Fitness
                    </button>
                  )}
                  {isOrganizerOrAdmin && (
                    <button
                      onClick={() => setActiveForm(activeForm === 'suspension' ? null : 'suspension')}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-semibold text-red-400 flex items-center gap-1.5"
                    >
                      <Ban className="h-3.5 w-3.5" /> Suspend
                    </button>
                  )}
                  {isManagerOrAdmin && (
                    <button
                      onClick={() => setActiveForm(activeForm === 'transfer' ? null : 'transfer')}
                      className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg text-xs font-semibold text-cyan-400 flex items-center gap-1.5"
                    >
                      <TrendingUp className="h-3.5 w-3.5" /> Log Transfer
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Forms Panel */}
              {activeForm === 'profile' && (
                <div className="p-6 rounded-2xl glass-dark border border-white/5 text-left">
                  <h3 className="text-sm font-bold text-white mb-4">Edit Profile details</h3>
                  <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Position</label>
                      <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="E.g. Striker, Midfielder"
                        className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Jersey Number</label>
                      <input
                        type="number"
                        value={jerseyNumber}
                        onChange={(e) => setJerseyNumber(parseInt(e.target.value) || 0)}
                        className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Birth Date</label>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-3 pl-1 pt-6">
                      <input
                        type="checkbox"
                        id="avail"
                        checked={availability}
                        onChange={(e) => setAvailability(e.target.checked)}
                        className="h-4 w-4 rounded border-white/10 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="avail" className="text-xs text-slate-300 cursor-pointer">Available for matches</label>
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-2 border-t border-white/5 pt-4 mt-2">
                      <button type="button" onClick={() => setActiveForm(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 text-xs font-semibold">Cancel</button>
                      <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                        {submitting && <Loader2 className="h-3 w-3 animate-spin" />} Save Profile
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeForm === 'fitness' && (
                <div className="p-6 rounded-2xl glass-dark border border-white/5 text-left">
                  <h3 className="text-sm font-bold text-white mb-4">Log Medical/Fitness Report</h3>
                  <form onSubmit={handleUpdateFitness} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Fitness Status</label>
                      <select
                        value={fitnessStatus}
                        onChange={(e) => setFitnessStatus(e.target.value as 'FIT' | 'INJURED' | 'RECOVERING')}
                        className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                      >
                        <option value="FIT">FIT</option>
                        <option value="INJURED">INJURED</option>
                        <option value="RECOVERING">RECOVERING</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Medical History Note</label>
                      <textarea
                        required
                        value={medicalNote}
                        onChange={(e) => setMedicalNote(e.target.value)}
                        placeholder="Log medical updates here (e.g. Minor hamstring pull, 2 weeks rest recommended)..."
                        rows={3}
                        className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
                      <button type="button" onClick={() => setActiveForm(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 text-xs font-semibold">Cancel</button>
                      <button type="submit" disabled={submitting} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                        {submitting && <Loader2 className="h-3 w-3 animate-spin" />} Submit Log
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeForm === 'suspension' && (
                <div className="p-6 rounded-2xl glass-dark border border-white/5 text-left">
                  <h3 className="text-sm font-bold text-white mb-4">Set Discipline Suspension</h3>
                  <form onSubmit={handleUpdateSuspension} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Suspension End Date (Leave empty to clear suspension)</label>
                      <input
                        type="date"
                        value={suspensionEnd}
                        onChange={(e) => setSuspensionEnd(e.target.value)}
                        className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
                      <button type="button" onClick={() => setActiveForm(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 text-xs font-semibold">Cancel</button>
                      <button type="submit" disabled={submitting} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                        {submitting && <Loader2 className="h-3 w-3 animate-spin" />} Save Suspension
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeForm === 'transfer' && (
                <div className="p-6 rounded-2xl glass-dark border border-white/5 text-left">
                  <h3 className="text-sm font-bold text-white mb-4">Log Career Club Transfer</h3>
                  <form onSubmit={handleUpdateTransfer} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select Target Team (Choose blank for Free Agent)</label>
                      <select
                        value={toTeamId}
                        onChange={(e) => setToTeamId(e.target.value)}
                        className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                      >
                        <option value="">Free Agent / No Team</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
                      <button type="button" onClick={() => setActiveForm(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 text-xs font-semibold">Cancel</button>
                      <button type="submit" disabled={submitting} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                        {submitting && <Loader2 className="h-3 w-3 animate-spin" />} Complete Transfer
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Roster profiles / history info logs split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left: Medical cards history */}
                <div className="p-5 rounded-2xl glass-dark border border-white/5 text-left space-y-3">
                  <h3 className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-green-400" /> Medical & Fitness Logs
                  </h3>
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-400">Current Status:</span>
                      <span className={`font-bold ${
                        selectedPlayer.fitnessStatus === 'FIT' ? 'text-green-400' :
                        selectedPlayer.fitnessStatus === 'INJURED' ? 'text-red-400' : 'text-amber-400'
                      }`}>{selectedPlayer.fitnessStatus}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Available for Selection:</span>
                      <span className="text-white font-bold">{selectedPlayer.availability ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 text-[11px] font-mono whitespace-pre-line max-h-32 overflow-y-auto text-slate-400 scrollbar">
                    {selectedPlayer.medicalHistory || 'No previous medical history recorded.'}
                  </div>
                </div>

                {/* Right: Suspension & transfers lists */}
                <div className="p-5 rounded-2xl glass-dark border border-white/5 text-left space-y-4">
                  
                  {/* Discipline / Suspensions */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 flex items-center gap-1.5 mb-2">
                      <Ban className="h-4 w-4 text-red-400" /> Disciplinary Board
                    </h3>
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs">
                      {selectedPlayer.suspensionEnd && new Date(selectedPlayer.suspensionEnd) > new Date() ? (
                        <div className="text-red-400 font-semibold flex items-center gap-2">
                          <span className="h-2 w-2 bg-red-500 rounded-full animate-ping" />
                          Suspended until {new Date(selectedPlayer.suspensionEnd).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-green-400 font-semibold">No active suspensions. Clear to play.</span>
                      )}
                    </div>
                  </div>

                  {/* Career Transfers */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 flex items-center gap-1.5 mb-2">
                      <Calendar className="h-4 w-4 text-cyan-400" /> Career Club Transfers
                    </h3>
                    <div className="max-h-28 overflow-y-auto space-y-2.5 text-[10px] scrollbar">
                      {!selectedPlayer.transferHistory || selectedPlayer.transferHistory.length === 0 ? (
                        <div className="text-slate-500 italic py-1 pl-1">No career transfers logged.</div>
                      ) : (
                        selectedPlayer.transferHistory.map((log: TransferLog, idx: number) => (
                          <div key={idx} className="p-2 bg-white/5 border border-white/5 rounded-lg flex justify-between items-center">
                            <div>
                              <span className="text-slate-400">{log.fromTeamName}</span>
                              <span className="text-indigo-400 font-bold mx-1.5">→</span>
                              <span className="text-white font-bold">{log.toTeamName}</span>
                            </div>
                            <span className="text-slate-500">{new Date(log.date).toLocaleDateString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
