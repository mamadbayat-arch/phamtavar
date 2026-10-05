import React, { useState } from 'react';
import {
  X,
  Building2,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { BankAccount } from '../types';
import { KNOWN_BANKS } from '../utils/bankSmsParser';
import { formatToman, toPersianDigits, toEnglishDigits } from '../utils/jalali';

interface BankAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankAccounts: BankAccount[];
  onAddBankAccount: (bank: Omit<BankAccount, 'id'>) => void;
  onUpdateBankAccount: (bank: BankAccount) => void;
  onDeleteBankAccount: (id: string) => void;
  onOpenSmsModal: () => void;
}

export const BankAccountsModal: React.FC<BankAccountsModalProps> = ({
  isOpen,
  onClose,
  bankAccounts,
  onAddBankAccount,
  onUpdateBankAccount,
  onDeleteBankAccount,
  onOpenSmsModal,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [bankName, setBankName] = useState(KNOWN_BANKS[0].name);
  const [cardLast4, setCardLast4] = useState('');
  const [initialBalance, setInitialBalance] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBalance = Number(toEnglishDigits(initialBalance).replace(/[,٬\s]/g, '')) || 0;
    const cleanLast4 = toEnglishDigits(cardLast4).slice(-4);
    const bankMeta = KNOWN_BANKS.find(b => b.name === bankName);

    if (editingId) {
      const existing = bankAccounts.find(b => b.id === editingId);
      if (existing) {
        onUpdateBankAccount({
          ...existing,
          bankName,
          cardLast4: cleanLast4 || existing.cardLast4,
          initialBalance: parsedBalance,
          currentBalance: parsedBalance,
          color: bankMeta?.color || existing.color,
        });
      }
      setEditingId(null);
    } else {
      onAddBankAccount({
        bankName,
        cardLast4: cleanLast4,
        initialBalance: parsedBalance,
        currentBalance: parsedBalance,
        lastBankSmsBalance: parsedBalance,
        color: bankMeta?.color || '#10b981',
      });
    }

    setIsAdding(false);
    setCardLast4('');
    setInitialBalance('');
  };

  const handleEdit = (b: BankAccount) => {
    setEditingId(b.id);
    setBankName(b.bankName);
    setCardLast4(b.cardLast4 || '');
    setInitialBalance(String(b.currentBalance));
    setIsAdding(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                مدیریت حساب‌ها و کارت‌های بانکی
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تعریف بانک‌ها جهت تطبیق هوشمند پیامک و تراز حساب
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

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingId(null);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? 'بستن فرم' : 'افزودن حساب بانکی جدید'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSmsModal();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all"
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>پردازش پیامک بانکی</span>
          </button>
        </div>

        {/* Add / Edit Form */}
        {isAdding && (
          <form
            onSubmit={handleSubmit}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-emerald-500/30 space-y-3 animate-in fade-in duration-200"
          >
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {editingId ? 'ویرایش اطلاعات حساب بانکی' : 'مشخصات حساب بانکی جدید'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام بانک
                </label>
                <select
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-slate-100"
                >
                  {KNOWN_BANKS.map(b => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ۴ رقم آخر کارت (اختیاری)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={cardLast4}
                  onChange={e => setCardLast4(e.target.value)}
                  placeholder="مثال: ۵۴۱۲"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-center dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                موجودی اولیه (تومان)
              </label>
              <input
                type="text"
                required
                value={initialBalance}
                onChange={e => setInitialBalance(e.target.value)}
                placeholder="مثال: ۵,۰۰۰,۰۰۰"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all"
              >
                {editingId ? 'ثبت تغییرات' : 'ذخیره حساب'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className="py-2 px-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
              >
                انصراف
              </button>
            </div>
          </form>
        )}

        {/* Bank Accounts List */}
        <div className="space-y-2.5">
          {bankAccounts.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 border border-dashed rounded-2xl p-4">
              هنوز حساب بانکی اضافه نکرده‌اید. با کلیک روی دکمه بالا یک حساب اضافه کنید.
            </div>
          ) : (
            bankAccounts.map(b => {
              const diff =
                b.lastBankSmsBalance !== undefined
                  ? b.lastBankSmsBalance - b.currentBalance
                  : 0;
              const hasDiff = Math.abs(diff) > 100;

              return (
                <div
                  key={b.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs"
                        style={{ backgroundColor: b.color || '#10b981' }}
                      >
                        {b.bankName.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {b.bankName}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {b.cardLast4 ? `کارت **** ${toPersianDigits(b.cardLast4)}` : 'حساب پیش‌فرض'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(b)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="ویرایش"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => confirm(`حساب «${b.bankName}» حذف شود؟`) && onDeleteBankAccount(b.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px]">موجودی در نرم‌افزار: </span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">
                        {formatToman(b.currentBalance)}
                      </span>
                    </div>

                    {b.lastBankSmsBalance !== undefined && (
                      <div className="flex items-center gap-1">
                        {hasDiff ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[10px] border border-amber-200 dark:border-amber-800"
                            title={`اختلاف با پیامک بانک: ${formatToman(Math.abs(diff))}`}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <span>{formatToman(Math.abs(diff))} اختلاف</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>تراز با بانک</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
