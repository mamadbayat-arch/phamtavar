import React, { useState } from 'react';
import {
  Grid2X2,
  Plus,
  CheckCircle2,
  Circle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Task, Quadrant } from '../types';
import { toPersianDigits } from '../utils/jalali';

interface EisenhowerViewProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onOpenNewTaskModal: (defaultQuad: Quadrant) => void;
  onEditTask: (task: Task) => void;
}

export const EisenhowerView: React.FC<EisenhowerViewProps> = ({
  tasks,
  onToggleTask,
  onOpenNewTaskModal,
  onEditTask,
}) => {
  const [showGuide, setShowGuide] = useState(false);

  const getQuadrantTasks = (quad: Quadrant) => tasks.filter(t => t.quad === quad);

  const quadrants = [
    {
      id: 'q1' as Quadrant,
      title: 'فوری و مهم (Q1)',
      subtitle: 'بحران‌ها و امور اضطراری — اول انجام بده',
      bgClass: 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60',
      headerClass: 'text-rose-700 dark:text-rose-400',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
      btnClass: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
    {
      id: 'q2' as Quadrant,
      title: 'مهم و غیرفوری (Q2)',
      subtitle: 'برنامه‌ریزی، رشد و اهداف — زمان‌بندی کن',
      bgClass: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60',
      headerClass: 'text-emerald-700 dark:text-emerald-400',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
      btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      id: 'q3' as Quadrant,
      title: 'فوری و غیرمهم (Q3)',
      subtitle: 'وقفه‌ها و درخواست‌های دیگران — تفویض کن',
      bgClass: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60',
      headerClass: 'text-amber-700 dark:text-amber-400',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
      btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    {
      id: 'q4' as Quadrant,
      title: 'غیرمهم و غیرفوری (Q4)',
      subtitle: 'اتلاف وقت و کارهای بی‌فایده — حذف کن',
      bgClass: 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700',
      headerClass: 'text-slate-700 dark:text-slate-300',
      badgeClass: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
      btnClass: 'bg-slate-600 hover:bg-slate-700 text-white',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Grid2X2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>ماتریس اولویت‌بندی آیزنهاور</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            دسته‌بندی کارها بر اساس فوریت و اهمیت برای تمرکز بر آنچه ارزشمند است
          </p>
        </div>

        <button
          onClick={() => setShowGuide(prev => !prev)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span>راهنما</span>
          {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Guide Accordion */}
      {showGuide && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
          <p className="font-bold text-emerald-800 dark:text-emerald-300">
            چگونه از ماتریس آیزنهاور برای بهره‌وری حداکثری استفاده کنیم؟
          </p>
          <ul className="list-disc list-inside space-y-1 pr-1 text-slate-600 dark:text-slate-400">
            <li>
              <strong className="text-rose-600 dark:text-rose-400">خانه ۱ (فوری و مهم):</strong> کارهایی که سررسید نزدیک دارند یا فوراً نیازمند رسیدگی شما هستند.
            </li>
            <li>
              <strong className="text-emerald-600 dark:text-emerald-400">خانه ۲ (مهم و غیرفوری):</strong> ارزشمندترین بخش برای رشد شخصی و حرفه‌ای. این کارها را زمان‌بندی کنید تا تبدیل به بحران نشوند.
            </li>
            <li>
              <strong className="text-amber-600 dark:text-amber-400">خانه ۳ (فوری و غیرمهم):</strong> درخواست‌هایی که فوریت دارند اما در مسیر اهداف اصلی شما نیستند. در صورت امکان به دیگران بسپارید.
            </li>
            <li>
              <strong className="text-slate-600 dark:text-slate-400">خانه ۴ (غیرمهم و غیرفوری):</strong> فعالیت‌های بدون ارزش افزوده؛ آن‌ها را به حداقل رسانده یا حذف کنید.
            </li>
          </ul>
        </div>
      )}

      {/* 4 Quadrants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrants.map(q => {
          const qTasks = getQuadrantTasks(q.id);
          const doneQCount = qTasks.filter(t => t.done).length;

          return (
            <div
              key={q.id}
              className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between transition-all ${q.bgClass}`}
            >
              <div>
                {/* Quadrant Title */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <h2 className={`text-sm font-bold ${q.headerClass}`}>
                      {q.title}
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {q.subtitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${q.badgeClass}`}>
                      {toPersianDigits(doneQCount)}/{toPersianDigits(qTasks.length)}
                    </span>
                    <button
                      onClick={() => onOpenNewTaskModal(q.id)}
                      className={`p-1 rounded-lg ${q.btnClass} active:scale-95 transition-transform`}
                      title="افزودن کار در این بخش"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quadrant Tasks List */}
                <div className="space-y-2 min-h-[90px]">
                  {qTasks.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                      هیچ کاری در این خانه ثبت نشده است.
                    </div>
                  ) : (
                    qTasks.map(task => (
                      <div
                        key={task.id}
                        className={`flex items-start justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs ${
                          task.done ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <button
                            onClick={() => onToggleTask(task.id)}
                            className="mt-0.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0"
                          >
                            {task.done ? (
                              <CheckCircle2 className="w-4 h-4 fill-emerald-100 dark:fill-emerald-950" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          <span
                            className={`text-xs font-medium break-words leading-relaxed ${
                              task.done
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-800 dark:text-slate-100'
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        <button
                          onClick={() => onEditTask(task)}
                          className="text-[11px] text-slate-400 hover:text-emerald-600 p-0.5 flex-shrink-0"
                        >
                          ویرایش
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
