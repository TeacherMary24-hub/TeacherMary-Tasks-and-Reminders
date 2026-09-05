import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { sound } from '../utils/audio';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Target,
  Sparkles,
  Award,
  AlertOctagon,
  Bell,
  Check,
} from 'lucide-react';

export const TodayFocusView: React.FC = () => {
  const {
    tasks,
    activeFocusTaskId,
    setActiveFocusTaskId,
    recordFocusSession,
    habitGoals,
    toggleHabit,
    pet,
  } = useApp();

  // Pomodoro timer settings (in seconds)
  const FOCUS_TIME = 25 * 60;
  const SHORT_BREAK = 5 * 60;
  const LONG_BREAK = 15 * 60;

  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(2);
  const [strictMode, setStrictMode] = useState(false);
  const [strictAlertTriggered, setStrictAlertTriggered] = useState(false);

  // Ambient sound state
  const [ambientType, setAmbientType] = useState<'none' | 'rain' | 'waves' | 'cafe' | 'forest' | 'whitenoise'>('none');
  const [ambientVolume, setAmbientVolume] = useState(0.5);

  const activeTask = tasks.find((t) => t.id === activeFocusTaskId);

  // Timer interval effect
  useEffect(() => {
    let interval: number;
    if (isRunning) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, mode]);

  // Strict Mode Exit Detection
  useEffect(() => {
    if (!strictMode || !isRunning || mode !== 'focus') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        sound.playChime('buzz');
        setStrictAlertTriggered(true);
      }
    };

    const handleWindowBlur = () => {
      sound.playChime('buzz');
      setStrictAlertTriggered(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [strictMode, isRunning, mode]);

  // Ambient sound updater
  useEffect(() => {
    if (ambientType === 'none' || !isRunning) {
      sound.stopAmbient();
    } else {
      sound.startAmbient(ambientType, ambientVolume);
    }
    return () => {
      sound.stopAmbient();
    };
  }, [ambientType, isRunning, ambientVolume]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    sound.playChime('complete');

    if (mode === 'focus') {
      const completed = sessionsCompleted + 1;
      setSessionsCompleted(completed);
      recordFocusSession(25, activeFocusTaskId || undefined);

      if (completed % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(LONG_BREAK);
      } else {
        setMode('shortBreak');
        setTimeLeft(SHORT_BREAK);
      }
    } else {
      setMode('focus');
      setTimeLeft(FOCUS_TIME);
    }
  };

  const toggleTimer = () => {
    if (!isRunning) {
      sound.playChime('bell');
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? FOCUS_TIME : mode === 'shortBreak' ? SHORT_BREAK : LONG_BREAK);
  };

  const switchMode = (newMode: 'focus' | 'shortBreak' | 'longBreak') => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? FOCUS_TIME : newMode === 'shortBreak' ? SHORT_BREAK : LONG_BREAK);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const totalTime = mode === 'focus' ? FOCUS_TIME : mode === 'shortBreak' ? SHORT_BREAK : LONG_BREAK;
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="flex-1 h-screen overflow-y-auto p-6 sm:p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Today's Focus <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100/80 border border-indigo-200/50 text-indigo-700 backdrop-blur-xs">Pomodoro Hybrid</span>
            </h2>
            <p className="text-sm text-slate-500">
              Science-backed interval training combining task progress, strict mode, and soothing ambient soundscapes.
            </p>
          </div>

          {/* Strict Mode Toggle */}
          <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-xl px-3.5 py-2 rounded-2xl border border-white/60 shadow-lg shadow-slate-200/30">
            <ShieldAlert className={`w-4 h-4 ${strictMode ? 'text-rose-600' : 'text-slate-400'}`} />
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800">Strict Focus Mode</p>
              <p className="text-[10px] text-slate-400">Prohibit app exit / tab switch</p>
            </div>
            <button
              onClick={() => {
                const next = !strictMode;
                setStrictMode(next);
                sound.playChime('bell');
              }}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ml-2 ${
                strictMode ? 'bg-rose-600' : 'bg-slate-200/80'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  strictMode ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Central Pomodoro Card */}
        <div className="bg-white/45 backdrop-blur-2xl rounded-3xl border border-white/60 p-8 sm:p-12 shadow-xl shadow-slate-200/40 text-center relative overflow-hidden">
          {/* Mode Selector Tabs */}
          <div className="inline-flex p-1 rounded-2xl bg-white/50 backdrop-blur-md mb-8 max-w-md w-full justify-between border border-white/50 shadow-xs">
            <button
              onClick={() => switchMode('focus')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'focus' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Focus (25m)
            </button>
            <button
              onClick={() => switchMode('shortBreak')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'shortBreak' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Short Break (5m)
            </button>
            <button
              onClick={() => switchMode('longBreak')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'longBreak' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Long Break (15m)
            </button>
          </div>

          {/* Active Task Selector / Tag */}
          <div className="mb-6 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Currently Focusing On:
            </span>
            <div className="flex items-center space-x-2">
              <select
                value={activeFocusTaskId || ''}
                onChange={(e) => setActiveFocusTaskId(e.target.value || null)}
                className="bg-white/60 backdrop-blur-md border border-white/60 text-slate-800 text-sm font-semibold rounded-xl px-4 py-1.5 focus:outline-none focus:bg-white/90 cursor-pointer max-w-md truncate shadow-xs"
              >
                <option value="">General Lesson & Teacher Focus</option>
                {tasks
                  .filter((t) => !t.completed)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.pomodoroCompleted}/{t.pomodoroGoal} Focus)
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Big Circular Clock Display */}
          <div className="relative w-64 h-64 mx-auto flex items-center justify-center mb-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="112"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-200/50"
                fill="transparent"
              />
              <circle
                cx="128"
                cy="128"
                r="112"
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 112}
                strokeDashoffset={2 * Math.PI * 112 * (1 - progressPercent / 100)}
                strokeLinecap="round"
                className={`transition-all duration-500 ${
                  mode === 'focus' ? 'text-indigo-600' : 'text-emerald-500'
                }`}
                fill="transparent"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl sm:text-6xl font-extrabold text-slate-800 tracking-tighter font-mono">
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase mt-1">
                {mode === 'focus' ? 'Deep Work Interval' : 'Rest & Recharge'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={resetTimer}
              className="p-3 rounded-2xl bg-white/60 hover:bg-white/90 border border-white/60 backdrop-blur-md text-slate-600 transition-all cursor-pointer shadow-xs"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              id="start-focus-timer-btn"
              onClick={toggleTimer}
              className={`px-8 py-4 rounded-2xl text-white font-bold text-lg flex items-center space-x-2 transition-all cursor-pointer shadow-lg backdrop-blur-xs ${
                isRunning
                  ? 'bg-amber-500/95 hover:bg-amber-500 shadow-amber-200/60'
                  : 'bg-indigo-600/95 hover:bg-indigo-600 shadow-indigo-200/60'
              }`}
            >
              {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-white" />}
              <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
            </button>

            <button
              onClick={handleTimerComplete}
              className="p-3 rounded-2xl bg-white/60 hover:bg-white/90 border border-white/60 backdrop-blur-md text-slate-600 transition-all cursor-pointer shadow-xs"
              title="Skip / Finish Interval"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Ambient Soundscapes Selector */}
          <div className="pt-6 border-t border-white/40 flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold">
              <Volume2 className="w-4 h-4 text-indigo-600" />
              <span>Ambient Sound:</span>
            </div>
            {(
              [
                { id: 'none', label: 'Mute' },
                { id: 'rain', label: '🌧️ Rainfall' },
                { id: 'waves', label: '🌊 Ocean Waves' },
                { id: 'cafe', label: '☕ Cozy Cafe' },
                { id: 'forest', label: '🌲 Forest Birds' },
                { id: 'whitenoise', label: '📻 White Noise' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => setAmbientType(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                  ambientType === s.id
                    ? 'bg-indigo-600/90 border-indigo-600 text-white shadow-md shadow-indigo-200/50'
                    : 'bg-white/50 border-white/60 text-slate-600 hover:bg-white/80 backdrop-blur-xs'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats & Habits Linkage Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/45 backdrop-blur-xl rounded-2xl border border-white/60 p-5 shadow-lg shadow-slate-200/30 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50/80 border border-amber-100/60 text-amber-600 flex items-center justify-center shadow-xs">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{sessionsCompleted}</p>
              <p className="text-xs text-slate-400 font-medium">Pomodoros Done Today</p>
            </div>
          </div>

          <div className="bg-white/45 backdrop-blur-xl rounded-2xl border border-white/60 p-5 shadow-lg shadow-slate-200/30 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 border border-indigo-100/60 text-indigo-600 flex items-center justify-center shadow-xs">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{sessionsCompleted * 25}m</p>
              <p className="text-xs text-slate-400 font-medium">Focused Teaching Time</p>
            </div>
          </div>

          <div className="bg-white/45 backdrop-blur-xl rounded-2xl border border-white/60 p-5 shadow-lg shadow-slate-200/30 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50/80 border border-rose-100/60 text-rose-600 flex items-center justify-center shadow-xs">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">+{sessionsCompleted * 25} Energy</p>
              <p className="text-xs text-slate-400 font-medium">Pip the Pet Energized</p>
            </div>
          </div>
        </div>

        {/* Related Habits Quick Checklist */}
        <div className="bg-white/45 backdrop-blur-xl rounded-2xl border border-white/60 p-5 shadow-lg shadow-slate-200/30">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Today's Wellness Habits Connected with Focus</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {habitGoals.map((h) => (
              <button
                key={h.id}
                onClick={() => toggleHabit(h.id)}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all text-left cursor-pointer shadow-xs ${
                  h.completed
                    ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-800 backdrop-blur-xs'
                    : 'bg-white/50 border-white/60 text-slate-700 hover:bg-white/80 backdrop-blur-xs'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                      h.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white/70'
                    }`}
                  >
                    {h.completed && <Check className="w-3 h-3" />}
                  </div>
                  <span className="font-medium">{h.title}</span>
                </div>
                <span className="text-[10px] font-bold text-amber-600">+{h.stonesReward} Stones</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Strict Mode High-Alert Warning Overlay */}
      {strictAlertTriggered && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-pulse">
          <div className="bg-white/85 backdrop-blur-2xl rounded-3xl p-8 max-w-md w-full text-center border-4 border-rose-500/80 shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center shadow-xs">
              <AlertOctagon className="w-10 h-10 animate-wiggle" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">STRICT FOCUS ALERT!</h3>
            <p className="text-sm font-semibold text-slate-700">
              You switched windows or tried to leave the application!
            </p>
            <p className="text-xs text-slate-500">
              Strict Mode prohibits distractions and tab hopping. Return to your classroom work to preserve your focus streak!
            </p>
            <button
              onClick={() => {
                setStrictAlertTriggered(false);
                sound.playChime('bell');
              }}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-sm transition-colors cursor-pointer shadow-lg shadow-rose-200"
            >
              Resume Teaching Focus
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
