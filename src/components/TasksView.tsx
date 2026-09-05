import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { parseNaturalLanguageTask } from '../utils/nlp';
import { Priority, ReminderType, RecurringRule, Category } from '../types';
import { sound } from '../utils/audio';
import {
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Flag,
  Flame,
  Volume2,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  Filter,
  Layers,
  Palette,
  Bell,
  Sparkles,
  Repeat,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Users,
  Heart,
  Package,
  Bookmark,
  Briefcase,
  Star,
  Folder,
  Eye,
  EyeOff,
  X,
  Check,
} from 'lucide-react';

export type DeadlineFilterType =
  | 'all'
  | 'today'
  | 'tomorrow'
  | 'this_week'
  | 'next_week'
  | 'this_month'
  | 'overdue'
  | 'no_deadline';

const renderCategoryIcon = (iconName?: string, className: string = 'w-4 h-4') => {
  switch (iconName) {
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'ClipboardList':
      return <ClipboardList className={className} />;
    case 'Users':
      return <Users className={className} />;
    case 'Heart':
      return <Heart className={className} />;
    case 'Package':
      return <Package className={className} />;
    case 'Bookmark':
      return <Bookmark className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'Star':
      return <Star className={className} />;
    case 'Folder':
      return <Folder className={className} />;
    default:
      return <Layers className={className} />;
  }
};

const CATEGORY_ICON_OPTIONS = [
  { id: 'GraduationCap', label: 'Teaching' },
  { id: 'BookOpen', label: 'Curriculum' },
  { id: 'ClipboardList', label: 'Admin' },
  { id: 'Users', label: 'Parents / Team' },
  { id: 'Heart', label: 'Self-Care' },
  { id: 'Package', label: 'Supplies' },
  { id: 'Bookmark', label: 'Bookmark' },
  { id: 'Briefcase', label: 'Professional' },
  { id: 'Sparkles', label: 'Special' },
  { id: 'Star', label: 'Important' },
  { id: 'Folder', label: 'General' },
  { id: 'Layers', label: 'Other' },
];

