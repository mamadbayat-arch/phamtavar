import {
  ActionLogType,
  ActionLogEntity,
  UserActionLog,
  Task,
  Money,
  Habit,
  Goal,
  Quadrant,
} from '../types';

import { apiFetch, getToken, hasServer, isTelemetryEnabled } from './api';

const SESSION_KEY = 'hp_ml_session_id';

/**
 * Returns a persistent session ID for the current browsing session.
 */
export function getSessionId(): string {
  try {
    let sessId = sessionStorage.getItem(SESSION_KEY);
    if (!sessId) {
      sessId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(SESSION_KEY, sessId);
    }
    return sessId;
  } catch {
    return `sess_${Date.now()}_local`;
  }
}

const FA_DAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

export function getPersianDayName(dayOfWeek: number): string {
  return FA_DAYS[dayOfWeek] || 'نامشخص';
}

/**
 * Normalizes Eisenhower Quadrant to a continuous ML priority score [0.0 - 1.0].
 * Q1 (Urgent & Important) = 1.0
 * Q2 (Important & Not Urgent) = 0.75 (high strategic value)
 * Q3 (Urgent & Not Important) = 0.50
 * Q4 (Neither) = 0.25
 */
export function calculatePriorityScore(quad?: Quadrant): number {
  switch (quad) {
    case 'q1':
      return 1.0;
    case 'q2':
      return 0.75;
    case 'q3':
      return 0.5;
    case 'q4':
      return 0.25;
    default:
      return 0.5;
  }
}

/**
 * Creates an immutable time-stamped action log compliant with ML event stream standards.
 */
export function createActionLog(
  actionType: ActionLogType,
  entityType: ActionLogEntity,
  entityId?: string,
  payloadSummary?: Record<string, any>,
  currentView = 'tasks'
): UserActionLog {
  const now = new Date();
  const epochMs = now.getTime();
  const dayOfWeek = now.getDay(); // 0 is Sunday
  const hourOfDay = now.getHours();
  const minuteOfHour = now.getMinutes();
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 4; // Friday & Thursday in Iran

  return {
    id: `log_${epochMs}_${Math.random().toString(36).substring(2, 7)}`,
    sessionId: getSessionId(),
    actionType,
    entityType,
    entityId,
    timestamp: now.toISOString(),
    epochMs,
    context: {
      dayOfWeek,
      dayOfWeekFa: getPersianDayName(dayOfWeek),
      hourOfDay,
      minuteOfHour,
      isWeekend,
      currentView,
      payloadSummary,
    },
  };
}

/**
 * Appends a log entry to the state's action log ring-buffer (keeps last maxLogs).
 */
export function appendActionLog(
  existingLogs: UserActionLog[] | undefined,
  newLog: UserActionLog,
  maxLogs = 2000
): UserActionLog[] {
  const logs = existingLogs ? [...existingLogs, newLog] : [newLog];
  if (logs.length > maxLogs) {
    return logs.slice(logs.length - maxLogs);
  }
  return logs;
}

/**
 * Fire-and-forget sync of action log to the ML backend.
 */
export function sendActionLogToBackend(log: UserActionLog): void {
  // Only signed-in users who left usage sharing on send anything.
  if (!hasServer() || !getToken() || !isTelemetryEnabled()) return;
  apiFetch('/api/ml/log-action', { method: 'POST', body: JSON.stringify(log) }).catch(() => {
    // Offline or network error - the log stays in local state
  });
}

/**
 * Enriches a Task entity with standardized ML features.
 */
export function enrichTaskWithMl(task: Task, isNew = false): Task {
  const now = new Date();
  const nowIso = now.toISOString();
  const nowEpoch = now.getTime();

  const createdAt = task.createdAt || nowIso;
  const createdTimestamp = task.createdTimestamp || (task.createdAt ? new Date(task.createdAt).getTime() : nowEpoch);

  let completedAt = task.completedAt;
  let completedTimestamp = task.completedTimestamp;
  let completionLatencyMinutes = task.completionLatencyMinutes;

  if (task.done && !completedAt) {
    completedAt = nowIso;
    completedTimestamp = nowEpoch;
    completionLatencyMinutes = Math.max(1, Math.round((nowEpoch - createdTimestamp) / 60000));
  } else if (!task.done) {
    completedAt = undefined;
    completedTimestamp = undefined;
    completionLatencyMinutes = undefined;
  }

  return {
    ...task,
    createdAt,
    createdTimestamp,
    updatedAt: nowIso,
    updatedTimestamp: nowEpoch,
    completedAt,
    completedTimestamp,
    completionLatencyMinutes,
    priorityScore: calculatePriorityScore(task.quad),
    dayOfWeek: task.dayOfWeek ?? now.getDay(),
    hourOfDay: task.hourOfDay ?? now.getHours(),
    source: task.source || 'manual',
    tags: task.tags || [],
  };
}

