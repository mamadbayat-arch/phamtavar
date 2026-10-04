import React from 'react';
import { X, Share, PlusSquare, Smartphone, CheckCircle, ExternalLink, Sparkles } from 'lucide-react';

interface IosInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IosInstallModal: React.FC<IosInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                نصب نسخه وب‌اپ روی آیفون (iOS)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                اجرای تمام‌صفحه، آفلاین و بومی با Safari
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-3 pt-1">
          {/* Step 1 */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Share className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                مرحله ۱: دکمه اشتراک‌گذاری
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                این صفحه را در مرورگر <strong>Safari</strong> آیفون باز کنید و دکمهٔ <strong>Share</strong> (آیکون ⬆️ مربع با فلش رو به بالا در نوار پایین) را لمس کنید.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <PlusSquare className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                مرحله ۲: افزودن به صفحه اصلی
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                در منوی گزینه‌ها کمی به پایین بیایید و گزینهٔ <strong>Add to Home Screen</strong> (یا «افزودن به صفحه اصلی» ➕) را انتخاب کنید.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                مرحله ۳: تأیید و نصب نهایی
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                در بالای سمت راست صفحه روی <strong>Add</strong> بزنید. آیکون برنامه مستقیماً در کنار سایر برنامه‌های آیفون شما قرار می‌گیرد!
              </p>
            </div>
          </div>
        </div>

        {/* Benefits badge list */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-1.5 text-xs text-emerald-900 dark:text-emerald-300">
          <div className="font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>مزایای نسخه وب‌اپ (PWA) در آیفون:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400 pr-1">
            <li>بدون نوار مرورگر و کاملاً تمام‌صفحه و مستقل (Standalone)</li>
            <li>عملکرد سریع با حفظ دائمی داده‌ها و کارهای شما روی حافظه دستگاه</li>
            <li>بدون نیاز به اپ‌استور و تحریم‌ناپذیر</li>
          </ul>
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-2xl transition-colors shadow-sm"
        >
          متوجه شدم
        </button>
      </div>
    </div>
  );
};
