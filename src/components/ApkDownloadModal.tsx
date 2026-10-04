import React from 'react';
import {
  Smartphone,
  Download,
  X,
  ShieldCheck,
  HardDrive,
  Cpu,
  CheckCircle,
  FileCheck,
} from 'lucide-react';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              دریافت خروجی نرم‌افزار اندروید (APK)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
          {/* Main Download Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white dark:bg-slate-800 shadow-md p-1 ring-2 ring-emerald-500/20 flex items-center justify-center">
              <img
                src="/assets/hamtavar-icon.png"
                alt="همتوار شخصی"
                className="w-full h-full rounded-xl object-contain"
              />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                همتوار شخصی (نسخه اندروید)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                شناسه: ir.hamtavar.personal · نسخه ۰٫۱ (کد ۱)
              </p>
            </div>

            {/* Direct Download Button */}
            <div className="space-y-2">
              <a
                href="https://github.com/mamadbayat-arch/phamtavar/raw/main/public/hamtavar-personal-debug.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span>دانلود مستقیم فایل APK (لینک عمومی و بدون محدودیت)</span>
              </a>

              <a
                href="https://github.com/mamadbayat-arch/phamtavar/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>مشاهده و دانلود از مخزن گیت‌هاب (GitHub Releases)</span>
              </a>
            </div>

            <p className="text-[11px] text-slate-400">
              بیلد شده با Android SDK 34 و کاملاً سازگار با اندروید ۶ تا ۱۴+
            </p>
          </div>

          {/* Technical Specs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold mb-1">
                <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
                <span>حجم بسیار سبک</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                حدود ۱٫۵ مگابایت با بارگذاری آنی و مصرف رم ناچیز
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>۱۰۰٪ امن و آفلاین</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                بدون نیاز به اینترنت یا دسترسی‌های مشکوک
              </p>
            </div>
          </div>

          {/* Installation Guide */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-500" />
              <span>راهنمای نصب روی گوشی اندروید:</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 pr-1">
              <li>فایل APK را با دکمهٔ بالا روی گوشی یا تبلت خود دانلود کنید.</li>
              <li>در اعلان دانلود یا پوشهٔ Downloads روی فایل ضربه بزنید.</li>
              <li>
                در صورت نمایش هشدار مرورگر (مجوز نصب برنامه‌های ناشناخته): گزینهٔ{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  Settings / تنظیمات
                </strong>{' '}
                را بزنید و تیک{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  Allow from this source (مجاز از این منبع)
                </strong>{' '}
                را فعال کنید.
              </li>
              <li>روی «Install / نصب» بزنید تا برنامه فوراً روی گوشی شما نصب شود.</li>
            </ol>
          </div>

          {/* Developer / CI Note */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              نکته فنی برای توسعه‌دهنده و گیت‌هاب:
            </p>
            <p>
              فایل‌های پروژه در مسیر <code className="font-mono">android/</code> و{' '}
              <code className="font-mono">www/</code> قرار دارند و گیت‌هاب اکشن{' '}
              <code className="font-mono">.github/workflows/build-apk.yml</code> نیز تنظیم شده
              تا با هر push روی شاخه main به صورت خودکار خروجی APK جدید را بسازد.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
