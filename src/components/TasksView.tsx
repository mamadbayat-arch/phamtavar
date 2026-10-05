import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Search,
  Check,
  Grid2X2,
  List,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Task, Goal, Quadrant } from '../types';
import {
  formatJalaliShort,
  formatJalaliLong,
  getTodayKey,
  moveDay,
  toJalali,
  getShortDayName,
  toPersianDigits,
} from '../utils/jalali';

interface TasksViewProps {
  tasks: Task[];
  goals: Goal[];
  onToggleTask: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subIndex: number) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenNewTaskModal: (defaultDateOrQuad?: any) => void;
}

type StatusFilter = 'all' | 'today' | 'pending' | 'done';
type QuadFilter = 'all' | 'q1' | 'q2' | 'q3' | 'q4';

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  goals,
  onToggleTask,
  onToggleSubtask,
  onEditTask,
  onDeleteTask,
  onOpenNewTaskModal,
}) => {
  const todayStr = getTodayKey();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [quadFilter, setQuadFilter] = useState<QuadFilter>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'quadrants' | 'list'>('quadrants');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  // 30-Day Planner section states
  const [selectedPlannerDay, setSelectedPlannerDay] = useState<string>(todayStr);
  const [plannerWindowOffset, setPlannerWindowOffset] = useState<number>(0);

  // Generate 30 days for planner slider
  const plannerDays = Array.from({ length: 30 }, (_, i) =>
    moveDay(todayStr, plannerWindowOffset + i)
  );

  const plannerDayTasks = tasks.filter(t => t.date === selectedPlannerDay);
  const plannerDayDone = plannerDayTasks.filter(t => t.done).length;

  const toggleExpand = (id: string) => {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Search match
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchSubs = task.subs?.some(s => s.title.toLowerCase().includes(q));
      if (!matchTitle && !matchSubs) return false;
    }

    // Status filter match
    if (statusFilter === 'today') {
      if (task.date !== todayStr) return false;
    } else if (statusFilter === 'pending') {
      if (task.done) return false;
    } else if (statusFilter === 'done') {
      if (!task.done) return false;
    }

    // Quad filter match
    if (quadFilter !== 'all') {
      if (task.quad !== quadFilter) return false;
    }

    return true;
  });

  const totalCount = tasks.length;
  const doneCount = tasks.filter(t => t.done).length;
  const percentDone = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const getGoalTitle = (goalId?: string) => {
    if (!goalId) return null;
    return goals.find(g => g.id === goalId)?.title || null;
  };

  // Eisenhower Quadrants Definition
  const quadrantSections: {
    id: Quadrant;
    name: string;
    description: string;
    accentColor: string;
    borderClass: string;
    bgClass: string;
    badgeClass: string;
    btnClass: string;
  }[] = [
    {
      id: 'q1',
      name: 'فوری و مهم (Q1)',
      description: 'بحران‌ها و امور اضطراری — اول انجام بده',
      accentColor: 'text-rose-600 dark:text-rose-400',
      borderClass: 'border-rose-200 dark:border-rose-900/60',
      bgClass: 'bg-rose-50/40 dark:bg-rose-950/20',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
      btnClass: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
    {
      id: 'q2',
      name: 'مهم و غیرفوری (Q2)',
      description: 'اهداف، رشد و برنامه‌ریزی — زمان‌بندی کن',
      accentColor: 'text-emerald-600 dark:text-emerald-400',
      borderClass: 'border-emerald-200 dark:border-emerald-900/60',
      bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
      btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      id: 'q3',
      name: 'فوری و غیرمهم (Q3)',
      description: 'وقفه‌ها و درخواست‌های روزمره — واگذار کن',
      accentColor: 'text-amber-600 dark:text-amber-400',
      borderClass: 'border-amber-200 dark:border-amber-900/60',
      bgClass: 'bg-amber-50/40 dark:bg-amber-950/20',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
      btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    {
      id: 'q4',
      name: 'غیرمهم و غیرفوری (Q4)',
      description: 'کارهای جانبی و کم‌ارزش — حذف کن',
      accentColor: 'text-slate-600 dark:text-slate-400',
      borderClass: 'border-slate-200 dark:border-slate-700',
      bgClass: 'bg-slate-50/60 dark:bg-slate-800/40',
      badgeClass: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
      btnClass: 'bg-slate-600 hover:bg-slate-700 text-white',
    },
  ];

  const unassignedTasks = filteredTasks.filter(t => !t.quad);

  // Render Task Card
  const renderTaskCard = (task: Task) => {
    const goalTitle = getGoalTitle(task.goalId);
    const isExpanded = Boolean(expandedTasks[task.id]);
    const subCount = task.subs?.length || 0;
    const subDoneCount = task.subs?.filter(s => s.done).length || 0;

    return (
      <div
        key={task.id}
        className={`bg-white dark:bg-slate-800 rounded-xl p-3 border transition-all shadow-xs ${
          task.done
            ? 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850/40 opacity-70'
            : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500/40 dark:hover:border-emerald-500/40'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={() => onToggleTask(task.id)}
            className="mt-0.5 text-emerald-600 dark:text-emerald-400 hover:scale-110 active:scale-95 transition-transform flex-shrink-0"
            aria-label={task.done ? 'علامت به عنوان انجام نشده' : 'علامت به عنوان انجام شده'}
          >
            {task.done ? (
              <CheckCircle2 className="w-5 h-5 fill-emerald-100 dark:fill-emerald-950" />
            ) : (
              <Circle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <span
                className={`text-sm font-medium leading-snug break-words ${
                  task.done
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-800 dark:text-slate-100'
                }`}
              >
                {task.title}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onEditTask(task)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="ویرایش"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
              {task.date && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                  {formatJalaliShort(task.date)}
                </span>
              )}

              {task.time && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                  <Clock className="w-3 h-3 text-emerald-500" />
                  <span>{toPersianDigits(task.time)}</span>
                </span>
              )}

              {goalTitle && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <Target className="w-3 h-3 text-blue-500" />
                  <span className="truncate max-w-[130px]">{goalTitle}</span>
                </span>
              )}

              {subCount > 0 && (
                <button
                  onClick={() => toggleExpand(task.id)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors font-medium mr-auto"
                >
                  <span>
                    {toPersianDigits(subDoneCount)} از {toPersianDigits(subCount)} زیرکار
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>

            {/* Subtasks Accordion */}
            {isExpanded && task.subs && task.subs.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1 pl-1 pr-1">
                {task.subs.map((sub, sIdx) => (
                  <div
                    key={sIdx}
                    onClick={() => onToggleSubtask(task.id, sIdx)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer text-xs transition-colors"
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                        sub.done
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {sub.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span
                      className={`flex-1 break-words ${
                        sub.done
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {sub.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & PROGRESS */}
      <div className="bg-gradient-to-l from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/30 p-4 rounded-2xl border border-emerald-500/20 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              مدیریت کارها و وظایف
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              دسته‌بندی در ماتریس آیزنهاور · {toPersianDigits(doneCount)} از {toPersianDigits(totalCount)} کار انجام شده ({toPersianDigits(percentDone)}٪)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-200/90 dark:bg-slate-800 p-0.5 rounded-xl text-slate-600 dark:text-slate-300">
              <button
                onClick={() => setViewMode('quadrants')}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  viewMode === 'quadrants'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
                title="نمای دسته‌بندی ماتریس آیزنهاور"
                aria-label="نمای دسته‌بندی ماتریس"
              >
                <Grid2X2 className="w-4 h-4 flex-shrink-0" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
                title="نمای فهرست یکپارچه"
                aria-label="نمای فهرست یکپارچه"
              >
                <List className="w-4 h-4 flex-shrink-0" />
              </button>
            </div>

            {/* Quick Add Button */}
            <button
              onClick={() => onOpenNewTaskModal()}
              className="flex items-center justify-center gap-1.5 h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition-all leading-none"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="leading-none">کار جدید</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentDone}%` }}
          />
        </div>
      </div>

      {/* 2. SEARCH & FILTERS */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="جستجوی کار، زیرکار..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:text-slate-100 placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              پاک‌کردن
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
          <div className="flex gap-1.5 flex-nowrap">
            {[
              { id: 'all' as StatusFilter, label: 'همه کارها' },
              { id: 'today' as StatusFilter, label: 'امروز' },
              { id: 'pending' as StatusFilter, label: 'در انتظار' },
              { id: 'done' as StatusFilter, label: 'انجام‌شده' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                  statusFilter === f.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Quick Quadrants filter */}
          <div className="flex gap-1 flex-nowrap mr-auto">
            {[
              { id: 'all' as QuadFilter, label: 'همه دسته‌ها' },
              { id: 'q1' as QuadFilter, label: 'Q1' },
              { id: 'q2' as QuadFilter, label: 'Q2' },
              { id: 'q3' as QuadFilter, label: 'Q3' },
              { id: 'q4' as QuadFilter, label: 'Q4' },
            ].map(q => (
              <button
                key={q.id}
                onClick={() => setQuadFilter(q.id)}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-bold text-[11px] transition-all ${
                  quadFilter === q.id
                    ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. EISENHOWER CATEGORIZED TASKS */}
      {viewMode === 'quadrants' ? (
        <div className="space-y-4">
          {quadrantSections.map(section => {
            if (quadFilter !== 'all' && quadFilter !== section.id) return null;

            const sectionTasks = filteredTasks.filter(t => t.quad === section.id);
            const secDone = sectionTasks.filter(t => t.done).length;

            return (
              <div
                key={section.id}
                className={`p-4 rounded-2xl border shadow-xs transition-all ${section.bgClass} ${section.borderClass}`}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/70 dark:border-slate-700/70">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className={`text-sm font-bold ${section.accentColor}`}>
                        {section.name}
                      </h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${section.badgeClass}`}>
                        {toPersianDigits(secDone)} از {toPersianDigits(sectionTasks.length)} انجام‌شده
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {section.description}
                    </p>
                  </div>

                  <button
                    onClick={() => onOpenNewTaskModal(section.id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-xs ${section.btnClass}`}
                    title={`افزودن کار در ${section.name}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن</span>
                  </button>
                </div>

                {/* Task items in this Quadrant */}
                <div className="space-y-2">
                  {sectionTasks.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400 dark:text-slate-500">
                      کاری در این دسته ثبت نشده است.
                    </div>
                  ) : (
                    sectionTasks.map(task => renderTaskCard(task))
                  )}
                </div>
              </div>
            );
          })}

          {/* Unassigned Tasks */}
          {(quadFilter === 'all' || quadFilter === 'q4') && unassignedTasks.length > 0 && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    سایر کارها (بدون دسته اولویت)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    برای دسته‌بندی بهتر، ویرایش کنید و یک دسته آیزنهاور به آن اختصاص دهید.
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-bold">
                  {toPersianDigits(unassignedTasks.length)} کار
                </span>
              </div>

              <div className="space-y-2">
                {unassignedTasks.map(task => renderTaskCard(task))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Flat List Mode */
        <div className="space-y-2.5">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                کاری مطابق فیلتر فعلی یافت نشد.
              </p>
              <button
                onClick={() => onOpenNewTaskModal()}
                className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                + افزودن کار جدید
              </button>
            </div>
          ) : (
            filteredTasks.map(task => renderTaskCard(task))
          )}
        </div>
      )}

      {/* 4. PLANNER SECTION AT THE BOTTOM OF TASKS (پلنر روزهای مختلف) */}
      <section className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        {/* Section Header */}
        <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>پلنر و تقویم ۳۰ روزه کارها</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              توزیع و زمان‌بندی کارها در روزهای آینده
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setPlannerWindowOffset(0);
                setSelectedPlannerDay(todayStr);
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              امروز
            </button>

            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setPlannerWindowOffset(prev => prev - 15)}
                className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="۱۵ روز قبل"
              >
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              </button>
              <button
                onClick={() => setPlannerWindowOffset(prev => prev + 15)}
                className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border-r border-slate-200 dark:border-slate-700"
                title="۱۵ روز بعد"
              >
                <ChevronLeft className="w-3.5 h-3.5 flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* 30-Day Slider */}
        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {plannerDays.map(dStr => {
              const isSelected = dStr === selectedPlannerDay;
              const isToday = dStr === todayStr;
              const countOnDay = tasks.filter(t => t.date === dStr).length;
              const parts = toJalali(dStr).split('/');
              const jDay = parts[2] || '';
              const jMonth = parts[1] || '';

              return (
                <button
                  key={dStr}
                  onClick={() => setSelectedPlannerDay(dStr)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[56px] py-2 px-1.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105'
                      : isToday
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                      : 'bg-slate-50 dark:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`text-[10px] font-medium ${
                      isSelected ? 'text-emerald-100' : 'text-slate-400'
                    }`}
                  >
                    {getShortDayName(dStr)}
                  </span>
                  <span className="text-base font-bold my-0.5">
                    {toPersianDigits(jDay)}
                  </span>
                  <span
                    className={`text-[9px] ${
                      isSelected ? 'text-emerald-100' : 'text-slate-400'
                    }`}
                  >
                    {toPersianDigits(jMonth)}/
                  </span>

                  {countOnDay > 0 && (
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

        {/* Selected Day's Tasks in Planner */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                برنامه {formatJalaliLong(selectedPlannerDay)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {plannerDayTasks.length > 0 ? (
                  <>
                    {toPersianDigits(plannerDayDone)} از {toPersianDigits(plannerDayTasks.length)} کار انجام شده است
                  </>
                ) : (
                  'کاری برای این تاریخ ثبت نشده است.'
                )}
              </p>
            </div>

            <button
              onClick={() => onOpenNewTaskModal(selectedPlannerDay)}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ثبت کار برای این روز</span>
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {plannerDayTasks.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                برای روز {toJalali(selectedPlannerDay)} کاری در تقویم وجود ندارد. با دکمهٔ بالا می‌توانید کاری ثبت کنید.
              </div>
            ) : (
              plannerDayTasks.map(task => renderTaskCard(task))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
