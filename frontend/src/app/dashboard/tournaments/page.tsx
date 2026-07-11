'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  Trophy, 
  Calendar, 
  Plus, 
  Loader2, 
  Check, 
  AlertTriangle,
  Info,
  MapPin,
  Clock,
  RefreshCw
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface Match {
  id: string;
  date: string;
  status: string;
  score1: number;
  score2: number;
  team1: { name: string };
  team2: { name: string };
  stadium: { name: string };
}

interface PointsTableEntry {
  id: string;
  teamId: string;
  team: { name: string };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

interface Tournament {
  id: string;
  name: string;
  format: string;
  startDate: string;
  endDate: string;
  prizeDetails: string | null;
  teams: Team[];
  matches?: Match[];
  pointsTables?: PointsTableEntry[];
}

export default function TournamentsPage() {
  const { user } = useAuth();
  
  // Data states
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'fixtures' | 'table'>('table');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [format, setFormat] = useState('LEAGUE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [prizeDetails, setPrizeDetails] = useState('');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tournaments');
      setTournaments(res.data.data);
      if (res.data.data.length > 0 && !selectedTournament) {
        fetchTournamentDetails(res.data.data[0].id);
      }
    } catch (e) {
      console.error('Error fetching tournaments', e);
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

  const fetchTournamentDetails = async (id: string) => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`/tournaments/${id}`);
      setSelectedTournament(res.data.data);
    } catch (e) {
      console.error('Error fetching tournament details', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
    fetchTeams();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectTournament = (id: string) => {
    fetchTournamentDetails(id);
  };

  const handleRecalculateTable = async (id: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.post(`/tournaments/${id}/recalculate`);
      setActionSuccess('Points table recalculated successfully.');
      fetchTournamentDetails(id);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Recalculation failed';
      setActionError(errorMsg);
    }
  };

  const handleTeamCheckbox = (teamId: string) => {
    if (selectedTeamIds.includes(teamId)) {
      setSelectedTeamIds(selectedTeamIds.filter(id => id !== teamId));
    } else {
      setSelectedTeamIds([...selectedTeamIds, teamId]);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate || selectedTeamIds.length < 2) {
      setActionError('Please fill in all fields and select at least 2 teams.');
      return;
    }
    setActionError(null);
    setSubmitting(true);

    try {
      await api.post('/tournaments', {
        name,
        format,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        prizeDetails: prizeDetails || undefined,
        teamIds: selectedTeamIds,
      });

      setActionSuccess('Tournament created and fixtures auto-scheduled!');
      setShowCreateModal(false);
      // Reset form
      setName('');
      setPrizeDetails('');
      setSelectedTeamIds([]);
      
      fetchTournaments();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Creation failed';
      setActionError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const canCreate = user?.role === 'SUPER_ADMIN' || user?.role === 'TOURNAMENT_ORGANIZER';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Trophy className="h-8 w-8 text-indigo-400" /> Tournaments & Leagues
          </h1>
          <p className="text-slate-400 text-sm mt-1">Configure active competitions, review schedules, and track points tallies.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/10 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Create Tournament
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

      {/* Layout Split: Tournament List vs Selected Details */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Tournaments list */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Competitions</h2>
          {loading ? (
            <div className="p-8 text-center text-slate-500 glass rounded-2xl">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading leagues...
            </div>
          ) : tournaments.length === 0 ? (
            <div className="p-8 text-center text-slate-500 glass rounded-2xl text-xs">
              No active tournaments. Create one to get started.
            </div>
          ) : (
            <div className="space-y-3.5">
              {tournaments.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTournament(t.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 ${
                    selectedTournament?.id === t.id
                      ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-sm truncate">{t.name}</div>
                  <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    <span>{t.format}</span>
                    <span>{new Date(t.startDate).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Tournament Details */}
        <div className="lg:col-span-3">
          {loadingDetails ? (
            <div className="p-20 text-center text-slate-500 glass rounded-3xl">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" /> Fetching tournament analytics...
            </div>
          ) : !selectedTournament ? (
            <div className="p-20 text-center text-slate-500 glass rounded-3xl flex flex-col items-center justify-center gap-2">
              <Info className="h-10 w-10 text-slate-600" />
              <p className="text-sm">Select a tournament from the left sidebar to view points tables and matches.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Selected Banner */}
              <div className="p-6 rounded-3xl glass border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(99,102,241,0.1)_0%,transparent_50%)] pointer-events-none" />
                <div>
                  <h2 className="text-2xl font-extrabold text-white">{selectedTournament.name}</h2>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold">{selectedTournament.format}</span>
                    <span>Starts: {new Date(selectedTournament.startDate).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Ends: {new Date(selectedTournament.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 z-10">
                  <button
                    onClick={() => handleRecalculateTable(selectedTournament.id)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
                    title="Recalculate standings"
                  >
                    <RefreshCw className="h-4 w-4" /> Recalculate
                  </button>
                </div>
              </div>

              {/* Tabs navigation */}
              <div className="flex border-b border-white/5">
                <button
                  onClick={() => setActiveTab('table')}
                  className={`px-6 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === 'table'
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Points Table
                </button>
                <button
                  onClick={() => setActiveTab('fixtures')}
                  className={`px-6 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === 'fixtures'
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Fixtures & Matches
                </button>
              </div>

              {/* Tab 1: Points Table */}
              {activeTab === 'table' && (
                <div className="p-6 rounded-3xl glass-dark border border-white/5">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="pb-3 pr-2">Club Name</th>
                          <th className="pb-3 px-2 text-center">PL</th>
                          <th className="pb-3 px-2 text-center">W</th>
                          <th className="pb-3 px-2 text-center">D</th>
                          <th className="pb-3 px-2 text-center">L</th>
                          <th className="pb-3 px-2 text-center">GF</th>
                          <th className="pb-3 px-2 text-center">GA</th>
                          <th className="pb-3 px-2 text-center">GD</th>
                          <th className="pb-3 pl-2 text-right">Points</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {!selectedTournament.pointsTables || selectedTournament.pointsTables.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-slate-500">
                              No points table data loaded.
                            </td>
                          </tr>
                        ) : (
                          selectedTournament.pointsTables.map((entry, idx) => (
                            <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-3.5 pr-2 font-semibold text-white flex items-center gap-3">
                                <span className="text-[10px] text-slate-500 font-bold w-4 text-center">{idx + 1}</span>
                                {entry.team.name}
                              </td>
                              <td className="py-3.5 px-2 text-center text-slate-300">{entry.played}</td>
                              <td className="py-3.5 px-2 text-center text-green-400">{entry.won}</td>
                              <td className="py-3.5 px-2 text-center text-slate-400">{entry.drawn}</td>
                              <td className="py-3.5 px-2 text-center text-red-400">{entry.lost}</td>
                              <td className="py-3.5 px-2 text-center text-slate-400">{entry.goalsFor}</td>
                              <td className="py-3.5 px-2 text-center text-slate-400">{entry.goalsAgainst}</td>
                              <td className="py-3.5 px-2 text-center text-slate-300 font-medium">
                                {entry.goalsFor - entry.goalsAgainst > 0 ? '+' : ''}{entry.goalsFor - entry.goalsAgainst}
                              </td>
                              <td className="py-3.5 pl-2 text-right font-extrabold text-indigo-400 text-sm">{entry.points}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 2: Fixtures */}
              {activeTab === 'fixtures' && (
                <div className="space-y-4">
                  {!selectedTournament.matches || selectedTournament.matches.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 glass rounded-3xl text-xs">
                      No matches scheduled for this tournament.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTournament.matches.map((match) => (
                        <div key={match.id} className="p-5 rounded-2xl glass-dark border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all">
                          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                              {new Date(match.date).toLocaleDateString()}
                            </span>
                            <span className={`px-2 py-0.5 rounded ${
                              match.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border border-green-500/25' :
                              match.status === 'LIVE' ? 'bg-red-500/10 text-red-400 border border-red-500/25 animate-pulse' :
                              'bg-white/5 text-slate-400 border border-white/5'
                            }`}>
                              {match.status}
                            </span>
                          </div>
                          
                          {/* Score Board */}
                          <div className="flex justify-between items-center my-3">
                            <span className="text-xs font-bold text-white max-w-[40%] truncate">{match.team1.name}</span>
                            <div className="px-3 py-1 rounded bg-slate-950 border border-white/5 text-center font-extrabold text-sm min-w-[70px]">
                              {match.status === 'SCHEDULED' ? 'v' : `${match.score1} - ${match.score2}`}
                            </div>
                            <span className="text-xs font-bold text-white max-w-[40%] truncate text-right">{match.team2.name}</span>
                          </div>

                          <div className="border-t border-white/5 pt-3.5 mt-3 flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-600" /> {match.stadium.name}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-slate-600" /> {new Date(match.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          
          {/* Content panel */}
          <div className="relative w-full max-w-lg bg-slate-900 h-full shadow-2xl border-l border-white/5 flex flex-col p-8 overflow-y-auto text-left">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-indigo-400" /> Schedule Tournament
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Enter competition parameters. The system will auto-allocate venues, assign referees, and build round-robin circles.
            </p>

            <form onSubmit={handleCreateTournament} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Tournament Name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g. Champions Premier League"
                  className="w-full p-3 border border-white/10 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-xs transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full p-3 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-xs transition-all"
                  >
                    <option value="LEAGUE">League</option>
                    <option value="KNOCKOUT">Knockout</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Prize Pool / Info</label>
                  <input
                    type="text"
                    value={prizeDetails}
                    onChange={(e) => setPrizeDetails(e.target.value)}
                    placeholder="E.g. $50,000 + Medals"
                    className="w-full p-3 border border-white/10 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-xs transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Start Date</label>
                  <input
                    required
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-3 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">End Date</label>
                  <input
                    required
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-3 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-xs transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Participating Teams ({selectedTeamIds.length} chosen)
                </label>
                <div className="border border-white/10 rounded-xl bg-slate-950 p-4 h-48 overflow-y-auto space-y-2.5">
                  {teams.length === 0 ? (
                    <div className="text-center text-slate-600 text-xs py-10">No clubs registered. Register teams first.</div>
                  ) : (
                    teams.map((team) => (
                      <label key={team.id} className="flex items-center gap-3 cursor-pointer text-xs text-slate-300 hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedTeamIds.includes(team.id)}
                          onChange={() => handleTeamCheckbox(team.id)}
                          className="h-4 w-4 rounded border-white/10 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{team.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 border-t border-white/5 pt-6 mt-8">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 font-semibold rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/15 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Schedule Tournament
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
