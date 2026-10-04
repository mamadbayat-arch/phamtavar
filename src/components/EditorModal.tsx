import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Target, Plus, Trash2 } from 'lucide-react';
import {
  Task,
  Money,
  Goal,
  Habit,
  Installment,
  Cheque,
  Quadrant,
  MoneyKind,
  MoneyCategory,
} from '../types';
import {
  getTodayKey,
  moveDay,
  toJalali,
  parseJalali,
  toEnglishDigits,
  toPersianDigits,
  getJalaliWeekDayIndex,
  getFullWeekDayName,
} from '../utils/jalali';

export type EditorKind =
  | 'task'
  | 'money'
  | 'goal'
  | 'habit'
  | 'installment'
  | 'cheque'
  | 'budget'
  | 'fromHabit';

interface EditorModalProps {
  isOpen: boolean;
  kind: EditorKind | null;
  itemData: any; // Task | Money | Goal | Habit | Installment | Cheque | null
  goals: Goal[];
  habits: Habit[];
  onClose: () => void;
  onSave: (kind: EditorKind, data: any) => void;
  onDelete?: (kind: EditorKind, id: string) => void;
}

export const EditorModal: React.FC<EditorModalProps> = ({
  isOpen,
  kind,
  itemData,
  goals,
  habits,
  onClose,
  onSave,
  onDelete,
}) => {
  const todayStr = getTodayKey();

  // Form states
  const [title, setTitle] = useState('');
  const [dateType, setDateType] = useState<'today' | 'tomorrow' | 'none' | 'custom'>('today');
  const [customJDate, setCustomJDate] = useState('');
  const [time, setTime] = useState('');
  const [goalId, setGoalId] = useState('');
  const [quad, setQuad] = useState<Quadrant>('');
  const [subtasksText, setSubtasksText] = useState('');

  // Money states
  const [amount, setAmount] = useState('');
  const [moneyKind, setMoneyKind] = useState<MoneyKind>('expense');
  const [category, setCategory] = useState<MoneyCategory>('روزمره');

  // Goal states
  const [target, setTarget] = useState('100');
  const [current, setCurrent] = useState('0');
  const [unit, setUnit] = useState('درصد');

  // Habit states
  const [habitDays, setHabitDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [habitPatternType, setHabitPatternType] = useState<
    'daily' | 'even' | 'odd' | 'alternate' | 'work' | 'custom'
  >('daily');
  const [selectedMonthDates, setSelectedMonthDates] = useState<string[]>([]);

  // Current Jalali Month Dates for Habit Scheduling
  const currentJMonth = toJalali(todayStr).slice(0, 7);
  const getDatesForCurrentJMonth = () => {
    const dates: string[] = [];
    let cur = moveDay(todayStr, -45);
    for (let i = 0; i < 90; i++) {
      if (toJalali(cur).startsWith(currentJMonth)) {
        dates.push(cur);
      }
      cur = moveDay(cur, 1);
    }
    return dates;
  };

  const applyHabitPreset = (preset: 'daily' | 'even' | 'odd' | 'alternate' | 'work') => {
    setHabitPatternType(preset);
    const allDates = getDatesForCurrentJMonth();

    if (preset === 'daily') {
      const days = [0, 1, 2, 3, 4, 5, 6];
      setHabitDays(days);
      setSelectedMonthDates(allDates);
    } else if (preset === 'even') {
      // روزهای زوج: شنبه (6)، دوشنبه (1)، چهارشنبه (3)
      const days = [6, 1, 3];
      setHabitDays(days);
      setSelectedMonthDates(
        allDates.filter(d => days.includes(new Date(d + 'T12:00:00').getDay()))
      );
    } else if (preset === 'odd') {
      // روزهای فرد: یکشنبه (0)، سه‌شنبه (2)، پنج‌شنبه (4)
      const days = [0, 2, 4];
      setHabitDays(days);
      setSelectedMonthDates(
        allDates.filter(d => days.includes(new Date(d + 'T12:00:00').getDay()))
      );
    } else if (preset === 'alternate') {
      // یک روز در میان
      setHabitDays([0, 1, 2, 3, 4, 5, 6]);
      setSelectedMonthDates(allDates.filter((_, idx) => idx % 2 === 0));
    } else if (preset === 'work') {
      // روزهای کاری: شنبه تا چهارشنبه
      const days = [6, 0, 1, 2, 3];
      setHabitDays(days);
      setSelectedMonthDates(
        allDates.filter(d => days.includes(new Date(d + 'T12:00:00').getDay()))
      );
    }
  };

  const toggleWeekday = (dayIndex: number) => {
    setHabitPatternType('custom');
    const newDays = habitDays.includes(dayIndex)
      ? habitDays.filter(d => d !== dayIndex)
      : [...habitDays, dayIndex];
    setHabitDays(newDays);

    const allDates = getDatesForCurrentJMonth();
    setSelectedMonthDates(
      allDates.filter(d => newDays.includes(new Date(d + 'T12:00:00').getDay()))
    );
  };

  const toggleCalendarDate = (dateStr: string) => {
    setHabitPatternType('custom');
    setSelectedMonthDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  // Installment states
  const [dueDay, setDueDay] = useState('15');
  const [totalInstallments, setTotalInstallments] = useState('12');
  const [remainingInstallments, setRemainingInstallments] = useState('12');

  // From Habit converter states
  const [habitPattern, setHabitPattern] = useState<'daily' | 'every2'>('daily');
  const [habitCount, setHabitCount] = useState('7');

  // Error state
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setError('');
    const id = itemData?.id;

    if (kind === 'task') {
      setTitle(itemData?.title || '');
      setQuad(itemData?.quad || 'q1');
      setGoalId(itemData?.goalId || '');
      setTime(itemData?.time || '');

      const tDate = itemData?.date;
      if (tDate === todayStr) {
        setDateType('today');
      } else if (tDate === moveDay(todayStr, 1)) {
        setDateType('tomorrow');
      } else if (!tDate) {
        setDateType('none');
      } else {
        setDateType('custom');
        setCustomJDate(toJalali(tDate));
      }

      setSubtasksText(itemData?.subs ? itemData.subs.map((s: any) => s.title).join('\n') : '');
    } else if (kind === 'money') {
      setTitle(itemData?.title || '');
      setAmount(itemData?.amount ? String(itemData.amount) : '');
      setMoneyKind(itemData?.kind || 'expense');
      setCategory(itemData?.category || 'روزمره');
      setDateType('today');
    } else if (kind === 'goal') {
      setTitle(itemData?.title || '');
      setTarget(itemData?.target ? String(itemData.target) : '100');
      setCurrent(itemData?.current !== undefined ? String(itemData.current) : '0');
      setUnit(itemData?.unit || 'درصد');
      if (itemData?.date) {
        setDateType('custom');
        setCustomJDate(toJalali(itemData.date));
      } else {
        setDateType('none');
      }
    } else if (kind === 'habit') {
      setTitle(itemData?.title || '');
      const incomingDays =
        itemData?.days && itemData.days.length > 0 ? itemData.days : [0, 1, 2, 3, 4, 5, 6];
      setHabitDays(incomingDays);
      setHabitPatternType(
        itemData?.pattern || (incomingDays.length === 7 ? 'daily' : 'custom')
      );

      const allDates = getDatesForCurrentJMonth();
      if (itemData?.targetDays && itemData.targetDays.length > 0) {
        setSelectedMonthDates(itemData.targetDays);
      } else {
        setSelectedMonthDates(
          allDates.filter(d => incomingDays.includes(new Date(d + 'T12:00:00').getDay()))
        );
      }
    } else if (kind === 'installment') {
      setTitle(itemData?.title || '');
      setAmount(itemData?.amount ? String(itemData.amount) : '');
      setDueDay(itemData?.dueDay ? String(itemData.dueDay) : '15');
      setTotalInstallments(itemData?.total ? String(itemData.total) : '12');
      setRemainingInstallments(
        itemData?.remaining !== undefined ? String(itemData.remaining) : '12'
      );
    } else if (kind === 'cheque') {
      setTitle(itemData?.title || '');
      setAmount(itemData?.amount ? String(itemData.amount) : '');
      if (itemData?.date) {
        setDateType('custom');
        setCustomJDate(toJalali(itemData.date));
      } else {
        setDateType('today');
      }
    } else if (kind === 'budget') {
      setTitle('بودجه ماهانه');
      setAmount(itemData?.budget ? String(itemData.budget) : '');
    } else if (kind === 'fromHabit') {
      const hb = habits.find(h => h.id === itemData?.habitId);
      setTitle(hb?.title || 'انجام عادت');
      setHabitPattern('daily');
      setHabitCount('7');
      setDateType('today');
    }
  }, [isOpen, kind, itemData]);

  if (!isOpen || !kind) return null;

  const resolveDate = (): string | undefined => {
    if (dateType === 'none') return undefined;
    if (dateType === 'today') return todayStr;
    if (dateType === 'tomorrow') return moveDay(todayStr, 1);
    if (dateType === 'custom') {
      if (!customJDate.trim()) throw new Error('لطفاً تاریخ شمسی را وارد کنید.');
      return parseJalali(customJDate.trim());
    }
    return undefined;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!title.trim() && kind !== 'budget') {
        throw new Error('لطفاً عنوان را وارد کنید.');
      }

      if (kind === 'task') {
        const date = resolveDate();
        const subs = subtasksText
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean)
          .map(t => {
            const existing = itemData?.subs?.find((s: any) => s.title === t);
            return { title: t, done: existing ? existing.done : false };
          });

        onSave('task', {
          id: itemData?.id,
          title: title.trim(),
          date,
          time: time.trim() || undefined,
          goalId: goalId || undefined,
          quad: quad || undefined,
          done: itemData?.done || false,
          subs,
        });
      } else if (kind === 'money') {
        const parsedAmount = Number(toEnglishDigits(amount).replace(/[,٬\s]/g, ''));
        if (!Number.isSafeInteger(parsedAmount) || parsedAmount <= 0) {
          throw new Error('مبلغ وارد شده معتبر نیست.');
        }
        const date = resolveDate() || todayStr;

        onSave('money', {
          id: itemData?.id,
          title: title.trim(),
          amount: parsedAmount,
          kind: moneyKind,
          category,
          date,
        });
      } else if (kind === 'goal') {
        const parsedTarget = Number(toEnglishDigits(target));
        const parsedCurrent = Number(toEnglishDigits(current));
        if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
          throw new Error('مقدار هدف باید عددی مثبت باشد.');
        }
        if (!Number.isFinite(parsedCurrent) || parsedCurrent < 0) {
          throw new Error('پیشرفت فعلی نمی‌تواند منفی باشد.');
        }

        onSave('goal', {
          id: itemData?.id,
          title: title.trim(),
          target: parsedTarget,
          current: parsedCurrent,
          unit: unit.trim() || 'واحد',
          date: resolveDate(),
        });
      } else if (kind === 'habit') {
        onSave('habit', {
          id: itemData?.id,
          title: title.trim(),
          days: habitDays.length > 0 ? habitDays : [0, 1, 2, 3, 4, 5, 6],
          pattern: habitPatternType,
          targetDays: selectedMonthDates,
          logs: itemData?.logs || [],
        });
      } else if (kind === 'installment') {
        const parsedAmount = Number(toEnglishDigits(amount).replace(/[,٬\s]/g, ''));
        const parsedDueDay = Number(toEnglishDigits(dueDay));
        const parsedTotal = Number(toEnglishDigits(totalInstallments));
        const parsedRem = Number(toEnglishDigits(remainingInstallments));

        if (!Number.isSafeInteger(parsedAmount) || parsedAmount <= 0) {
          throw new Error('مبلغ قسط باید بزرگتر از صفر باشد.');
        }
        if (!Number.isInteger(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
          throw new Error('روز سررسید باید بین ۱ تا ۳۱ باشد.');
        }
        if (!Number.isInteger(parsedTotal) || parsedTotal < 1) {
          throw new Error('تعداد کل اقساط باید حداقل ۱ باشد.');
        }

        onSave('installment', {
          id: itemData?.id,
          title: title.trim(),
          amount: parsedAmount,
          dueDay: parsedDueDay,
          total: parsedTotal,
          remaining: Math.min(parsedTotal, Math.max(0, parsedRem)),
        });
      } else if (kind === 'cheque') {
        const parsedAmount = Number(toEnglishDigits(amount).replace(/[,٬\s]/g, ''));
        if (!Number.isSafeInteger(parsedAmount) || parsedAmount <= 0) {
          throw new Error('مبلغ چک باید بزرگتر از صفر باشد.');
        }
        const date = resolveDate();
        if (!date) throw new Error('تاریخ سررسید چک الزامی است.');

        onSave('cheque', {
          id: itemData?.id,
          title: title.trim(),
          amount: parsedAmount,
          date,
          cashed: itemData?.cashed || false,
        });
      } else if (kind === 'budget') {
        const parsedAmount = Number(toEnglishDigits(amount).replace(/[,٬\s]/g, ''));
        if (!Number.isSafeInteger(parsedAmount) || parsedAmount < 0) {
          throw new Error('مبلغ بودجه باید صفر یا بیشتر باشد.');
        }
        onSave('budget', { budget: parsedAmount });
      } else if (kind === 'fromHabit') {
        const hb = habits.find(h => h.id === itemData?.habitId);
        const count = Number(toEnglishDigits(habitCount));
        if (!Number.isInteger(count) || count < 1 || count > 30) {
          throw new Error('تعداد باید بین ۱ تا ۳۰ روز باشد.');
        }

        let cur = resolveDate() || todayStr;
        const days = hb?.days || [0, 1, 2, 3, 4, 5, 6];
        const newTasks: any[] = [];

        for (let i = 0; i < 90 && newTasks.length < count; i++, cur = moveDay(cur, 1)) {
          if (habitPattern === 'every2' && i % 2 !== 0) continue;
          const dayOfWeek = new Date(cur + 'T12:00:00').getDay();
          if (days.includes(dayOfWeek)) {
            newTasks.push({
              title: title.trim(),
              date: cur,
              habitId: hb?.id,
              done: false,
              subs: [],
            });
          }
        }

        onSave('fromHabit', { tasks: newTasks });
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'خطایی رخ داد.');
    }
  };

  const modalTitle = () => {
    switch (kind) {
      case 'task':
        return itemData?.id ? 'ویرایش کار' : 'ثبت کار جدید';
      case 'money':
        return itemData?.id ? 'ویرایش تراکنش مالی' : 'ثبت تراکنش جدید';
      case 'goal':
        return itemData?.id ? 'ویرایش هدف' : 'تعریف هدف جدید';
      case 'habit':
        return itemData?.id ? 'ویرایش عادت' : 'تعریف عادت جدید';
      case 'installment':
        return itemData?.id ? 'ویرایش قسط' : 'ثبت قسط ماهانه جدید';
      case 'cheque':
        return itemData?.id ? 'ویرایش چک' : 'ثبت چک جدید';
      case 'budget':
        return 'تنظیم سقف بودجه ماهانه';
      case 'fromHabit':
        return 'تبدیل عادت به کار در پلنر';
      default:
        return 'فرم';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {modalTitle()}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
              {error}
            </div>
          )}

          {/* Title input (for everything except budget) */}
          {kind !== 'budget' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                عنوان <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={
                  kind === 'task'
                    ? 'مثال: ارسال گزارش کار هفتگی'
                    : kind === 'money'
                    ? 'مثال: خرید خواربار، دستمزد پروژه'
                    : kind === 'goal'
                    ? 'مثال: مطالعه کتاب، پس‌انداز'
                    : 'عنوان...'
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:text-slate-100"
              />
            </div>
          )}

          {/* Task-specific fields */}
          {kind === 'task' && (
            <>
              {/* Eisenhower Category Selection - Visual Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  دسته‌بندی ماتریس آیزنهاور <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    {
                      id: 'q1' as Quadrant,
                      title: 'فوری و مهم (Q1)',
                      subtitle: 'اقدام فوری / بحران‌ها',
                      activeClass: 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-500/30',
                      inactiveClass: 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900 hover:border-rose-300',
                    },
                    {
                      id: 'q2' as Quadrant,
                      title: 'مهم و غیرفوری (Q2)',
                      subtitle: 'رشد، اهداف، زمان‌بندی',
                      activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/30',
                      inactiveClass: 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900 hover:border-emerald-300',
                    },
                    {
                      id: 'q3' as Quadrant,
                      title: 'فوری و غیرمهم (Q3)',
                      subtitle: 'وقفه‌ها / واگذاری',
                      activeClass: 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-500/30',
                      inactiveClass: 'bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900 hover:border-amber-300',
                    },
                    {
                      id: 'q4' as Quadrant,
                      title: 'غیرمهم و غیرفوری (Q4)',
                      subtitle: 'کارهای جانبی / کم‌اهمیت',
                      activeClass: 'bg-slate-700 text-white border-slate-700 shadow-sm ring-2 ring-slate-500/30',
                      inactiveClass: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300',
                    },
                  ].map(card => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setQuad(card.id)}
                      className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                        quad === card.id ? card.activeClass : card.inactiveClass
                      }`}
                    >
                      <span className="font-bold text-xs">{card.title}</span>
                      <span
                        className={`text-[10px] mt-0.5 ${
                          quad === card.id ? 'text-white/80' : 'opacity-70'
                        }`}
                      >
                        {card.subtitle}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  تاریخ انجام
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {[
                    { id: 'today', label: 'امروز' },
                    { id: 'tomorrow', label: 'فردا' },
                    { id: 'custom', label: 'تاریخ شمسی' },
                    { id: 'none', label: 'بدون تاریخ' },
                  ].map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDateType(d.id as any)}
                      className={`py-1.5 px-2 rounded-lg border font-medium transition-all ${
                        dateType === d.id
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {dateType === 'custom' && (
                  <input
                    type="text"
                    placeholder="۱۴۰۵/۰۷/۱۵"
                    value={customJDate}
                    onChange={e => setCustomJDate(e.target.value)}
                    className="mt-2 w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-slate-100 text-center font-mono"
                  />
                )}
              </div>

              {/* Time & Goal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    ساعت انجام (اختیاری)
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    اتصال به هدف
                  </label>
                  <select
                    value={goalId}
                    onChange={e => setGoalId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-slate-100"
                  >
                    <option value="">بدون هدف مرتبط</option>
                    {goals.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subtasks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  زیرکارها (هر خط یک مورد)
                </label>
                <textarea
                  rows={3}
                  value={subtasksText}
                  onChange={e => setSubtasksText(e.target.value)}
                  placeholder="مرحله اول&#10;مرحله دوم&#10;مرحله سوم"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:text-slate-100 resize-none"
                />
              </div>
            </>
          )}

          {/* Money-specific fields */}
          {kind === 'money' && (
            <>
              {/* Type: Expense vs Income */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMoneyKind('expense')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    moneyKind === 'expense'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  هزینه
                </button>
                <button
                  type="button"
                  onClick={() => setMoneyKind('income')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    moneyKind === 'income'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  درآمد
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  مبلغ به تومان <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="مثال: ۱۵۰,۰۰۰"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:text-slate-100"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  دسته‌بندی
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as MoneyCategory)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-slate-100"
                >
                  {[
                    'روزمره',
                    'خوراک',
                    'رفت‌وآمد',
                    'خانه',
                    'سلامت',
                    'آموزش',
                    'درآمد',
                    'سایر',
                  ].map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Goal-specific fields */}
          {kind === 'goal' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    مقدار کل هدف
                  </label>
                  <input
                    type="number"
                    required
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    پیشرفت فعلی
                  </label>
                  <input
                    type="number"
                    value={current}
                    onChange={e => setCurrent(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  واحد سنجش (مثال: درصد، صفحه، تومان، روز)
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder="درصد"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-slate-100"
                />
              </div>
            </>
          )}

          {/* Habit-specific fields */}
          {kind === 'habit' && (
            <div className="space-y-4">
              {/* Smart Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  الگوهای پرکاربرد تکرار
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'daily', label: 'هر روز' },
                    { id: 'alternate', label: 'یک روز در میان' },
                    { id: 'even', label: 'روزهای زوج (ش، ۲ش، ۴ش)' },
                    { id: 'odd', label: 'روزهای فرد (۱ش، ۳ش، ۵ش)' },
                    { id: 'work', label: 'شنبه تا چهارشنبه' },
                    { id: 'custom', label: 'انتخاب دستی' },
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (p.id !== 'custom') applyHabitPreset(p.id as any);
                        else setHabitPatternType('custom');
                      }}
                      className={`py-2 px-1.5 rounded-xl border text-center font-bold text-[11px] transition-all ${
                        habitPatternType === p.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekdays Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  روزهای فعال در هفته
                </label>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {[
                    { id: 6, label: 'ش' },
                    { id: 0, label: '۱ش' },
                    { id: 1, label: '۲ش' },
                    { id: 2, label: '۳ش' },
                    { id: 3, label: '۴ش' },
                    { id: 4, label: '۵ش' },
                    { id: 5, label: 'ج' },
                  ].map(w => {
                    const isSelected = habitDays.includes(w.id);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => toggleWeekday(w.id)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {w.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visual Month Calendar & Day Picker */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    تقویم ماه ({toPersianDigits(currentJMonth)}) ·{' '}
                    {toPersianDigits(selectedMonthDates.length)} روز انتخاب‌شده
                  </span>

                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => applyHabitPreset('daily')}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    >
                      همه
                    </button>
                    <button
                      type="button"
                      onClick={() => applyHabitPreset('alternate')}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    >
                      یک‌درمیان
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHabitPatternType('custom');
                        setSelectedMonthDates([]);
                        setHabitDays([]);
                      }}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-rose-600 hover:bg-rose-50"
                    >
                      پاکسازی
                    </button>
                  </div>
                </div>

                {/* Weekday headers starting with Saturday (شنبه) */}
                <div className="grid grid-cols-7 gap-1 text-center pt-1 border-b border-slate-200/60 dark:border-slate-700/60 pb-1">
                  {['ش', '۱ش', '۲ش', '۳ش', '۴ش', '۵ش', 'ج'].map((w, idx) => (
                    <span
                      key={idx}
                      className={`text-[11px] font-bold ${
                        idx === 6 ? 'text-rose-500' : 'text-slate-400'
                      }`}
                      title={
                        ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'][idx]
                      }
                    >
                      {w}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 pt-1">
                  {/* Empty padding cells for Saturday alignment */}
                  {(() => {
                    const currentMonthDates = getDatesForCurrentJMonth();
                    const emptyCount =
                      currentMonthDates.length > 0 ? getJalaliWeekDayIndex(currentMonthDates[0]) : 0;
                    return Array.from({ length: emptyCount }).map((_, idx) => (
                      <div key={`empty-m-${idx}`} className="py-1.5" />
                    ));
                  })()}

                  {getDatesForCurrentJMonth().map(dStr => {
                    const isSelected = selectedMonthDates.includes(dStr);
                    const jDay = toJalali(dStr).split('/')[2];
                    const dayName = getFullWeekDayName(dStr);
                    return (
                      <button
                        key={dStr}
                        type="button"
                        onClick={() => toggleCalendarDate(dStr)}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white dark:bg-slate-750 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                        title={`${dayName} ${toJalali(dStr)}`}
                      >
                        {toPersianDigits(jDay)}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  می‌توانید روزهای دلخواه ماه را مستقیماً با لمس روی تقویم فعال یا غیرفعال کنید.
                </p>
              </div>
            </div>
          )}

          {/* Installment fields */}
          {kind === 'installment' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  مبلغ هر قسط (تومان) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="مثال: ۱,۵۰۰,۰۰۰"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    روز سررسید (۱ تا ۳۱)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={e => setDueDay(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تعداد کل اقساط
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={totalInstallments}
                    onChange={e => setTotalInstallments(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    باقی‌مانده
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={remainingInstallments}
                    onChange={e => setRemainingInstallments(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-slate-100"
                  />
                </div>
              </div>
            </>
          )}

          {/* Cheque fields */}
          {kind === 'cheque' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  مبلغ چک (تومان) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="مثال: ۵,۰۰۰,۰۰۰"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  تاریخ سررسید چک (شمسی) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="۱۴۰۵/۰۸/۰۱"
                  value={customJDate}
                  onChange={e => {
                    setDateType('custom');
                    setCustomJDate(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-slate-100 text-center font-mono"
                />
              </div>
            </>
          )}

          {/* Budget field */}
          {kind === 'budget' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                سقف بودجه ماهانه (تومان)
              </label>
              <input
                type="text"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="مثال: ۱۰,۰۰۰,۰۰۰"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:text-slate-100"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                برای حذف سقف بودجه، عدد صفر وارد کنید.
              </p>
            </div>
          )}

          {/* From Habit fields */}
          {kind === 'fromHabit' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  الگوی تکرار در روزها
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHabitPattern('daily')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      habitPattern === 'daily'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    هر روز مطابق عادت
                  </button>
                  <button
                    type="button"
                    onClick={() => setHabitPattern('every2')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      habitPattern === 'every2'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    یک روز در میان
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  چند کار ساخته شود؟ (۱ تا ۳۰)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={habitCount}
                  onChange={e => setHabitCount(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all"
            >
              ذخیره
            </button>

            {itemData?.id && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('آیا از حذف این مورد اطمینان دارید؟')) {
                    onDelete(kind, itemData.id);
                    onClose();
                  }
                }}
                className="py-2.5 px-3 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100 font-bold text-xs transition-colors"
              >
                حذف
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
