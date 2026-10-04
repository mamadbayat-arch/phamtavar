import React, { useState } from 'react';
import {
  Download,
  Sparkles,
  CheckCircle2,
  X,
  AlertTriangle,
  RefreshCw,
  Smartphone,
  ArrowRight,
  ShieldCheck,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { AppVersionInfo } from '../types';
import { HamtavarLogo } from './HamtavarLogo';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  versionInfo: AppVersionInfo | null;
  currentVersion: string;
  currentVersionCode: number;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  versionInfo,
  currentVersion,
  currentVersionCode,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(false);

  if (!isOpen || !versionInfo) return null;

  const isMandatory = versionInfo.isMandatory;

  const handleDownloadAndInstallApk = () => {
    setIsDownloading(true);
    setDownloadProgress(10);

    // Simulate smooth progress bar for realistic user feedback
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 15;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setDownloadProgress(100);
      setIsDownloading(false);
      setIsDownloaded(true);

      const defaultPublicApkUrl = 'https://github.com/mamadbayat-arch/phamtavar/raw/main/public/hamtavar-personal-debug.apk';
      const downloadUrl = versionInfo.apkUrl && versionInfo.apkUrl.startsWith('http')
        ? versionInfo.apkUrl
        : defaultPublicApkUrl;

      // If running inside Android Native WebView Bridge
      if ((window as any).PersonalNative && typeof (window as any).PersonalNative.downloadAndInstallApk === 'function') {
        (window as any).PersonalNative.downloadAndInstallApk(downloadUrl);
      } else {
        // Standard Web/Browser download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'hamtavar-personal-update.apk';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }, 1500);
  };

  const handlePwaReload = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const reg of registrations) {
          reg.update();
        }
      });
    }
    // Hard reload ignoring cache
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header Banner */}
        <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 pt-7 text-center overflow-hidden">
          {/* Background decorative circles */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-emerald-400/20 rounded-full blur-lg pointer-events-none" />

          {!isMandatory && (
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="inline-flex p-3 bg-white/15 backdrop-blur-sm rounded-2xl shadow-inner mb-3">
            <HamtavarLogo size={48} />
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <h2 className="text-lg font-black tracking-tight">
              نسخه جدید همتوار آماده است!
            </h2>
          </div>

          <p className="text-xs text-emerald-100 max-w-xs mx-auto">
            برای بهره‌مندی از آخرین امکانات و بهبود کارایی، برنامه را به‌روزرسانی کنید.
          </p>

          {/* Version Pill comparison */}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-sm text-xs font-mono font-bold shadow-xs">
            <span className="opacity-75">نسخه شما: {currentVersion}</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-90" />
            <span className="text-amber-200 font-extrabold">نسخه سرور: {versionInfo.version}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {isMandatory && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>این به‌روزرسانی برای حفظ پایداری و اطلاعات شما الزامی است.</span>
            </div>
          )}

          {/* Release Notes / Changelog */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>تغییرات و قابلیت‌های جدید این نسخه:</span>
            </span>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto space-y-2 text-xs text-slate-700 dark:text-slate-300">
              {versionInfo.changelog && versionInfo.changelog.length > 0 ? (
                versionInfo.changelog.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{log}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>بهبود عملکرد کلی و سرعت بارگذاری</span>
                </div>
              )}
            </div>
          </div>

          {/* Download Progress Bar */}
          {isDownloading && (
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-in fade-in">
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>در حال دریافت فایل نسخه جدید...</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {isDownloaded && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>فایل دریافت شد. جهت تکمیل نصب روی فایل دانلودشده ضربه بزنید.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleDownloadAndInstallApk}
              disabled={isDownloading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال آماده‌سازی دانلود...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>دانلود و نصب نسخه جدید (اندروید APK)</span>
                </>
              )}
            </button>

            <button
              onClick={handlePwaReload}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>به‌روزرسانی سریع نسخه وب / آیفون (PWA)</span>
            </button>

            {!isMandatory && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                بعداً یادآوری کن
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>هنگام به‌روزرسانی هیچ‌کدام از اطلاعات و کارهای شما پاک نخواهد شد.</span>
        </div>
      </div>
    </div>
  );
};
