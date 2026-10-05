import { AppState, Task, Goal, Habit, Installment, Cheque, Money, UserActionLog } from '../types';
import { getTodayKey, moveDay } from './jalali';
import {
  enrichTaskWithMl,
  enrichMoneyWithMl,
  enrichHabitWithMl,
  enrichGoalWithMl,
  createActionLog,
} from './behaviorLogger';

declare global {
  interface Window {
    PersonalNative?: {
      readState: () => string;
      writeState: (json: string) => boolean;
      exportBackup: (json: string) => void;
      importBackup: () => void;
    };
    receiveBackup?: (json: string) => void;
    backupResult?: (text: string) => void;
    handleBack?: () => boolean;
  }
}

const STORAGE_KEY = 'hp_state';
const LEGACY_KEY = 'personal';

export const getInitialSampleState = (): AppState => {
  const today = getTodayKey();
  const yesterday = moveDay(today, -1);
  const tomorrow = moveDay(today, 1);
  const nextWeek = moveDay(today, 6);

  const sampleGoals: Goal[] = [
    {
      id: 'goal-1',
      title: 'مطالعه کتاب مدیریت زمان',
      target: 250,
      current: 110,
      unit: 'صفحه',
      date: moveDay(today, 20),
    },
    {
      id: 'goal-2',
      title: 'پس‌انداز برای ارتقای تجهیزات',
      target: 15000000,
      current: 9500000,
      unit: 'تومان',
      date: moveDay(today, 45),
    },
    {
      id: 'goal-3',
      title: 'ورزش و پیاده‌روی منظم',
      target: 30,
      current: 14,
      unit: 'روز',
      date: moveDay(today, 16),
    },
  ];

  const sampleTasks: Task[] = [
    {
      id: 'task-1',
      title: 'بررسی گزارش‌های مالی و پرداخت اقساط ماه',
      done: false,
      date: today,
      time: '10:30',
      quad: 'q1',
      subs: [
        { title: 'بررسی موجودی حساب', done: true },
        { title: 'پرداخت قسط وام قرض‌الحسنه', done: false },
        { title: 'ثبت در دخل‌وخرج همتوار', done: false },
      ],
    },
    {
      id: 'task-2',
      title: 'مطالعه فصل چهارم کتاب مدیریت زمان',
      done: false,
      date: today,
      time: '18:00',
      goalId: 'goal-1',
      quad: 'q2',
      subs: [
        { title: 'خلاصه‌نویسی نکات کلیدی', done: false },
        { title: 'مرور تمرین‌های عملی', done: false },
      ],
    },
    {
      id: 'task-3',
      title: 'پاسخ به ایمیل‌ها و پیام‌های کاری',
      done: true,
      date: today,
      time: '09:00',
      quad: 'q3',
    },
    {
      id: 'task-4',
      title: 'برنامه‌ریزی جلسات هفتگی تیم',
      done: false,
      date: tomorrow,
      time: '11:00',
      quad: 'q2',
    },
    {
      id: 'task-5',
      title: 'خرید لوازم مصرفی منزل',
      done: false,
      date: tomorrow,
      quad: 'q3',
    },
    {
      id: 'task-6',
      title: 'پیگیری سررسید چک خدمات طراحی',
      done: false,
      date: nextWeek,
      quad: 'q1',
    },
  ];

  const sampleHabits: Habit[] = [
    {
      id: 'habit-1',
      title: 'مطالعه روزانه (حداقل ۲۰ دقیقه)',
      days: [0, 1, 2, 3, 4, 5, 6],
      logs: [yesterday, today],
    },
    {
      id: 'habit-2',
      title: 'ورزش و حرکات کششی صبحگاهی',
      days: [6, 0, 1, 2, 3, 4], // Saturday to Thursday
      logs: [yesterday, today],
    },
    {
      id: 'habit-3',
      title: 'برنامه‌ریزی کارهای فردا قبل از خواب',
      days: [0, 1, 2, 3, 4, 5, 6],
      logs: [yesterday],
    },
  ];

  const sampleInstallments: Installment[] = [
    {
      id: 'inst-1',
      title: 'قسط وام اشتغال و تجهیزات',
      amount: 2850000,
      dueDay: 15,
      total: 24,
      remaining: 8,
    },
    {
      id: 'inst-2',
      title: 'صندوق قرض‌الحسنه خانوادگی',
      amount: 1500000,
      dueDay: 25,
      total: 12,
      remaining: 3,
    },
  ];

  const sampleCheques: Cheque[] = [
    {
      id: 'chq-1',
      title: 'چک بابت قرارداد توسعه نرم‌افزار',
      amount: 8500000,
      date: moveDay(today, 3),
      cashed: false,
    },
    {
      id: 'chq-2',
      title: 'چک ضمانت خرید اقساطی',
      amount: 5000000,
      date: moveDay(today, 18),
      cashed: false,
    },
  ];

  const sampleMoney: Money[] = [
    {
      id: 'm-1',
      title: 'دریافت دستمزد پروژه پاره‌وقت',
      amount: 14000000,
      kind: 'income',
      category: 'درآمد',
      date: yesterday,
    },
    {
      id: 'm-2',
      title: 'خرید مواد غذایی هفتگی',
      amount: 1250000,
      kind: 'expense',
      category: 'خوراک',
      date: yesterday,
    },
    {
      id: 'm-3',
      title: 'هزینه شارژ و اینترنت',
      amount: 450000,
      kind: 'expense',
      category: 'روزمره',
      date: today,
    },
  ];

  return {
    tasks: sampleTasks.map(t => enrichTaskWithMl(t, true)),
    money: sampleMoney.map(m => enrichMoneyWithMl(m, true)),
    budget: 8000000,
    goals: sampleGoals.map(g => enrichGoalWithMl(g, true)),
    habits: sampleHabits.map(h => enrichHabitWithMl(h, true)),
    installments: sampleInstallments.map(i => ({
      ...i,
      createdAt: new Date().toISOString(),
      createdTimestamp: Date.now(),
    })),
    cheques: sampleCheques.map(c => ({
      ...c,
      createdAt: new Date().toISOString(),
      createdTimestamp: Date.now(),
    })),
    bankAccounts: [
      {
        id: 'bank-1',
        bankName: 'بانک ملت',
        cardLast4: '۵۴۱۲',
        initialBalance: 5200000,
        currentBalance: 5200000,
        lastBankSmsBalance: 5200000,
        color: '#e11d48',
        createdAt: new Date().toISOString(),
        createdTimestamp: Date.now(),
      },
      {
        id: 'bank-2',
        bankName: 'بلوبانک',
        cardLast4: '۸۹۳۱',
        initialBalance: 2400000,
        currentBalance: 2400000,
        lastBankSmsBalance: 2400000,
        color: '#0284c7',
        createdAt: new Date().toISOString(),
        createdTimestamp: Date.now(),
      },
    ],
    actionLogs: [
      createActionLog('app_launch', 'system', undefined, { note: 'بارگذاری اولیه داده‌های نمونه با استانداردهای یادگیری ماشین' }),
    ],
  };
};

