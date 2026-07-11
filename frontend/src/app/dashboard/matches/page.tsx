'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ShieldAlert, 
  Loader2, 
  Check, 
  AlertTriangle,
  Info,
  Tv
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface MatchEvent {
  id: string;
  type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'MILESTONE';
  minute: number;
  teamId: string | null;
  playerName: string;
  details: string;
  timestamp: string;
}

interface Match {
  id: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  score1: number;
  score2: number;
  date: string;
  team1Id: string;
  team2Id: string;
  team1: Team;
  team2: Team;
  stadium: { name: string; city: string; capacity: number };
  referee: { user: { name: string } } | null;
  liveTimelineJson: MatchEvent[] | null;
}

export default function MatchesPage() {
  const { user } = useAuth();
  
  // Data states
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // UX states
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Controls triggers
  const [activeForm, setActiveForm] = useState<'score' | 'status' | 'event' | null>(null);

  // Form states
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [matchStatus, setMatchStatus] = useState<'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'>('SCHEDULED');
  const [eventType, setEventType] = useState<'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'MILESTONE'>('GOAL');
  const [eventMinute, setEventMinute] = useState(45);
  const [eventTeamId, setEventTeamId] = useState('');
  const [eventPlayerName, setEventPlayerName] = useState('');
  const [eventDetails, setEventDetails] = useState('');

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/matches');
      setMatches(res.data.data);
      if (res.data.data.length > 0 && !selectedMatch) {
        fetchMatchDetails(res.data.data[0].id);
      }
    } catch (e) {
      console.error('Error fetching matches', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchDetails = async (id: string) => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`/matches/${id}`);
      const data = res.data.data as Match;
      setSelectedMatch(data);
      setScore1(data.score1);
      setScore2(data.score2);
      setMatchStatus(data.status);
      setEventTeamId(data.team1Id);
    } catch (e) {
      console.error('Error fetching match details', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectMatch = (id: string) => {
    fetchMatchDetails(id);
    setActiveForm(null);
  };

  // Update Score
  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await api.post(`/matches/${selectedMatch.id}/score`, { score1, score2 });
      setActionSuccess('Scores updated.');
      setSelectedMatch({ ...selectedMatch, score1: res.data.data.score1, score2: res.data.data.score2 });
      fetchMatches();
      setActiveForm(null);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Score update failed';
      setActionError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Update Status
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await api.post(`/matches/${selectedMatch.id}/status`, { status: matchStatus });
      setActionSuccess('Match status updated successfully.');
      setSelectedMatch({ ...selectedMatch, status: res.data.data.status });
      fetchMatches();
      setActiveForm(null);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Status transition failed';
      setActionError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Add Event
  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch || !eventPlayerName) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await api.post(`/matches/${selectedMatch.id}/events`, {
        type: eventType,
        minute: eventMinute,
        teamId: eventTeamId || null,
        playerName: eventPlayerName,
        details: eventDetails
      });
      setActionSuccess('Match event logged.');
      setSelectedMatch({ ...selectedMatch, liveTimelineJson: res.data.data.liveTimelineJson });
      setEventPlayerName('');
      setEventDetails('');
      setActiveForm(null);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Event logging failed';
      setActionError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const isOfficial = user?.role === 'SUPER_ADMIN' || user?.role === 'REFEREE';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Tv className="h-8 w-8 text-indigo-400 animate-pulse" /> Live Match Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review active scoreboards, event timetables, and referee operations panels.</p>
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

      {/* Split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Match Schedule lists */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Game Fixtures</h2>
          {loading ? (
            <div className="p-8 text-center text-slate-500 glass rounded-2xl">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading match logs...
            </div>
          ) : matches.length === 0 ? (
            <div className="p-8 text-center text-slate-500 glass rounded-2xl text-xs">
              No tournament matches scheduled.
            </div>
          ) : (
            <div className="space-y-3.5">
              {matches.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelectMatch(m.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                    selectedMatch?.id === m.id
                      ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-2.5">
                    <span>{new Date(m.date).toLocaleDateString()}</span>
                    <span className={`px-1.5 py-0.5 rounded ${
                      m.status === 'LIVE' ? 'bg-red-500/15 text-red-400 border border-red-500/25 animate-pulse' :
                      m.status === 'COMPLETED' ? 'bg-green-500/15 text-green-400 border border-green-500/25' :
                      'bg-white/5 text-slate-500'
                    }`}>{m.status}</span>
                  </div>
                  <div className="font-bold text-xs truncate flex justify-between items-center">
                    <span className="truncate max-w-[40%]">{m.team1.name}</span>
                    <span className="font-mono text-indigo-400 px-1 font-extrabold">
                      {m.status === 'SCHEDULED' ? 'v' : `${m.score1}-${m.score2}`}
                    </span>
                    <span className="truncate max-w-[40%] text-right">{m.team2.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Focus Match board */}
        <div className="lg:col-span-3">
          {loadingDetails ? (
            <div className="p-20 text-center text-slate-500 glass rounded-3xl">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" /> Syncing live scoreboard...
            </div>
          ) : !selectedMatch ? (
            <div className="p-20 text-center text-slate-500 glass rounded-3xl flex flex-col items-center justify-center gap-2">
              <Info className="h-10 w-10 text-slate-600" />
              <p className="text-sm">Select a match from the sidebar to inspect match center timelines or update status.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Scoreboard display */}
              <div className="p-8 rounded-3xl glass border border-white/5 relative overflow-hidden text-center space-y-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)] pointer-events-none" />
                
                {/* Status indicator */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-white/5 text-[10px] uppercase font-bold text-slate-400">
                  {selectedMatch.status === 'LIVE' && <span className="h-2 w-2 bg-red-500 rounded-full animate-ping" />}
                  <span>Status: {selectedMatch.status}</span>
                </div>

                {/* Score Panel */}
                <div className="flex justify-between items-center max-w-xl mx-auto py-2">
                  {/* Team 1 */}
                  <div className="w-[35%] flex flex-col items-center gap-2">
                    <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-extrabold text-lg">
                      {selectedMatch.team1.name[0]}
                    </div>
                    <span className="font-extrabold text-white text-xs text-center truncate w-full">{selectedMatch.team1.name}</span>
                  </div>

                  {/* score digit */}
                  <div className="flex items-center justify-center font-mono text-5xl font-extrabold text-white gap-6">
                    <span>{selectedMatch.status === 'SCHEDULED' ? '0' : selectedMatch.score1}</span>
                    <span className="text-slate-600 text-4xl">:</span>
                    <span>{selectedMatch.status === 'SCHEDULED' ? '0' : selectedMatch.score2}</span>
                  </div>

                  {/* Team 2 */}
                  <div className="w-[35%] flex flex-col items-center gap-2">
                    <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-extrabold text-lg">
                      {selectedMatch.team2.name[0]}
                    </div>
                    <span className="font-extrabold text-white text-xs text-center truncate w-full">{selectedMatch.team2.name}</span>
                  </div>
                </div>

                {/* Stadium details */}
                <div className="border-t border-white/5 pt-4 flex flex-wrap justify-center gap-x-8 gap-y-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-indigo-400" /> {selectedMatch.stadium.name}, {selectedMatch.stadium.city}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-indigo-400" /> {new Date(selectedMatch.date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-indigo-400" /> {new Date(selectedMatch.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  {selectedMatch.referee && <span className="flex items-center gap-1.5"><ShieldAlert className="h-4 w-4 text-indigo-400" /> Ref: {selectedMatch.referee.user.name}</span>}
                </div>
              </div>

              {/* Referee Official Tools */}
              {isOfficial && (
                <div className="p-5 rounded-3xl glass-dark border border-white/5 text-left">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Official Referee Control Panel</h3>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => setActiveForm(activeForm === 'score' ? null : 'score')}
                      className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 font-semibold hover:bg-white/10"
                    >
                      Record Score
                    </button>
                    <button
                      onClick={() => setActiveForm(activeForm === 'status' ? null : 'status')}
                      className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 font-semibold hover:bg-white/10"
                    >
                      Transition Status
                    </button>
                    <button
                      onClick={() => setActiveForm(activeForm === 'event' ? null : 'event')}
                      className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 font-semibold hover:bg-white/10"
                    >
                      Log Match Event
                    </button>
                  </div>

                  {/* Form: Record Score */}
                  {activeForm === 'score' && (
                    <form onSubmit={handleScoreSubmit} className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex items-end gap-4 max-w-md">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">{selectedMatch.team1.name} Score</label>
                        <input
                          type="number"
                          value={score1}
                          onChange={(e) => setScore1(parseInt(e.target.value) || 0)}
                          className="w-20 p-2 border border-white/10 rounded-lg bg-slate-900 text-white focus:outline-none text-xs"
                        />
                      </div>
                      <span className="text-white pb-2 font-bold">:</span>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">{selectedMatch.team2.name} Score</label>
                        <input
                          type="number"
                          value={score2}
                          onChange={(e) => setScore2(parseInt(e.target.value) || 0)}
                          className="w-20 p-2 border border-white/10 rounded-lg bg-slate-900 text-white focus:outline-none text-xs"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1 disabled:opacity-50 ml-auto"
                      >
                        {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save Score
                      </button>
                    </form>
                  )}

                  {/* Form: Transition Status */}
                  {activeForm === 'status' && (
                    <form onSubmit={handleStatusSubmit} className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex items-end gap-4 max-w-sm">
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-400 mb-1">State</label>
                        <select
                          value={matchStatus}
                          onChange={(e) => setMatchStatus(e.target.value as 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED')}
                          className="w-full p-2 border border-white/10 rounded-lg bg-slate-900 text-white focus:outline-none text-xs"
                        >
                          <option value="SCHEDULED">Scheduled</option>
                          <option value="LIVE">LIVE / In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1 disabled:opacity-50"
                      >
                        {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Transition
                      </button>
                    </form>
                  )}

                  {/* Form: Log Match Event */}
                  {activeForm === 'event' && (
                    <form onSubmit={handleEventSubmit} className="p-4 rounded-xl bg-slate-950/60 border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Event Type</label>
                        <select
                          value={eventType}
                          onChange={(e) => setEventType(e.target.value as 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'MILESTONE')}
                          className="w-full p-2 border border-white/10 rounded-lg bg-slate-900 text-white focus:outline-none text-xs"
                        >
                          <option value="GOAL">Goal</option>
                          <option value="YELLOW_CARD">Yellow Card</option>
                          <option value="RED_CARD">Red Card</option>
                          <option value="SUBSTITUTION">Substitution</option>
                          <option value="MILESTONE">Milestone</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Minute</label>
                          <input
                            type="number"
                            value={eventMinute}
                            onChange={(e) => setEventMinute(parseInt(e.target.value) || 45)}
                            className="w-full p-2 border border-white/10 rounded-lg bg-slate-900 text-white focus:outline-none text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Team Involved</label>
                          <select
                            value={eventTeamId}
                            onChange={(e) => setEventTeamId(e.target.value)}
                            className="w-full p-2 border border-white/10 rounded-lg bg-slate-900 text-white focus:outline-none text-xs"
                          >
                            <option value="">None / Both</option>
                            <option value={selectedMatch.team1Id}>{selectedMatch.team1.name}</option>
                            <option value={selectedMatch.team2Id}>{selectedMatch.team2.name}</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Player Name</label>
                        <input
                          required
                          type="text"
                          value={eventPlayerName}
                          onChange={(e) => setEventPlayerName(e.target.value)}
                          placeholder="E.g. Lionel Messi"
                          className="w-full p-2 border border-white/10 rounded-lg bg-slate-900 text-white focus:outline-none text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Details (Optional)</label>
                        <input
                          type="text"
                          value={eventDetails}
                          onChange={(e) => setEventDetails(e.target.value)}
                          placeholder="E.g. Assist by X, Penalty kick, etc."
                          className="w-full p-2 border border-white/10 rounded-lg bg-slate-900 text-white focus:outline-none text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2 flex justify-end gap-2 border-t border-white/5 pt-4">
                        <button type="button" onClick={() => setActiveForm(null)} className="px-4 py-2 bg-white/5 rounded-lg text-slate-300 text-xs font-semibold">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Log Event
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Event Timeline Stream */}
              <div className="p-6 rounded-3xl glass-dark border border-white/5 text-left">
                <h3 className="text-sm font-bold text-white mb-4">Match Event Log</h3>
                
                {!selectedMatch.liveTimelineJson || selectedMatch.liveTimelineJson.length === 0 ? (
                  <div className="text-center text-slate-500 py-12 text-xs flex flex-col items-center justify-center gap-2">
                    <Info className="h-8 w-8 text-slate-600" />
                    <span>No match events logged yet. Timeline begins when the referee kicks off the game.</span>
                  </div>
                ) : (
                  <div className="relative border-l border-white/10 pl-6 ml-2 space-y-6">
                    {selectedMatch.liveTimelineJson.map((event) => (
                      <div key={event.id} className="relative">
                        {/* Bullet Icon */}
                        <div className="absolute left-[-31px] top-1 h-3 w-3 rounded-full border border-indigo-500 bg-slate-950 flex items-center justify-center" />
                        
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-indigo-400 font-bold text-xs">{event.minute}&apos;</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            event.type === 'GOAL' ? 'bg-green-500/10 text-green-400 border border-green-500/25' :
                            event.type === 'YELLOW_CARD' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                            event.type === 'RED_CARD' ? 'bg-red-500/10 text-red-400 border border-red-500/25' :
                            'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                          }`}>{event.type}</span>
                          <span className="font-bold text-white text-xs">{event.playerName}</span>
                        </div>
                        {event.details && <p className="text-[10px] text-slate-400 mt-1 pl-8 font-medium">{event.details}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
