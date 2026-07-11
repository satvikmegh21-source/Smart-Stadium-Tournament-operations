'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  Bell, 
  Send, 
  Loader2, 
  Check, 
  AlertTriangle,
  Info,
  Clock,
  Volume2,
  Megaphone,
  Radio
} from 'lucide-react';

interface AlertItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();

  // Data states
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [statusText, setStatusText] = useState('Initializing Stream...');
  const [streamConnected, setStreamConnected] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Audio mock chime
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    // Construct SSE Endpoint url
    const backendBase = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '') 
      : 'http://localhost:5000';
    const sseUrl = `${backendBase}/api/notifications/stream`;

    console.log(`[SSE Client] Connecting to: ${sseUrl}`);
    setStatusText('Connecting to live dispatch...');
    
    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      setStreamConnected(true);
      setStatusText('Live streaming active');
    };

    eventSource.onerror = (e) => {
      console.error('[SSE Error]', e);
      setStreamConnected(false);
      setStatusText('Reconnecting to dispatch...');
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        console.log('[SSE Message]', parsed);

        if (parsed.type === 'BROADCAST_RECEIVED' || parsed.type === 'NOTIFICATION_RECEIVED') {
          const newAlert: AlertItem = {
            id: parsed.data.id || Math.random().toString(),
            title: parsed.data.title,
            message: parsed.data.message,
            createdAt: parsed.data.createdAt || new Date().toISOString(),
          };

          // Append to beginning of list
          setAlerts(prev => [newAlert, ...prev]);

          // Play mock chime
          if (soundEnabled && typeof window !== 'undefined') {
            const context = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.connect(gain);
            gain.connect(context.destination);
            osc.frequency.setValueAtTime(880, context.currentTime); // High A note
            gain.gain.setValueAtTime(0.05, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
            osc.start();
            osc.stop(context.currentTime + 0.3);
          }
        }
      } catch (err) {
        console.error('Failed to parse SSE data', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [soundEnabled]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    setSubmitting(true);
    setActionError(null);

    try {
      await api.post('/notifications', { title, message });
      setActionSuccess('Announcements broadcast successfully.');
      setTitle('');
      setMessage('');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Broadcast failed';
      setActionError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const isOperator = ['SUPER_ADMIN', 'STADIUM_MANAGER', 'TOURNAMENT_ORGANIZER'].includes(user?.role || '');

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Bell className="h-8 w-8 text-indigo-400" /> Notifications & Dispatch
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time emergency exit instructions, match results, and stadium-wide broadcasts.</p>
        </div>

        {/* Live Channel Connection status pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              soundEnabled ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400' : 'bg-slate-950 border-white/5 text-slate-500'
            }`}
          >
            <Volume2 className="h-4 w-4" /> {soundEnabled ? 'Chime Enabled' : 'Chime Muted'}
          </button>

          <span className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            streamConnected ? 'bg-green-500/15 border-green-500/30 text-green-400' : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
          }`}>
            <Radio className={`h-3.5 w-3.5 ${streamConnected ? 'animate-pulse' : ''}`} />
            {statusText}
          </span>
        </div>
      </div>

      {/* Grid: Broadcast form vs Dispatch channel list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Dispatch card (Admin/Managers only) */}
        <div className="lg:col-span-1 space-y-6">
          {!isOperator ? (
            <div className="p-6 rounded-3xl glass border border-white/5 text-left relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.03)_0%,transparent_55%)] pointer-events-none" />
              <h2 className="text-sm font-extrabold text-white mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-indigo-400" /> Spectator Channel
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                As a spectator, you are subscribed to the live stadium dispatch channel. Updates, safety emergencies, or scheduling adjustments will display here instantly with a chime notification.
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-3xl glass border border-white/5 text-left relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.05)_0%,transparent_55%)] pointer-events-none" />
              <h2 className="text-base font-extrabold text-white mb-2 flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-indigo-400" /> Broadcast Dispatch
              </h2>
              <p className="text-xs text-slate-400 mb-6">Send stadium-wide alerts or safety warnings. Placed immediately into client streams.</p>

              {actionSuccess && (
                <div className="p-3 mb-4 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-xs flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}
              {actionError && (
                <div className="p-3 mb-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <form onSubmit={handleBroadcast} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Subject / Title</label>
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g. Security Update, Gate Access"
                    className="w-full p-3 border border-white/10 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Announcement Message</label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide specific details..."
                    rows={5}
                    className="w-full p-3 border border-white/10 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/15 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send Broadcast</>}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Col: Alerts Streaming list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Live Push Feed</h2>
          
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="p-20 text-center text-slate-500 glass rounded-3xl text-xs flex flex-col items-center justify-center gap-2">
                <Bell className="h-8 w-8 text-slate-600" />
                <span>Waiting for dispatch broadcasts. Active listener stream is listening.</span>
              </div>
            ) : (
              alerts.map((a) => (
                <div key={a.id} className="p-5 rounded-2xl glass-dark border border-white/5 hover:border-white/10 transition-all text-left space-y-3 flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/25 text-indigo-400 shrink-0">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between items-center gap-2">
                      <h4 className="font-extrabold text-sm text-white">{a.title}</h4>
                      <span className="text-[9px] text-slate-500 font-semibold flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(a.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{a.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
