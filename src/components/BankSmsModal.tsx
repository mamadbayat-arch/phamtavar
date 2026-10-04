import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building2,
  AlertTriangle,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Clipboard,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { BankAccount, Money } from '../types';
import { parseBankSms, ParsedBankSms, KNOWN_BANKS } from '../utils/bankSmsParser';
import { formatToman, toPersianDigits, getTodayKey } from '../utils/jalali';

interface BankSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankAccounts: BankAccount[];
  initialSmsText?: string;
  onAddTransaction: (
    money: Omit<Money, 'id'>,
    bankId?: string,
    adjustBalance?: { bankId: string; newBalance: number }
  ) => void;
  onAddBankAccount: (bank: Omit<BankAccount, 'id'>) => BankAccount;
}

const SAMPLE_SMS_TEMPLATES = [
  {
    label: 'بانک ملت (خرید)',
    text: 'بانک ملت\nبرداشت مبلغ ۲۵۰,۰۰۰ ریال از حساب ۵۴۱۲\nمانده: ۱,۴۲۰,۰۰۰ ریال\nخرید از فروشگاه افق کوروش\n۱۴۰۵/۰۷/۱۵ ۱۰:۳۰',
  },
  {
    label: 'بلوبانک (واریز)',
    text: 'بلوبانک\nواریز مبلغ ۵۰۰,۰۰۰ تومان به کارت ۸۹۳۱\nمانده: ۳,۲۰۰,۰۰۰ تومان\nانتقال پایا از شرکت\n۱۴۰۵/۰۷/۱۵ ۱۲:۱۵',
  },
  {
    label: 'بانک ملی (اختلاف مانده)',
    text: 'بانک ملی ایران\nبرداشت از ۶۰۳۷۹۹...۱۲۳۴\nمبلغ: ۱,۰۰۰,۰۰۰ ریال\nمانده: ۵,۰۰۰,۰۰۰ ریال\nانتقال وجه شتابی',
  },
  {
    label: 'بانک سامان (برداشت)',
    text: 'بانک سامان\nبرداشت ۸۵۰,۰۰۰ ریال از کارت ۹۰۱۲\nموجودی: ۲,۱۰۰,۰۰۰ ریال\nخرید داروخانه',
  },
];

