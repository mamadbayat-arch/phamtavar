import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
} from 'lucide-react';
import { Task } from '../types';
import {
  getTodayKey,
  moveDay,
  toJalali,
  formatJalaliLong,
  getDayOfWeekName,
  getShortDayName,
  toPersianDigits,
} from '../utils/jalali';

interface PlannerViewProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onOpenNewTaskModal: (defaultDate?: string) => void;
  onEditTask: (task: Task) => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  tasks,
  onToggleTask,
  onOpenNewTaskModal,
  onEditTask,
}) => {
  const today = getTodayKey();
  const [selectedDay, setSelectedDay] = useState<string>(today);
  const [windowOffset, setWindowOffset] = useState<number>(0);

  // Generate 30 days starting from windowOffset
  const days = Array.from({ length: 30 }, (_, i) => moveDay(today, windowOffset + i));

  const dayTasks = tasks.filter(t => t.date === selectedDay);
  const dayDoneCount = dayTasks.filter(t => t.done).length;
  const dayPercent = dayTasks.length > 0 ? Math.round((dayDoneCount / dayTasks.length) * 100) : 0;

  const handlePrevWindow = () => setWindowOffset(prev => prev - 15);
  const handleNextWindow = () => setWindowOffset(prev => prev + 15);
  const handleGoToday = () => {
    setWindowOffset(0);
    setSelectedDay(today);
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>پلنر ۳۰ روزه</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            برنامه‌ریزی و زمان‌بندی روزانه
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleGoToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
          >
            امروز
          </button>
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={handlePrevWindow}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              title="دوره قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextWindow}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              title="دوره بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Date Slider */}
      <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {days.map(dStr => {
            const isSelected = dStr === selectedDay;
            const isToday = dStr === today;
            const dayTasksCount = tasks.filter(t => t.date === dStr).length;
            const jalaliParts = toJalali(dStr).split('/');
            const jDay = jalaliParts[2] || '';
            const jMonth = jalaliParts[1] || '';

            return (
              <button
                key={dStr}
                onClick={() => setSelectedDay(dStr)}
                className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[56px] py-2 px-1.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105'
                    : isToday
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    : 'bg-slate-50 dark:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <span className={`text-[10px] font-medium ${isSelected ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-400'}`}>
                  {getShortDayName(dStr)}
                </span>
                <span className="text-base font-bold my-0.5">
                  {toPersianDigits(jDay)}
                </span>
                <span className={`text-[9px] ${isSelected ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-400'}`}>
                  {toPersianDigits(jMonth)}/
                </span>

                {/* Task dot indicator */}
                {dayTasksCount > 0 && (
                  <div
                    className={`mt-1 w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-emerald-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day View */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {formatJalaliLong(selectedDay)}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {dayTasks.length > 0 ? (
                <>
                  {toPersianDigits(dayDoneCount)} از {toPersianDigits(dayTasks.length)} کار انجام شده ({toPersianDigits(dayPercent)}٪)
                </>
              ) : (
                'هیچ کاری برای این روز ثبت نشده است.'
              )}
            </p>
          </div>

          <button
            onClick={() => onOpenNewTaskModal(selectedDay)}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ثبت کار برای این روز</span>
          </button>
        </div>

        {/* Task items for selected day */}
        <div className="space-y-2 pt-1">
          {dayTasks.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              برای روز {toJalali(selectedDay)} برنامه‌ای ثبت نکرده‌اید.
            </div>
          ) : (
            dayTasks.map(task => (
              <div
                key={task.id}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                  task.done
                    ? 'bg-slate-50 dark:bg-slate-850/40 border-slate-200 dark:border-slate-800 opacity-75'
                    : 'bg-white dark:bg-slate-750 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="text-emerald-600 dark:text-emerald-400 hover:scale-110 active:scale-95 transition-transform flex-shrink-0"
                  >
                    {task.done ? (
                      <CheckCircle2 className="w-5 h-5 fill-emerald-100 dark:fill-emerald-950" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium break-words ${
                        task.done
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.time && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        <span>ساعت {toPersianDigits(task.time)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onEditTask(task)}
                  className="text-xs text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1"
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
};
