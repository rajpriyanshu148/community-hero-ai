'use client';

import React, { useState } from 'react';
import { MapPin, Filter, Layers, List, Eye, ShieldAlert } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { useIssues } from '../../../hooks/useIssues';
import Link from 'next/link';

export default function MapPage() {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'MAP' | 'HEATMAP'>('MAP');

  const { data: issuesData, isLoading } = useIssues({ limit: 100 });
  const issues = issuesData?.data?.issues || [];

  // Filter issues client-side for immediate feedback
  const filteredIssues = issues.filter((issue: any) => {
    const matchesCategory = filterCategory === 'ALL' || issue.category === filterCategory;
    const matchesSeverity = filterSeverity === 'ALL' || issue.severity === filterSeverity;
    return matchesCategory && matchesSeverity;
  });

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-rose-500';
      case 'HIGH': return 'bg-amber-500';
      case 'MEDIUM': return 'bg-yellow-500';
      default: return 'bg-emerald-500';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] min-h-[500px]">
      {/* Sidebar Control Panel */}
      <Card className="glass w-full lg:w-80 p-5 border-slate-900 flex flex-col gap-6 h-fit lg:h-full overflow-y-auto">
        <div>
          <h2 className="text-base font-bold text-white font-space mb-1">Digital Twin Filters</h2>
          <p className="text-xs text-slate-500">Isolate problems by classification metrics</p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              <span>Category</span>
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
            >
              <option value="ALL">All Categories</option>
              <option value="POTHOLE">Potholes</option>
              <option value="WATER_LEAKAGE">Water Leakages</option>
              <option value="GARBAGE">Garbage Overflow</option>
              <option value="STREETLIGHT">Streetlight Failure</option>
              <option value="SEWAGE">Sewage Issues</option>
              <option value="INFRASTRUCTURE">Broken Infrastructure</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Severity Level</span>
            </label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* View toggles */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Map Layers</span>
          </span>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={viewMode === 'MAP' ? 'civic' : 'outline'}
              className="text-xs font-bold py-2 h-auto"
              onClick={() => setViewMode('MAP')}
            >
              Standard Map
            </Button>
            <Button
              variant={viewMode === 'HEATMAP' ? 'civic' : 'outline'}
              className="text-xs font-bold py-2 h-auto"
              onClick={() => setViewMode('HEATMAP')}
            >
              Heatmap Overlay
            </Button>
          </div>
        </div>

        {/* Selected listings */}
        <div className="flex-1 flex flex-col gap-3 min-h-[150px] border-t border-slate-900/60 pt-4">
          <span className="text-xs font-bold text-slate-400">Report Listings ({filteredIssues.length})</span>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 max-h-[220px]">
            {filteredIssues.map((issue: any) => (
              <Link href={`/issues/${issue.id}`} key={issue.id}>
                <div className="p-2.5 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800/40 hover:border-slate-800 transition-all flex items-center gap-3 cursor-pointer">
                  <div className={`w-2.5 h-2.5 rounded-full ${getSeverityColor(issue.severity)} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-slate-200 block truncate">{issue.title}</span>
                    <span className="text-[9px] text-slate-500 block truncate">{issue.address}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Card>

      {/* Interactive Map Visualizer Canvas representation */}
      <Card className="glass flex-1 border-slate-900 overflow-hidden relative flex items-center justify-center p-6 bg-slate-950/20">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        {viewMode === 'HEATMAP' ? (
          /* Heatmap glow overlay */
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-[180px] h-[180px] bg-rose-500/10 rounded-full blur-[80px] absolute top-[30%] left-[40%]" />
            <div className="w-[220px] h-[220px] bg-amber-500/10 rounded-full blur-[90px] absolute top-[40%] left-[55%]" />
          </div>
        ) : null}

        {/* Map Grid Vector Line drawing representing Bengaluru roads grid */}
        <svg className="absolute inset-0 w-full h-full text-slate-900 stroke-current opacity-30" strokeWidth="1.5">
          <line x1="10%" y1="0" x2="10%" y2="100%" />
          <line x1="30%" y1="0" x2="30%" y2="100%" />
          <line x1="50%" y1="0" x2="50%" y2="100%" />
          <line x1="70%" y1="0" x2="70%" y2="100%" />
          <line x1="90%" y1="0" x2="90%" y2="100%" />

          <line x1="0" y1="20%" x2="100%" y2="20%" />
          <line x1="0" y1="40%" x2="100%" y2="40%" />
          <line x1="0" y1="60%" x2="100%" y2="60%" />
          <line x1="0" y1="80%" x2="100%" y2="80%" />
        </svg>

        {/* Render Interactive Issue Marker Pins */}
        <div className="relative w-full h-full">
          {filteredIssues.map((issue: any, index) => {
            // Map lat/lng coordinates onto percentages of screen width/height for visualization
            const left = `${((issue.lng - 77.58) * 1000) % 80 + 10}%`;
            const top = `${((issue.lat - 12.90) * 1000) % 80 + 10}%`;

            return (
              <Link href={`/issues/${issue.id}`} key={issue.id}>
                <div
                  className="absolute cursor-pointer group transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left, top }}
                >
                  {/* Pin glow halo */}
                  <span className={`absolute inset-0 rounded-full animate-ping opacity-25 ${getSeverityColor(issue.severity)}`} />

                  <div className={`w-5 h-5 rounded-full border border-slate-950 flex items-center justify-center shadow-lg relative z-10 transition-transform hover:scale-125 ${getSeverityColor(issue.severity)}`}>
                    <MapPin className="w-3 h-3 text-slate-950" />
                  </div>

                  {/* Tooltip */}
                  <div className="absolute left-1/2 bottom-7 transform -translate-x-1/2 bg-slate-950 border border-slate-800 text-[10px] text-white p-2 rounded shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity w-36 pointer-events-none whitespace-normal leading-normal">
                    <span className="font-bold block text-slate-100 mb-0.5">{issue.title}</span>
                    <span className="text-slate-400 block truncate">{issue.address}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="absolute bottom-5 right-5 glass border border-slate-800 px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs font-bold text-slate-400 relative z-20">
          <Eye className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Active Digital Twin Stream</span>
        </div>
      </Card>
    </div>
  );
}