export const BankSmsModal: React.FC<BankSmsModalProps> = ({
  isOpen,
  onClose,
  bankAccounts,
  initialSmsText = '',
  onAddTransaction,
  onAddBankAccount,
}) => {
  const [smsText, setSmsText] = useState(initialSmsText);
  const [parsed, setParsed] = useState<ParsedBankSms | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [reconcileAction, setReconcileAction] = useState<
    'normal' | 'add_diff_expense' | 'add_diff_income' | 'force_reconcile'
  >('normal');

  useEffect(() => {
    if (initialSmsText) {
      setSmsText(initialSmsText);
    }
  }, [initialSmsText]);

  useEffect(() => {
    if (!smsText.trim()) {
      setParsed(null);
      return;
    }
    const result = parseBankSms(smsText);
    setParsed(result);

    if (result) {
      // Find matching bank account
      let match = bankAccounts.find(
        b =>
          (result.cardLast4 && b.cardLast4 && b.cardLast4.includes(result.cardLast4)) ||
          b.bankName.includes(result.bankName)
      );

      if (match) {
        setSelectedBankId(match.id);
      } else if (bankAccounts.length > 0) {
        setSelectedBankId(bankAccounts[0].id);
      }
    }
  }, [smsText, bankAccounts]);

  if (!isOpen) return null;

  const currentAccount = bankAccounts.find(b => b.id === selectedBankId);

  // Calculate Balance Reconciliations
  let balanceDiff = 0;
  let hasDiscrepancy = false;
  let expectedNewBalance = 0;

  if (currentAccount && parsed && parsed.balance !== undefined) {
    if (parsed.kind === 'expense') {
      expectedNewBalance = currentAccount.currentBalance - parsed.amount;
    } else {
      expectedNewBalance = currentAccount.currentBalance + parsed.amount;
    }

    balanceDiff = parsed.balance - expectedNewBalance;
    hasDiscrepancy = Math.abs(balanceDiff) > 100; // tolerance for small roundings
  }

  const handleConfirm = () => {
    if (!parsed) return;

    let targetBankId = selectedBankId;

    // If no bank account selected, auto-create one
    if (!targetBankId && parsed.bankName) {
      const newAcc = onAddBankAccount({
        bankName: parsed.bankName,
        cardLast4: parsed.cardLast4,
        initialBalance: parsed.balance || parsed.amount,
        currentBalance: parsed.balance || parsed.amount,
        lastBankSmsBalance: parsed.balance,
        color: '#10b981',
      });
      targetBankId = newAcc.id;
    }

    const today = getTodayKey();

    // 1. Add the main transaction
    onAddTransaction(
      {
        title: parsed.description || (parsed.kind === 'expense' ? 'خرید / برداشت بانکی' : 'واریز بانکی'),
        amount: parsed.amount,
        kind: parsed.kind,
        category: parsed.kind === 'expense' ? 'روزمره' : 'درآمد',
        date: today,
        bankId: targetBankId,
      },
      targetBankId,
      parsed.balance !== undefined
        ? {
            bankId: targetBankId,
            newBalance: parsed.balance,
          }
        : undefined
    );

    // 2. Handle discrepancy adjustment if user chose to add the difference
    if (hasDiscrepancy && currentAccount && parsed.balance !== undefined) {
      if (reconcileAction === 'add_diff_expense' && balanceDiff < 0) {
        // Bank has less money than expected -> add missing expense
        onAddTransaction(
          {
            title: `هزینه ثبت‌نشده (تطبیق با پیامک ${currentAccount.bankName})`,
            amount: Math.abs(balanceDiff),
            kind: 'expense',
            category: 'سایر',
            date: today,
            bankId: targetBankId,
          },
          targetBankId
        );
      } else if (reconcileAction === 'add_diff_income' && balanceDiff > 0) {
        // Bank has more money than expected -> add missing income
        onAddTransaction(
          {
            title: `درآمد ثبت‌نشده (تطبیق با پیامک ${currentAccount.bankName})`,
            amount: balanceDiff,
            kind: 'income',
            category: 'درآمد',
            date: today,
            bankId: targetBankId,
          },
          targetBankId
        );
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                تشخیص هوشمند پیامک بانکی
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                شناسایی خودکار بانک، واریز/برداشت و تطبیق موجودی حساب
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

        {/* SMS Input Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              متن پیامک بانکی
            </label>
            <button
              type="button"
              onClick={async () => {
                try {
                  const clip = await navigator.clipboard.readText();
                  if (clip) setSmsText(clip);
                } catch {
                  // clipboard denied
                }
              }}
              className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
            >
              <Clipboard className="w-3 h-3" />
              <span>چسباندن از کلیپ‌بورد</span>
            </button>
          </div>

          <textarea
            rows={3}
            value={smsText}
            onChange={e => setSmsText(e.target.value)}
            placeholder="متن پیامک واریز یا برداشت بانکی را اینجا جای‌گذاری کنید..."
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:text-slate-100 resize-none font-mono"
          />

          {/* Sample SMS Templates */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
            <span className="text-[10px] text-slate-400 whitespace-nowrap">تست با نمونه:</span>
            {SAMPLE_SMS_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSmsText(tmpl.text)}
                className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 whitespace-nowrap border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Parsed Result Display */}
        {parsed ? (
          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-xl text-white ${
                      parsed.kind === 'expense' ? 'bg-rose-500' : 'bg-emerald-600'
                    }`}
                  >
                    {parsed.kind === 'expense' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {parsed.kind === 'expense' ? 'برداشت / هزینه' : 'واریز / درآمد'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {parsed.bankName} {parsed.cardLast4 ? `· کارت ${toPersianDigits(parsed.cardLast4)}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-left">
                  <span
                    className={`text-base font-extrabold ${
                      parsed.kind === 'expense'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {parsed.kind === 'expense' ? '-' : '+'}
                    {formatToman(parsed.amount)}
                  </span>
                  {parsed.balance !== undefined && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      مانده پیامک: {formatToman(parsed.balance)}
                    </p>
                  )}
                </div>
              </div>

              {/* Target Bank Account Selection */}
              <div className="pt-2 border-t border-emerald-500/20">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  حساب بانکی مقصد در نرم‌افزار
                </label>
                <select
                  value={selectedBankId}
                  onChange={e => setSelectedBankId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-slate-100"
                >
                  {bankAccounts.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} {b.cardLast4 ? `(کارت ${toPersianDigits(b.cardLast4)})` : ''} — موجودی فعلی:{' '}
                      {formatToman(b.currentBalance)}
                    </option>
                  ))}
                  {bankAccounts.length === 0 && (
                    <option value="">(تعریف خودکار حساب برای این بانک)</option>
                  )}
                </select>
              </div>
            </div>

            {/* BALANCE RECONCILIATION & DISCREPANCY CHECK */}
            {currentAccount && parsed.balance !== undefined && (
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  hasDiscrepancy
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60'
                    : 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {hasDiscrepancy ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1 space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {hasDiscrepancy ? '⚠️ هشدار اختلاف موجودی حساب' : '✅ موجودی حساب کاملاً تراز است'}
                    </h4>

                    {hasDiscrepancy ? (
                      <div className="space-y-2 text-xs">
                        {balanceDiff < 0 ? (
                          <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                            موجودی مانده در پیامک بانک{' '}
                            <strong>{formatToman(Math.abs(balanceDiff))}</strong> کمتر از موجودی پیش‌بینی‌شده در
                            نرم‌افزار است.
                            <br />
                            <span className="font-semibold">
                              آیا هزینه یا برداشت ثبت‌نشده‌ای داشته‌اید؟
                            </span>
                          </p>
                        ) : (
                          <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                            موجودی مانده در پیامک بانک{' '}
                            <strong>{formatToman(balanceDiff)}</strong> بیشتر از موجودی پیش‌بینی‌شده در نرم‌افزار است.
                            <br />
                            <span className="font-semibold">
                              آیا درآمد یا واریز ثبت‌نشده‌ای داشته‌اید؟
                            </span>
                          </p>
                        )}

                        {/* Action radio choices */}
                        <div className="space-y-1.5 pt-1">
                          <label className="flex items-center gap-2 p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-700/60 cursor-pointer">
                            <input
                              type="radio"
                              name="reconcile"
                              checked={
                                reconcileAction ===
                                (balanceDiff < 0 ? 'add_diff_expense' : 'add_diff_income')
                              }
                              onChange={() =>
                                setReconcileAction(
                                  balanceDiff < 0 ? 'add_diff_expense' : 'add_diff_income'
                                )
                              }
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                              {balanceDiff < 0
                                ? `ثبت این تراکنش + ثبت خودکار هزینه ثبت‌نشده (${formatToman(Math.abs(balanceDiff))})`
                                : `ثبت این تراکنش + ثبت خودکار درآمد ثبت‌نشده (${formatToman(balanceDiff)})`}
                            </span>
                          </label>

                          <label className="flex items-center gap-2 p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name="reconcile"
                              checked={reconcileAction === 'force_reconcile'}
                              onChange={() => setReconcileAction('force_reconcile')}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                              فقط تطبیق مستقیم موجودی حساب با مانده پیامک ({formatToman(parsed.balance)})
                            </span>
                          </label>

                          <label className="flex items-center gap-2 p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name="reconcile"
                              checked={reconcileAction === 'normal'}
                              onChange={() => setReconcileAction('normal')}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                              فقط ثبت این تراکنش (بدون تغییر اختلاف حساب)
                            </span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                        پس از ثبت این تراکنش، موجودی نرم‌افزار دقیقاً با مانده بانک ({formatToman(parsed.balance)})
                        یکسان خواهد شد.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {parsed.kind === 'expense' ? 'تأیید و ثبت هزینه' : 'تأیید و ثبت درآمد'}
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        ) : (
          smsText.trim().length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                پیامک بانکی معتبری شناسایی نشد.
              </p>
              <p className="text-[11px] text-slate-400">
                لطفاً متن کامل پیامک بانکی که شامل کلمات واریز/برداشت و مبلغ است را وارد کنید یا از دکمه‌های نمونه بالا
                استفاده کنید.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
