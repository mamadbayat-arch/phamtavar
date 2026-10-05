import React from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  ListTodo,
  Edit2,
  Trash2,
  Minus,
} from 'lucide-react';
import { Goal, Task } from '../types';
import { formatJalaliShort, toPersianDigits } from '../utils/jalali';

interface GoalsViewProps {
  goals: Goal[];
  tasks: Task[];
  onOpenNewGoalModal: () => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onUpdateProgress: (goalId: string, delta: number) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  tasks,
  onOpenNewGoalModal,
  onEditGoal,
  onDeleteGoal,
  onUpdateProgress,
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>اهداف و دستاوردهای شخصی</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            تعیین مقصد مشخص و رصد گام‌به‌گام پیشرفت
          </p>
        </div>

        <button
          onClick={onOpenNewGoalModal}
          className="flex items-center justify-center gap-1.5 h-8 sm:h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition-all leading-none whitespace-nowrap flex-shrink-0"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span className="leading-none">هدف جدید</span>
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {goals.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
            هنوز هدفی تعریف نکرده‌اید. با فشردن دکمهٔ «هدف جدید» آغاز کنید.
          </div>
        ) : (
          goals.map(goal => {
            const percent = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
            const linkedTasks = tasks.filter(t => t.goalId === goal.id);
            const linkedDone = linkedTasks.filter(t => t.done).length;
            const isCompleted = goal.current >= goal.target;

            return (
              <div
                key={goal.id}
                className={`p-4 rounded-2xl border transition-all shadow-sm ${
                  isCompleted
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {goal.title}
                      </h2>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تحقق یافته</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {goal.date && (
                        <span>مهلت هدف: {formatJalaliShort(goal.date)}</span>
                      )}
                      {linkedTasks.length > 0 && (
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <ListTodo className="w-3.5 h-3.5 text-blue-500" />
                          <span>
                            {toPersianDigits(linkedDone)} از {toPersianDigits(linkedTasks.length)} کار مرتبط
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditGoal(goal)}
                      aria-label="ویرایش هدف"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => confirm(`هدف «${goal.title}» حذف شود؟`) && onDeleteGoal(goal.id)}
                      aria-label="حذف هدف"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Counter */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-200">
                      {toPersianDigits(goal.current)} از {toPersianDigits(goal.target)} {goal.unit}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {toPersianDigits(percent)}٪
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Quick Increment Controls */}
                <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <span className="text-xs text-slate-400 ml-auto">ثبت پیشرفت سریع:</span>
                  <button
                    onClick={() => onUpdateProgress(goal.id, -1)}
                    disabled={goal.current <= 0}
                    className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                    title="کاهش یک واحد"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateProgress(goal.id, 1)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold border border-emerald-300 dark:border-emerald-700"
                    title="افزایش یک واحد"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>۱ {goal.unit}</span>
                  </button>
                  <button
                    onClick={() => onUpdateProgress(goal.id, 5)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold border border-emerald-300 dark:border-emerald-700"
                    title="افزایش ۵ واحد"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>۵</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
