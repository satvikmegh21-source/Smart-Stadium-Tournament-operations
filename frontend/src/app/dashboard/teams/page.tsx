'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  Shield, 
  Users, 
  UserPlus, 
  UserMinus,
  Briefcase,
  Plus, 
  Loader2, 
  Check, 
  AlertTriangle,
  Info,
  Palette
} from 'lucide-react';

interface Coach {
  id: string;
  licenseLevel: string | null;
  user: { name: string; email: string };
}

interface Player {
  id: string;
  position: string | null;
  jerseyNumber: number | null;
  teamId?: string | null;
  user: { name: string; email: string };
}

interface Team {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  coachId: string | null;
  coach: Coach | null;
  players?: Player[];
  _count?: { players: number };
}

export default function TeamsPage() {
  const { user } = useAuth();
  
  // Data states
  const [teams, setTeams] = useState<Team[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [unassignedPlayers, setUnassignedPlayers] = useState<Player[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // UI states
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#10b981');
  const [submitting, setSubmitting] = useState(false);

  // Assignment states
  const [assigningCoach, setAssigningCoach] = useState(false);
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [assigningPlayer, setAssigningPlayer] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teams');
      setTeams(res.data.data);
      if (res.data.data.length > 0 && !selectedTeam) {
        fetchTeamDetails(res.data.data[0].id);
      }
    } catch (e) {
      console.error('Error fetching teams', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamDetails = async (id: string) => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`/teams/${id}`);
      setSelectedTeam(res.data.data);
    } catch (e) {
      console.error('Error fetching team details', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchCoachesAndPlayers = async () => {
    try {
      const [coachesRes, playersRes] = await Promise.all([
        api.get('/coaches'),
        api.get('/players')
      ]);
      setCoaches(coachesRes.data.data);
      
      // Filter players that are unassigned
      const playersList = playersRes.data.data as Player[];
      // Filter out players who have teamId (since we return team details)
      const freeAgents = playersList.filter(p => !p.teamId);
      setUnassignedPlayers(freeAgents);
    } catch (e) {
      console.error('Error fetching details', e);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchCoachesAndPlayers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectTeam = (id: string) => {
    fetchTeamDetails(id);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setActionError(null);
    setSubmitting(true);

    try {
      await api.post('/teams', {
        name,
        primaryColor,
        secondaryColor
      });
      setActionSuccess('Team created successfully!');
      setShowCreateModal(false);
      setName('');
      fetchTeams();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Creation failed';
      setActionError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignCoachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !selectedCoachId) return;
    setAssigningCoach(true);
    setActionError(null);

    try {
      await api.post('/teams/assign-coach', {
        teamId: selectedTeam.id,
        coachId: selectedCoachId
      });
      setActionSuccess('Coach assigned to team.');
      setSelectedCoachId('');
      fetchTeamDetails(selectedTeam.id);
      fetchCoachesAndPlayers();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Assignment failed';
      setActionError(errorMsg);
    } finally {
      setAssigningCoach(false);
    }
  };

  const handleAssignPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !selectedPlayerId) return;
    setAssigningPlayer(true);
    setActionError(null);

    try {
      await api.post('/teams/assign-player', {
        teamId: selectedTeam.id,
        playerId: selectedPlayerId
      });
      setActionSuccess('Player assigned to team.');
      setSelectedPlayerId('');
      fetchTeamDetails(selectedTeam.id);
      fetchCoachesAndPlayers();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Assignment failed';
      setActionError(errorMsg);
    } finally {
      setAssigningPlayer(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!selectedTeam) return;
    setActionError(null);

    try {
      await api.post('/teams/remove-player', { playerId });
      setActionSuccess('Player removed from team roster.');
      fetchTeamDetails(selectedTeam.id);
      fetchCoachesAndPlayers();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Removal failed';
      setActionError(errorMsg);
    }
  };

  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'TEAM_MANAGER';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-indigo-400" /> Team Directories & Rosters
          </h1>
          <p className="text-slate-400 text-sm mt-1">Register teams, assign coaching contracts, and check player rosters.</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/10 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Create Team
          </button>
        )}
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

      {/* Grid: Left team list vs right details */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left list of clubs */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Registered Clubs</h2>
          {loading ? (
            <div className="p-8 text-center text-slate-500 glass rounded-2xl">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading clubs...
            </div>
          ) : teams.length === 0 ? (
            <div className="p-8 text-center text-slate-500 glass rounded-2xl text-xs">
              No registered clubs. Create one above.
            </div>
          ) : (
            <div className="space-y-3.5">
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTeam(t.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                    selectedTeam?.id === t.id
                      ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {/* Color bar indicator */}
                  <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: t.primaryColor }} />
                  
                  <div className="font-bold text-sm truncate pl-1">{t.name}</div>
                  <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider pl-1">
                    <span>{t.coach?.user.name ? 'Coach: ' + t.coach.user.name.split(' ')[0] : 'No Coach'}</span>
                    <span>{t._count?.players || 0} Players</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right side: Detailed roster views */}
        <div className="lg:col-span-3">
          {loadingDetails ? (
            <div className="p-20 text-center text-slate-500 glass rounded-3xl">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" /> Fetching club roster...
            </div>
          ) : !selectedTeam ? (
            <div className="p-20 text-center text-slate-500 glass rounded-3xl flex flex-col items-center justify-center gap-2">
              <Info className="h-10 w-10 text-slate-600" />
              <p className="text-sm">Select a club from the left panel to modify players/coaches and view active rosters.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Team Information Card */}
              <div className="p-6 rounded-3xl glass border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(99,102,241,0.1)_0%,transparent_50%)] pointer-events-none" />
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg border border-white/10" style={{ backgroundColor: selectedTeam.primaryColor }}>
                    {selectedTeam.name[0]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-white">{selectedTeam.name}</h2>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1"><Palette className="h-3.5 w-3.5" /> Colors:</span>
                      <span className="h-3 w-3 rounded-full border border-white/10" style={{ backgroundColor: selectedTeam.primaryColor }} />
                      <span className="h-3 w-3 rounded-full border border-white/10" style={{ backgroundColor: selectedTeam.secondaryColor }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignments Forms for Admins/Managers */}
              {canEdit && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assign Coach */}
                  <div className="p-5 rounded-2xl glass-dark border border-white/5 text-left">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-indigo-400" /> Contract Coach
                    </h3>
                    <form onSubmit={handleAssignCoachSubmit} className="flex gap-2">
                      <select
                        required
                        value={selectedCoachId}
                        onChange={(e) => setSelectedCoachId(e.target.value)}
                        className="flex-1 p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                      >
                        <option value="">Select coach</option>
                        {coaches.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.user.name} ({c.licenseLevel || 'No license level'})
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        disabled={assigningCoach || !selectedCoachId}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center justify-center"
                      >
                        {assigningCoach ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assign'}
                      </button>
                    </form>
                  </div>

                  {/* Assign Player */}
                  <div className="p-5 rounded-2xl glass-dark border border-white/5 text-left">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-indigo-400" /> Sign Player / Free Agent
                    </h3>
                    <form onSubmit={handleAssignPlayerSubmit} className="flex gap-2">
                      <select
                        required
                        value={selectedPlayerId}
                        onChange={(e) => setSelectedPlayerId(e.target.value)}
                        className="flex-1 p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                      >
                        <option value="">Select free agent</option>
                        {unassignedPlayers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.user.name} ({p.position || 'Unassigned position'})
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        disabled={assigningPlayer || !selectedPlayerId}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center justify-center"
                      >
                        {assigningPlayer ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Roster lists */}
              <div className="space-y-6">
                {/* Coach details */}
                <div className="p-5 rounded-2xl glass-dark border border-white/5 text-left">
                  <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                    Coaching Staff
                  </h3>
                  {!selectedTeam.coach ? (
                    <div className="text-slate-500 text-xs py-2">No head coach currently assigned to this team.</div>
                  ) : (
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                      <div>
                        <div className="font-bold text-white text-sm">{selectedTeam.coach.user.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{selectedTeam.coach.user.email}</div>
                      </div>
                      <span className="px-2.5 py-1 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-bold text-[10px] rounded uppercase">
                        License: {selectedTeam.coach.licenseLevel || 'N/A'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Player Roster */}
                <div className="p-5 rounded-2xl glass-dark border border-white/5 text-left">
                  <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                    Active Players ({selectedTeam.players?.length || 0})
                  </h3>
                  {!selectedTeam.players || selectedTeam.players.length === 0 ? (
                    <div className="text-slate-500 text-xs py-8 text-center">No active players on the roster. Sign players above.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTeam.players.map((player) => (
                        <div key={player.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs">
                              {player.jerseyNumber || '#'}
                            </div>
                            <div>
                              <div className="font-semibold text-white text-xs">{player.user.name}</div>
                              <div className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wider font-bold text-indigo-400">{player.position || 'Unassigned'}</div>
                            </div>
                          </div>
                          {canEdit && (
                            <button
                              onClick={() => handleRemovePlayer(player.id)}
                              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Release Player"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Team Slide-out Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-sm bg-slate-900 h-full shadow-2xl border-l border-white/5 flex flex-col p-8 overflow-y-auto text-left justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-indigo-400" /> Create Club / Team
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Register a new team. Define identity colors that will reflect across points tables and match scheduling items.
              </p>

              <form onSubmit={handleCreateTeam} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Team Name</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. Barcelona FC"
                    className="w-full p-3 border border-white/10 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-xs transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Primary Color</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-8 w-8 rounded border border-white/10 cursor-pointer bg-slate-950"
                      />
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{primaryColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Secondary Color</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="h-8 w-8 rounded border border-white/10 cursor-pointer bg-slate-950"
                      />
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{secondaryColor}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/15 disabled:opacity-50 mt-6"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register Club'}
                </button>
              </form>
            </div>
            
            <button
              onClick={() => setShowCreateModal(false)}
              className="py-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 font-semibold rounded-xl text-xs transition-all mt-8"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
