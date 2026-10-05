import React, { useRef, useState } from 'react';
import {
  X,
  Moon,
  Sun,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  LogOut,
  CloudUpload,
  CloudDownload,
  RefreshCw,
} from 'lucide-react';
import { AppState, CURRENT_APP_VERSION } from '../types';
import { exportJsonBackup, importJsonBackup, getInitialSampleState, getEmptyState } from '../utils/storage';
import { ApiError, apiJson, hasServer, isTelemetryEnabled, postJson, setTelemetryEnabled } from '../utils/api';
import { toPersianDigits } from '../utils/jalali';

interface SettingsModalProps {
  isOpen: boolean;
  theme: 'light' | 'dark';
  state: AppState;
  isLoggedIn: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onToggleTheme: () => void;
  onStateRestored: (newState: AppState) => void;
  onNotify: (message: string) => void;
  onOpenAdminPanel: () => void;
  onCheckUpdate: () => void;
  onLogout: () => void;
}

const card = 'p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
const plainButton =
  'flex items-center justify-center gap-1.5 min-h-10 py-2 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors disabled:opacity-50';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  theme,
  state,
  isLoggedIn,
  isAdmin,
  onClose,
  onToggleTheme,
  onStateRestored,
  onNotify,
  onOpenAdminPanel,
  onCheckUpdate,
  onLogout,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cloudBusy, setCloudBusy] = useState<'sync' | 'restore' | null>(null);
  const [telemetry, setTelemetry] = useState(isTelemetryEnabled);

  if (!isOpen) return null;

  const serverAvailable = hasServer();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const restored = await importJsonBackup(file);
      if (confirm('اطلاعات فعلی با این فایل پشتیبان جایگزین شود؟ (بهتر است ابتدا از اطلاعات فعلی پشتیبان بگیرید)')) {
        onStateRestored(restored);
        onNotify('پشتیبان با موفقیت بازیابی شد.');
        onClose();
      }
    } catch (err: any) {
      onNotify(`خطا در بازیابی پشتیبان: ${err?.message || 'قالب فایل نامعتبر است.'}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCloudSync = async () => {
    setCloudBusy('sync');
    try {
      await postJson('/api/cloud/sync', { state });
      onNotify('پشتیبان ابری ذخیره شد.');
    } catch (err) {
      onNotify((err as ApiError).message || 'ذخیره ابری انجام نشد.');
    } finally {
      setCloudBusy(null);
    }
  };

  const handleCloudRestore = async () => {
    if (!confirm('اطلاعات فعلی این دستگاه با آخرین پشتیبان ابری جایگزین شود؟')) return;
    setCloudBusy('restore');
    try {
      const data = await apiJson('/api/cloud/restore');
      if (!data.backup?.state) {
        onNotify('هنوز پشتیبان ابری برای این حساب ثبت نشده است.');
        return;
      }
      onStateRestored(data.backup.state);
      onNotify('اطلاعات از پشتیبان ابری بازیابی شد.');
      onClose();
    } catch (err) {
      onNotify((err as ApiError).message || 'بازیابی ابری انجام نشد.');
    } finally {
      setCloudBusy(null);
    }
  };

  const handleLoadSample = () => {
    if (confirm('داده‌های فعلی با داده‌های نمونه جایگزین می‌شوند. ادامه می‌دهید؟')) {
      onStateRestored(getInitialSampleState());
      onNotify('داده‌های نمونه بارگذاری شدند.');
      onClose();
    }
  };

  const handleClearAll = () => {
    if (confirm('هشدار: همه کارها، تراکنش‌ها، عادت‌ها و اهداف شما پاک می‌شوند. مطمئن هستید؟')) {
      onStateRestored(getEmptyState());
      onNotify('تمامی داده‌ها پاک شدند.');
      onClose();
    }
  };

  const toggleTelemetry = () => {
    const next = !telemetry;
    setTelemetryEnabled(next);
    setTelemetry(next);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom duration-200"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 id="settings-title" className="text-base font-bold text-slate-800 dark:text-slate-100">
            تنظیمات و پشتیبان‌گیری
          </h2>
          <button
            onClick={onClose}
            aria-label="بستن"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] overflow-y-auto space-y-3 text-xs text-slate-700 dark:text-slate-300">
          {/* Account */}
          {isLoggedIn && (
            <div className={`${card} flex items-center justify-between gap-3`}>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  {state.userProfile?.fullName || 'کاربر همتوار'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5" dir="ltr">
                  {toPersianDigits(state.userProfile?.mobile || '')}
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="flex items-center gap-1.5 min-h-10 px-3 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-bold active:scale-95 transition-all flex-shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج از حساب</span>
              </button>
            </div>
          )}

          {isAdmin && (
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">پنل مدیریت سامانه</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">بنر اطلاع‌رسانی، نسخه برنامه و دیتاست</p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenAdminPanel();
                }}
                className="min-h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs flex-shrink-0"
              >
                مدیریت
              </button>
            </div>
          )}

          {/* Theme */}
          <div className={`${card} flex items-center justify-between gap-3`}>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">حالت نمایش</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                حالت فعلی: {theme === 'dark' ? 'تیره' : 'روشن'}
              </p>
            </div>
            <button onClick={onToggleTheme} className={plainButton}>
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

          {/* Backup */}
          <div className={`${card} space-y-2.5`}>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">پشتیبان اطلاعات</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                اطلاعات شما روی همین دستگاه نگهداری می‌شود. پیش از تعویض گوشی یا حذف برنامه پشتیبان بگیرید.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => exportJsonBackup(state)} className={plainButton}>
                <Download className="w-4 h-4 text-emerald-600" />
                <span>ذخیره در فایل</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className={plainButton}>
                <Upload className="w-4 h-4 text-blue-600" />
                <span>بازیابی از فایل</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportFile}
              />

              {serverAvailable && isLoggedIn && (
                <>
                  <button onClick={handleCloudSync} disabled={cloudBusy !== null} className={plainButton}>
                    {cloudBusy === 'sync' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CloudUpload className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>ذخیره در ابر</span>
                  </button>
                  <button onClick={handleCloudRestore} disabled={cloudBusy !== null} className={plainButton}>
                    {cloudBusy === 'restore' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CloudDownload className="w-4 h-4 text-blue-600" />
                    )}
                    <span>بازیابی از ابر</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Usage sharing */}
          {serverAvailable && (
            <div className={`${card} flex items-center justify-between gap-3`}>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">کمک به بهبود همتوار</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  نوع و زمان کارهایی که در برنامه انجام می‌دهید (بدون عنوان‌ها و شماره شما) برای بهبود برنامه ارسال می‌شود.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={telemetry}
                aria-label="ارسال آمار استفاده"
                onClick={toggleTelemetry}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  telemetry ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                    telemetry ? 'right-0.5' : 'right-[1.375rem]'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Data tools */}
          <div className={`${card} space-y-2`}>
            <p className="font-bold text-slate-800 dark:text-slate-200">ابزارهای داده</p>
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleLoadSample}
                className="flex items-center gap-1 min-h-10 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>بارگذاری داده‌های نمونه</span>
              </button>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 min-h-10 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>پاکسازی همه</span>
              </button>
            </div>
          </div>

          {/* Version */}
          <div className={`${card} flex items-center justify-between gap-3`}>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              نسخه همتوار شخصی: <span dir="ltr">{toPersianDigits(CURRENT_APP_VERSION)}</span>
            </p>
            {serverAvailable && (
              <button
                onClick={() => {
                  onClose();
                  onCheckUpdate();
                }}
                className="min-h-10 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs flex-shrink-0"
              >
                بررسی نسخه جدید
              </button>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p>
              {serverAvailable
                ? 'کارها و اطلاعات مالی شما فقط وقتی به سرور می‌رود که خودتان «ذخیره در ابر» را بزنید.'
                : 'این نسخه به هیچ سروری وصل نیست و همه اطلاعات فقط روی همین دستگاه می‌ماند.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
