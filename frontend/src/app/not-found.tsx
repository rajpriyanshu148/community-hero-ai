'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-full text-rose-450">
        <ShieldAlert className="w-16 h-16" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-white font-space">404 — Page Not Found</h1>
        <p className="text-slate-400 text-sm max-w-sm">
          The ward index or report you are looking for does not exist or has been archived by the council.
        </p>
      </div>
      <Link href="/">
        <Button variant="outline" className="border-slate-800 text-sm flex items-center gap-2 hover:bg-slate-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing</span>
        </Button>
      </Link>
    </div>
  );
}
