'use client';

import React, { useEffect, useState } from 'react';
import { Eye, ShieldAlert, Sparkles, AlertTriangle, CloudRain, Sun } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { PredictionAlert } from '../../../components/shared/PredictionAlert';
import axios from 'axios';

export default function WatchtowerPage() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [weatherAlerts, setWeatherAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWatchtowerData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        
        // Fetch global predictions
        const predRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/ai/predictions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (predRes.data.success) {
          setPredictions(predRes.data.data);
        }

        // Fetch weather alerts
        const weatherRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/weather/alerts?lat=12.9715987&lng=77.5945627`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (weatherRes.data.success) {
          setWeatherAlerts(weatherRes.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching watchtower data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchtowerData();
  }, []);

  const getProbabilityColor = (prob: number) => {
    if (prob >= 0.8) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    if (prob >= 0.5) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-space mb-1 flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span>AI Watchtower</span>
          </h2>
          <p className="text-xs text-slate-550">Predictive civic modeling & climate-aware emergency monitoring</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Climate alerts / warning feed (col span 2) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-cyan-400" />
              <span>Climate Risk Feed</span>
            </h3>

            {weatherAlerts.length > 0 ? (
              <div className="flex flex-col gap-4">
                {weatherAlerts.map((alert: any) => (
                  <PredictionAlert
                    key={alert.id}
                    type="WEATHER"
                    title={alert.alertType.replace('_', ' ')}
                    message={alert.message}
                    severity={alert.severity}
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-900/40 border border-slate-900 rounded-2xl flex items-center justify-center gap-3 text-xs text-slate-500">
                <Sun className="w-5 h-5 text-amber-500" />
                <span>No active climate-aware risk alerts. Weather normal.</span>
              </div>
            )}

            {/* Historical charts simulation */}
            <div className="flex flex-col gap-4 pt-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Historical Civic Report Spikes</h3>
              <Card className="glass p-6 border-slate-900 flex flex-col gap-6">
                {/* SVG mock charts vector representation */}
                <div className="aspect-[2/1] md:aspect-[3/1] w-full relative flex items-end border-b border-l border-slate-800 pb-2 pl-2">
                  <svg className="w-full h-full text-cyan-500/20" viewBox="0 0 300 100" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="25" x2="300" y2="25" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
                    <line x1="0" y1="75" x2="300" y2="75" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />

                    {/* Chart path representing spikes */}
                    <path
                      d="M0 80 Q30 20 60 70 T120 40 T180 90 T240 10 T300 80"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                    />
                  </svg>
                  {/* Axis labels */}
                  <span className="absolute left-[-15px] top-[0] text-[9px] font-bold text-slate-600">Max</span>
                  <span className="absolute left-[-15px] bottom-[0] text-[9px] font-bold text-slate-600">Min</span>
                  <span className="absolute right-0 bottom-[-18px] text-[9px] font-bold text-slate-600">30 Days Ago</span>
                </div>
                <div className="text-center text-[10px] text-slate-550 font-bold uppercase">
                  Ward-level complaints density index (30-day window)
                </div>
              </Card>
            </div>
          </div>

          {/* Predictive model warning cards (col span 1) */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Predictive Models</span>
            </h3>

            <div className="flex flex-col gap-4">
              {predictions.length > 0 ? (
                predictions.map((pred: any) => (
                  <Card key={pred.id} className="glass p-5 border-slate-900 flex flex-col gap-4 relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                        {pred.ward}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getProbabilityColor(pred.probability)}`}>
                        {Math.round(pred.probability * 100)}% Probability
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col gap-2">
                      <h4 className="text-sm font-bold text-white">{pred.issueType.replace('_', ' ')} Warning</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{pred.reasoning}</p>
                    </div>

                    <div className="text-[10px] text-slate-500 font-semibold border-t border-slate-900/60 pt-3 flex justify-between">
                      <span>Expires: {new Date(pred.expiresAt).toLocaleDateString()}</span>
                      <span>Model: Gemini 1.5</span>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 border border-slate-900 border-dashed rounded-2xl text-slate-500 text-xs font-semibold">
                  No predictive models compiled. Checks schedule daily at 6 AM.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline fallback loader
function Loader(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
