export type Quadrant = 'q1' | 'q2' | 'q3' | 'q4' | '';

export interface Subtask {
  title: string;
  done: boolean;
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
}

export interface Money {
  id: string;
  title: string;
  amount: number;
  kind: MoneyKind;
  category: MoneyCategory;
  date: string; // YYYY-MM-DD
  bankId?: string; // Linked bank account ID
}

export interface Installment {
  id: string;
  title: string;
  amount: number;
  dueDay: number; // 1..31
  total: number;
  remaining: number;
}

export interface Cheque {
  id: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  cashed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  date?: string; // Target date
}

export interface Habit {
  id: string;
  title: string;
  days: number[]; // 0=Sunday, 1=Monday, ... 6=Saturday
  logs: string[]; // ['YYYY-MM-DD']
  pattern?: 'daily' | 'even' | 'odd' | 'alternate' | 'custom';
  targetDays?: string[]; // Specific dates in calendar
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
}

export type AppView = 'tasks' | 'finance' | 'habits' | 'goals';
