import React, { useRef } from 'react';
import {
  X,
  Moon,
  Sun,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Apple,
  LogOut,
  LogIn,
} from 'lucide-react';
import { AppState } from '../types';
import { exportJsonBackup, importJsonBackup, getInitialSampleState } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  theme: 'light' | 'dark';
  state: AppState;
  onClose: () => void;
  onToggleTheme: () => void;
  onStateRestored: (newState: AppState) => void;
  onOpenApkModal: () => void;
  onOpenIosModal: () => void;
  onOpenAdminPanel: () => void;
  onCheckUpdate?: () => void;
  onLogout?: () => void;
  onOpenLogin?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  theme,
  state,
  onClose,
  onToggleTheme,
  onStateRestored,
  onOpenApkModal,
  onOpenIosModal,
  onOpenAdminPanel,
  onCheckUpdate,
  onLogout,
  onOpenLogin,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    exportJsonBackup(state);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const restored = await importJsonBackup(file);
      if (
        confirm(
          'آیا مایلید اطلاعات فعلی با این فایل پشتیبان جایگزین شود؟ (در صورت تمایل، ابتدا از اطلاعات فعلی پشتیبان بگیرید)'
        )
      ) {
        onStateRestored(restored);
        alert('پشتیبان با موفقیت بازیابی شد.');
        onClose();
      }
    } catch (err: any) {
      alert(`خطا در بازیابی پشتیبان: ${err?.message || 'قالب فایل نامعتبر است.'}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = () => {
    if (confirm('آیا می‌خواهید داده‌های نمونه بارگذاری شوند؟')) {
      onStateRestored(getInitialSampleState());
      alert('داده‌های نمونه بارگذاری شدند.');
      onClose();
    }
  };

  const handleClearAll = () => {
    if (
      confirm(
        'هشدار: تمامی کارهای شما پاک خواهند شد. آیا مطمئن هستید؟ حتماً ابتدا پشتیبان بگیرید.'
      )
    ) {
      onStateRestored({
        tasks: [],
        money: [],
        budget: 0,
        goals: [],
        habits: [],
        installments: [],
        cheques: [],
        bankAccounts: [],
      });
      alert('تمامی داده‌ها پاک شدند.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            تنظیمات و پشتیبان‌گیری
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-700 dark:text-slate-300">
          {/* APK banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-emerald-900 dark:text-emerald-300">
                خروجی نرم‌افزار اندروید (APK)
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                فایل قابل نصب مستقیم روی تمامی گوشی‌های اندروید
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenApkModal();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>دانلود APK</span>
            </button>
          </div>

          {/* iOS / iPhone PWA Guide */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <Apple className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">نسخه آیفون (iOS PWA)</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  نصب آسان و تمام‌صفحه از طریق مرورگر Safari
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenIosModal();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-xs"
            >
              <span>راهنمای نصب</span>
            </button>
          </div>

          {/* Admin & Cloud & Ads */}
          <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">پنل مدیریت تبلیغات، سرور و ابر</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  تنظیم بنرهای تبلیغاتی، همگام‌سازی ابری و انتقال SFTP
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenAdminPanel();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
            >
              <span>مدیریت</span>
            </button>
          </div>

          {/* Theme setting */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">حالت نمایشی (تم)</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                حالت فعلی: {theme === 'dark' ? 'تیره (شب)' : 'روشن (روز)'}
              </p>
            </div>
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>تغییر به روشن</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>تغییر به تیره</span>
                </>
              )}
            </button>
          </div>

          {/* Backup & Restore */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">پشتیبان اطلاعات شخصی</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                تمام اطلاعات شما فقط روی همین دستگاه نگهداری می‌شود و هیچ سرور خارجی وجود ندارد. پیش از تعویض گوشی یا حذف برنامه حتماً پشتیبان تهیه کنید.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold hover:bg-slate-100 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>ذخیره پشتیبان (JSON)</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold hover:bg-slate-100 transition-colors"
              >
                <Upload className="w-4 h-4 text-blue-600" />
                <span>بازیابی پشتیبان</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>
          </div>

          {/* User Account & Login / Logout */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                {state.userProfile?.isVerified
                  ? `${state.userProfile?.fullName || 'کاربر گرامی'} (${state.userProfile?.mobile})`
                  : 'کاربر مهمان (حالت آفلاین)'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {state.userProfile?.isVerified
                  ? 'حساب کاربری فعال و هماهنگ با سرور ابری همتوار'
                  : 'اطلاعات در این دستگاه ذخیره می‌شود. جهت پشتیبان ابری وارد شوید.'}
              </p>
            </div>
            {state.userProfile?.isVerified ? (
              onLogout && (
                <button
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-bold text-xs active:scale-95 transition-all flex-shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج از حساب</span>
                </button>
              )
            ) : (
              onOpenLogin && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs active:scale-95 transition-all flex-shrink-0 shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>ورود / ثبت‌نام</span>
                </button>
              )
            )}
          </div>

          {/* Sample Data & Reset */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
            <p className="font-bold text-slate-800 dark:text-slate-200">ابزارهای مدیریت داده</p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadSample}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>بارگذاری داده‌های نمونه</span>
              </button>

              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-semibold mr-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>پاکسازی همه</span>
              </button>
            </div>
          </div>

          {/* App Version & Auto-Update Check */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                نسخه همتوار شخصی: ۱.۲.۰
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                سیستم بررسی خودکار آخرین نسخه سرور (Auto-Update)
              </p>
            </div>
            {onCheckUpdate && (
              <button
                onClick={() => {
                  onClose();
                  onCheckUpdate();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>بررسی نسخه جدید</span>
              </button>
            )}
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p>
              همتوار شخصی هیچ داده‌ای به هیچ سروری ارسال نمی‌کند و نیازمند هیچ‌گونه ثبت‌نام یا مجوز اینترنت نیست.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
