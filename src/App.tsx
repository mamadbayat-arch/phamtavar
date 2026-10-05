import React, { useState, useEffect, useRef } from 'react';
import {
  AppState,
  AppView,
  Task,
  Money,
  Goal,
  Habit,
  Installment,
  Cheque,
  Quadrant,
  BankAccount,
} from './types';
import {
  loadStoredState,
  saveStoredState,
  clearUserSession,
  getUserState,
  validateBackup,
  getEmptyState,
  getInitialSampleState,
} from './utils/storage';
import { apiJson, getToken, hasServer, setToken } from './utils/api';
import { toJalali, getTodayKey } from './utils/jalali';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { TasksView } from './components/TasksView';
import { FinanceView } from './components/FinanceView';
import { HabitsView } from './components/HabitsView';
import { GoalsView } from './components/GoalsView';
import { EditorModal, EditorKind } from './components/EditorModal';
import { SettingsModal } from './components/SettingsModal';
import { ApkDownloadModal } from './components/ApkDownloadModal';
import { BankAccountsModal } from './components/BankAccountsModal';
import { BankSmsModal } from './components/BankSmsModal';
import { IosInstallModal } from './components/IosInstallModal';
import { LoginModal } from './components/LoginModal';
import { AdBanner } from './components/AdBanner';
import { AdminPanelModal } from './components/AdminPanelModal';
import { UpdateModal } from './components/UpdateModal';
import { LogoutModal } from './components/LogoutModal';
import { UserProfile, AppVersionInfo, CURRENT_APP_VERSION, CURRENT_APP_VERSION_CODE } from './types';
import {
  createActionLog,
  appendActionLog,
  sendActionLogToBackend,
  enrichTaskWithMl,
  enrichMoneyWithMl,
  enrichHabitWithMl,
  enrichGoalWithMl,
} from './utils/behaviorLogger';

