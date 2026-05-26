/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Role } from '../types';
import { LayoutDashboard, History, Users, BarChart3, Wrench, ListTodo } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  role: Role;
}

export default function BottomNav({ currentTab, onChangeTab, role }: BottomNavProps) {
  // Define tabs on the basis of user role
  const tabs =
    role === 'admin'
      ? [
          { id: 'dashboard', label: 'დაფა', icon: LayoutDashboard },
          { id: 'history', label: 'ისტორია', icon: History },
          { id: 'employees', label: 'პერსონალი', icon: Users },
          { id: 'reports', label: 'ანგარიშები', icon: BarChart3 },
        ]
      : [
          { id: 'all-orders', label: 'დავალებები', icon: ListTodo },
          { id: 'mechanic-dashboard', label: 'ჩემი გვერდი', icon: Wrench },
        ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 text-slate-400 py-1.5 px-4 shadow-xl z-50 md:sticky md:top-[61px] md:bottom-auto md:border-t-0 md:border-b">
      <div className="flex items-center justify-around max-w-lg mx-auto md:max-w-2xl">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              id={`tab-btn-${tab.id}`}
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all select-none cursor-pointer w-full max-w-[80px] ${
                isActive
                  ? 'text-amber-400 font-bold bg-amber-500/10'
                  : 'hover:text-slate-200 text-slate-400'
              }`}
            >
              <IconComponent className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium tracking-tight font-sans text-center truncate w-full">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