export const TasksView: React.FC = () => {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    toggleSubTask,
    addSubTask,
    deleteSubTask,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    setActiveView,
    setActiveFocusTaskId,
  } = useApp();

  // Input states
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || 'cat-teaching');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [customDueDate, setCustomDueDate] = useState('');
  const [customDueTime, setCustomDueTime] = useState('');
  const [customPriority, setCustomPriority] = useState<Priority>('medium');
  const [customReminderType, setCustomReminderType] = useState<ReminderType>('alert');
  const [customLocation, setCustomLocation] = useState('');
  const [customRecurring, setCustomRecurring] = useState<RecurringRule>('none');
  const [customPomodoroGoal, setCustomPomodoroGoal] = useState<number>(2);

  // Filter & Search
  const [showCategoryBar, setShowCategoryBar] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('pending');
  const [filterDeadline, setFilterDeadline] = useState<DeadlineFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  // Date range computations for deadline filtering
  const dateRanges = useMemo(() => {
    const getLocalDateString = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const now = new Date();
    const todayStr = getLocalDateString(now);

    const tom = new Date(now);
    tom.setDate(tom.getDate() + 1);
    const tomorrowStr = getLocalDateString(tom);

    // Current week (Monday to Sunday)
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
    const distToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const thisWeekStart = getLocalDateString(monday);
    const thisWeekEnd = getLocalDateString(sunday);

    // Next week (Next Monday to Next Sunday)
    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);

    const nextWeekStart = getLocalDateString(nextMonday);
    const nextWeekEnd = getLocalDateString(nextSunday);

    // This Month
    const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthEndStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

    return {
      todayStr,
      tomorrowStr,
      thisWeekStart,
      thisWeekEnd,
      nextWeekStart,
      nextWeekEnd,
      monthStartStr,
      monthEndStr,
    };
  }, []);

  const checkDeadlineMatch = (t: (typeof tasks)[0], filter: DeadlineFilterType): boolean => {
    if (filter === 'all') return true;

    if (filter === 'no_deadline') {
      return !t.dueDate || t.dueDate.trim() === '';
    }

    if (!t.dueDate) return false;
    const due = t.dueDate;

    if (filter === 'overdue') {
      return due < dateRanges.todayStr && !t.completed;
    }
    if (filter === 'today') {
      return due === dateRanges.todayStr;
    }
    if (filter === 'tomorrow') {
      return due === dateRanges.tomorrowStr;
    }
    if (filter === 'this_week') {
      return due >= dateRanges.thisWeekStart && due <= dateRanges.thisWeekEnd;
    }
    if (filter === 'next_week') {
      return due >= dateRanges.nextWeekStart && due <= dateRanges.nextWeekEnd;
    }
    if (filter === 'this_month') {
      return due >= dateRanges.monthStartStr && due <= dateRanges.monthEndStr;
    }

    return true;
  };

  const deadlineCounts = useMemo(() => {
    const base = tasks.filter((t) => {
      if (filterStatus === 'pending' && t.completed) return false;
      if (filterStatus === 'completed' && !t.completed) return false;
      if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      return true;
    });

    return {
      all: base.length,
      today: base.filter((t) => checkDeadlineMatch(t, 'today')).length,
      tomorrow: base.filter((t) => checkDeadlineMatch(t, 'tomorrow')).length,
      this_week: base.filter((t) => checkDeadlineMatch(t, 'this_week')).length,
      next_week: base.filter((t) => checkDeadlineMatch(t, 'next_week')).length,
      this_month: base.filter((t) => checkDeadlineMatch(t, 'this_month')).length,
      overdue: base.filter((t) => checkDeadlineMatch(t, 'overdue')).length,
      no_deadline: base.filter((t) => checkDeadlineMatch(t, 'no_deadline')).length,
    };
  }, [tasks, filterStatus, filterCategory, filterPriority, dateRanges]);

  // Subtask input per task
  const [subTaskInputs, setSubTaskInputs] = useState<Record<string, string>>({});

  // Constant reminder modal / active alarm state
  const [activeConstantReminder, setActiveConstantReminder] = useState<string | null>(null);

  // Category Manager Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366F1');
  const [newCatIcon, setNewCatIcon] = useState('Bookmark');

  // Real-time NLP parsed hints
  const nlpPreview = useMemo(() => {
    if (!inputText.trim()) return null;
    return parseNaturalLanguageTask(inputText);
  }, [inputText]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const parsed = parseNaturalLanguageTask(inputText);

    addTask({
      title: parsed.title,
      completed: false,
      priority: parsed.priority || customPriority,
      categoryId: selectedCategory,
      dueDate: parsed.dueDate || customDueDate || undefined,
      dueTime: parsed.dueTime || customDueTime || undefined,
      durationMinutes: 30,
      subtasks: [],
      reminderType: customReminderType,
      locationName: parsed.locationName || customLocation || undefined,
      recurring: customRecurring,
      pomodoroGoal: customPomodoroGoal,
      tags: parsed.tags.length > 0 ? parsed.tags : ['Tasks'],
    });

    setInputText('');
    setCustomDueDate('');
    setCustomDueTime('');
    setCustomLocation('');
    setIsAdvancedOpen(false);
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleAddSubtask = (taskId: string) => {
    const text = subTaskInputs[taskId];
    if (text && text.trim()) {
      addSubTask(taskId, text.trim());
      setSubTaskInputs((prev) => ({ ...prev, [taskId]: '' }));
    }
  };

  const startFocusOnTask = (taskId: string) => {
    setActiveFocusTaskId(taskId);
    setActiveView('focus');
  };

  const triggerConstantReminderSimulation = (taskTitle: string) => {
    setActiveConstantReminder(taskTitle);
    sound.playChime('bell');
    const interval = setInterval(() => {
      sound.playChime('bell');
    }, 2000);

    // Save interval in window for clearing
    (window as unknown as { _constantReminderInterval?: number })._constantReminderInterval = interval as unknown as number;
  };

  const stopConstantReminder = () => {
    setActiveConstantReminder(null);
    const interval = (window as unknown as { _constantReminderInterval?: number })._constantReminderInterval;
    if (interval) {
      clearInterval(interval);
    }
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName.trim(),
      color: newCatColor,
      icon: newCatIcon,
    });
    setNewCatName('');
    setIsCategoryModalOpen(false);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'pending' && t.completed) return false;
    if (filterStatus === 'completed' && !t.completed) return false;
    if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (!checkDeadlineMatch(t, filterDeadline)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchTag = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
      const matchSub = (t.subtasks || []).some((st) => st.title.toLowerCase().includes(q));
      if (!matchTitle && !matchTag && !matchSub) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 h-screen overflow-y-auto p-6 sm:p-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Tasks & Action List</h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="manage-categories-btn"
              onClick={() => setIsCategoryModalOpen(true)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/60 backdrop-blur-md border border-white/60 text-slate-700 text-sm font-semibold hover:bg-white/80 shadow-xs cursor-pointer"
            >
              <Palette className="w-4 h-4 text-indigo-600" />
              <span>Categories</span>
            </button>
          </div>
        </div>

        {/* Top Category List (Toggleable) */}
        <div className="bg-white/45 backdrop-blur-xl rounded-2xl border border-white/60 p-3.5 sm:p-4 shadow-xl shadow-slate-200/40 transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100/60 text-indigo-600 flex items-center justify-center shadow-xs">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Categories ({categories.length})
                  </h3>
                  {filterCategory !== 'all' && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center space-x-1">
                      <span>Filtered: {categories.find((c) => c.id === filterCategory)?.name || filterCategory}</span>
                      <button
                        onClick={() => setFilterCategory('all')}
                        className="hover:text-indigo-900 cursor-pointer ml-1 font-bold"
                        title="Clear category filter"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 px-2.5 py-1.5 rounded-xl bg-white/60 hover:bg-white/90 border border-white/60 shadow-xs cursor-pointer transition-all flex items-center space-x-1"
                title="Manage categories"
              >
                <Palette className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Manage</span>
              </button>

              <button
                id="toggle-category-bar-btn"
                onClick={() => setShowCategoryBar(!showCategoryBar)}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white/95 border border-white/60 shadow-xs cursor-pointer transition-all flex items-center space-x-1.5"
                title={showCategoryBar ? 'Collapse category list' : 'Expand category list'}
              >
                {showCategoryBar ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hide</span>
                    <ChevronDown className="w-3.5 h-3.5 rotate-180 transition-transform" />
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Show Categories ({categories.length})</span>
                    <ChevronDown className="w-3.5 h-3.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Category Cards Container */}
          {showCategoryBar && (
            <div className="mt-3 pt-3 border-t border-white/40 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {/* All Categories Option */}
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center space-x-2 border cursor-pointer ${
                  filterCategory === 'all'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-md shadow-slate-900/20'
                    : 'bg-white/60 backdrop-blur-xs text-slate-700 border-white/60 hover:bg-white/90 shadow-xs'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                    filterCategory === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                </div>
                <span>All Categories</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                    filterCategory === 'all' ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tasks.length}
                </span>
              </button>

              {/* Individual Category Cards */}
              {categories.map((c) => {
                const isSelected = filterCategory === c.id;
                const totalCount = tasks.filter((t) => t.categoryId === c.id).length;
                const pendingCount = tasks.filter((t) => t.categoryId === c.id && !t.completed).length;

                return (
                  <button
                    key={c.id}
                    onClick={() => setFilterCategory(isSelected ? 'all' : c.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center space-x-2.5 border cursor-pointer ${
                      isSelected
                        ? 'text-white shadow-md'
                        : 'bg-white/60 backdrop-blur-xs text-slate-700 border-white/60 hover:bg-white/90 shadow-xs'
                    }`}
                    style={{
                      backgroundColor: isSelected ? c.color : undefined,
                      borderColor: isSelected ? c.color : undefined,
                      boxShadow: isSelected ? `0 4px 14px ${c.color}40` : undefined,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-lg flex items-center justify-center shadow-xs"
                      style={{
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : `${c.color}20`,
                        color: isSelected ? '#FFFFFF' : c.color,
                      }}
                    >
                      {renderCategoryIcon(c.icon, 'w-3 h-3')}
                    </div>
                    <span className="whitespace-nowrap">{c.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {pendingCount > 0 ? `${pendingCount} open` : totalCount}
                    </span>
                  </button>
                );
              })}

              {/* Add New Category Button */}
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-indigo-600 bg-white/40 hover:bg-white/80 border border-dashed border-slate-300 hover:border-indigo-400 shrink-0 flex items-center space-x-1.5 cursor-pointer transition-all"
                title="Add a new category"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>
          )}
        </div>

        {/* NLP Smart Task Creation Box */}
        <div className="bg-white/45 backdrop-blur-xl rounded-2xl border border-white/60 p-4 sm:p-5 shadow-xl shadow-slate-200/40 transition-all hover:border-white/80">
          <form onSubmit={handleCreateTask} className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50/80 border border-indigo-100/50 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <input
                id="task-natural-language-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Add a new task..."
                className="w-full text-sm sm:text-base font-medium text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
              />
              <button
                type="submit"
                id="add-task-btn"
                className="px-4 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white font-semibold text-sm rounded-xl transition-colors shrink-0 cursor-pointer shadow-md shadow-indigo-200/50 backdrop-blur-xs flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Task</span>
              </button>
            </div>

            {/* Live NLP Extraction Pills */}
            {nlpPreview && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/40 text-xs text-slate-600">
                <span className="text-[11px] font-semibold text-slate-400">Detected:</span>
                {nlpPreview.dueDate && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-blue-50/80 border border-blue-200/60 text-blue-700 font-medium">
                    <Calendar className="w-3 h-3" />
                    <span>{nlpPreview.dueDate}</span>
                  </span>
                )}
                {nlpPreview.dueTime && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-purple-50/80 border border-purple-200/60 text-purple-700 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>{nlpPreview.dueTime}</span>
                  </span>
                )}
                {nlpPreview.priority && (
                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md font-semibold border ${
                      nlpPreview.priority === 'high'
                        ? 'bg-rose-50/80 border-rose-200/60 text-rose-700'
                        : nlpPreview.priority === 'medium'
                        ? 'bg-amber-50/80 border-amber-200/60 text-amber-700'
                        : 'bg-emerald-50/80 border-emerald-200/60 text-emerald-700'
                    }`}
                  >
                    <Flag className="w-3 h-3" />
                    <span className="capitalize">{nlpPreview.priority} Priority</span>
                  </span>
                )}
                {nlpPreview.locationName && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-50/80 border border-amber-200/60 text-amber-800 font-medium">
                    <MapPin className="w-3 h-3" />
                    <span>{nlpPreview.locationName}</span>
                  </span>
                )}
                {nlpPreview.tags.map((t) => (
                  <span key={t} className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-md bg-white/70 border border-white/60 text-slate-700 font-medium">
                    <Tag className="w-2.5 h-2.5" />
                    <span>#{t}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Advanced Options Toggle */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
              >
                <span>{isAdvancedOpen ? 'Hide' : 'More'} Details & Reminder Options</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-slate-500">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs font-semibold text-slate-700 bg-white/60 backdrop-blur-md border border-white/60 rounded-xl px-2.5 py-1 focus:outline-none cursor-pointer shadow-xs"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expandable Advanced Controls */}
            {isAdvancedOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/40 text-xs">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Due Date & Time</label>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={customDueDate}
                      onChange={(e) => setCustomDueDate(e.target.value)}
                      className="w-full bg-white/60 backdrop-blur-md border border-white/60 rounded-xl px-2.5 py-1.5 text-slate-700 focus:bg-white/90 shadow-xs"
                    />
                    <input
                      type="time"
                      value={customDueTime}
                      onChange={(e) => setCustomDueTime(e.target.value)}
                      className="w-28 bg-white/60 backdrop-blur-md border border-white/60 rounded-xl px-2.5 py-1.5 text-slate-700 focus:bg-white/90 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Reminder Style</label>
                  <select
                    value={customReminderType}
                    onChange={(e) => setCustomReminderType(e.target.value as ReminderType)}
                    className="w-full bg-white/60 backdrop-blur-md border border-white/60 rounded-xl px-2.5 py-1.5 text-slate-700 focus:bg-white/90 shadow-xs"
                  >
                    <option value="alert">Standard Alert</option>
                    <option value="location">Location-based Reminder</option>
                    <option value="constant">Constant Reminder (Rings until done)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Recurring Rule</label>
                  <select
                    value={customRecurring}
                    onChange={(e) => setCustomRecurring(e.target.value as RecurringRule)}
                    className="w-full bg-white/60 backdrop-blur-md border border-white/60 rounded-xl px-2.5 py-1.5 text-slate-700 focus:bg-white/90 shadow-xs"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekdays">Every Weekday (Mon-Fri)</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Location Tag</label>
                  <input
                    type="text"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder="e.g. Room 204, Library..."
                    className="w-full bg-white/60 backdrop-blur-md border border-white/60 rounded-xl px-2.5 py-1.5 text-slate-700 focus:bg-white/90 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Pomodoro Target</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={customPomodoroGoal}
                      onChange={(e) => setCustomPomodoroGoal(Number(e.target.value))}
                      className="w-16 bg-white/60 backdrop-blur-md border border-white/60 rounded-xl px-2.5 py-1.5 text-slate-700 focus:bg-white/90 shadow-xs"
                    />
                    <span className="text-slate-400">intervals (25m each)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Priority</label>
                  <div className="flex space-x-2">
                    {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCustomPriority(p)}
                        className={`flex-1 py-1.5 rounded-xl font-semibold capitalize border cursor-pointer transition-all shadow-xs ${
                          customPriority === p
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white/60 backdrop-blur-md text-slate-600 border-white/60 hover:bg-white/80'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Deadline Segmented Filter Ribbon */}
        <div className="bg-white/45 backdrop-blur-xl p-3 rounded-2xl border border-white/60 shadow-xl shadow-slate-200/40 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2 text-slate-700 font-bold shrink-0">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="uppercase tracking-wider text-[11px]">Deadline:</span>
              {filterDeadline !== 'all' && (
                <button
                  onClick={() => setFilterDeadline('all')}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 cursor-pointer transition-colors"
                  title="Clear deadline filter"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1">
              {[
                { id: 'all', label: 'All Deadlines', count: deadlineCounts.all },
                { id: 'today', label: 'Today', count: deadlineCounts.today },
                { id: 'tomorrow', label: 'Tomorrow', count: deadlineCounts.tomorrow },
                { id: 'this_week', label: 'This Week', count: deadlineCounts.this_week },
                { id: 'next_week', label: 'Next Week', count: deadlineCounts.next_week },
                { id: 'this_month', label: 'This Month', count: deadlineCounts.this_month },
                { id: 'overdue', label: 'Overdue', count: deadlineCounts.overdue, isOverdue: true },
                { id: 'no_deadline', label: 'No Deadline', count: deadlineCounts.no_deadline },
              ].map((d) => {
                const isSelected = filterDeadline === d.id;
                const isOverdueAlert = d.isOverdue && d.count > 0;

                return (
                  <button
                    key={d.id}
                    onClick={() =>
                      setFilterDeadline(isSelected && d.id !== 'all' ? 'all' : (d.id as DeadlineFilterType))
                    }
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 shrink-0 border cursor-pointer ${
                      isSelected
                        ? d.isOverdue
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200/50'
                          : 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200/50'
                        : isOverdueAlert
                        ? 'bg-rose-50/90 text-rose-700 border-rose-300/80 hover:bg-rose-100/90 shadow-xs'
                        : 'bg-white/60 backdrop-blur-xs text-slate-600 border-white/60 hover:bg-white/90 hover:text-slate-900 shadow-xs'
                    }`}
                  >
                    <span>{d.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : isOverdueAlert
                          ? 'bg-rose-200 text-rose-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {d.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/45 backdrop-blur-xl p-3 rounded-2xl border border-white/60 shadow-xl shadow-slate-200/40 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 bg-white/50 backdrop-blur-md p-1 rounded-xl border border-white/60">
            {(['pending', 'completed', 'all'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-white/90 text-slate-800 shadow-xs backdrop-blur-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Category & Priority Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-white/60 backdrop-blur-md border border-white/60 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:bg-white/90 shadow-xs"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-white/60 backdrop-blur-md border border-white/60 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:bg-white/90 shadow-xs"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/60 backdrop-blur-md border border-white/60 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:bg-white/90 w-36 sm:w-48 shadow-xs"
            />
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg shadow-slate-200/30">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-semibold">No tasks found</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const cat = categories.find((c) => c.id === task.categoryId) || categories[0];
              const isExpanded = !!expandedTasks[task.id];
              const subtasks = task.subtasks || [];
              const completedSubCount = subtasks.filter((s) => s.completed).length;

              return (
                <div
                  key={task.id}
                  id={`task-item-${task.id}`}
                  className={`rounded-2xl border transition-all ${
                    task.completed
                      ? 'border-white/40 bg-white/30 backdrop-blur-md opacity-75'
                      : 'bg-white/45 backdrop-blur-xl border-white/60 hover:border-white/90 shadow-lg shadow-slate-200/30'
                  }`}
                >
                  <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3 flex-1">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleTaskComplete(task.id)}
                        className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-indigo-600 fill-indigo-50" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      {/* Main Task Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`text-sm sm:text-base font-semibold ${
                              task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {task.title}
                          </h3>

                          {/* Category Badge with custom hex code color */}
                          {cat && (
                            <span
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-xs"
                              style={{ backgroundColor: cat.color }}
                            >
                              <span>{cat.name}</span>
                            </span>
                          )}

                          {/* Priority Pill */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                              task.priority === 'high'
                                ? 'bg-rose-100 text-rose-700'
                                : task.priority === 'medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {task.priority}
                          </span>

                          {/* Constant Reminder Indicator */}
                          {task.reminderType === 'constant' && (
                            <button
                              onClick={() => triggerConstantReminderSimulation(task.title)}
                              title="Constant Reminder: rings until done. Click to test ring!"
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer"
                            >
                              <Volume2 className="w-3 h-3 text-amber-600 animate-pulse" />
                              <span>Constant Reminder</span>
                            </button>
                          )}

                          {/* Recurring Indicator */}
                          {task.recurring !== 'none' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700">
                              <Repeat className="w-2.5 h-2.5" />
                              <span className="capitalize">{task.recurring}</span>
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                        )}

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                          {task.dueDate ? (
                            <span className="inline-flex items-center space-x-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {task.dueDate} {task.dueTime ? `at ${task.dueTime}` : ''}
                              </span>
                              {/* Deadline badge indicator */}
                              {task.dueDate < dateRanges.todayStr && !task.completed ? (
                                <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  <span>Overdue</span>
                                </span>
                              ) : task.dueDate === dateRanges.todayStr ? (
                                <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Today
                                </span>
                              ) : task.dueDate === dateRanges.tomorrowStr ? (
                                <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                                  Tomorrow
                                </span>
                              ) : null}
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-slate-400">
                              <Calendar className="w-3 h-3 opacity-60" />
                              <span className="text-[11px]">No Deadline</span>
                            </span>
                          )}

                          {task.locationName && (
                            <span className="inline-flex items-center space-x-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{task.locationName}</span>
                            </span>
                          )}

                          {/* Pomodoro Progress Button */}
                          <button
                            onClick={() => startFocusOnTask(task.id)}
                            title="Start Pomodoro Focus on this task"
                            className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                          >
                            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>
                              {task.pomodoroCompleted}/{task.pomodoroGoal} Focus
                            </span>
                          </button>

                          {/* Subtasks Count toggle */}
                          {subtasks.length > 0 && (
                            <button
                              onClick={() => toggleExpand(task.id)}
                              className="inline-flex items-center space-x-1 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                            >
                              <span>
                                {completedSubCount}/{subtasks.length} subtasks
                              </span>
                              <ChevronDown
                                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 cursor-pointer"
                        title="Subtasks & details"
                      >
                        <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Subtasks Section & Inline Subtask Add */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                        <span>Subtask Checklist</span>
                        <span>
                          {completedSubCount} of {subtasks.length} completed
                        </span>
                      </div>

                      {/* Progress Bar */}
                      {subtasks.length > 0 && (
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${(completedSubCount / subtasks.length) * 100}%`,
                            }}
                          />
                        </div>
                      )}

                      {/* Subtasks List */}
                      <div className="space-y-1.5">
                        {subtasks.map((st) => (
                          <div
                            key={st.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white/60 backdrop-blur-sm border border-white/60 text-xs shadow-xs"
                          >
                            <label className="flex items-center space-x-2.5 flex-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={st.completed}
                                onChange={() => toggleSubTask(task.id, st.id)}
                                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                              />
                              <span
                                className={`font-medium ${
                                  st.completed ? 'line-through text-slate-400' : 'text-slate-700'
                                }`}
                              >
                                {st.title}
                              </span>
                            </label>
                            <button
                              onClick={() => deleteSubTask(task.id, st.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Subtask input */}
                      <div className="flex items-center space-x-2 pt-1">
                        <input
                          type="text"
                          placeholder="Add subtask item..."
                          value={subTaskInputs[task.id] || ''}
                          onChange={(e) =>
                            setSubTaskInputs((prev) => ({ ...prev, [task.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSubtask(task.id);
                            }
                          }}
                          className="flex-1 bg-white/70 backdrop-blur-md border border-white/60 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:bg-white/90 shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSubtask(task.id)}
                          className="px-3 py-1.5 bg-indigo-600/90 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-md shadow-indigo-200/50"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Constant Reminder Ringing Modal */}
      {activeConstantReminder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 max-w-md w-full text-center border-4 border-amber-400/80 shadow-2xl animate-bounce">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-4 shadow-sm">
              <Bell className="w-8 h-8 animate-wiggle" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Constant Reminder Ringing!</h3>
            <p className="text-sm font-semibold text-slate-600 mt-2">
              "{activeConstantReminder}"
            </p>
            <p className="text-xs text-slate-400 mt-1">
              This reminder repeats until you acknowledge or complete it!
            </p>
            <button
              onClick={stopConstantReminder}
              className="mt-6 w-full py-3 bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold rounded-2xl transition-colors cursor-pointer shadow-lg shadow-indigo-200"
            >
              I Got It / Stop Ringing
            </button>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white/85 backdrop-blur-2xl rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-white/60 space-y-5">
            <div className="flex items-center justify-between border-b border-white/40 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Customize Categories</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            {/* List of existing categories */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-white/60 bg-white/60 backdrop-blur-xs shadow-xs"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0 mr-2">
                    <input
                      type="color"
                      value={c.color}
                      onChange={(e) => updateCategory(c.id, { color: e.target.value })}
                      className="w-7 h-7 rounded-lg border-0 cursor-pointer overflow-hidden shadow-xs shrink-0"
                      title="Change category color using hex code"
                    />
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
                      style={{ backgroundColor: `${c.color}20`, color: c.color }}
                    >
                      {renderCategoryIcon(c.icon, 'w-4 h-4')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{c.name}</p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono uppercase">
                        <span>{c.color}</span>
                        <span>•</span>
                        <select
                          value={c.icon || 'Layers'}
                          onChange={(e) => updateCategory(c.id, { icon: e.target.value })}
                          className="text-[10px] font-sans bg-transparent border-0 text-slate-600 focus:outline-none cursor-pointer"
                          title="Change icon"
                        >
                          {CATEGORY_ICON_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label} ({opt.id})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCategory(c.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                    title="Delete category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Category Form */}
            <div className="pt-3 border-t border-white/40 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Add New Category</h4>
              
              {/* Icon selector pills */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Choose Icon:</label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {CATEGORY_ICON_OPTIONS.map((opt) => {
                    const isIconSelected = newCatIcon === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setNewCatIcon(opt.id)}
                        className={`p-2 rounded-xl flex items-center space-x-1.5 shrink-0 border cursor-pointer transition-all ${
                          isIconSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white/60 text-slate-600 border-white/60 hover:bg-white/90'
                        }`}
                        title={opt.label}
                      >
                        {renderCategoryIcon(opt.id, 'w-3.5 h-3.5')}
                        <span className="text-[10px] font-medium hidden sm:inline">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-10 h-10 rounded-xl border-0 cursor-pointer overflow-hidden shrink-0 shadow-xs"
                  title="Pick hex color code"
                />
                <input
                  type="text"
                  placeholder="Category Name (e.g. Science Fair, Department)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 bg-white/70 backdrop-blur-md border border-white/60 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white/90 shadow-xs"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-md shadow-indigo-200/50 shrink-0"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
