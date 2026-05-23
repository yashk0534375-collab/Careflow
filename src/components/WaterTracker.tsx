import React from 'react';
import { WaterLog } from '../types';

interface WaterTrackerProps {
  logs: WaterLog[];
  onAdd: (amount: number) => void;
}

export default function WaterTracker({ logs, onAdd }: WaterTrackerProps) {
  const totalWater = logs.reduce((acc, log) => acc + log.amount, 0);
  const goal = 2500; // Default 2.5L
  const percentage = Math.min(Math.round((totalWater / goal) * 100), 100);

  const quickAddOptions = [250, 500, 750];

  return (
    <div className="space-y-12">
      <header className="border-b border-[#3a3a3f] pb-8">
        <h1 className="display-xxl mb-4">HYDRATION PROTOCOL</h1>
        <p className="caption-text text-[#f0f0fa] max-w-2xl uppercase">
          MONITOR FLUID INTAKE. MAINTAIN HYDRATION FOR OPTIMAL COGNITIVE AND PHYSICAL PERFORMANCE.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Display */}
        <div className="card flex flex-col items-center justify-center text-center lg:col-span-1">
          <div className="flex items-center justify-between w-full mb-8">
            <span className="eyebrow">VOLUME TRACKED</span>
            <span className="text-xs font-bold uppercase tracking-wider">{totalWater / 1000}L / {goal / 1000}L</span>
          </div>
          
          <div className="display-xxl mb-8">{percentage}%</div>
          
          <div className="w-full h-1 bg-[#3a3a3f] mb-8">
            <div className="h-full bg-white transition-all duration-1000" style={{ width: `${percentage}%` }} />
          </div>
          
          <p className="caption-text uppercase tracking-wider text-[#5a5a5f] font-bold">
            {Math.max(0, Math.ceil((goal - totalWater) / 250))} UNITS (250ML) REQUIRED FOR OPTIMAL.
          </p>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="eyebrow mb-6">QUICK LOG (MILLILITERS)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {quickAddOptions.map((amount) => (
                <button
                  key={amount}
                  onClick={() => onAdd(amount)}
                  className="border border-[#3a3a3f] hover:border-white p-6 transition-colors group flex flex-col items-center justify-center text-center"
                >
                  <p className="display-lg group-hover:text-white text-[#f0f0fa] transition-colors">{amount}</p>
                  <p className="text-[10px] text-[#5a5a5f] mt-2 uppercase font-bold tracking-widest group-hover:text-white transition-colors">EXECUTE</p>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="eyebrow mb-6">TELEMETRY HISTORY</h3>
            <div className="space-y-0 max-h-[300px] overflow-y-auto no-scrollbar">
              {logs.length > 0 ? (
                [...logs].reverse().map((log, i) => (
                  <div key={i} className="flex items-center justify-between py-4 border-b border-[#3a3a3f] last:border-0 last:pb-0">
                    <p className="text-sm font-bold uppercase">{log.amount} ML VOLUME</p>
                    <p className="text-[10px] font-bold tracking-wider text-[#5a5a5f] uppercase">
                      T-MINUS: {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-[#5a5a5f] text-xs font-bold uppercase tracking-wider">NO FLUID VOLUME LOGGED FOR CURRENT CYCLE.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
