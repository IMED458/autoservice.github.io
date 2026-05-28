/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, ROLE_LABELS } from '../types';
import { LogOut, ShieldCheck, Wrench, Crown } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
}

export default function Header({ currentUser, onLogout }: HeaderProps) {
  if (!currentUser) return null;

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 py-3 px-4 shadow-md backdrop-blur-md">
      <div className="flex items-center justify-between max-w-lg mx-auto md:max-w-7xl">
        {/* Brand Logo and Title */}
        <div className="flex items-center gap-2">
          <div className="bg-amber-500 text-slate-950 p-2 rounded-xl flex items-center justify-center">
            <Wrench className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight font-sans leading-none text-slate-50">
              ავტოსერვისი
            </h1>
            <span className="text-[10px] text-slate-400 font-sans tracking-wide">
              მართვის სისტემა
            </span>
          </div>
        </div>

        {/* User Badge & Logout Option */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl">
            {currentUser.role === 'super_admin' || currentUser.role === 'manager' ? (
              <Crown className="w-3.5 h-3.5 text-purple-400" />
            ) : currentUser.role === 'admin' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-200 font-sans leading-none">
                {currentUser.firstName} {currentUser.lastName ? currentUser.lastName[0] + '.' : ''}
              </div>
              <span className="text-[9px] text-slate-500 font-semibold font-sans uppercase tracking-wider">
                {ROLE_LABELS[currentUser.role]}
              </span>
            </div>
          </div>

          <button
            id="header-logout-btn"
            onClick={onLogout}
            title="გასვლა"
            className="p-2 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
