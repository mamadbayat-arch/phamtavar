import React from 'react';
import { Moon, Sun, Settings, ShieldCheck, LogOut } from 'lucide-react';
import { formatJalaliLong, getTodayKey } from '../utils/jalali';
import { HamtavarLogo } from './HamtavarLogo';

interface HeaderProps {
  theme: 'light' | 'dark';
  isLoggedIn?: boolean;
  isAdmin?: boolean;
  userName?: string;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenAdminPanel: () => void;
  onLogout: () => void;
}

const iconButton =
  'w-10 h-10 rounded-xl border active:scale-95 transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500';

export const Header: React.FC<HeaderProps> = ({
  theme,
  isLoggedIn = false,
  isAdmin = false,
  userName,
  onToggleTheme,
  onOpenSettings,
  onOpenAdminPanel,
  onLogout,
}) => {
  const todayStr = formatJalaliLong(getTodayKey());
  const firstName = userName?.trim().split(/\s+/)[0];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] sm:px-6 transition-colors duration-200 shadow-xs">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <HamtavarLogo size={38} />
            {isLoggedIn && (
              <span
                className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 border-2 border-white dark:border-slate-900 rounded-full bg-emerald-500"
                title="وارد حساب کاربری شده‌اید"
              />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                همتوار
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 truncate max-w-[7rem]">
                {firstName || 'شخصی'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-none truncate">
              {todayStr}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isAdmin && (
            <button
              onClick={onOpenAdminPanel}
              className={`${iconButton} text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-800/60`}
              title="پنل مدیریت"
              aria-label="پنل مدیریت"
            >
              <ShieldCheck className="w-[18px] h-[18px]" />
            </button>
          )}

          <button
            onClick={onToggleTheme}
            className={`${iconButton} text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700`}
            aria-label={theme === 'dark' ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره'}
            title={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'}
          >
            {theme === 'dark' ? <Sun className="w-[18px] h-[18px] text-amber-400" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>

          <button
            onClick={onOpenSettings}
            className={`${iconButton} text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700`}
            aria-label="تنظیمات و پشتیبان"
            title="تنظیمات و پشتیبان"
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>

          {isLoggedIn && (
            <button
              onClick={onLogout}
              className={`${iconButton} border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60`}
              aria-label="خروج از حساب"
              title={userName ? `خروج از حساب ${userName}` : 'خروج از حساب کاربری'}
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
