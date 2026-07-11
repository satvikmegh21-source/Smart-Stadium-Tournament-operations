'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  Calendar, 
  Plus, 
  Loader2, 
  Check, 
  AlertTriangle,
  Info,
  Clock,
  UserCheck,
  Award,
  Sparkles
} from 'lucide-react';

interface Player {
  id: string;
  user: { name: string };
}

interface TrainingSession {
  id: string;
  date: string;
  title: string;
  description: string;
  durationMinutes: number;
  attendance: Record<string, boolean>; // playerId -> present
}

interface PerformanceLog {
  id: string;
  playerId: string;
  playerName: string;
  rating: number;
  feedback: string;
  date: string;
}

interface Coach {
  id: string;
  userId: string;
  licenseLevel: string | null;
  trainingSessions: TrainingSession[] | null;
  performanceLogs: PerformanceLog[] | null;
  user: { name: string; email: string };
  team: { id: string; name: string; players?: Player[] } | null;
}

export default function CoachesPage() {
  const { user } = useAuth();
  
  // Data states
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  
  // UX states
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal / Form triggers
  const [activeForm, setActiveForm] = useState<'session' | 'attendance' | 'performance' | null>(null);
  const [activeSession, setActiveSession] = useState<TrainingSession | null>(null);

  // Forms inputs
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDesc, setSessionDesc] = useState('');
  const [sessionDuration, setSessionDuration] = useState(60);
  const [sessionDate, setSessionDate] = useState('');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [rating, setRating] = useState(8);
  const [feedback, setFeedback] = useState('');

  const fetchCoaches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coaches');
      setCoaches(res.data.data);
      
      // Auto-select logged-in coach if possible
      const loggedInCoach = (res.data.data as Coach[]).find(c => c.user.email === user?.email);
      if (loggedInCoach) {
        fetchCoachDetails(loggedInCoach.id);
      } else if (res.data.data.length > 0) {
        fetchCoachDetails(res.data.data[0].id);
      }
    } catch (e) {
      console.error('Error fetching coaches', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoachDetails = async (id: string) => {
    try {
      const res = await api.get(`/coaches/${id}`);
      const coachData = res.data.data as Coach;
      
      // Fetch their team players list separately by querying team details
      if (coachData.team) {
        const teamRes = await api.get(`/teams/${coachData.team.id}`);
        coachData.team.players = teamRes.data.data.players;
      }
      
      setSelectedCoach(coachData);
    } catch (e) {
      console.error('Error fetching coach details', e);
    }
  };

  useEffect(() => {
    fetchCoaches();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectCoach = (id: string) => {
    fetchCoachDetails(id);
    setActiveForm(null);
  };

  // Plan Session
  const handlePlanSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoach || !sessionTitle || !sessionDate) return;
    setSubmitting(true);
    setActionError(null);

    try {
      await api.post(`/coaches/${selectedCoach.id}/sessions`, {
        title: sessionTitle,
        description: sessionDesc,
        durationMinutes: sessionDuration,
        date: new Date(sessionDate).toISOString()
      });
      setActionSuccess('Training session planned successfully!');
      setSessionTitle('');
      setSessionDesc('');
      setSessionDate('');
      fetchCoachDetails(selectedCoach.id);
      setActiveForm(null);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to plan session';
      setActionError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Attendance Sheet
  const handleOpenAttendance = (session: TrainingSession) => {
    setActiveSession(session);
    setActiveForm('attendance');
    
    // Pre-fill attendance checklist
    const currentAttendance = session.attendance || {};
    const newMap: Record<string, boolean> = {};
    selectedCoach?.team?.players?.forEach(p => {
      newMap[p.id] = currentAttendance[p.id] !== undefined ? currentAttendance[p.id] : true;
    });
    setAttendanceMap(newMap);
  };

  // Submit Attendance
  const handleLogAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoach || !activeSession) return;
    setSubmitting(true);
    setActionError(null);

    try {
      await api.post(`/coaches/${selectedCoach.id}/attendance`, {
        sessionId: activeSession.id,
        attendanceMap
      });
      setActionSuccess('Session attendance logged.');
      fetchCoachDetails(selectedCoach.id);
      setActiveForm(null);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to log attendance';
      setActionError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Performance Card
  const handlePerformanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoach || !selectedPlayerId || !feedback) return;
    setSubmitting(true);
    setActionError(null);

    try {
      await api.post(`/coaches/${selectedCoach.id}/performance`, {
        playerId: selectedPlayerId,
        rating,
        feedback
      });
      setActionSuccess('Performance card submitted.');
      setSelectedPlayerId('');
      setFeedback('');
      fetchCoachDetails(selectedCoach.id);
      setActiveForm(null);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit report';
      setActionError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Permissions helpers
  const isOwner = selectedCoach?.userId === user?.id;
  const isOwnerOrAdmin = isOwner || user?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Award className="h-8 w-8 text-indigo-400" /> Coaching Hub
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review coaching credentials, schedule training sessions, and submit player reports.</p>
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
        
        {/* Left column: Coaches List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Coaching Staff</h2>
          {loading ? (
            <div className="p-8 text-center text-slate-500 glass rounded-2xl">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading coaches...
            </div>
          ) : coaches.length === 0 ? (
            <div className="p-8 text-center text-slate-500 glass rounded-2xl text-xs">
              No coaches registered in the system.
            </div>
          ) : (
            <div className="space-y-3.5">
              {coaches.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCoach(c.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 ${
                    selectedCoach?.id === c.id
                      ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-sm truncate">{c.user.name}</div>
                  <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    <span>{c.team?.name || 'No Contract'}</span>
                    <span>License: {c.licenseLevel || 'N/A'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Coach portal workspaces */}
        <div className="lg:col-span-3">
          {!selectedCoach ? (
            <div className="p-20 text-center text-slate-500 glass rounded-3xl flex flex-col items-center justify-center gap-2">
              <Info className="h-10 w-10 text-slate-600" />
              <p className="text-sm">Select a head coach from the sidebar to inspect schedules and submit team reports.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Profile Card Header */}
              <div className="p-6 rounded-3xl glass border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(99,102,241,0.1)_0%,transparent_50%)] pointer-events-none" />
                <div>
                  <h2 className="text-2xl font-extrabold text-white">{selectedCoach.user.name}</h2>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>{selectedCoach.user.email}</span>
                    <span>•</span>
                    <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px]">Head Coach</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-300">{selectedCoach.team?.name || 'Free Agent'}</span>
                  </div>
                </div>

                {isOwnerOrAdmin && (
                  <div className="flex gap-2 z-10">
                    <button
                      onClick={() => setActiveForm(activeForm === 'session' ? null : 'session')}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" /> Plan Training
                    </button>
                    <button
                      onClick={() => setActiveForm(activeForm === 'performance' ? null : 'performance')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Sparkles className="h-4 w-4" /> Performance Card
                    </button>
                  </div>
                )}
              </div>

              {/* Forms Panels */}
              {activeForm === 'session' && (
                <div className="p-6 rounded-2xl glass-dark border border-white/5 text-left">
                  <h3 className="text-sm font-bold text-white mb-4">Plan Training Exercise</h3>
                  <form onSubmit={handlePlanSession} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Session Title</label>
                      <input
                        required
                        type="text"
                        value={sessionTitle}
                        onChange={(e) => setSessionTitle(e.target.value)}
                        placeholder="E.g. Tactical Corner Drills"
                        className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Duration (Minutes)</label>
                      <input
                        required
                        type="number"
                        value={sessionDuration}
                        onChange={(e) => setSessionDuration(parseInt(e.target.value) || 0)}
                        className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Session Date / Time</label>
                      <input
                        required
                        type="datetime-local"
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Exercise Details</label>
                      <input
                        type="text"
                        value={sessionDesc}
                        onChange={(e) => setSessionDesc(e.target.value)}
                        placeholder="Target focus, setup instructions..."
                        className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-2 border-t border-white/5 pt-4 mt-2">
                      <button type="button" onClick={() => setActiveForm(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 text-xs font-semibold">Cancel</button>
                      <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                        {submitting && <Loader2 className="h-3 w-3 animate-spin" />} Plan Session
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeForm === 'attendance' && activeSession && (
                <div className="p-6 rounded-2xl glass-dark border border-white/5 text-left">
                  <h3 className="text-sm font-bold text-white mb-2">Attendance Check-in</h3>
                  <p className="text-xs text-slate-400 mb-4">Log player presence for session: <strong>{activeSession.title}</strong></p>
                  
                  {!selectedCoach.team?.players || selectedCoach.team.players.length === 0 ? (
                    <div className="text-slate-500 text-xs py-4 text-center">No active players to mark attendance.</div>
                  ) : (
                    <form onSubmit={handleLogAttendanceSubmit} className="space-y-4">
                      <div className="border border-white/10 rounded-xl bg-slate-950 p-4 max-h-48 overflow-y-auto space-y-2.5">
                        {selectedCoach.team.players.map((p) => (
                          <label key={p.id} className="flex items-center justify-between cursor-pointer text-xs text-slate-300 hover:text-white transition-colors">
                            <span>{p.user.name}</span>
                            <input
                              type="checkbox"
                              checked={attendanceMap[p.id] !== false}
                              onChange={(e) => setAttendanceMap({ ...attendanceMap, [p.id]: e.target.checked })}
                              className="h-4 w-4 rounded border-white/10 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                            />
                          </label>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
                        <button type="button" onClick={() => { setActiveForm(null); setActiveSession(null); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 text-xs font-semibold">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                          {submitting && <Loader2 className="h-3 w-3 animate-spin" />} Log Attendance
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {activeForm === 'performance' && (
                <div className="p-6 rounded-2xl glass-dark border border-white/5 text-left">
                  <h3 className="text-sm font-bold text-white mb-4">Log Player Performance Card</h3>
                  {!selectedCoach.team?.players || selectedCoach.team.players.length === 0 ? (
                    <div className="text-slate-500 text-xs py-4 text-center">No active players to evaluate.</div>
                  ) : (
                    <form onSubmit={handlePerformanceSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select Player</label>
                          <select
                            required
                            value={selectedPlayerId}
                            onChange={(e) => setSelectedPlayerId(e.target.value)}
                            className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                          >
                            <option value="">Choose player</option>
                            {selectedCoach.team.players.map(p => (
                              <option key={p.id} value={p.id}>{p.user.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Rating (1 to 10)</label>
                          <input
                            required
                            type="number"
                            min={1}
                            max={10}
                            value={rating}
                            onChange={(e) => setRating(parseInt(e.target.value) || 8)}
                            className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Evaluation Feedback</label>
                        <textarea
                          required
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Tactical performance, speed drills results, physical shape remarks..."
                          rows={3}
                          className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
                        <button type="button" onClick={() => setActiveForm(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 text-xs font-semibold">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                          {submitting && <Loader2 className="h-3 w-3 animate-spin" />} Submit Card
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Training sessions checklist and performance lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left: Planned sessions */}
                <div className="p-5 rounded-2xl glass-dark border border-white/5 text-left space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-indigo-400" /> Training Schedule
                  </h3>
                  
                  {!selectedCoach.trainingSessions || selectedCoach.trainingSessions.length === 0 ? (
                    <div className="text-slate-500 text-xs py-8 text-center">No exercises or sessions currently scheduled.</div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto scrollbar">
                      {selectedCoach.trainingSessions.map((session) => (
                        <div key={session.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-xs text-white">{session.title}</h4>
                              {isOwnerOrAdmin && (
                                <button
                                  onClick={() => handleOpenAttendance(session)}
                                  className="px-2 py-0.5 rounded bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-400 font-bold text-[9px] uppercase tracking-wide transition-all"
                                >
                                  Mark Attendance
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">{session.description || 'No description'}</p>
                          </div>
                          
                          <div className="border-t border-white/5 pt-3 mt-3 flex justify-between items-center text-[9px] text-slate-500 font-semibold">
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {session.durationMinutes} Mins</span>
                            <span>Date: {new Date(session.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Performance Logs list */}
                <div className="p-5 rounded-2xl glass-dark border border-white/5 text-left space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-emerald-400" /> Performance Evaluator
                  </h3>

                  {!selectedCoach.performanceLogs || selectedCoach.performanceLogs.length === 0 ? (
                    <div className="text-slate-500 text-xs py-8 text-center">No player performance reviews logged.</div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto scrollbar">
                      {selectedCoach.performanceLogs.map((log) => (
                        <div key={log.id} className="p-4 rounded-xl bg-white/5 border border-white/5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-white">{log.playerName}</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-600/10 border border-emerald-500/25 text-emerald-400 font-bold text-[9px]">
                              Rating: {log.rating}/10
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1.5 italic font-medium">&quot;{log.feedback}&quot;</p>
                          <div className="text-right text-[8px] text-slate-500 font-semibold mt-2.5">
                            Logged: {new Date(log.date).toLocaleDateString()}
                          </div>
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
    </div>
  );
}