/**
 * Enriches a Money transaction with standardized ML features.
 */
export function enrichMoneyWithMl(item: Money, isNew = false): Money {
  const now = new Date();
  const nowIso = now.toISOString();
  const nowEpoch = now.getTime();

  const amount = Number(item.amount) || 0;
  const amountTomans = amount;
  const amountRials = amount * 10;
  // Normalized Log-10 scale: standard feature scaling for financial neural nets
  const amountLog10 = Math.round(Math.log10(amount + 1) * 1000) / 1000;

  const dayOfWeek = item.dayOfWeek ?? now.getDay();
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 4;

  return {
    ...item,
    amount,
    amountTomans,
    amountRials,
    amountLog10,
    createdAt: item.createdAt || nowIso,
    createdTimestamp: item.createdTimestamp || nowEpoch,
    updatedAt: nowIso,
    dayOfWeek,
    hourOfDay: item.hourOfDay ?? now.getHours(),
    isWeekend,
    source: item.source || 'manual',
    inferredCategoryConfidence: item.inferredCategoryConfidence ?? 1.0,
  };
}

/**
 * Enriches a Habit with behavioral retention analytics.
 */
export function enrichHabitWithMl(habit: Habit, isNew = false): Habit {
  const now = new Date();
  const nowIso = now.toISOString();
  const nowEpoch = now.getTime();

  const logs = habit.logs || [];
  const streakCount = calculateCurrentStreak(logs);
  const bestStreak = Math.max(habit.bestStreak || 0, streakCount);
  const completionRate30d = Math.round((countLogsInLastDays(logs, 30) / 30) * 100) / 100;

  return {
    ...habit,
    createdAt: habit.createdAt || nowIso,
    createdTimestamp: habit.createdTimestamp || nowEpoch,
    streakCount,
    bestStreak,
    completionRate30d,
  };
}

const localDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Consecutive logged days ending today (or yesterday, if today is not logged yet). */
export function calculateCurrentStreak(logs: string[]): number {
  if (!logs || logs.length === 0) return 0;
  const done = new Set(logs);
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  if (!done.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (done.has(localDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function countLogsInLastDays(logs: string[], days: number): number {
  const from = new Date();
  from.setHours(12, 0, 0, 0);
  from.setDate(from.getDate() - (days - 1));
  const fromKey = localDateKey(from);
  const toKey = localDateKey(new Date());
  return new Set(logs.filter(d => d >= fromKey && d <= toKey)).size;
}

/**
 * Enriches a Goal with progress trajectory features.
 */
export function enrichGoalWithMl(goal: Goal, isNew = false): Goal {
  const now = new Date();
  const nowIso = now.toISOString();
  const nowEpoch = now.getTime();

  const target = Math.max(1, Number(goal.target) || 1);
  const current = Number(goal.current) || 0;
  const progressPercentage = Math.min(100, Math.round((current / target) * 100));

  const history = goal.history ? [...goal.history] : [];
  // Append current milestone to history if changed
  const lastEntry = history[history.length - 1];
  if (!lastEntry || lastEntry.value !== current) {
    history.push({
      date: nowIso.slice(0, 10),
      timestamp: nowIso,
      epochMs: nowEpoch,
      value: current,
      percentage: progressPercentage,
    });
  }

  return {
    ...goal,
    target,
    current,
    progressPercentage,
    createdAt: goal.createdAt || nowIso,
    createdTimestamp: goal.createdTimestamp || nowEpoch,
    updatedAt: nowIso,
    history,
  };
}
