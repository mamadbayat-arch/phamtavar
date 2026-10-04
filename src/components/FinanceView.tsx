import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Sliders,
  CreditCard,
  Building2,
} from 'lucide-react';
import { Money, Installment, Cheque, BankAccount } from '../types';
import {
  formatToman,
  formatJalaliShort,
  getTodayKey,
  daysDiff,
  toPersianDigits,
} from '../utils/jalali';

interface FinanceViewProps {
  money: Money[];
  budget: number;
  installments: Installment[];
  cheques: Cheque[];
  bankAccounts: BankAccount[];
  onOpenNewMoneyModal: () => void;
  onOpenNewInstallmentModal: () => void;
  onOpenNewChequeModal: () => void;
  onOpenBudgetModal: () => void;
  onOpenBankAccountsModal: () => void;
  onOpenSmsModal: () => void;
  onPayInstallment: (instId: string) => void;
  onToggleCheque: (chqId: string) => void;
  onDeleteMoney: (id: string) => void;
  onDeleteInstallment: (id: string) => void;
  onDeleteCheque: (id: string) => void;
  onEditMoney: (item: Money) => void;
  onEditInstallment: (item: Installment) => void;
  onEditCheque: (item: Cheque) => void;
}

type FinanceTab = 'transactions' | 'installments' | 'cheques';

