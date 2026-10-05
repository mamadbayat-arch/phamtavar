import { AppState, Task, Goal, Habit, Installment, Cheque, Money, UserProfile } from '../types';
import { getTodayKey, moveDay } from './jalali';
import {
  enrichTaskWithMl,
  enrichMoneyWithMl,
  enrichHabitWithMl,
  enrichGoalWithMl,
  createActionLog,
} from './behaviorLogger';

import { hasServer } from './api';

declare global {
  interface Window {
    receiveBackup?: (json: string) => void;
    backupResult?: (text: string) => void;
    handleBack?: () => boolean;
  }
}

const STORAGE_KEY = 'hp_state';
const LEGACY_KEY = 'personal';
const ACTIVE_USER_MOBILE_KEY = 'hp_active_mobile';
// Used by the Android build when no server is configured (pure on-device mode).
const LOCAL_DEVICE_KEY = 'hp_state_local';

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
  const isEntity = (x: any) => x && typeof x === 'object' && typeof x.id === 'string' && typeof x.title === 'string';
  const tasks = Array.isArray(d.tasks) ? d.tasks.filter(isEntity).map((t: any) => enrichTaskWithMl(t)) : [];
  const money = Array.isArray(d.money) ? d.money.filter(isEntity).map((m: any) => enrichMoneyWithMl(m)) : [];
  const goals = Array.isArray(d.goals) ? d.goals.filter(isEntity).map((g: any) => enrichGoalWithMl(g)) : [];
  const habits = Array.isArray(d.habits)
    ? d.habits
        .filter(isEntity)
        .map((h: any) =>
          enrichHabitWithMl({ ...h, days: Array.isArray(h.days) ? h.days : [], logs: Array.isArray(h.logs) ? h.logs : [] })
        ) : [];
  const installments = Array.isArray(d.installments) ? d.installments.filter(isEntity) : [];
  const cheques = Array.isArray(d.cheques) ? d.cheques.filter(isEntity) : [];
  const bankAccounts = Array.isArray(d.bankAccounts)
    ? d.bankAccounts.filter((b: any) => b && typeof b.id === 'string' && typeof b.bankName === 'string')
    : [];
  const actionLogs = Array.isArray(d.actionLogs) ? d.actionLogs.slice(-2000) : [];
  const userProfile = normalizeProfile(d.userProfile);
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

const normalizeProfile = (p: any): UserProfile | undefined => {
  if (!p || typeof p !== 'object' || typeof p.mobile !== 'string') return undefined;
  return {
    mobile: p.mobile.replace(/\D/g, ''),
    fullName: typeof p.fullName === 'string' && p.fullName.trim() ? p.fullName.trim().slice(0, 80) : 'کاربر همتوار',
    isVerified: p.isVerified === true,
    registeredAt: typeof p.registeredAt === 'string' ? p.registeredAt : new Date().toISOString(),
    isAdmin: p.isAdmin === true,
  };
};

const readKey = (key: string): AppState | null => {
  try {
    const raw = localStorage.getItem(key);
    if (raw && raw.trim().length > 2) return validateBackup(JSON.parse(raw));
  } catch (err) {
    console.warn(`Failed to read ${key}:`, err);
  }
  return null;
};

const readNative = (): AppState | null => {
  try {
    const raw = window.PersonalNative?.readState?.();
    if (raw && raw.trim().length > 2) return validateBackup(JSON.parse(raw));
  } catch (err) {
    console.warn('Failed to read native state:', err);
  }
  return null;
};

const writeNative = (raw: string): void => {
  try {
    window.PersonalNative?.writeState?.(raw);
  } catch {}
};

/** Ends the session on this device. The signed-out user's data stays in its own partition. */
export const clearUserSession = (): void => {
  try {
    localStorage.removeItem(ACTIVE_USER_MOBILE_KEY);
    // Older versions mirrored the active user's data into these shared keys.
    localStorage.removeItem('hp_state_guest');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_KEY);
    sessionStorage.removeItem('hp_session');
  } catch {}
  writeNative('');
};

export const getUserState = (mobile: string): AppState | null => readKey(`hp_state_${mobile.replace(/\D/g, '')}`);

export const loadStoredState = (): AppState => {
  let activeMobile: string | null = null;
  try {
    activeMobile = localStorage.getItem(ACTIVE_USER_MOBILE_KEY);
  } catch {}

  if (!hasServer()) {
    // On-device mode: no account, the data simply belongs to this phone. Data
    // saved by an older build under a phone number is adopted as-is.
    const local =
      readKey(LOCAL_DEVICE_KEY) ||
      (activeMobile ? readKey(`hp_state_${activeMobile}`) : null) ||
      readNative() ||
      readKey(STORAGE_KEY) ||
      readKey(LEGACY_KEY);
    const initial = local ? { ...local, userProfile: undefined } : getInitialSampleState();
    saveStoredState(initial);
    return initial;
  }

  if (activeMobile) {
    const userState = readKey(`hp_state_${activeMobile}`);
    if (userState?.userProfile?.isVerified) return userState;
  }

  // A signed-in session saved by the native shell survives a cleared WebView cache.
  const native = readNative();
  if (native?.userProfile?.isVerified) return native;

  // Signed out: start empty and let the login screen take over.
  return getEmptyState();
};

export const saveStoredState = (state: AppState): boolean => {
  try {
    const profile = state.userProfile;
    if (profile?.isVerified && profile.mobile) {
      const raw = JSON.stringify(state);
      const cleanMobile = profile.mobile.replace(/\D/g, '');
      localStorage.setItem(`hp_state_${cleanMobile}`, raw);
      localStorage.setItem(ACTIVE_USER_MOBILE_KEY, cleanMobile);
      writeNative(raw);
    } else if (!hasServer()) {
      const raw = JSON.stringify(state);
      localStorage.setItem(LOCAL_DEVICE_KEY, raw);
      writeNative(raw);
    }
    // Signed out with a server configured: there is nothing of the user's to persist.
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
