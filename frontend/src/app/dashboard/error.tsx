'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Unhandled Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full text-slate-400 text-center px-6 max-w-md mx-auto space-y-5">
      <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 w-fit">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-white mb-1.5">Operations Failure</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          An unexpected error occurred while processing stadium telemetry signals. Try resetting the channel connection.
        </p>
      </div>
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/15"
      >
        <RefreshCw className="h-4 w-4" /> Reset Connection
      </button>
    </div>
  );
}
