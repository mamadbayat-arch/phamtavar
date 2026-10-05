import React, { useState, useEffect } from 'react';
import { Smartphone, User, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, RefreshCw, KeyRound, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { HamtavarLogo } from './HamtavarLogo';
import { ApiError, postJson, setToken } from '../utils/api';
import { toEnglishDigits } from '../utils/jalali';

interface LoginModalProps {
  isOpen: boolean;
  onSuccess: (profile: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onSuccess }) => {
  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  // Only a development server ever returns the code; production never does.
  const [devCode, setDevCode] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (isOpen) {
      // A fresh form every time: the next person must not see the last user's number.
      setStep('info');
      setFullName('');
      setMobile('');
      setOtpCode('');
      setErrorMsg('');
      setInfoMsg('');
      setDevCode(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step !== 'otp' || timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!isOpen) return null;

  const cleanMobile = toEnglishDigits(mobile).replace(/\D/g, '');

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!fullName.trim()) {
      setErrorMsg('لطفاً نام و نام خانوادگی خود را وارد کنید.');
      return;
    }
    if (!/^09\d{9}$/.test(cleanMobile)) {
      setErrorMsg('شماره موبایل نامعتبر است. نمونه صحیح: ۰۹۱۲۳۴۵۶۷۸۹');
      return;
    }

    setIsLoading(true);
    try {
      const data = await postJson('/api/auth/send-otp', { mobile: cleanMobile, fullName: fullName.trim() });
      setStep('otp');
      setOtpCode('');
      setTimer(60);
      setDevCode(data.devCode || null);
      setInfoMsg(data.message || 'کد تأیید ارسال شد.');
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 429 && apiErr.data?.retryAfter && step === 'otp') {
        setTimer(apiErr.data.retryAfter);
      }
      setErrorMsg(apiErr.message || 'خطا در ارسال کد تأیید');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const cleanCode = toEnglishDigits(otpCode).replace(/\D/g, '');
    if (cleanCode.length !== 5) {
      setErrorMsg('کد تأیید ۵ رقمی را کامل وارد کنید.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await postJson('/api/auth/verify-otp', {
        mobile: cleanMobile,
        code: cleanCode,
        fullName: fullName.trim(),
      });
      setToken(data.token);
      onSuccess(data.user);
    } catch (err) {
      setErrorMsg((err as ApiError).message || 'خطا در بررسی کد. دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden p-6 sm:p-7 space-y-5">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-emerald-500/10 rounded-2xl">
            <HamtavarLogo size={52} />
          </div>
          <h2 id="login-title" className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            ورود به سامانه همتوار شخصی
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
            جهت حفظ امنیت و دسترسی به اطلاعات شخصی، ورود فقط با شماره موبایل و کد تایید پیامکی امکان‌پذیر است.
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
          <div role="alert" className="flex items-center gap-2 p-3 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div role="status" className="flex items-center gap-2 p-3 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
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
                autoComplete="name"
                maxLength={80}
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
                inputMode="numeric"
                autoComplete="tel"
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
                  {cleanMobile}
                </span>
              </div>
<p className="text-[11px] text-slate-400">کد ۵ رقمی پیامک‌شده به این شماره را وارد کنید.</p>
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
                    onClick={() => handleSendOtp()}
                    disabled={isLoading}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    ارسال مجدد کد
                  </button>
                )}
              </label>

              <input
                type="text"
                maxLength={5}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otpCode}
                onChange={e => setOtpCode(toEnglishDigits(e.target.value).replace(/\D/g, ''))}
                placeholder="-----"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center text-xl font-bold tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
                dir="ltr"
                required
              />
            </div>

            {devCode && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
                <span>
                  سرور در حالت توسعه است؛ کد: <strong dir="ltr">{devCode}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setOtpCode(devCode)}
                  className="px-2 py-1 rounded-md bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold text-[10px]"
                >
                  درج کد
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
          <span>اطلاعات شما روی همین دستگاه می‌ماند؛ حساب فقط برای پشتیبان ابری است</span>
        </div>
      </div>
    </div>
  );
};
