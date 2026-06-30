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
  const issues = (issuesData as any)?.data?.issues || [];

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

  const pinsData = filteredIssues.map((issue: any) => ({
    id: issue.id,
    title: issue.title,
    address: issue.address,
    lat: issue.lat,
    lng: issue.lng,
    severity: issue.severity,
  }));

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map {
          height: 100%;
          margin: 0;
          padding: 0;
          background: #090f1e;
        }
        .leaflet-popup-content-wrapper {
          background: #090f1e !important;
          color: #fff !important;
          border: 1px solid #1e293b;
          border-radius: 12px;
          font-family: system-ui, -apple-system, sans-serif;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
          padding: 4px;
        }
        .leaflet-popup-tip {
          background: #090f1e !important;
        }
        .popup-title {
          font-weight: 700;
          color: #22d3ee;
          font-size: 13px;
          margin-bottom: 4px;
        }
        .popup-desc {
          font-size: 11px;
          color: #94a3b8;
          margin-bottom: 6px;
        }
        .popup-severity {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .popup-link {
          display: inline-block;
          margin-top: 8px;
          font-size: 11px;
          color: #22d3ee;
          text-decoration: none;
          font-weight: 700;
        }
        .popup-link:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const pins = ${JSON.stringify(pinsData)};
        const viewMode = "${viewMode}";

        // Center on Bengaluru default
        const map = L.map('map', { zoomControl: false }).setView([12.9716, 77.5946], 12);
        
        // Add zoom control bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Styled CartoDB Dark Matter tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 20
        }).addTo(map);

        const markers = [];

        pins.forEach(pin => {
          let pinColor = '#10b981'; // Low
          if (pin.severity === 'CRITICAL') pinColor = '#ef4444';
          else if (pin.severity === 'HIGH') pinColor = '#f59e0b';
          else if (pin.severity === 'MEDIUM') pinColor = '#eab308';

          let radius = 8;
          let opacity = 0.85;
          let fillOpacity = 0.7;

          if (viewMode === 'HEATMAP') {
            radius = 24;
            opacity = 0.15;
            fillOpacity = 0.35;
          }

          const marker = L.circleMarker([pin.lat, pin.lng], {
            radius: radius,
            fillColor: pinColor,
            color: viewMode === 'HEATMAP' ? 'transparent' : '#020617',
            weight: 2,
            opacity: opacity,
            fillOpacity: fillOpacity
          }).addTo(map);

          if (viewMode !== 'HEATMAP') {
            const popupContent = \`
              <div class="popup-title">\${pin.title}</div>
              <div class="popup-desc">\${pin.address}</div>
              <div class="popup-severity" style="color: \${pinColor}">Severity: \${pin.severity}</div>
              <a href="/issues/\${pin.id}" target="_parent" class="popup-link">View Details &rarr;</a>
            \`;
            marker.bindPopup(popupContent);
          }
          markers.push(marker);
        });

        // Fit map bounds to encompass all pins dynamically
        if (markers.length > 0) {
          const group = new L.featureGroup(markers);
          map.fitBounds(group.getBounds().pad(0.3));
        }
      </script>
    </body>
    </html>
  `;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] min-h-[500px]">
      {/* Sidebar Control Panel */}
      <Card className="glass w-full lg:w-80 p-5 border-slate-900 flex flex-col gap-6 h-fit lg:h-full overflow-y-auto">
        <div>
          <h2 className="text-base font-bold text-white font-space mb-1">Digital Twin Filters</h2>
          <p className="text-xs text-slate-550">Isolate problems by classification metrics</p>
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

      {/* Interactive Map Visualizer Container */}
      <Card className="glass flex-1 border-slate-900 overflow-hidden relative p-0 bg-slate-950/20">
        <iframe
          srcDoc={mapHtml}
          className="w-full h-full border-0 absolute inset-0"
          title="Digital Twin Map Stream"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-top-navigation"
        />
        
        <div className="absolute bottom-5 left-5 glass border border-slate-800/80 px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs font-bold text-slate-400 z-20 pointer-events-none">
          <Eye className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Active Digital Twin Map Stream</span>
        </div>
      </Card>
    </div>
  );
}