export const FinanceView: React.FC<FinanceViewProps> = ({
  money,
  budget,
  installments,
  cheques,
  bankAccounts,
  onOpenNewMoneyModal,
  onOpenNewInstallmentModal,
  onOpenNewChequeModal,
  onOpenBudgetModal,
  onOpenBankAccountsModal,
  onOpenSmsModal,
  onPayInstallment,
  onToggleCheque,
  onDeleteMoney,
  onDeleteInstallment,
  onDeleteCheque,
  onEditMoney,
  onEditInstallment,
  onEditCheque,
}) => {
  const [tab, setTab] = useState<FinanceTab>('transactions');
  const todayStr = getTodayKey();

  // Financial calculations
  const totalIncome = money
    .filter(m => m.kind === 'income')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalExpense = money
    .filter(m => m.kind === 'expense')
    .reduce((sum, m) => sum + m.amount, 0);

  const balance = totalIncome - totalExpense;

  const budgetUsagePercent = budget > 0 ? Math.min(100, Math.round((totalExpense / budget) * 100)) : 0;
  const isOverBudget = budget > 0 && totalExpense > budget;

  // Alerts for cheques and installments
  const dueCheques = cheques.filter(c => !c.cashed && daysDiff(c.date, todayStr) <= 3);
  const dueInstallments = installments.filter(inst => {
    const [y, m, d] = todayStr.split('-').map(Number);
    const daysLeft = inst.dueDay - d;
    return inst.remaining > 0 && daysLeft >= 0 && daysLeft <= 3;
  });

  // Bank Discrepancy Alerts
  const discrepantAccounts = bankAccounts.filter(b => {
    if (b.lastBankSmsBalance === undefined) return false;
    return Math.abs(b.lastBankSmsBalance - b.currentBalance) > 100;
  });

  return (
    <div className="space-y-4">
      {/* Bank Account Discrepancy Alerts */}
      {discrepantAccounts.map(b => {
        const diff = (b.lastBankSmsBalance ?? 0) - b.currentBalance;
        const isLess = diff < 0;
        return (
          <div
            key={b.id}
            className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-300 dark:border-amber-800 shadow-xs flex items-start justify-between gap-3 animate-in fade-in"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  اختلاف حساب در {b.bankName} {b.cardLast4 ? `(کارت ${toPersianDigits(b.cardLast4)})` : ''}
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                  موجودی در آخرین پیامک بانک <strong>{formatToman(Math.abs(diff))}</strong>{' '}
                  {isLess ? 'کمتر' : 'بیشتر'} از موجودی نرم‌افزار است.
                  {isLess ? ' آیا هزینه یا برداشت ثبت‌نشده دارید؟' : ' آیا درآمد یا واریز ثبت‌نشده دارید؟'}
                </p>
              </div>
            </div>
            <button
              onClick={onOpenSmsModal}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xs transition-all"
            >
              بررسی و تطبیق
            </button>
          </div>
        );
      })}

      {/* Bank Accounts & Cards Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              حساب‌ها و کارت‌های بانکی
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {toPersianDigits(bankAccounts.length)} حساب
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenSmsModal}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-xs transition-all"
              title="پردازش خودکار پیامک بانکی"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>پردازش پیامک</span>
            </button>

            <button
              onClick={onOpenBankAccountsModal}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>مدیریت بانک‌ها</span>
            </button>
          </div>
        </div>

        {/* Horizontal bank cards */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {bankAccounts.map(b => {
            const diff =
              b.lastBankSmsBalance !== undefined ? b.lastBankSmsBalance - b.currentBalance : 0;
            const hasDiff = Math.abs(diff) > 100;
            return (
              <div
                key={b.id}
                onClick={onOpenSmsModal}
                className="flex-shrink-0 min-w-[155px] p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-850/70 hover:border-emerald-500/50 cursor-pointer transition-all shadow-xs"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {b.bankName}
                  </span>
                  {hasDiff ? (
                    <span
                      className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                      title="دارای اختلاف موجودی با پیامک"
                    />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="تراز با بانک" />
                  )}
                </div>
                <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {formatToman(b.currentBalance)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {b.cardLast4 ? `کارت **** ${toPersianDigits(b.cardLast4)}` : 'حساب پیش‌فرض'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      {/* Due Date Alert Banner */}
      {(dueCheques.length > 0 || dueInstallments.length > 0) && (
        <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>یادآوری سررسید چک‌ها و اقساط</span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            {dueCheques.map(c => {
              const diff = daysDiff(c.date, todayStr);
              return (
                <div key={c.id} className="flex items-center justify-between gap-2">
                  <span>
                    چک «{c.title}» ({formatToman(c.amount)}):{' '}
                    <strong className="text-amber-700 dark:text-amber-400">
                      {diff < 0 ? 'سررسید گذشته!' : diff === 0 ? 'سررسید امروز!' : `${toPersianDigits(diff)} روز مانده`}
                    </strong>
                  </span>
                  <button
                    onClick={() => onToggleCheque(c.id)}
                    className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    پاس شد
                  </button>
                </div>
              );
            })}

            {dueInstallments.map(inst => (
              <div key={inst.id} className="flex items-center justify-between gap-2">
                <span>
                  قسط «{inst.title}» ({formatToman(inst.amount)}): روز {toPersianDigits(inst.dueDay)} ماه ({toPersianDigits(inst.remaining)} قسط مانده)
                </span>
                <button
                  onClick={() => onPayInstallment(inst.id)}
                  className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  ثبت پرداخت
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Income */}
        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mb-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>کل دریافتی</span>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {formatToman(totalIncome)}
          </p>
        </div>

        {/* Expense */}
        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 mb-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>کل هزینه‌ها</span>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {formatToman(totalExpense)}
          </p>
        </div>

        {/* Balance */}
        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
            <Wallet className="w-3.5 h-3.5 text-blue-500" />
            <span>تراز مالی</span>
          </div>
          <p
            className={`text-sm font-bold truncate ${
              balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatToman(balance)}
          </p>
        </div>
      </div>

      {/* Budget Meter */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              بودجه ماهانه
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {budget > 0
                ? `${formatToman(totalExpense)} از سقف ${formatToman(budget)} (${toPersianDigits(budgetUsagePercent)}٪)`
                : 'هنوز سقف بودجه تعیین نشده است.'}
            </p>
          </div>
          <button
            onClick={onOpenBudgetModal}
            className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 font-semibold"
          >
            <Sliders className="w-3 h-3" />
            <span>تنظیم بودجه</span>
          </button>
        </div>

        {budget > 0 && (
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget ? 'bg-rose-500' : budgetUsagePercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (totalExpense / budget) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'transactions' as FinanceTab, label: 'تراکنش‌ها' },
            { id: 'installments' as FinanceTab, label: 'اقساط' },
            { id: 'cheques' as FinanceTab, label: 'چک‌ها' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === t.id
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Add button corresponding to current sub-tab */}
        {tab === 'transactions' && (
          <button
            onClick={onOpenNewMoneyModal}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ثبت تراکنش</span>
          </button>
        )}
        {tab === 'installments' && (
          <button
            onClick={onOpenNewInstallmentModal}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>قسط جدید</span>
          </button>
        )}
        {tab === 'cheques' && (
          <button
            onClick={onOpenNewChequeModal}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>چک جدید</span>
          </button>
        )}
      </div>

      {/* Tab Content: Transactions */}
      {tab === 'transactions' && (
        <div className="space-y-2">
          {money.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
              هنوز هیچ تراکنشی ثبت نکرده‌اید.
            </div>
          ) : (
            money.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      item.kind === 'income'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                    }`}
                  >
                    {item.kind === 'income' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>دسته: {item.category}</span>
                      <span>•</span>
                      <span>{formatJalaliShort(item.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-bold ${
                      item.kind === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {item.kind === 'income' ? '+' : '-'} {formatToman(item.amount)}
                  </span>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => onEditMoney(item)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteMoney(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content: Installments */}
      {tab === 'installments' && (
        <div className="space-y-2.5">
          {installments.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
              هیچ اقساط ماهانه‌ای ثبت نشده است.
            </div>
          ) : (
            installments.map(inst => (
              <div
                key={inst.id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {inst.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      سررسید: هر ماه روز {toPersianDigits(inst.dueDay)} · {toPersianDigits(inst.remaining)} از {toPersianDigits(inst.total)} قسط باقی‌مانده
                    </p>
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {formatToman(inst.amount)}
                    </p>
                    <p className="text-[11px] text-slate-400">به ازای هر قسط</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => onPayInstallment(inst.id)}
                    disabled={inst.remaining <= 0}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{inst.remaining <= 0 ? 'تمام اقساط تسویه شد' : 'ثبت پرداخت یک قسط'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditInstallment(inst)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteInstallment(inst.id)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content: Cheques */}
      {tab === 'cheques' && (
        <div className="space-y-2.5">
          {cheques.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
              هنوز چکی ثبت نشده است.
            </div>
          ) : (
            cheques.map(c => {
              const diff = daysDiff(c.date, todayStr);
              return (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-xl border shadow-sm transition-all ${
                    c.cashed
                      ? 'bg-slate-50 dark:bg-slate-850/40 border-slate-200 dark:border-slate-800 opacity-70'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3
                        className={`text-sm font-bold ${
                          c.cashed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {c.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>سررسید: {formatJalaliShort(c.date)}</span>
                        {!c.cashed && (
                          <span
                            className={`font-semibold ${
                              diff < 0
                                ? 'text-rose-500'
                                : diff === 0
                                ? 'text-amber-500 font-bold'
                                : 'text-slate-500'
                            }`}
                          >
                            ({diff < 0 ? 'سررسید گذشته' : diff === 0 ? 'امروز' : `${toPersianDigits(diff)} روز دیگر`})
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {formatToman(c.amount)}
                      </p>
                      <button
                        onClick={() => onToggleCheque(c.id)}
                        className={`mt-1 text-xs font-bold px-2 py-0.5 rounded ${
                          c.cashed
                            ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {c.cashed ? 'پاس شده' : 'علامت به عنوان پاس شده'}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1 pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
                    <button
                      onClick={() => onEditCheque(c)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCheque(c.id)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
