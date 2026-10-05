export type Quadrant = 'q1' | 'q2' | 'q3' | 'q4' | '';

export interface Subtask {
  title: string;
  done: boolean;
  completedAt?: string; // ISO 8601 timestamp
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  date?: string; // YYYY-MM-DD (Gregorian)
  time?: string; // HH:mm
  goalId?: string;
  quad?: Quadrant;
  habitId?: string;
  subs?: Subtask[];

  // Machine Learning & Behavioral Metadata Fields
  createdAt?: string; // ISO 8601 UTC timestamp
  createdTimestamp?: number; // Unix epoch ms
  updatedAt?: string; // ISO 8601 UTC timestamp
  updatedTimestamp?: number; // Unix epoch ms
  completedAt?: string; // ISO 8601 timestamp when marked done
  completedTimestamp?: number; // Unix epoch ms
  completionLatencyMinutes?: number; // Duration in minutes between creation and completion
  estimatedMinutes?: number; // Planned duration for ML regression
  actualMinutes?: number; // Real duration spent
  priorityScore?: number; // Normalized continuous score 0.0 to 1.0 (Q1=1.0, Q2=0.75, Q3=0.5, Q4=0.25)
  dayOfWeek?: number; // 0 (Sunday) to 6 (Saturday)
  hourOfDay?: number; // 0 to 23
  source?: 'manual' | 'ai_suggested' | 'sms_parser' | 'quick_add';
  tags?: string[]; // Semantic tags for NLP / embeddings
}

export type MoneyKind = 'expense' | 'income';

export type MoneyCategory =
  | 'روزمره'
  | 'خوراک'
  | 'رفت‌وآمد'
  | 'خانه'
  | 'سلامت'
  | 'آموزش'
  | 'درآمد'
  | 'سایر';

export interface BankAccount {
  id: string;
  bankName: string;
  cardLast4?: string;
  accountNumber?: string;
  initialBalance: number; // in Tomans
  currentBalance: number; // in Tomans
  lastBankSmsBalance?: number; // in Tomans
  color?: string;

  // ML metadata
  createdAt?: string;
  createdTimestamp?: number;
  updatedAt?: string;
}

export interface Money {
  id: string;
  title: string;
  amount: number;
  kind: MoneyKind;
  category: MoneyCategory;
  date: string; // YYYY-MM-DD
  bankId?: string; // Linked bank account ID

  // Machine Learning & Financial Analytics Fields
  createdAt?: string; // ISO 8601 UTC
  createdTimestamp?: number; // Epoch ms
  updatedAt?: string;
  amountTomans?: number; // Normalized Tomans
  amountRials?: number; // 10x Tomans
  amountLog10?: number; // Log-scale transformed amount for ML normalization: log10(amount + 1)
  dayOfWeek?: number; // 0-6
  hourOfDay?: number; // 0-23
  isWeekend?: boolean;
  source?: 'manual' | 'sms_parser' | 'bank_sync';
  inferredCategoryConfidence?: number; // 0.0 - 1.0 for model prediction
}

export interface Installment {
  id: string;
  title: string;
  amount: number;
  dueDay: number; // 1..31
  total: number;
  remaining: number;

  createdAt?: string;
  createdTimestamp?: number;
}

export interface Cheque {
  id: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  cashed: boolean;

  createdAt?: string;
  createdTimestamp?: number;
  cashedAt?: string;
}

export interface GoalProgressHistory {
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO 8601
  epochMs: number;
  value: number;
  percentage: number;
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  date?: string; // Target date

  // ML fields
  createdAt?: string;
  createdTimestamp?: number;
  updatedAt?: string;
  progressPercentage?: number; // 0-100
  history?: GoalProgressHistory[]; // Time-series progress for trajectory forecasting
}

export interface HabitLogEntry {
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO 8601
  epochMs: number;
  dayOfWeek: number; // 0-6
  hourOfDay: number; // 0-23
  completed: boolean;
}

export interface Habit {
  id: string;
  title: string;
  days: number[]; // 0=Sunday, 1=Monday, ... 6=Saturday
  logs: string[]; // ['YYYY-MM-DD']
  pattern?: 'daily' | 'even' | 'odd' | 'alternate' | 'custom';
  targetDays?: string[]; // Specific dates in calendar

  // ML & Behavioral Habit Analytics
  createdAt?: string;
  createdTimestamp?: number;
  streakCount?: number; // Current continuous streak
  bestStreak?: number; // All-time highest streak
  completionRate30d?: number; // 0.0 to 1.0 (frequency density in last 30 days)
  detailedLogs?: HabitLogEntry[]; // Granular timestamped check-in events
}

export interface UserProfile {
  mobile: string;
  fullName: string;
  isVerified: boolean;
  registeredAt: string;
}

export interface AdConfig {
  active: boolean;
  title: string;
  description: string;
  ctaText?: string;
  ctaUrl?: string;
  badge?: string;
  bgColor?: string;
}

export interface AppVersionInfo {
  version: string;
  versionCode: number;
  releaseDate?: string;
  minSupportedVersion?: string;
  isMandatory?: boolean;
  changelog: string[];
  apkUrl: string;
  sftpServer?: {
    ip: string;
    port: number;
    username: string;
    targetFolder: string;
  };
}

export const CURRENT_APP_VERSION = '1.2.0';
export const CURRENT_APP_VERSION_CODE = 2;

// User Action & Behavioral Event Log Schema (Machine Learning Ready)
export type ActionLogType =
  | 'task_create'
  | 'task_toggle'
  | 'task_update'
  | 'task_delete'
  | 'task_reorder'
  | 'money_create'
  | 'money_delete'
  | 'bank_sms_parse'
  | 'bank_sms_confirm'
  | 'habit_check'
  | 'habit_uncheck'
  | 'habit_create'
  | 'habit_delete'
  | 'goal_progress_update'
  | 'goal_create'
  | 'goal_delete'
  | 'bank_account_create'
  | 'bank_account_update'
  | 'bank_account_delete'
  | 'installment_create'
  | 'installment_pay'
  | 'cheque_create'
  | 'cheque_toggle'
  | 'view_change'
  | 'cloud_sync'
  | 'backup_export'
  | 'app_launch';

export type ActionLogEntity =
  | 'task'
  | 'money'
  | 'habit'
  | 'goal'
  | 'bank_account'
  | 'installment'
  | 'cheque'
  | 'navigation'
  | 'system';

export interface UserActionLog {
  id: string;
  sessionId: string;
  actionType: ActionLogType;
  entityType: ActionLogEntity;
  entityId?: string;
  timestamp: string; // ISO 8601 UTC
  epochMs: number; // Unix timestamp in milliseconds
  context: {
    dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
    dayOfWeekFa: string; // شنبه, یکشنبه, ...
    hourOfDay: number; // 0 - 23
    minuteOfHour: number; // 0 - 59
    isWeekend: boolean; // Friday (and Thursday)
    currentView: string;
    payloadSummary?: Record<string, any>;
  };
}

export interface AppState {
  tasks: Task[];
  money: Money[];
  budget: number;
  goals: Goal[];
  habits: Habit[];
  installments: Installment[];
  cheques: Cheque[];
  bankAccounts: BankAccount[];
  userProfile?: UserProfile;
  actionLogs?: UserActionLog[]; // Time-stamped behavioral action events for ML
}

export type AppView = 'tasks' | 'finance' | 'habits' | 'goals';
