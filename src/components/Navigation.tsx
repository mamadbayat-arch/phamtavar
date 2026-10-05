import React from 'react';
import {
  CheckSquare,
  Calendar,
  Grid2X2,
  Wallet,
  Flame,
  Target,
} from 'lucide-react';
import { AppView } from '../types';

interface NavigationProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  pendingTasksCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onSelectView,
  pendingTasksCount,
}) => {
  const navItems = [
    {
      id: 'tasks' as AppView,
      label: 'کارها',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : null,
    },
    {
      id: 'finance' as AppView,
      label: 'دخل‌وخرج',
      icon: Wallet,
    },
    {
      id: 'habits' as AppView,
      label: 'عادت‌ها',
      icon: Flame,
    },
    {
      id: 'goals' as AppView,
      label: 'اهداف',
      icon: Target,
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-[calc(8px+env(safe-area-inset-bottom))] pt-1 px-2 shadow-lg transition-colors">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/80 dark:bg-emerald-950/40 scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-transform ${
                    isActive ? 'scale-110' : ''
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 px-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 leading-none tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
