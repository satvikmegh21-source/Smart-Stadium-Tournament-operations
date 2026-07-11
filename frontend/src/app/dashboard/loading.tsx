'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full text-slate-500">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
      <p className="text-sm font-semibold tracking-wide uppercase">Syncing telemetry logs...</p>
    </div>
  );
}
