'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  TrendingUp, 
  Users, 
  Trophy, 
  ShieldAlert, 
  FileText, 
  Download, 
  Cpu, 
  Loader2, 
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface AnalyticsData {
  summary: {
    users: number;
    tournaments: number;
    teams: number;
    matches: number;
    revenue: number;
    sponsors: number;
    activeIncidents: number;
  };
  charts: {
    monthlyRevenue: { name: string; revenue: number }[];
    zoneOccupancy: { zone: string; occupancy: number }[];
    revenueSplits: { name: string; value: number }[];
  };
}

interface Team {
  id: string;
  name: string;
}

interface AIResult {
  probabilities: {
    team1Probability: number;
    team2Probability: number;
    drawProbability: number;
  };
  metrics: {
    team1Points: number;
    team2Points: number;
    team1Suspensions: number;
    team2Suspensions: number;
  };
  analysis: string;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Exporters status
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingCSV, setDownloadingCSV] = useState(false);

  // AI Predictor forms
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [predicting, setPredicting] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics/summary');
      setData(res.data.data);
    } catch (e) {
      console.error('Error fetching analytics summary', e);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      setTeams(res.data.data);
    } catch (e) {
      console.error('Error fetching teams list', e);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAnalytics(), fetchTeams()]).finally(() => setLoading(false));
  }, []);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team1Id || !team2Id) return;
    setPredicting(true);
    setAiError(null);
    setAiResult(null);

    try {
      const res = await api.post('/analytics/predict', { team1Id, team2Id });
      setAiResult(res.data.data);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Matchup prediction analysis failed';
      setAiError(errorMsg);
    } finally {
      setPredicting(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const res = await api.get('/reports/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'stadium_operations_summary.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('PDF download failed', e);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDownloadCSV = async () => {
    setDownloadingCSV(true);
    try {
      const res = await api.get('/reports/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'stadium_bookings_ledger.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('CSV download failed', e);
    } finally {
      setDownloadingCSV(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-20 text-center text-slate-500 glass rounded-3xl">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" /> Fetching operations performance analysis...
      </div>
    );
  }

  const t1Name = teams.find(t => t.id === team1Id)?.name || 'Home Team';
  const t2Name = teams.find(t => t.id === team2Id)?.name || 'Away Team';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-indigo-400" /> Executive Analytics & AI
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review operational yields, zone occupancies, and execute AI match prediction forecasts.</p>
        </div>
        
        {/* Reports exporter actions */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white font-semibold text-xs flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {downloadingPDF ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            Export PDF Audit
          </button>
          <button
            onClick={handleDownloadCSV}
            disabled={downloadingCSV}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white font-semibold text-xs flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {downloadingCSV ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Export Bookings CSV
          </button>
        </div>
      </div>

      {/* Metric Cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="p-5 rounded-2xl glass border border-white/5 text-left">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit mb-3"><Users className="h-5 w-5" /></div>
          <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Registered Accounts</span>
          <span className="text-2xl font-extrabold text-white mt-1 block">{data.summary.users}</span>
        </div>

        <div className="p-5 rounded-2xl glass border border-white/5 text-left">
          <div className="p-2 bg-violet-500/10 text-violet-400 rounded-xl w-fit mb-3"><Trophy className="h-5 w-5" /></div>
          <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Leagues & Teams</span>
          <span className="text-2xl font-extrabold text-white mt-1 block">{data.summary.tournaments} / {data.summary.teams}</span>
        </div>

        <div className="p-5 rounded-2xl glass border border-white/5 text-left">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-3"><DollarSign className="h-5 w-5" /></div>
          <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Ticketing Yields</span>
          <span className="text-2xl font-extrabold text-white mt-1 block">${data.summary.revenue.toLocaleString()}</span>
        </div>

        <div className="p-5 rounded-2xl glass border border-white/5 text-left">
          <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl w-fit mb-3"><ShieldAlert className="h-5 w-5" /></div>
          <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Active Operations Alarms</span>
          <span className="text-2xl font-extrabold text-white mt-1 block">{data.summary.activeIncidents}</span>
        </div>
      </div>

      {/* Grid: Charts visual reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Line Chart: Revenue trends */}
        <div className="lg:col-span-2 p-6 rounded-3xl glass border border-white/5 text-left space-y-4">
          <h3 className="font-bold text-white text-sm">Ticketing Revenue Yield (Past 6 Months)</h3>
          <div className="h-72 w-full font-mono text-[9px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.charts.monthlyRevenue} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <ChartTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Commercial revenue splits */}
        <div className="lg:col-span-1 p-6 rounded-3xl glass border border-white/5 text-left space-y-4 flex flex-col justify-between">
          <h3 className="font-bold text-white text-sm">Commercial Revenue Breakdown</h3>
          
          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.charts.revenueSplits}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.charts.revenueSplits.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 font-bold border-t border-white/5 pt-4">
            {data.charts.revenueSplits.map((item, idx) => (
              <div key={idx} className="text-center">
                <span className="block h-2 w-2 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS[idx] }} />
                <span className="block text-white uppercase">{item.name}</span>
                <span className="block mt-0.5">${item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart: Seating zone occupancies */}
        <div className="lg:col-span-1 p-6 rounded-3xl glass border border-white/5 text-left space-y-4">
          <h3 className="font-bold text-white text-sm">Zone Seating Occupancy %</h3>
          <div className="h-64 w-full font-mono text-[9px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.zoneOccupancy} margin={{ left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="zone" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <ChartTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
                <Bar dataKey="occupancy" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI outcome prediction form & results visualizer */}
        <div className="lg:col-span-2 p-6 rounded-3xl glass border border-white/5 text-left space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-400" /> AI Standings & Matchup Predictor
          </h3>
          <p className="text-xs text-slate-400">Evaluates player suspension records, historical points standings, and squad fitness variables.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Compare Select Form */}
            <form onSubmit={handlePredict} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Home Team Designation</label>
                <select
                  required
                  value={team1Id}
                  onChange={(e) => setTeam1Id(e.target.value)}
                  className="w-full p-3 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                >
                  <option value="">Select team</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Away Team Designation</label>
                <select
                  required
                  value={team2Id}
                  onChange={(e) => setTeam2Id(e.target.value)}
                  className="w-full p-3 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs"
                >
                  <option value="">Select team</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={predicting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/15 disabled:opacity-50"
              >
                {predicting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Run Predictive Forecast'}
              </button>
            </form>

            {/* Prediction Output Visualizer */}
            <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 space-y-4">
              {aiError && (
                <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {!aiResult && !aiError && (
                <div className="text-center py-10 text-slate-500 text-xs flex flex-col items-center justify-center gap-1.5">
                  <Cpu className="h-8 w-8 text-slate-700" />
                  <span>Select competing lineups to compute outcome probabilities.</span>
                </div>
              )}

              {aiResult && (
                <div className="space-y-4 text-left">
                  <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">AI Forecast Complete</div>
                  
                  {/* Gauge bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-white font-bold">
                      <span>{t1Name} ({aiResult.probabilities.team1Probability}%)</span>
                      <span className="text-slate-500">Draw ({aiResult.probabilities.drawProbability}%)</span>
                      <span>{t2Name} ({aiResult.probabilities.team2Probability}%)</span>
                    </div>
                    <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-950 border border-white/5">
                      <div className="bg-indigo-500 h-full transition-all" style={{ width: `${aiResult.probabilities.team1Probability}%` }} />
                      <div className="bg-slate-700 h-full transition-all" style={{ width: `${aiResult.probabilities.drawProbability}%` }} />
                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${aiResult.probabilities.team2Probability}%` }} />
                    </div>
                  </div>

                  {/* Standings comparisons stats cards */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 bg-slate-950/60 p-3.5 rounded-xl border border-white/5 font-semibold">
                    <div>
                      <div className="text-[8px] text-slate-500 uppercase tracking-wider">Standing Points Compare</div>
                      <div className="text-xs text-white font-bold mt-0.5">{aiResult.metrics.team1Points} pts vs {aiResult.metrics.team2Points} pts</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-slate-500 uppercase tracking-wider">Active Suspensions</div>
                      <div className="text-xs text-white font-bold mt-0.5">{aiResult.metrics.team1Suspensions} vs {aiResult.metrics.team2Suspensions} players</div>
                    </div>
                  </div>

                  {/* Summary analysis text alert */}
                  <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 leading-relaxed font-semibold">
                    {aiResult.analysis}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