export const getEmptyState = (): AppState => ({
  tasks: [],
  money: [],
  budget: 0,
  goals: [],
  habits: [],
  installments: [],
  cheques: [],
  bankAccounts: [],
  actionLogs: [],
});

/**
 * Ensures all entities in state comply with Machine Learning standards
 * and time-stamped metadata requirements.
 */
export const ensureMlCompliance = (state: AppState): AppState => {
  return {
    ...state,
    tasks: (state.tasks || []).map(t => enrichTaskWithMl(t)),
    money: (state.money || []).map(m => enrichMoneyWithMl(m)),
    habits: (state.habits || []).map(h => enrichHabitWithMl(h)),
    goals: (state.goals || []).map(g => enrichGoalWithMl(g)),
    actionLogs: Array.isArray(state.actionLogs) ? state.actionLogs : [],
  };
};

export const validateBackup = (d: any): AppState => {
  if (!d || typeof d !== 'object') {
    throw new Error('فایل پشتیبان نامعتبر است.');
  }

  // Normalize missing arrays
  const tasks = Array.isArray(d.tasks) ? d.tasks.map((t: any) => enrichTaskWithMl(t)) : [];
  const money = Array.isArray(d.money) ? d.money.map((m: any) => enrichMoneyWithMl(m)) : [];
  const goals = Array.isArray(d.goals) ? d.goals.map((g: any) => enrichGoalWithMl(g)) : [];
  const habits = Array.isArray(d.habits) ? d.habits.map((h: any) => enrichHabitWithMl(h)) : [];
  const installments = Array.isArray(d.installments) ? d.installments : [];
  const cheques = Array.isArray(d.cheques) ? d.cheques : [];
  const bankAccounts = Array.isArray(d.bankAccounts) ? d.bankAccounts : [];
  const actionLogs = Array.isArray(d.actionLogs) ? d.actionLogs : [];
  const userProfile = d.userProfile;
  const budget = Number.isFinite(d.budget) && d.budget >= 0 ? Number(d.budget) : 0;

  return {
    tasks,
    money,
    budget,
    goals,
    habits,
    installments,
    cheques,
    bankAccounts,
    userProfile,
    actionLogs,
  };
};

export const loadStoredState = (): AppState => {
  try {
    // 1. Try Android Native Bridge
    if (window.PersonalNative && typeof window.PersonalNative.readState === 'function') {
      const nativeRaw = window.PersonalNative.readState();
      if (nativeRaw && nativeRaw.trim().length > 2) {
        return validateBackup(JSON.parse(nativeRaw));
      }
    }

    // 2. Try localStorage
    const localRaw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    if (localRaw && localRaw.trim().length > 2) {
      return validateBackup(JSON.parse(localRaw));
    }
  } catch (err) {
    console.warn('Failed to load stored state:', err);
  }

  // 3. Fallback to Initial Sample State for immediate enjoyable testing
  const initial = getInitialSampleState();
  saveStoredState(initial);
  return initial;
};

export const saveStoredState = (state: AppState): boolean => {
  try {
    const raw = JSON.stringify(state);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, raw);
    localStorage.setItem(LEGACY_KEY, raw);

    // Save to Android Native SharedPreferences if running in WebView
    if (window.PersonalNative && typeof window.PersonalNative.writeState === 'function') {
      window.PersonalNative.writeState(raw);
    }

    return true;
  } catch (err) {
    console.error('Failed to save state:', err);
    return false;
  }
};

export const exportJsonBackup = (state: AppState) => {
  const json = JSON.stringify({ version: 1, ...state }, null, 2);

  if (window.PersonalNative && typeof window.PersonalNative.exportBackup === 'function') {
    window.PersonalNative.exportBackup(json);
    return;
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hamtavar-personal-backup-${getTodayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const importJsonBackup = (file: File): Promise<AppState> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const validated = validateBackup(parsed);
        resolve(validated);
      } catch (err: any) {
        reject(new Error(err?.message || 'قالب فایل پشتیبان معتبر نیست.'));
      }
    };
    reader.onerror = () => reject(new Error('خطا در خواندن فایل.'));
    reader.readAsText(file);
  });
};
