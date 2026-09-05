import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ViewType } from '../types';
import {
  CheckSquare,
  FileText,
  Target,
  Repeat,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  RefreshCw,
  CalendarCheck,
  Zap,
  Gem,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    tasks,
    isGoogleCalendarConnected,
    connectGoogleCalendar,
    syncWithGoogleCalendar,
    autoSyncGoogleCalendar,
    setAutoSyncGoogleCalendar,
    pet,
  } = useApp();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  const navItems: { id: ViewType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number | string }[] = [
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: pendingTasksCount > 0 ? pendingTasksCount : undefined },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'focus', label: "Today's Focus", icon: Target },
    { id: 'routinery', label: 'Routinery', icon: Repeat },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'habits', label: 'Habits', icon: Sparkles, badge: `${pet.energy}%` },
  ];

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      if (!isGoogleCalendarConnected) {
        await connectGoogleCalendar();
        setSyncMessage('Connected & Synced!');
      } else {
        const res = await syncWithGoogleCalendar();
        setSyncMessage(`Synced ${res.added} event(s)!`);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Sync issue';
      setSyncMessage(errMsg);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  return (
    <aside
      id="main-sidebar"
      className="w-68 min-w-68 h-screen bg-white/40 backdrop-blur-2xl border-r border-white/50 flex flex-col justify-between select-none z-30 shrink-0 shadow-lg shadow-indigo-100/20"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-white/40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-200/50 border border-white/30">
            TM
          </div>
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-slate-800 tracking-tight leading-tight truncate">
              TeacherMary
            </h1>
            <p className="text-xs font-medium text-slate-500 truncate">
              Reminders & Tasks
            </p>
          </div>
        </div>

        {/* Google Calendar Sync Card */}
        <div className="mt-4 p-2.5 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isGoogleCalendarConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-xs font-semibold text-slate-700">Google Calendar</span>
            </div>
            <button
              id="sync-google-calendar-btn"
              onClick={handleManualSync}
              disabled={isSyncing}
              title={isGoogleCalendarConnected ? 'Sync with Google Calendar' : 'Connect Google Calendar'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white/80 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{isGoogleCalendarConnected ? 'Auto-sync active' : 'Not linked'}</span>
            {isGoogleCalendarConnected ? (
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncGoogleCalendar}
                  onChange={(e) => setAutoSyncGoogleCalendar(e.target.checked)}
                  className="w-3 h-3 text-indigo-600 rounded"
                />
                <span className="text-[10px] text-slate-600 font-medium">Auto</span>
              </label>
            ) : (
              <button
                onClick={handleManualSync}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
              >
                Connect
              </button>
            )}
          </div>

          {syncMessage && (
            <div className="mt-1.5 text-[10px] text-indigo-700 font-medium bg-white/80 border border-white/60 px-2 py-0.5 rounded-lg flex items-center space-x-1 shadow-xs">
              {syncMessage.includes('Synced') || syncMessage.includes('Connected') ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
              )}
              <span className="truncate">{syncMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-white/80 backdrop-blur-md text-indigo-700 font-bold shadow-sm border border-white/90'
                  : 'text-slate-600 hover:bg-white/45 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4.5 h-4.5 transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 text-xs rounded-full font-semibold border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white/70 text-slate-600 border-white/60'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Pet Widget Card */}
      <div className="p-3 border-t border-white/40">
        <div
          onClick={() => setActiveView('habits')}
          className="p-3 rounded-2xl bg-white/50 backdrop-blur-md border border-white/60 cursor-pointer hover:bg-white/70 hover:shadow-md transition-all shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🐦</span>
              <div>
                <p className="text-xs font-bold text-slate-800">{pet.name}</p>
                <p className="text-[10px] text-slate-500 capitalize">Lvl {pet.level} {pet.stage}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-full border border-amber-200/80 text-amber-700 text-xs font-bold shadow-xs">
              <Gem className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{pet.rainbowStones}</span>
            </div>
          </div>

          {/* Energy Bar */}
          <div className="mt-2.5">
            <div className="flex justify-between text-[10px] font-medium text-slate-500 mb-1">
              <span className="flex items-center space-x-1">
                <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                <span>Energy</span>
              </span>
              <span>{pet.energy}%</span>
            </div>
            <div className="w-full bg-white/60 h-1.5 rounded-full overflow-hidden border border-white/40">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${pet.energy}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
