import React from 'react';
import { Moon, Sun, Settings, Smartphone, Apple, Megaphone } from 'lucide-react';
import { formatJalaliLong, getTodayKey } from '../utils/jalali';
import { HamtavarLogo } from './HamtavarLogo';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenApkModal: () => void;
  onOpenIosModal: () => void;
  onOpenAdminPanel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onOpenSettings,
  onOpenApkModal,
  onOpenIosModal,
  onOpenAdminPanel,
}) => {
  const todayStr = formatJalaliLong(getTodayKey());

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-6 transition-colors duration-200">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Logo (بالا سمت راست) */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <HamtavarLogo size={40} />
            <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                همتوار
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                شخصی
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {todayStr}
            </p>
          </div>
        </div>

        {/* Action Controls (بالا سمت چپ) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Admin Panel & Ads */}
          <button
            onClick={onOpenAdminPanel}
            className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 active:scale-95 transition-all"
            title="مدیریت تبلیغات و سرور ابری"
          >
            <Megaphone className="w-4 h-4" />
          </button>

          {/* iOS / iPhone PWA button */}
          <button
            onClick={onOpenIosModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 shadow-sm active:scale-95 transition-all"
            title="نصب نسخه وب‌اپ روی آیفون (iOS PWA)"
          >
            <Apple className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">نسخه آیفون</span>
            <span className="sm:hidden">iOS</span>
          </button>

          {/* Direct APK Download Button */}
          <button
            onClick={onOpenApkModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-95 transition-all"
            title="دانلود مستقیم فایل APK همتوار برای اندروید"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">دانلود APK</span>
            <span className="sm:hidden">APK</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
            aria-label="تغییر تم"
            title={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
            aria-label="تنظیمات و پشتیبان"
            title="تنظیمات و پشتیبان"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
