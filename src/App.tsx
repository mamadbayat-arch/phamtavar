import React, { useState, useEffect } from 'react';
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
import { loadStoredState, saveStoredState } from './utils/storage';
import { toJalali } from './utils/jalali';
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
import { UserProfile, AppVersionInfo, CURRENT_APP_VERSION, CURRENT_APP_VERSION_CODE } from './types';

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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Auto-Update States
  const [serverVersionInfo, setServerVersionInfo] = useState<AppVersionInfo | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Check version on launch for Auto-Update
  useEffect(() => {
    fetch('/api/app/version')
      .then(res => res.json())
      .then((data: AppVersionInfo) => {
        if (!data || !data.version) return;
        setServerVersionInfo(data);

        const serverCode = data.versionCode || 0;
        const isNewerCode = serverCode > CURRENT_APP_VERSION_CODE;
        const isNewerVersion = data.version !== CURRENT_APP_VERSION;

        if (isNewerCode || isNewerVersion) {
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

  // Show login modal on first launch if not yet verified
  useEffect(() => {
    if (!state.userProfile || !state.userProfile.isVerified) {
      setIsLoginModalOpen(true);
    }
  }, []);

  // Listen for /admin, #admin, or ?admin in URL address bar
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = new URLSearchParams(window.location.search);
      if (path === '/admin' || hash === '#admin' || hash === '#/admin' || search.has('admin')) {
        setIsAdminPanelOpen(true);
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    window.addEventListener('hashchange', handleUrlRoute);
    return () => {
      window.removeEventListener('popstate', handleUrlRoute);
      window.removeEventListener('hashchange', handleUrlRoute);
    };
  }, []);

  const openAdminPanel = () => {
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
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
        const parsed = JSON.parse(jsonString);
        setState(parsed);
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
      if (isLoginModalOpen) {
        setIsLoginModalOpen(false);
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
    currentView,
  ]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Task Actions
  const handleToggleTask = (taskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, done: !t.done } : t)),
    }));
  };

  const handleToggleSubtask = (taskId: string, subIndex: number) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id !== taskId || !t.subs) return t;
        const newSubs = t.subs.map((s, idx) => (idx === subIndex ? { ...s, done: !s.done } : s));
        return { ...t, subs: newSubs };
      }),
    }));
  };

  const handleDeleteTask = (taskId: string) => {
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

  // Money Actions
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
    setState(prev => ({
      ...prev,
      installments: prev.installments.map(inst => {
        if (inst.id === instId && inst.remaining > 0) {
          return { ...inst, remaining: inst.remaining - 1 };
        }
        return inst;
      }),
    }));
    showToast('یک قسط به عنوان پرداخت‌شده ثبت شد.');
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
      cheques: prev.cheques.map(c => (c.id === chqId ? { ...c, cashed: !c.cashed } : c)),
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
    const newMoney: Money = {
      ...moneyData,
      id: crypto.randomUUID(),
    };

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
    setState(prev => ({
      ...prev,
      habits: prev.habits.map(h => {
        if (h.id !== habitId) return h;
        const exists = h.logs.includes(dateStr);
        const newLogs = exists ? h.logs.filter(d => d !== dateStr) : [...h.logs, dateStr];
        return { ...h, logs: newLogs };
      }),
    }));
  };

  const handleDeleteHabit = (habitId: string) => {
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
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: habit.title,
      date: dateStr,
      quad: 'q2', // مهم و غیرفوری
      habitId: habit.id,
      done: false,
      subs: [],
    };
    setState(prev => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
    showToast(`عادت «${habit.title}» برای تاریخ ${toJalali(dateStr)} به تب کارها اضافه شد.`);
  };

  // Goal Actions
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
    setState(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== goalId),
      // unlink tasks
      tasks: prev.tasks.map(t => (t.goalId === goalId ? { ...t, goalId: undefined } : t)),
    }));
    showToast('هدف حذف شد.');
  };

  const handleUpdateGoalProgress = (goalId: string, delta: number) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => {
        if (g.id !== goalId) return g;
        return { ...g, current: Math.max(0, g.current + delta) };
      }),
    }));
  };

  // Save entity from Universal Editor
  const handleSaveEntity = (kind: EditorKind, data: any) => {
    const id = data.id || crypto.randomUUID();

    if (kind === 'task') {
      setState(prev => {
        const existingIdx = prev.tasks.findIndex(t => t.id === id);
        if (existingIdx !== -1) {
          const updated = [...prev.tasks];
          updated[existingIdx] = { ...data, id };
          return { ...prev, tasks: updated };
        }
        return { ...prev, tasks: [data, ...prev.tasks] };
      });
      showToast('کار ذخیره شد.');
    } else if (kind === 'money') {
      setState(prev => {
        const existingIdx = prev.money.findIndex(m => m.id === id);
        if (existingIdx !== -1) {
          const updated = [...prev.money];
          updated[existingIdx] = { ...data, id };
          return { ...prev, money: updated };
        }
        return { ...prev, money: [data, ...prev.money] };
      });
      showToast('تراکنش مالی ثبت شد.');
    } else if (kind === 'goal') {
      setState(prev => {
        const existingIdx = prev.goals.findIndex(g => g.id === id);
        if (existingIdx !== -1) {
          const updated = [...prev.goals];
          updated[existingIdx] = { ...data, id };
          return { ...prev, goals: updated };
        }
        return { ...prev, goals: [...prev.goals, { ...data, id }] };
      });
      showToast('هدف ذخیره شد.');
    } else if (kind === 'habit') {
      setState(prev => {
        const existingIdx = prev.habits.findIndex(h => h.id === id);
        if (existingIdx !== -1) {
          const updated = [...prev.habits];
          updated[existingIdx] = { ...data, id };
          return { ...prev, habits: updated };
        }
        return { ...prev, habits: [...prev.habits, { ...data, id }] };
      });
      showToast('عادت ذخیره شد.');
    } else if (kind === 'installment') {
      setState(prev => {
        const existingIdx = prev.installments.findIndex(i => i.id === id);
        if (existingIdx !== -1) {
          const updated = [...prev.installments];
          updated[existingIdx] = { ...data, id };
          return { ...prev, installments: updated };
        }
        return { ...prev, installments: [...prev.installments, { ...data, id }] };
      });
      showToast('قسط ذخیره شد.');
    } else if (kind === 'cheque') {
      setState(prev => {
        const existingIdx = prev.cheques.findIndex(c => c.id === id);
        if (existingIdx !== -1) {
          const updated = [...prev.cheques];
          updated[existingIdx] = { ...data, id };
          return { ...prev, cheques: updated };
        }
        return { ...prev, cheques: [...prev.cheques, { ...data, id }] };
      });
      showToast('چک ذخیره شد.');
    } else if (kind === 'budget') {
      setState(prev => ({ ...prev, budget: data.budget }));
      showToast('سقف بودجه ماهانه به‌روزرسانی شد.');
    } else if (kind === 'fromHabit') {
      if (Array.isArray(data.tasks)) {
        const newTasksWithIds = data.tasks.map((t: any) => ({
          ...t,
          id: crypto.randomUUID(),
        }));
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200 antialiased selection:bg-emerald-500/20">
      {/* Header */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        onOpenIosModal={() => setIsIosModalOpen(true)}
        onOpenAdminPanel={openAdminPanel}
      />

      {/* Ad & Announcement Banner */}
      <AdBanner onOpenAdminPanel={openAdminPanel} />

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
        onSelectView={setCurrentView}
        pendingTasksCount={pendingTasksCount}
      />

      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-20 inset-x-4 z-40 max-w-sm mx-auto flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/90 dark:bg-slate-100/95 text-white dark:text-slate-900 text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom duration-200">
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
        onStateRestored={setState}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        onOpenIosModal={() => setIsIosModalOpen(true)}
        onOpenAdminPanel={openAdminPanel}
        onCheckUpdate={() => setIsUpdateModalOpen(true)}
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
        isOpen={isAdminPanelOpen}
        onClose={closeAdminPanel}
        state={state}
        onRestoreState={setState}
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

      {/* Login / First Launch OTP Verification */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onSuccess={profile => {
          setState(prev => ({ ...prev, userProfile: profile }));
          setIsLoginModalOpen(false);
          showToast(`خوش آمدید، ${profile.fullName}!`);
        }}
        onSkip={() => setIsLoginModalOpen(false)}
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
    </div>
  );
}
