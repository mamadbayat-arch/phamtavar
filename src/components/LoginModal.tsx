import React, { useState, useEffect } from 'react';
import { Smartphone, User, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, RefreshCw, KeyRound, AlertCircle, X } from 'lucide-react';
import { UserProfile } from '../types';
import { HamtavarLogo } from './HamtavarLogo';

interface LoginModalProps {
  isOpen: boolean;
  onSuccess: (profile: UserProfile) => void;
  onSkip?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onSuccess, onSkip }) => {
  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [fallbackCode, setFallbackCode] = useState<string | null>(null);
  const [timer, setTimer] = useState(120);

  useEffect(() => {
    if (isOpen) {
      setStep('info');
      setOtpCode('');
      setErrorMsg('');
      setInfoMsg('');
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: any;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!isOpen) return null;

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const cleanMobile = mobile.trim();
    if (!cleanMobile) {
      setErrorMsg('لطفاً شماره موبایل خود را وارد نمایید.');
      return;
    }
    if (!/^09\d{9}$/.test(cleanMobile)) {
      setErrorMsg('شماره موبایل نامعتبر است. نمونه صحیح: ۰۹۱۲۳۴۵۶۷۸۹');
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg('لطفاً نام و نام خانوادگی خود را وارد کنید.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: cleanMobile, fullName: fullName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('otp');
        setTimer(120);
        setFallbackCode(data.fallbackCode || null);
        setInfoMsg(data.message || 'کد تایید ارسال گردید.');
      } else {
        setErrorMsg(data.message || 'خطا در ارسال کد تایید');
      }
    } catch (err: any) {
      // In case of offline or local standalone
      const mockCode = '12345';
      setStep('otp');
      setTimer(120);
      setFallbackCode(mockCode);
      setInfoMsg('حالت آفلاین: از کد ۱۲۳۴۵ برای ورود استفاده کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const cleanCode = otpCode.trim();
    if (!cleanCode) {
      setErrorMsg('لطفاً کد تایید را وارد کنید.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: mobile.trim(),
          code: cleanCode,
          fullName: fullName.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        onSuccess(data.user);
      } else {
        // Fallback check
        if (fallbackCode && cleanCode === fallbackCode) {
          const profile: UserProfile = {
            mobile: mobile.trim(),
            fullName: fullName.trim() || 'کاربر همتوار',
            isVerified: true,
            registeredAt: new Date().toISOString(),
          };
          onSuccess(profile);
        } else {
          setErrorMsg(data.message || 'کد وارد شده صحیح نمی‌باشد.');
        }
      }
    } catch (err: any) {
      if (cleanCode === '12345' || (fallbackCode && cleanCode === fallbackCode)) {
        const profile: UserProfile = {
          mobile: mobile.trim() || '09120000000',
          fullName: fullName.trim() || 'کاربر همتوار',
          isVerified: true,
          registeredAt: new Date().toISOString(),
        };
        onSuccess(profile);
      } else {
        setErrorMsg('خطا در بررسی کد. مجدداً تلاش نمایید.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFastLoginWithFallback = () => {
    if (fallbackCode) {
      setOtpCode(fallbackCode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden p-6 sm:p-7 space-y-5">
        {/* Optional Close Button */}
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="بستن پنجره ورود"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-emerald-500/10 rounded-2xl">
            <HamtavarLogo size={52} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            به همتوار شخصی خوش آمدید
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
            مدیریت هوشمند کارهای روزانه، ماتریس آیزنهاور، امور مالی و بودجه، عادات و اهداف
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 pt-1 pb-1">
          <div
            className={`h-1.5 rounded-full transition-all ${
              step === 'info' ? 'w-8 bg-emerald-600' : 'w-3 bg-slate-300 dark:bg-slate-700'
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all ${
              step === 'otp' ? 'w-8 bg-emerald-600' : 'w-3 bg-slate-300 dark:bg-slate-700'
            }`}
          />
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="flex items-center gap-2 p-3 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* STEP 1: MOBILE & NAME */}
        {step === 'info' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>نام و نام خانوادگی</span>
              </label>
              <input
                type="text"
                placeholder="مثلاً: محمد بیات"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="rtl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>شماره تلفن همراه</span>
              </label>
              <input
                type="tel"
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold tracking-wider text-left focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
                maxLength={11}
                required
              />
              <p className="text-[11px] text-slate-400">
                کد تایید پیامکی از طریق سامانه پیامک برای این شماره ارسال خواهد شد.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال ارسال پیامک...</span>
                  </>
                ) : (
                  <>
                    <span>دریافت کد تایید پیامکی</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>

              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  ورود موقت به عنوان مهمان (بعداً ثبت می‌کنم)
                </button>
              )}
            </div>
          </form>
        )}

        {/* STEP 2: ENTER OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">شماره ثبت‌شده:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono" dir="ltr">
                  {mobile}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                پیامک: «به همتوار خوش آمدید. کد ورود شما #CODE# hamtavar.ir»
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  <span>کد تایید ۵ رقمی</span>
                </span>
                {timer > 0 ? (
                  <span className="text-[11px] text-slate-400 font-mono">
                    {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')} مانده
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    ارسال مجدد کد
                  </button>
                )}
              </label>

              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                placeholder="-----"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center text-xl font-bold tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
                dir="ltr"
                required
              />
            </div>

            {fallbackCode && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
                <span>کد تست سریع: <strong>{fallbackCode}</strong></span>
                <button
                  type="button"
                  onClick={handleFastLoginWithFallback}
                  className="px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold text-[10px]"
                >
                  درج خودکار
                </button>
              </div>
            )}

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال بررسی...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأیید و ورود به همتوار</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('info')}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                اصلاح شماره یا نام
              </button>
            </div>
          </form>
        )}

        {/* Footer Guarantee */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>ورود فقط برای بار اول جهت فعال‌سازی حساب و پشتیبان ابری است</span>
        </div>
      </div>
    </div>
  );
};