declare global {
  interface Window {
    handleIncomingBankSms?: (smsBody: string) => void;
  }
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadStoredState());
  const [currentView, setCurrentView] = useState<AppView>('tasks');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('hp_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorKind, setEditorKind] = useState<EditorKind | null>(null);
  const [editorItemData, setEditorItemData] = useState<any>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isIosModalOpen, setIsIosModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // With a server, the app is only usable after SMS login. The Android build
  // without a configured server keeps everything on the device instead.
  const requiresLogin = hasServer();
  const isLoggedIn = !!state.userProfile?.isVerified;
  const isAdmin = isLoggedIn && !!state.userProfile?.isAdmin;

  const handleConfirmLogout = () => {
    // The effect below has already saved this user's data to their own partition.
    setToken(null);
    clearUserSession();
    setState(getEmptyState());
    setIsLogoutModalOpen(false);
    setIsAdminPanelOpen(false);
    setCurrentView('tasks');
    showToast('از حساب کاربری خارج شدید.');
  };

  const handleLoginSuccess = async (profile: UserProfile) => {
    const cleanMobile = profile.mobile.replace(/\D/g, '');

    // 1. This device already holds this user's data.
    const existingLocal = getUserState(cleanMobile);
    if (existingLocal) {
      setState({ ...existingLocal, userProfile: profile });
      showToast(`خوش آمدید، ${profile.fullName}! اطلاعات شما بارگذاری شد.`);
      return;
    }

    // 2. Otherwise look for their cloud backup.
    try {
      const data = await apiJson('/api/cloud/restore');
      if (data.backup?.state) {
        setState({ ...validateBackup(data.backup.state), userProfile: profile });
        showToast(`خوش آمدید، ${profile.fullName}! اطلاعات ابری شما بازیابی شد.`);
        return;
      }
    } catch {
      // Offline or server error: fall through to a fresh account.
    }

    // 3. Brand-new account. Never inherit whatever the previous user left in memory.
    setState({ ...getInitialSampleState(), userProfile: profile });
    showToast(`خوش آمدید، ${profile.fullName}! حساب شما فعال شد.`);
  };

  // Replaces the data but keeps the signed-in identity, so a backup file made
  // by someone else can never switch this device to their account.
  const applyRestoredState = (incoming: unknown) => {
    setState(prev => ({ ...validateBackup(incoming), userProfile: prev.userProfile }));
  };

  // Refresh the profile (name, admin flag) and drop the session if the server rejects the token.
  useEffect(() => {
    if (!requiresLogin || !isLoggedIn) return;
    if (!getToken()) {
      // Signed in by an older build that had no server session.
      clearUserSession();
      setState(getEmptyState());
      return;
    }
    apiJson('/api/auth/me')
      .then(data => {
        if (data.user) setState(prev => (prev.userProfile ? { ...prev, userProfile: { ...prev.userProfile, ...data.user } } : prev));
      })
      .catch(err => {
        if (err?.status === 401) {
          clearUserSession();
          setState(getEmptyState());
          showToast('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.');
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-Update States
  const [serverVersionInfo, setServerVersionInfo] = useState<AppVersionInfo | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Check version on launch for Auto-Update
  useEffect(() => {
    if (!hasServer()) return;
    apiJson<AppVersionInfo>('/api/app/version')
      .then(data => {
        if (!data || !data.version) return;
        setServerVersionInfo(data);

        if ((data.versionCode || 0) > CURRENT_APP_VERSION_CODE) {
          const dismissedVersion = sessionStorage.getItem('dismissed_update_version');
          if (data.isMandatory || dismissedVersion !== data.version) {
            setIsUpdateModalOpen(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleCloseUpdateModal = () => {
    if (serverVersionInfo?.version) {
      sessionStorage.setItem('dismissed_update_version', serverVersionInfo.version);
    }
    setIsUpdateModalOpen(false);
  };

  // Open the admin panel from /admin, #admin or ?admin, for admins only.
  const isAdminRef = useRef(isAdmin);
  isAdminRef.current = isAdmin;
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = new URLSearchParams(window.location.search);
      const wantsAdmin = path === '/admin' || hash === '#admin' || hash === '#/admin' || search.has('admin');
      if (wantsAdmin && isAdminRef.current) setIsAdminPanelOpen(true);
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    window.addEventListener('hashchange', handleUrlRoute);
    return () => {
      window.removeEventListener('popstate', handleUrlRoute);
      window.removeEventListener('hashchange', handleUrlRoute);
    };
  }, [isAdmin]);

  const openAdminPanel = () => {
    if (!isAdmin) return;
    try {
      window.history.pushState(null, '', '#admin');
    } catch (e) {}
    setIsAdminPanelOpen(true);
  };

  const closeAdminPanel = () => {
    try {
      if (window.location.hash === '#admin' || window.location.hash === '#/admin') {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (e) {}
    setIsAdminPanelOpen(false);
  };

  // Bank & SMS states
  const [isBankAccountsModalOpen, setIsBankAccountsModalOpen] = useState(false);
  const [isBankSmsModalOpen, setIsBankSmsModalOpen] = useState(false);
  const [incomingSmsText, setIncomingSmsText] = useState('');

  // Toast notice
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toastTimer = useRef<number | undefined>(undefined);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync theme to document element
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('hp_theme', theme);
    } catch {}
  }, [theme]);

  // Sync state to storage
  useEffect(() => {
    saveStoredState(state);
  }, [state]);

  // Register Android native bridge callbacks
  useEffect(() => {
    window.receiveBackup = (jsonString: string) => {
      try {
        const parsed = validateBackup(JSON.parse(jsonString));
        if (!confirm('اطلاعات فعلی با این فایل پشتیبان جایگزین شود؟')) return;
        applyRestoredState(parsed);
        showToast('پشتیبان با موفقیت بازیابی شد.');
      } catch (err: any) {
        showToast(`خطا در خواندن فایل: ${err?.message || ''}`);
      }
    };

    window.backupResult = (text: string) => {
      showToast(text);
    };

    window.handleIncomingBankSms = (smsBody: string) => {
      setIncomingSmsText(smsBody);
      setIsBankSmsModalOpen(true);
      showToast('پیامک بانکی جدید شناسایی شد!');
    };

    window.handleBack = () => {
      if (isLogoutModalOpen) {
        setIsLogoutModalOpen(false);
        return true;
      }
      if (isBankSmsModalOpen) {
        setIsBankSmsModalOpen(false);
        return true;
      }
      if (isBankAccountsModalOpen) {
        setIsBankAccountsModalOpen(false);
        return true;
      }
      if (isEditorOpen) {
        setIsEditorOpen(false);
        return true;
      }
      if (isSettingsOpen) {
        setIsSettingsOpen(false);
        return true;
      }
      if (isApkModalOpen) {
        setIsApkModalOpen(false);
        return true;
      }
      if (isIosModalOpen) {
        setIsIosModalOpen(false);
        return true;
      }
      if (isUpdateModalOpen && !serverVersionInfo?.isMandatory) {
        handleCloseUpdateModal();
        return true;
      }
      if (isAdminPanelOpen) {
        setIsAdminPanelOpen(false);
        return true;
      }
      if (currentView !== 'tasks') {
        setCurrentView('tasks');
        return true;
      }
      return false; // Exit app
    };

    return () => {
      delete window.receiveBackup;
      delete window.backupResult;
      delete window.handleIncomingBankSms;
      delete window.handleBack;
    };
  }, [
    isEditorOpen,
    isSettingsOpen,
    isApkModalOpen,
    isBankSmsModalOpen,
    isBankAccountsModalOpen,
    isIosModalOpen,
    isUpdateModalOpen,
    isAdminPanelOpen,
    isLogoutModalOpen,
    serverVersionInfo,
    currentView,
  ]);

  // Behavioral ML action logger helper
  const recordBehavioralAction = (
    actionType: any,
    entityType: any,
    entityId?: string,
    payloadSummary?: Record<string, any>
  ) => {
    const log = createActionLog(actionType, entityType, entityId, payloadSummary, currentView);
    setState(prev => ({
      ...prev,
      actionLogs: appendActionLog(prev.actionLogs, log),
    }));
    sendActionLogToBackend(log);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Task Actions with ML Tracking
  const handleToggleTask = (taskId: string) => {
    setState(prev => {
      let isDoneNow = false;
      const updatedTasks = prev.tasks.map(t => {
        if (t.id === taskId) {
          isDoneNow = !t.done;
          return enrichTaskWithMl({ ...t, done: isDoneNow });
        }
        return t;
      });
      const log = createActionLog('task_toggle', 'task', taskId, { done: isDoneNow }, currentView);
      sendActionLogToBackend(log);
      return {
        ...prev,
        tasks: updatedTasks,
        actionLogs: appendActionLog(prev.actionLogs, log),
      };
    });
  };

  const handleToggleSubtask = (taskId: string, subIndex: number) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id !== taskId || !t.subs) return t;
        const newSubs = t.subs.map((s, idx) => (idx === subIndex ? { ...s, done: !s.done, completedAt: !s.done ? new Date().toISOString() : undefined } : s));
        return { ...t, subs: newSubs };
      }),
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    recordBehavioralAction('task_delete', 'task', taskId);
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId),
    }));
    showToast('کار حذف شد.');
  };

  const handleOpenNewTaskModal = (defaultDateOrQuad?: any) => {
    let initialData: any = {};
    if (typeof defaultDateOrQuad === 'string') {
      if (['q1', 'q2', 'q3', 'q4'].includes(defaultDateOrQuad)) {
        initialData.quad = defaultDateOrQuad;
      } else {
        initialData.date = defaultDateOrQuad;
      }
    }
    setEditorKind('task');
    setEditorItemData(initialData);
    setIsEditorOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditorKind('task');
    setEditorItemData(task);
    setIsEditorOpen(true);
  };

  // Money Actions with ML Tracking
  const handleOpenNewMoneyModal = () => {
    setEditorKind('money');
    setEditorItemData(null);
    setIsEditorOpen(true);
  };

  const handleEditMoney = (item: Money) => {
    setEditorKind('money');
    setEditorItemData(item);
    setIsEditorOpen(true);
  };

  const handleDeleteMoney = (id: string) => {
    recordBehavioralAction('money_delete', 'money', id);
    setState(prev => ({
      ...prev,
      money: prev.money.filter(m => m.id !== id),
    }));
    showToast('تراکنش حذف شد.');
  };

  // Installment Actions
  const handleOpenNewInstallmentModal = () => {
    setEditorKind('installment');
    setEditorItemData(null);
    setIsEditorOpen(true);
  };

  const handleEditInstallment = (item: Installment) => {
    setEditorKind('installment');
    setEditorItemData(item);
    setIsEditorOpen(true);
  };

  const handlePayInstallment = (instId: string) => {
    const inst = state.installments.find(i => i.id === instId);
    if (!inst || inst.remaining <= 0) return;

    // Paying an instalment is real money leaving: record it so the budget stays honest.
    const payment = enrichMoneyWithMl(
      {
        id: crypto.randomUUID(),
        title: `قسط ${inst.title}`,
        amount: inst.amount,
        kind: 'expense',
        category: 'سایر',
        date: getTodayKey(),
      },
      true
    );
    recordBehavioralAction('installment_pay', 'installment', instId, { amount: inst.amount });
    setState(prev => ({
      ...prev,
      installments: prev.installments.map(i =>
        i.id === instId && i.remaining > 0 ? { ...i, remaining: i.remaining - 1 } : i
      ),
      money: [payment, ...prev.money],
    }));
    showToast('پرداخت قسط ثبت و به هزینه‌ها اضافه شد.');
  };

  const handleDeleteInstallment = (id: string) => {
    setState(prev => ({
      ...prev,
      installments: prev.installments.filter(i => i.id !== id),
    }));
    showToast('قسط حذف شد.');
  };

  // Cheque Actions
  const handleOpenNewChequeModal = () => {
    setEditorKind('cheque');
    setEditorItemData(null);
    setIsEditorOpen(true);
  };

  const handleEditCheque = (item: Cheque) => {
    setEditorKind('cheque');
    setEditorItemData(item);
    setIsEditorOpen(true);
  };

  const handleToggleCheque = (chqId: string) => {
    setState(prev => ({
      ...prev,
      cheques: prev.cheques.map(c =>
        c.id === chqId ? { ...c, cashed: !c.cashed, cashedAt: !c.cashed ? new Date().toISOString() : undefined } : c
      ),
    }));
  };

  const handleDeleteCheque = (id: string) => {
    setState(prev => ({
      ...prev,
      cheques: prev.cheques.filter(c => c.id !== id),
    }));
    showToast('چک حذف شد.');
  };

  // Bank Accounts & SMS Handlers
  const handleAddBankAccount = (bank: Omit<BankAccount, 'id'>): BankAccount => {
    const newBank: BankAccount = {
      ...bank,
      id: crypto.randomUUID(),
    };
    setState(prev => ({
      ...prev,
      bankAccounts: [...(prev.bankAccounts || []), newBank],
    }));
    showToast(`حساب «${newBank.bankName}» با موفقیت اضافه شد.`);
    return newBank;
  };

  const handleUpdateBankAccount = (updatedBank: BankAccount) => {
    setState(prev => ({
      ...prev,
      bankAccounts: (prev.bankAccounts || []).map(b => (b.id === updatedBank.id ? updatedBank : b)),
    }));
    showToast('حساب بانکی به‌روزرسانی شد.');
  };

  const handleDeleteBankAccount = (id: string) => {
    setState(prev => ({
      ...prev,
      bankAccounts: (prev.bankAccounts || []).filter(b => b.id !== id),
    }));
    showToast('حساب بانکی حذف شد.');
  };

  const handleAddTransactionFromSms = (
    moneyData: Omit<Money, 'id'>,
    bankId?: string,
    adjustBalance?: { bankId: string; newBalance: number }
  ) => {
    const rawMoney: Money = {
      ...moneyData,
      id: crypto.randomUUID(),
      source: 'sms_parser',
    };
    const newMoney: Money = enrichMoneyWithMl(rawMoney, true);

    recordBehavioralAction('bank_sms_confirm', 'money', newMoney.id, {
      amountTomans: newMoney.amountTomans,
      amountLog10: newMoney.amountLog10,
      bankId,
      category: newMoney.category,
      kind: newMoney.kind,
    });

    setState(prev => {
      let updatedAccounts = [...(prev.bankAccounts || [])];

      if (bankId) {
        updatedAccounts = updatedAccounts.map(b => {
          if (b.id === bankId) {
            let nextBal = b.currentBalance;
            if (adjustBalance && adjustBalance.bankId === bankId) {
              nextBal = adjustBalance.newBalance;
            } else if (newMoney.kind === 'expense') {
              nextBal -= newMoney.amount;
            } else {
              nextBal += newMoney.amount;
            }
            return {
              ...b,
              currentBalance: nextBal,
              lastBankSmsBalance: adjustBalance ? adjustBalance.newBalance : b.lastBankSmsBalance,
            };
          }
          return b;
        });
      }

      return {
        ...prev,
        money: [newMoney, ...prev.money],
        bankAccounts: updatedAccounts,
      };
    });

    showToast(`تراکنش «${newMoney.title}» با موفقیت ثبت شد.`);
  };

  // Budget
  const handleOpenBudgetModal = () => {
    setEditorKind('budget');
    setEditorItemData({ budget: state.budget });
    setIsEditorOpen(true);
  };

  // Habit Actions
  const handleOpenNewHabitModal = () => {
    setEditorKind('habit');
    setEditorItemData(null);
    setIsEditorOpen(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditorKind('habit');
    setEditorItemData(habit);
    setIsEditorOpen(true);
  };

  const handleToggleHabitLog = (habitId: string, dateStr: string) => {
    setState(prev => {
      let actionType: any = 'habit_check';
      const updatedHabits = prev.habits.map(h => {
        if (h.id !== habitId) return h;
        const exists = h.logs.includes(dateStr);
        actionType = exists ? 'habit_uncheck' : 'habit_check';
        const newLogs = exists ? h.logs.filter(d => d !== dateStr) : [...h.logs, dateStr];
        return enrichHabitWithMl({ ...h, logs: newLogs });
      });

      const log = createActionLog(actionType, 'habit', habitId, { date: dateStr }, currentView);
      sendActionLogToBackend(log);

      return {
        ...prev,
        habits: updatedHabits,
        actionLogs: appendActionLog(prev.actionLogs, log),
      };
    });
  };

  const handleDeleteHabit = (habitId: string) => {
    recordBehavioralAction('habit_delete', 'habit', habitId);
    setState(prev => ({
      ...prev,
      habits: prev.habits.filter(h => h.id !== habitId),
    }));
    showToast('عادت حذف شد.');
  };

  const handleOpenConvertHabitModal = (habitId: string) => {
    setEditorKind('fromHabit');
    setEditorItemData({ habitId });
    setIsEditorOpen(true);
  };

  const handleConvertHabitDayToTask = (habit: Habit, dateStr: string) => {
    const rawTask: Task = {
      id: crypto.randomUUID(),
      title: habit.title,
      date: dateStr,
      quad: 'q2', // مهم و غیرفوری
      habitId: habit.id,
      done: false,
      subs: [],
      source: 'quick_add',
    };
    const newTask = enrichTaskWithMl(rawTask, true);
    recordBehavioralAction('task_create', 'task', newTask.id, { source: 'habit_conversion', quad: newTask.quad });
    setState(prev => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
    showToast(`عادت «${habit.title}» برای تاریخ ${toJalali(dateStr)} به تب کارها اضافه شد.`);
  };

  // Goal Actions with ML Progress Tracking
  const handleOpenNewGoalModal = () => {
    setEditorKind('goal');
    setEditorItemData(null);
    setIsEditorOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditorKind('goal');
    setEditorItemData(goal);
    setIsEditorOpen(true);
  };

  const handleDeleteGoal = (goalId: string) => {
    recordBehavioralAction('goal_delete', 'goal', goalId);
    setState(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== goalId),
      // unlink tasks
      tasks: prev.tasks.map(t => (t.goalId === goalId ? { ...t, goalId: undefined } : t)),
    }));
    showToast('هدف حذف شد.');
  };

  const handleUpdateGoalProgress = (goalId: string, delta: number) => {
    setState(prev => {
      let progress: number | undefined;
      const updatedGoals = prev.goals.map(g => {
        if (g.id !== goalId) return g;
        const nextVal = Math.max(0, g.current + delta);
        const updatedGoal = enrichGoalWithMl({ ...g, current: nextVal });
        progress = updatedGoal.progressPercentage;
        return updatedGoal;
      });

      const log = createActionLog(
        'goal_progress_update',
        'goal',
        goalId,
        { delta, progress },
        currentView
      );
      sendActionLogToBackend(log);

      return {
        ...prev,
        goals: updatedGoals,
        actionLogs: appendActionLog(prev.actionLogs, log),
      };
    });
  };

  // Save entity from Universal Editor with Machine Learning Normalization
  const handleSaveEntity = (kind: EditorKind, data: any) => {
    const id = data.id || crypto.randomUUID();

    if (kind === 'task') {
      setState(prev => {
        const existingIdx = prev.tasks.findIndex(t => t.id === id);
        const isEdit = existingIdx !== -1;
        const enriched = enrichTaskWithMl({ ...data, id }, !isEdit);
        const log = createActionLog(
          isEdit ? 'task_update' : 'task_create',
          'task',
          id,
          { quad: enriched.quad, priorityScore: enriched.priorityScore },
          currentView
        );
        sendActionLogToBackend(log);

        if (isEdit) {
          const updated = [...prev.tasks];
          updated[existingIdx] = enriched;
          return { ...prev, tasks: updated, actionLogs: appendActionLog(prev.actionLogs, log) };
        }
        return { ...prev, tasks: [enriched, ...prev.tasks], actionLogs: appendActionLog(prev.actionLogs, log) };
      });
      showToast('کار ذخیره شد.');
    } else if (kind === 'money') {
      setState(prev => {
        const existingIdx = prev.money.findIndex(m => m.id === id);
        const isEdit = existingIdx !== -1;
        const enriched = enrichMoneyWithMl({ ...data, id }, !isEdit);
        const log = createActionLog(
          'money_create',
          'money',
          id,
          { amountTomans: enriched.amountTomans, amountLog10: enriched.amountLog10, kind: enriched.kind, category: enriched.category },
          currentView
        );
        sendActionLogToBackend(log);

        if (isEdit) {
          const updated = [...prev.money];
          updated[existingIdx] = enriched;
          return { ...prev, money: updated, actionLogs: appendActionLog(prev.actionLogs, log) };
        }
        return { ...prev, money: [enriched, ...prev.money], actionLogs: appendActionLog(prev.actionLogs, log) };
      });
      showToast('تراکنش مالی ثبت شد.');
    } else if (kind === 'goal') {
      setState(prev => {
        const existingIdx = prev.goals.findIndex(g => g.id === id);
        const isEdit = existingIdx !== -1;
        const enriched = enrichGoalWithMl({ ...data, id }, !isEdit);
        const log = createActionLog(
          'goal_create',
          'goal',
          id,
          { target: enriched.target, unit: enriched.unit, progress: enriched.progressPercentage },
          currentView
        );
        sendActionLogToBackend(log);

        if (isEdit) {
          const updated = [...prev.goals];
          updated[existingIdx] = enriched;
          return { ...prev, goals: updated, actionLogs: appendActionLog(prev.actionLogs, log) };
        }
        return { ...prev, goals: [...prev.goals, enriched], actionLogs: appendActionLog(prev.actionLogs, log) };
      });
      showToast('هدف ذخیره شد.');
    } else if (kind === 'habit') {
      setState(prev => {
        const existingIdx = prev.habits.findIndex(h => h.id === id);
        const isEdit = existingIdx !== -1;
        const enriched = enrichHabitWithMl({ ...data, id }, !isEdit);
        const log = createActionLog(
          'habit_create',
          'habit',
          id,
          { daysCount: enriched.days?.length, streak: enriched.streakCount },
          currentView
        );
        sendActionLogToBackend(log);

        if (isEdit) {
          const updated = [...prev.habits];
          updated[existingIdx] = enriched;
          return { ...prev, habits: updated, actionLogs: appendActionLog(prev.actionLogs, log) };
        }
        return { ...prev, habits: [...prev.habits, enriched], actionLogs: appendActionLog(prev.actionLogs, log) };
      });
      showToast('عادت ذخیره شد.');
    } else if (kind === 'installment') {
      recordBehavioralAction('installment_create', 'installment', id, { amount: data.amount, total: data.total });
      setState(prev => {
        const existingIdx = prev.installments.findIndex(i => i.id === id);
        if (existingIdx !== -1) {
          const updated = [...prev.installments];
          updated[existingIdx] = { ...prev.installments[existingIdx], ...data, id };
          return { ...prev, installments: updated };
        }
        return { ...prev, installments: [...prev.installments, { ...data, id, createdAt: new Date().toISOString(), createdTimestamp: Date.now() }] };
      });
      showToast('قسط ذخیره شد.');
    } else if (kind === 'cheque') {
      recordBehavioralAction('cheque_create', 'cheque', id, { amount: data.amount, date: data.date });
      setState(prev => {
        const existingIdx = prev.cheques.findIndex(c => c.id === id);
        if (existingIdx !== -1) {
          const updated = [...prev.cheques];
          updated[existingIdx] = { ...prev.cheques[existingIdx], ...data, id };
          return { ...prev, cheques: updated };
        }
        return { ...prev, cheques: [...prev.cheques, { ...data, id, createdAt: new Date().toISOString(), createdTimestamp: Date.now() }] };
      });
      showToast('چک ذخیره شد.');
    } else if (kind === 'budget') {
      setState(prev => ({ ...prev, budget: data.budget }));
      showToast('سقف بودجه ماهانه به‌روزرسانی شد.');
    } else if (kind === 'fromHabit') {
      if (Array.isArray(data.tasks)) {
        const newTasksWithIds = data.tasks.map((t: any) => enrichTaskWithMl({ ...t, id: crypto.randomUUID() }, true));
        setState(prev => ({ ...prev, tasks: [...newTasksWithIds, ...prev.tasks] }));
        showToast(`${newTasksWithIds.length} کار از روی عادت ساخته و به فهرست اضافه شد.`);
      }
    }
  };

  const handleDeleteEntity = (kind: EditorKind, id: string) => {
    if (kind === 'task') handleDeleteTask(id);
    if (kind === 'money') handleDeleteMoney(id);
    if (kind === 'goal') handleDeleteGoal(id);
    if (kind === 'habit') handleDeleteHabit(id);
    if (kind === 'installment') handleDeleteInstallment(id);
    if (kind === 'cheque') handleDeleteCheque(id);
  };

  const pendingTasksCount = state.tasks.filter(t => !t.done).length;

  const handleSelectView = (view: AppView) => {
    if (view !== currentView) {
      recordBehavioralAction('view_change', 'navigation', undefined, { from: currentView, to: view });
      setCurrentView(view);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200 antialiased selection:bg-emerald-500/20">
      {/* Header */}
      <Header
        theme={theme}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        userName={state.userProfile?.fullName}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAdminPanel={openAdminPanel}
        onLogout={() => setIsLogoutModalOpen(true)}
      />

      {/* Ad & Announcement Banner */}
      <AdBanner />

      {/* Main View Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 pb-24">
        {currentView === 'tasks' && (
          <TasksView
            tasks={state.tasks}
            goals={state.goals}
            onToggleTask={handleToggleTask}
            onToggleSubtask={handleToggleSubtask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onOpenNewTaskModal={handleOpenNewTaskModal}
          />
        )}

        {currentView === 'finance' && (
          <FinanceView
            money={state.money}
            budget={state.budget}
            installments={state.installments}
            cheques={state.cheques}
            bankAccounts={state.bankAccounts || []}
            onOpenNewMoneyModal={handleOpenNewMoneyModal}
            onOpenNewInstallmentModal={handleOpenNewInstallmentModal}
            onOpenNewChequeModal={handleOpenNewChequeModal}
            onOpenBudgetModal={handleOpenBudgetModal}
            onOpenBankAccountsModal={() => setIsBankAccountsModalOpen(true)}
            onOpenSmsModal={() => {
              setIncomingSmsText('');
              setIsBankSmsModalOpen(true);
            }}
            onPayInstallment={handlePayInstallment}
            onToggleCheque={handleToggleCheque}
            onDeleteMoney={handleDeleteMoney}
            onDeleteInstallment={handleDeleteInstallment}
            onDeleteCheque={handleDeleteCheque}
            onEditMoney={handleEditMoney}
            onEditInstallment={handleEditInstallment}
            onEditCheque={handleEditCheque}
          />
        )}

        {currentView === 'habits' && (
          <HabitsView
            habits={state.habits}
            onToggleHabitLog={handleToggleHabitLog}
            onOpenNewHabitModal={handleOpenNewHabitModal}
            onOpenConvertHabitModal={handleOpenConvertHabitModal}
            onConvertDayToTask={handleConvertHabitDayToTask}
            onEditHabit={handleEditHabit}
            onDeleteHabit={handleDeleteHabit}
          />
        )}

        {currentView === 'goals' && (
          <GoalsView
            goals={state.goals}
            tasks={state.tasks}
            onOpenNewGoalModal={handleOpenNewGoalModal}
            onEditGoal={handleEditGoal}
            onDeleteGoal={handleDeleteGoal}
            onUpdateProgress={handleUpdateGoalProgress}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <Navigation
        currentView={currentView}
        onSelectView={handleSelectView}
        pendingTasksCount={pendingTasksCount}
      />

      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-20 inset-x-4 z-40 max-w-sm mx-auto flex items-center justify-center pointer-events-none">
          <div role="status" aria-live="polite" className="bg-slate-900/90 dark:bg-slate-100/95 text-white dark:text-slate-900 text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom duration-200">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Universal Editor Modal */}
      <EditorModal
        isOpen={isEditorOpen}
        kind={editorKind}
        itemData={editorItemData}
        goals={state.goals}
        habits={state.habits}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveEntity}
        onDelete={handleDeleteEntity}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        theme={theme}
        state={state}
        onClose={() => setIsSettingsOpen(false)}
        onToggleTheme={toggleTheme}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        onStateRestored={applyRestoredState}
        onNotify={showToast}
        onOpenAdminPanel={openAdminPanel}
        onCheckUpdate={() => setIsUpdateModalOpen(true)}
        onLogout={() => setIsLogoutModalOpen(true)}
      />

      {/* APK Download & Info Modal */}
      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* iOS / iPhone PWA Guide Modal */}
      <IosInstallModal
        isOpen={isIosModalOpen}
        onClose={() => setIsIosModalOpen(false)}
      />

      {/* Admin Panel (Ads, Server, Cloud Sync, SFTP, Auto-Update) */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen && isAdmin}
        onClose={closeAdminPanel}
        state={state}
        onRestoreState={applyRestoredState}
        userProfile={state.userProfile}
        onOpenUpdateModal={vInfo => {
          if (vInfo) setServerVersionInfo(vInfo);
          setIsUpdateModalOpen(true);
        }}
      />

      {/* Auto-Update Modal for Older Versions */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={handleCloseUpdateModal}
        versionInfo={serverVersionInfo}
        currentVersion={CURRENT_APP_VERSION}
        currentVersionCode={CURRENT_APP_VERSION_CODE}
      />

      {/* Login / Mandatory SMS OTP Verification */}
      <LoginModal
        isOpen={requiresLogin && !isLoggedIn}
        onSuccess={handleLoginSuccess}
      />

      {/* Bank SMS Modal */}
      <BankSmsModal
        isOpen={isBankSmsModalOpen}
        onClose={() => setIsBankSmsModalOpen(false)}
        bankAccounts={state.bankAccounts || []}
        initialSmsText={incomingSmsText}
        onAddTransaction={handleAddTransactionFromSms}
        onAddBankAccount={handleAddBankAccount}
      />

      {/* Bank Accounts Modal */}
      <BankAccountsModal
        isOpen={isBankAccountsModalOpen}
        onClose={() => setIsBankAccountsModalOpen(false)}
        bankAccounts={state.bankAccounts || []}
        onAddBankAccount={handleAddBankAccount}
        onUpdateBankAccount={handleUpdateBankAccount}
        onDeleteBankAccount={handleDeleteBankAccount}
        onOpenSmsModal={() => {
          setIncomingSmsText('');
          setIsBankSmsModalOpen(true);
        }}
      />

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        userName={state.userProfile?.fullName}
        userMobile={state.userProfile?.mobile}
      />
    </div>
  );
}
