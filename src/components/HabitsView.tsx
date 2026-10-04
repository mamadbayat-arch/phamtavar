import React, { useState } from 'react';
import {
  Flame,
  Plus,
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
  Sparkles,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  ListTodo,
} from 'lucide-react';
import { Habit } from '../types';
import {
  getTodayKey,
  moveDay,
  toJalali,
  shiftJMonth,
  toPersianDigits,
  formatJalaliLong,
  getJalaliWeekDayIndex,
  getFullWeekDayName,
} from '../utils/jalali';

interface HabitsViewProps {
  habits: Habit[];
  onToggleHabitLog: (habitId: string, dateStr: string) => void;
  onOpenNewHabitModal: () => void;
  onOpenConvertHabitModal: (habitId: string) => void;
  onConvertDayToTask: (habit: Habit, dateStr: string) => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  onToggleHabitLog,
  onOpenNewHabitModal,
  onOpenConvertHabitModal,
  onConvertDayToTask,
  onEditHabit,
  onDeleteHabit,
}) => {
  const today = getTodayKey();
  const currentJMonth = toJalali(today).slice(0, 7); // e.g. "1405/07"

  // In default state, calendar is CLOSED (null)
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);
  const [activeJMonth, setActiveJMonth] = useState<string>(currentJMonth);

  // Selected date inside the open habit calendar
  const [selectedCalDay, setSelectedCalDay] = useState<string | null>(null);

  const calculateStreak = (habit: Habit): number => {
    let streak = 0;
    let checkDate = today;

    if (habit.logs.includes(today)) {
      streak++;
      checkDate = moveDay(today, -1);
    } else {
      checkDate = moveDay(today, -1);
      if (!habit.logs.includes(checkDate)) {
        return 0;
      }
    }

    while (habit.logs.includes(checkDate)) {
      streak++;
      checkDate = moveDay(checkDate, -1);
    }

    return streak;
  };

  const getFrequencyLabel = (days: number[]) => {
    if (days.length === 7) return 'هر روز';
    if (days.length === 6 && !days.includes(5)) return 'شنبه تا پنج‌شنبه';
    if (days.length === 1 && days[0] === 5) return 'فقط جمعه‌ها';
    return `${toPersianDigits(days.length)} روز در هفته`;
  };

  const toggleExpandHabit = (habitId: string) => {
    if (expandedHabitId === habitId) {
      setExpandedHabitId(null);
      setSelectedCalDay(null);
    } else {
      setExpandedHabitId(habitId);
      setActiveJMonth(currentJMonth);
      setSelectedCalDay(today);
    }
  };

  // Find dates in this Jalali month
  const getDatesForJMonth = (jMonth: string) => {
    const dates: string[] = [];
    let cur = moveDay(today, -70);
    for (let i = 0; i < 160; i++) {
      if (toJalali(cur).startsWith(jMonth)) {
        dates.push(cur);
      }
      cur = moveDay(cur, 1);
    }
    return dates;
  };

  const monthDates = getDatesForJMonth(activeJMonth);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span>ردیاب و ساخت عادت‌های پایدار</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            روی هر عادت کلیک کنید تا تقویم آن باز شود و بتوانید روزهای خاص را به کار تبدیل کنید
          </p>
        </div>

        <button
          onClick={onOpenNewHabitModal}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>عادت جدید</span>
        </button>
      </div>

      {/* Habits List */}
      <div className="space-y-3">
        {habits.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
            هنوز عادتی ثبت نشده است. روی «عادت جدید» کلیک کنید.
          </div>
        ) : (
          habits.map(habit => {
            const isDoneToday = habit.logs.includes(today);
            const streak = calculateStreak(habit);
            const isExpanded = expandedHabitId === habit.id;

            return (
              <div
                key={habit.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isExpanded
                    ? 'bg-white dark:bg-slate-800 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {/* Habit Card Header */}
                <div
                  onClick={() => toggleExpandHabit(habit.id)}
                  className="p-4 cursor-pointer flex items-start justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox for today */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onToggleHabitLog(habit.id, today);
                      }}
                      className="mt-0.5 text-emerald-600 dark:text-emerald-400 hover:scale-110 active:scale-95 transition-transform flex-shrink-0"
                      title={isDoneToday ? 'علامت انجام شده امروز' : 'ثبت انجام برای امروز'}
                    >
                      {isDoneToday ? (
                        <CheckCircle2 className="w-6 h-6 fill-emerald-100 dark:fill-emerald-950" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-400" />
                      )}
                    </button>

                    <div>
                      <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {habit.title}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>{getFrequencyLabel(habit.days)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                          <Flame className="w-3.5 h-3.5 fill-amber-500" />
                          <span>{toPersianDigits(streak)} روز متوالی</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Convert All Button - With Clear Persian Text */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onOpenConvertHabitModal(habit.id);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100 transition-colors shadow-2xs"
                      title="تبدیل دوره‌ای عادت به کارهای روزانه"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>تبدیل به کار</span>
                    </button>

                    {/* Compact Calendar toggle button */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleExpandHabit(habit.id);
                      }}
                      className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border transition-all ${
                        isExpanded
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-750 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                      title="تقویم روزهای ماه"
                    >
                      <CalendarIcon className="w-3 h-3" />
                      <span>تقویم</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onEditHabit(habit);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="ویرایش"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteHabit(habit.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ACCORDION: COMPACT CALENDAR HEATMAP */}
                {isExpanded && (
                  <div className="p-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-850/40 space-y-2">
                    {/* Compact Month Navigator */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                          تقویم {toPersianDigits(activeJMonth)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({toPersianDigits(
                            habit.logs.filter(d => toJalali(d).startsWith(activeJMonth)).length
                          )} روز انجام‌شده)
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setActiveJMonth(prev => shiftJMonth(prev, -1))}
                          className="p-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                          title="ماه قبل"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setActiveJMonth(currentJMonth)}
                          className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                        >
                          این ماه
                        </button>
                        <button
                          onClick={() => setActiveJMonth(prev => shiftJMonth(prev, 1))}
                          className="p-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                          title="ماه بعد"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Compact Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center pt-0.5">
                      {['ش', '۱ش', '۲ش', '۳ش', '۴ش', '۵ش', 'ج'].map((w, idx) => {
                        const fullNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
                        return (
                          <span
                            key={idx}
                            className={`text-[10px] font-bold pb-0.5 ${
                              idx === 6 ? 'text-rose-500' : 'text-slate-400'
                            }`}
                            title={fullNames[idx]}
                          >
                            {w}
                          </span>
                        );
                      })}

                      {/* خانههای خالی قبل از روز اول ماه */}
                      {monthDates.length > 0 &&
                        Array.from({ length: getJalaliWeekDayIndex(monthDates[0]) }).map((_, idx) => (
                          <div key={`empty-pad-${idx}`} className="py-1 px-0.5" />
                        ))}

                      {monthDates.map(dStr => {
                        const isLogged = habit.logs.includes(dStr);
                        const isToday = dStr === today;
                        const isSelected = selectedCalDay === dStr;
                        const jDay = toJalali(dStr).split('/')[2];
                        const dayName = getFullWeekDayName(dStr);

                        return (
                          <button
                            key={dStr}
                            onClick={() => setSelectedCalDay(dStr)}
                            className={`py-1 px-0.5 rounded-lg text-[11px] font-bold transition-all border relative ${
                              isSelected
                                ? 'ring-2 ring-emerald-500 scale-105 z-10'
                                : ''
                            } ${
                              isLogged
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : isToday
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                                : 'bg-white dark:bg-slate-750 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                            title={`${dayName} ${toJalali(dStr)}`}
                          >
                            <span>{toPersianDigits(jDay)}</span>
                            {isLogged && (
                              <Check className="w-2 h-2 mx-auto mt-0.5 stroke-[3] text-emerald-100" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Interactive Action Box for Selected Day */}
                    {selectedCalDay && (
                      <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            عملیات برای {getFullWeekDayName(selectedCalDay)} {formatJalaliLong(selectedCalDay)}:
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {habit.logs.includes(selectedCalDay) ? 'وضعیت: انجام‌شده' : 'وضعیت: ثبت‌نشده'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {/* Toggle Completion */}
                          <button
                            onClick={() => onToggleHabitLog(habit.id, selectedCalDay)}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                              habit.logs.includes(selectedCalDay)
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200'
                            }`}
                          >
                            {habit.logs.includes(selectedCalDay) ? (
                              <>
                                <Circle className="w-3.5 h-3.5" />
                                <span>لغو انجام این روز</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>ثبت انجام این روز</span>
                              </>
                            )}
                          </button>

                          {/* Convert this day to a Task in Tasks tab! */}
                          <button
                            onClick={() => onConvertDayToTask(habit, selectedCalDay)}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all"
                            title="این عادت را برای این تاریخ تبدیل به یک تسک در تب کارها کن"
                          >
                            <ListTodo className="w-3.5 h-3.5" />
                            <span>تبدیل به کار در تب کارها</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
