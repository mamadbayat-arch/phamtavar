import React from 'react';
import { Moon, Sun, Settings, Megaphone, LogOut } from 'lucide-react';
import { formatJalaliLong, getTodayKey } from '../utils/jalali';
import { HamtavarLogo } from './HamtavarLogo';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenAdminPanel: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onOpenSettings,
  onOpenAdminPanel,
  onLogout,
}) => {
  const todayStr = formatJalaliLong(getTodayKey());

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-2.5 sm:px-6 transition-colors duration-200 shadow-xs">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Logo (سمت راست) */}
        <div className="flex items-center gap-3">
          <div className="relative group flex-shrink-0">
            <HamtavarLogo size={38} />
            <div className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                همتوار
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                شخصی
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-none">
              {todayStr}
            </p>
          </div>
        </div>

        {/* Action Controls (سمت چپ - کاملاً هم‌راستا و متوازن) */}
        <div className="flex items-center gap-2">
          {/* Admin Panel (آیکن مدیریت تبلیغات و سرور) */}
          <button
            onClick={onOpenAdminPanel}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 active:scale-95 transition-all flex items-center justify-center"
            title="مدیریت تبلیغات و سرور"
            aria-label="مدیریت سرور"
          >
            <Megaphone className="w-4 h-4" />
          </button>

          {/* Theme Toggle (تنظیم نور و تم - وسط‌چین و متوازن) */}
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all flex items-center justify-center"
            aria-label="تغییر تم"
            title={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Settings (تنظیمات برنامه) */}
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all flex items-center justify-center"
            aria-label="تنظیمات و پشتیبان"
            title="تنظیمات و پشتیبان"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Logout (خروج از حساب / خروج از برنامه) */}
          <button
            onClick={onLogout}
            className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 active:scale-95 transition-all flex items-center justify-center gap-1.5 text-xs font-bold shadow-2xs"
            aria-label="خروج از حساب"
            title="خروج از حساب کاربری"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </div>
    </header>
  );
};
