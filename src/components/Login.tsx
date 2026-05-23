import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Moon, Sun, LogIn, ShieldCheck, HeartPulse } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoginProps {
  onLogin: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Login({ onLogin, isDarkMode, toggleDarkMode }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just simulate login
    onLogin();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="geo-card p-8 sm:p-10">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white">
                <HeartPulse size={24} />
              </div>
              <h1 className="text-2xl font-black tracking-tighter">CareFlow</h1>
            </div>
            <button 
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-600 transition-all"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Welcome Back</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in to continue your health journey.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <button type="button" className="text-[10px] font-bold text-brand-600 hover:underline">Forgot?</button>
              </div>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm"
              />
            </div>

            <div className="flex items-center gap-2 py-2">
              <input type="checkbox" id="remember" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              <label htmlFor="remember" className="text-xs text-slate-500">Remember me for 30 days</label>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-brand-100 dark:shadow-none flex items-center justify-center gap-2"
            >
              <LogIn size={20} /> Sign In
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account? <button className="font-bold text-brand-600 hover:underline">Create one</button>
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-slate-400">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck size={14} /> Secure Login
          </div>
          <div className="w-1 h-1 bg-slate-300 rounded-full" />
          <div className="text-[10px] font-bold uppercase tracking-widest">
            Privacy Policy
          </div>
        </div>
      </motion.div>
    </div>
  );
}
