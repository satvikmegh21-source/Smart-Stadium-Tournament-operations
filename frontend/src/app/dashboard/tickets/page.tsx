'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  CreditCard, 
  Plus, 
  Loader2, 
  Check, 
  AlertTriangle,
  MapPin,
  Calendar,
  Ticket,
  DollarSign,
  QrCode,
  Tag
} from 'lucide-react';

interface Team {
  name: string;
}

interface Match {
  id: string;
  date: string;
  status: string;
  team1: Team;
  team2: Team;
  stadium: { name: string; city: string };
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  method: string;
  transactionId: string;
}

interface TicketPurchased {
  id: string;
  seatNumber: string;
  zone: string;
  qrCode: string | null;
  booking: {
    match: Match;
    payment: Payment | null;
  };
}

export default function TicketsPage() {

  // Data states
  const [matches, setMatches] = useState<Match[]>([]);
  const [myTickets, setMyTickets] = useState<TicketPurchased[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'buy' | 'mine'>('buy');

  // Checkout states
  const [seatZone, setSeatZone] = useState('VIP Box');
  const [seatNumber, setSeatNumber] = useState('V-12');
  const [price, setPrice] = useState(150);

  // Card details mock
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');

  const fetchMatches = async () => {
    try {
      const res = await api.get('/matches');
      // Only show scheduled or live matches for ticket purchases
      const sellable = (res.data.data as Match[]).filter(m => m.status === 'SCHEDULED' || m.status === 'LIVE');
      setMatches(sellable);
    } catch (e) {
      console.error('Error fetching matches', e);
    }
  };

  const fetchMyTickets = async () => {
    try {
      const res = await api.get('/tickets');
      setMyTickets(res.data.data);
    } catch (e) {
      console.error('Error fetching my tickets', e);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMatches(), fetchMyTickets()]).finally(() => setLoading(false));

    // Handle return redirect from Stripe checkout (real or mock)
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const mId = params.get('matchId');
    const zName = params.get('seatZone');
    const sNum = params.get('seatNumber');
    const uPrice = params.get('price');

    if (sessionId && mId && zName && sNum && uPrice) {
      api.post('/tickets/purchase', {
        matchId: mId,
        seatZone: decodeURIComponent(zName),
        seatNumber: decodeURIComponent(sNum),
        price: parseFloat(uPrice),
      })
      .then(() => {
        setActionSuccess('Payment verified successfully! Welcome to the Arena.');
        fetchMyTickets();
        setActiveTab('mine');
        window.history.replaceState({}, document.title, window.location.pathname);
      })
      .catch((err) => {
        console.error('Redirect confirmation failed', err);
      });
    }
  }, []);

  const handleZoneChange = (zone: string) => {
    setSeatZone(zone);
    if (zone === 'VIP Box') {
      setPrice(150);
      setSeatNumber('V-' + Math.floor(Math.random() * 50 + 1));
    } else if (zone === 'Category A') {
      setPrice(80);
      setSeatNumber('A-' + Math.floor(Math.random() * 100 + 1));
    } else {
      setPrice(40);
      setSeatNumber('B-' + Math.floor(Math.random() * 150 + 1));
    }
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const res = await api.post('/payments/create-checkout-session', {
        matchId: selectedMatch.id,
        seatZone,
        seatNumber,
        price
      });

      if (res.data && res.data.url) {
        // Redirect client browser directly to Stripe gateway
        window.location.href = res.data.url;
      } else {
        setActionError('Failed to load gateway URL.');
        setSubmitting(false);
      }
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Redirect to checkout failed';
      setActionError(errorMsg);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Ticket className="h-8 w-8 text-indigo-400" /> Ticket Office
          </h1>
          <p className="text-slate-400 text-sm mt-1">Book stadium seats, browse gate access zones, and verify purchase invoices.</p>
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

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setActiveTab('buy')}
          className={`px-6 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'buy'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Book Seats
        </button>
        <button
          onClick={() => setActiveTab('mine')}
          className={`px-6 py-3 font-semibold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'mine'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          My Tickets ({myTickets.length})
        </button>
      </div>

      {loading ? (
        <div className="p-20 text-center text-slate-500 glass rounded-3xl">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" /> Syncing ticket booth...
        </div>
      ) : activeTab === 'buy' ? (
        /* Buy Ticket Board */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.length === 0 ? (
            <div className="col-span-full p-16 text-center text-slate-500 glass rounded-3xl text-xs">
              No upcoming matches registered for ticketing. Check back later.
            </div>
          ) : (
            matches.map((match) => (
              <div key={match.id} className="p-5 rounded-2xl glass border border-white/5 flex flex-col justify-between hover:border-white/10 hover:scale-[1.01] transition-all text-left">
                <div className="space-y-4">
                  {/* Banner */}
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(match.date).toLocaleDateString()}</span>
                    <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/25">{match.status}</span>
                  </div>

                  {/* Match Matchups */}
                  <div className="font-extrabold text-sm text-white flex justify-between items-center bg-slate-950/60 p-3.5 rounded-xl border border-white/5">
                    <span className="truncate max-w-[42%]">{match.team1.name}</span>
                    <span className="text-slate-600 font-mono">v</span>
                    <span className="truncate max-w-[42%] text-right">{match.team2.name}</span>
                  </div>

                  {/* Stadium name */}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400" /> {match.stadium.name}, {match.stadium.city}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMatch(match)}
                  className="w-full mt-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-md shadow-indigo-500/10"
                >
                  <Plus className="h-4 w-4" /> Book Seat
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        /* My Purchased Tickets list */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myTickets.length === 0 ? (
            <div className="col-span-full p-16 text-center text-slate-500 glass rounded-3xl text-xs">
              No tickets booked under this user account.
            </div>
          ) : (
            myTickets.map((t) => (
              <div key={t.id} className="p-6 rounded-2xl glass-dark border border-white/5 text-left relative overflow-hidden flex flex-col justify-between space-y-6">
                {/* Visual barcode mockup border */}
                <div className="absolute top-0 right-0 w-2.5 h-full bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(255,255,255,0.05)_2px,rgba(255,255,255,0.05)_4px)]" />

                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Ticket className="h-3.5 w-3.5 text-indigo-400" /> Ticket ID: {t.id.slice(0, 8)}</span>
                    <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/25">Confirmed</span>
                  </div>

                  {/* Match Info */}
                  <div>
                    <h3 className="font-extrabold text-sm text-white">
                      {t.booking.match.team1.name} vs {t.booking.match.team2.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                      <MapPin className="h-3 w-3" /> {t.booking.match.stadium.name}
                    </div>
                  </div>

                  {/* Row Seat details */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-white/5">
                    <div>
                      <div className="text-[8px] text-slate-500 font-bold uppercase">Zone Category</div>
                      <div className="text-xs text-white font-bold">{t.zone}</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-slate-500 font-bold uppercase">Seat Designation</div>
                      <div className="text-xs text-white font-bold">{t.seatNumber}</div>
                    </div>
                  </div>
                </div>

                {/* QR Access verification code card */}
                <div className="flex items-center gap-3.5 pt-4 border-t border-white/5">
                  <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center p-0.5 overflow-hidden">
                    {t.qrCode && t.qrCode.startsWith('data:') ? (
                      <img src={t.qrCode} alt="QR Code" className="h-full w-full object-contain" /> // eslint-disable-line @next/next/no-img-element
                    ) : (
                      <QrCode className="h-8 w-8 text-black" />
                    )}
                  </div>
                  <div>
                    <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Gate Check Code</div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      {t.qrCode && t.qrCode.startsWith('data:') ? t.id.slice(0, 12).toUpperCase() : (t.qrCode || 'N/A')}
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-[10px] font-extrabold text-indigo-400 flex items-center justify-end"><DollarSign className="h-3 w-3" /> {t.booking.payment?.amount || 40}</span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wide">Paid: Card</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Checkout Simulator Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm" onClick={() => setSelectedMatch(null)} />
          <div className="relative w-full max-w-lg bg-slate-900 border border-white/5 rounded-3xl p-8 text-left grid grid-cols-1 md:grid-cols-2 gap-6 shadow-2xl">
            
            {/* Left Col: Seating choices */}
            <div className="space-y-5">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Tag className="h-5 w-5 text-indigo-400" /> Seating Zones
              </h3>
              
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleZoneChange('VIP Box')}
                  className={`w-full p-4 rounded-2xl border transition-all text-left flex justify-between items-center ${
                    seatZone === 'VIP Box' ? 'bg-indigo-600/15 border-indigo-500 text-white' : 'bg-slate-950 border-white/10 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">VIP Box Lounge</div>
                    <div className="text-[8px] text-slate-500 mt-0.5">Top-tier corporate lounge seat</div>
                  </div>
                  <span className="font-bold text-xs text-indigo-400">$150</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleZoneChange('Category A')}
                  className={`w-full p-4 rounded-2xl border transition-all text-left flex justify-between items-center ${
                    seatZone === 'Category A' ? 'bg-indigo-600/15 border-indigo-500 text-white' : 'bg-slate-950 border-white/10 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">Category A Grandstand</div>
                    <div className="text-[8px] text-slate-500 mt-0.5">Frontline stadium views</div>
                  </div>
                  <span className="font-bold text-xs text-indigo-400">$80</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleZoneChange('Category B')}
                  className={`w-full p-4 rounded-2xl border transition-all text-left flex justify-between items-center ${
                    seatZone === 'Category B' ? 'bg-indigo-600/15 border-indigo-500 text-white' : 'bg-slate-950 border-white/10 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">Category B General</div>
                    <div className="text-[8px] text-slate-500 mt-0.5">Standard zone seats</div>
                  </div>
                  <span className="font-bold text-xs text-indigo-400">$40</span>
                </button>
              </div>
            </div>

            {/* Right Col: Pay simulator */}
            <div className="flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-400" /> Checkout Simulator
                </h3>
                
                {/* Total Summary */}
                <div className="p-3 bg-slate-950 border border-white/5 rounded-xl text-[11px] text-slate-400 space-y-1.5 font-semibold">
                  <div className="flex justify-between">
                    <span>Seat Category:</span>
                    <span className="text-white">{seatZone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seat Number:</span>
                    <span className="text-white">{seatNumber}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1.5 text-xs">
                    <span className="text-white">Amount Due:</span>
                    <span className="text-indigo-400 font-extrabold">${price}</span>
                  </div>
                </div>

                {/* Dummy Card Forms */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="Card Number"
                    className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs font-mono"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs font-mono"
                    />
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="CVV"
                      className="w-full p-2.5 border border-white/10 rounded-xl bg-slate-950 text-white focus:outline-none text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-lg shadow-indigo-500/15 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Pay & Book'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
