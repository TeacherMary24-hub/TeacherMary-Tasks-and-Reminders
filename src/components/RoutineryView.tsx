import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Routine, RoutineStep } from '../types';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Compass,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronRight,
  Sun,
  Flame,
  Moon,
  Heart,
  Smile,
  Coffee,
  BookOpen,
} from 'lucide-react';

export const RoutineryView: React.FC = () => {
  const { routines, addRoutine, updateRoutine, deleteRoutine, pet } = useApp();

  const [activeTab, setActiveTab] = useState<'myRoutines' | 'explore'>('myRoutines');
  const [runningRoutine, setRunningRoutine] = useState<Routine | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepSecondsLeft, setStepSecondsLeft] = useState(0);
  const [isStepRunning, setIsStepRunning] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  // Edit / Create Routine Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  // Ready-made routine templates in Explore tab
  const exploreTemplates: Routine[] = [
    {
      id: 'tmpl-1',
      title: 'Classroom Morning Mindfulness & Centering',
      icon: 'Sun',
      description: 'Ground your energy before students flood through the door.',
      category: 'morning',
      startTime: '07:15',
      steps: [
        { id: 'ts-1', title: 'Open Classroom Blinds to Natural Sunlight', durationMinutes: 2, icon: 'Sun', description: 'Brighten the room and breathe fresh air.' },
        { id: 'ts-2', title: 'Sip Warm Tea in Stillness', durationMinutes: 4, icon: 'Coffee', description: 'No emails, just mindful sips.' },
        { id: 'ts-3', title: 'Write 3 Teacher Affirmations', durationMinutes: 4, icon: 'Heart', description: '“I am patient, prepared, and inspiring today.”' },
      ],
    },
    {
      id: 'tmpl-2',
      title: 'Power Lesson Planning Block',
      icon: 'BookOpen',
      description: 'Fast, focused prep for upcoming unit activities.',
      category: 'teaching',
      startTime: '14:00',
      steps: [
        { id: 'ts-4', title: 'Review State Curriculum Standards', durationMinutes: 5, icon: 'BookOpen', description: 'Pinpoint required learning goals.' },
        { id: 'ts-5', title: 'Design Interactive Station Tasks', durationMinutes: 15, icon: 'Sparkles', description: 'Create 3 differentiated small group prompts.' },
        { id: 'ts-6', title: 'Queue Digital Slides & Videos', durationMinutes: 5, icon: 'Clock', description: 'Test links and presentation remotes.' },
      ],
    },
    {
      id: 'tmpl-3',
      title: 'Between-Class Mental Reset',
      icon: 'Smile',
      description: 'Quick 5-minute transition to clear mental clutter.',
      category: 'wellness',
      steps: [
        { id: 'ts-7', title: 'Neck & Wrist Micro-Stretches', durationMinutes: 2, icon: 'Activity', description: 'Release keyboard and grading tension.' },
        { id: 'ts-8', title: '4-7-8 Breathing Cycle', durationMinutes: 2, icon: 'Wind', description: 'Calm the nervous system.' },
        { id: 'ts-9', title: 'Drink Cold Glass of Water', durationMinutes: 1, icon: 'Droplets', description: 'Hydrate your vocal cords.' },
      ],
    },
  ];

  // Routine Step Runner timer
  useEffect(() => {
    let timer: number;
    if (isStepRunning && stepSecondsLeft > 0) {
      timer = window.setInterval(() => {
        setStepSecondsLeft((prev) => {
          if (prev <= 1) {
            handleStepFinished();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStepRunning, stepSecondsLeft]);

  const startGuidedRoutine = (routine: Routine) => {
    if (!routine.steps || routine.steps.length === 0) return;
    setRunningRoutine(routine);
    setCurrentStepIndex(0);
    const firstStep = routine.steps[0];
    const duration = firstStep.durationMinutes * 60;
    setStepSecondsLeft(duration);
    setIsStepRunning(true);
    sound.playChime('bell');

    if (isVoiceEnabled) {
      sound.speak(`Starting routine ${routine.title}. First step: ${firstStep.title} for ${firstStep.durationMinutes} minutes.`);
    }
  };

  const handleStepFinished = () => {
    if (!runningRoutine) return;
    sound.playChime('complete');

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < runningRoutine.steps.length) {
      setCurrentStepIndex(nextIndex);
      const nextStep = runningRoutine.steps[nextIndex];
      const duration = nextStep.durationMinutes * 60;
      setStepSecondsLeft(duration);

      if (isVoiceEnabled) {
        sound.speak(`Next step: ${nextStep.title}, ${nextStep.durationMinutes} minutes.`);
      }
    } else {
      // Entire Routine Completed!
      setIsStepRunning(false);
      sound.playChime('complete');
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });
      if (isVoiceEnabled) {
        sound.speak(`Congratulations! You have completed the ${runningRoutine.title} routine. Well done Teacher Mary!`);
      }
      setTimeout(() => {
        setRunningRoutine(null);
      }, 3000);
    }
  };

  const skipStep = () => {
    handleStepFinished();
  };

  const stopGuidedRoutine = () => {
    setIsStepRunning(false);
    setRunningRoutine(null);
  };

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const activeStep = runningRoutine?.steps[currentStepIndex];

  return (
    <div className="flex-1 h-screen overflow-y-auto p-6 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Routinery
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs ${
                isVoiceEnabled
                  ? 'bg-indigo-600/90 border-indigo-600 text-white shadow-md shadow-indigo-200/50'
                  : 'bg-white/50 border-white/60 text-slate-700 hover:bg-white/80 backdrop-blur-md'
              }`}
            >
              {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>Voice Prompts {isVoiceEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Tab switch */}
            <div className="bg-white/50 backdrop-blur-md p-1 rounded-xl border border-white/60 flex space-x-1 text-xs font-semibold shadow-xs">
              <button
                onClick={() => setActiveTab('myRoutines')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  activeTab === 'myRoutines' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Routines
              </button>
              <button
                onClick={() => setActiveTab('explore')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors ${
                  activeTab === 'explore' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Explore Templates</span>
              </button>
            </div>
          </div>
        </div>

        {/* ACTIVE GUIDED RUNNER (If a routine is running) */}
        {runningRoutine && activeStep && (
          <div className="bg-gradient-to-br from-indigo-900/90 via-indigo-800/90 to-slate-900/90 backdrop-blur-2xl text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-white/20 relative overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between border-b border-indigo-700/50 pb-4 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Active Guided Routine ({currentStepIndex + 1} of {runningRoutine.steps.length})
                </span>
                <h3 className="text-xl font-extrabold">{runningRoutine.title}</h3>
              </div>
              <button
                onClick={stopGuidedRoutine}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
              >
                Exit Routine
              </button>
            </div>

            {/* Current Step Big Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-bold mb-3 border border-indigo-400/20">
                  <span>Current Step</span>
                </div>
                <h4 className="text-2xl sm:text-3xl font-bold tracking-tight">{activeStep.title}</h4>
                {activeStep.description && (
                  <p className="text-sm text-indigo-200/80 mt-2">{activeStep.description}</p>
                )}

                {/* Controls */}
                <div className="flex items-center space-x-3 mt-6">
                  <button
                    onClick={() => setIsStepRunning(!isStepRunning)}
                    className="px-6 py-3 rounded-2xl bg-white text-indigo-900 font-bold text-sm flex items-center space-x-2 hover:bg-indigo-50 transition-colors shadow-lg cursor-pointer"
                  >
                    {isStepRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-indigo-900" />}
                    <span>{isStepRunning ? 'Pause' : 'Resume'}</span>
                  </button>
                  <button
                    onClick={skipStep}
                    className="px-4 py-3 rounded-2xl bg-indigo-700/60 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center space-x-1.5 transition-colors cursor-pointer border border-indigo-500/30"
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>Next / Skip</span>
                  </button>
                </div>
              </div>

              {/* Countdown Clock Display */}
              <div className="text-center bg-indigo-950/50 backdrop-blur-md p-6 rounded-3xl border border-indigo-400/20 shadow-inner">
                <span className="text-6xl sm:text-7xl font-mono font-extrabold tracking-tight">
                  {formatSecs(stepSecondsLeft)}
                </span>
                <p className="text-xs text-indigo-300 font-medium mt-2">
                  Duration: {activeStep.durationMinutes} min
                </p>

                {/* Next Up preview */}
                {runningRoutine.steps[currentStepIndex + 1] && (
                  <div className="mt-4 pt-3 border-t border-indigo-800/40 text-left">
                    <p className="text-[11px] text-indigo-300 uppercase font-bold tracking-wider">Next up:</p>
                    <p className="text-xs font-semibold text-white truncate">
                      {runningRoutine.steps[currentStepIndex + 1].title} (
                      {runningRoutine.steps[currentStepIndex + 1].durationMinutes}m)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: My Routines */}
        {activeTab === 'myRoutines' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routines.map((r) => {
                const totalMins = r.steps.reduce((acc, s) => acc + s.durationMinutes, 0);
                return (
                  <div
                    key={r.id}
                    className="bg-white/45 backdrop-blur-xl rounded-2xl border border-white/60 p-5 shadow-lg shadow-slate-200/30 hover:border-white/90 hover:bg-white/55 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50/80 border border-indigo-100/60 text-indigo-600 flex items-center justify-center font-bold shadow-xs">
                            {r.category === 'morning' ? (
                              <Sun className="w-5 h-5 text-amber-500" />
                            ) : r.category === 'evening' ? (
                              <Moon className="w-5 h-5 text-indigo-600" />
                            ) : (
                              <Flame className="w-5 h-5 text-rose-500" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-800">{r.title}</h3>
                            <p className="text-xs text-slate-500">
                              {r.steps.length} timed steps • {totalMins} minutes total
                            </p>
                          </div>
                        </div>
                        {r.startTime && (
                          <span className="px-2 py-0.5 rounded-lg bg-white/60 border border-white/60 text-slate-700 text-xs font-semibold shadow-xs">
                            {r.startTime}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-2">{r.description}</p>

                      {/* Step List Preview */}
                      <div className="mt-4 space-y-1.5 border-t border-white/40 pt-3">
                        {r.steps.map((st, i) => (
                          <div
                            key={st.id}
                            className="flex items-center justify-between text-xs text-slate-600 bg-white/50 backdrop-blur-xs border border-white/50 p-2 rounded-xl shadow-xs"
                          >
                            <span className="truncate">
                              {i + 1}. {st.title}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 shrink-0 ml-2">
                              {st.durationMinutes}m
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-5 pt-3 border-t border-white/40 flex items-center justify-between">
                      <button
                        onClick={() => deleteRoutine(r.id)}
                        className="text-slate-400 hover:text-rose-600 text-xs font-medium cursor-pointer transition-colors"
                      >
                        Delete
                      </button>

                      <button
                        onClick={() => startGuidedRoutine(r)}
                        className="px-4 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-200/50 transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Start Guided Routine</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Explore Ready-Made Routines */}
        {activeTab === 'explore' && (
          <div className="space-y-4">
            <div className="bg-indigo-50/70 backdrop-blur-md border border-indigo-200/60 rounded-2xl p-4 text-xs text-indigo-900 shadow-xs">
              <span className="font-bold">Explore Curated Teacher Routines:</span> Ready-made sequences designed to eliminate morning decision fatigue, organize lesson planning blocks, and create mindful transitions.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exploreTemplates.map((tmpl) => {
                const totalMins = tmpl.steps.reduce((acc, s) => acc + s.durationMinutes, 0);
                return (
                  <div
                    key={tmpl.id}
                    className="bg-white/45 backdrop-blur-xl rounded-2xl border border-white/60 p-5 shadow-lg shadow-slate-200/30 hover:border-white/90 hover:bg-white/55 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-800">{tmpl.title}</h3>
                          <p className="text-xs text-slate-500">
                            {tmpl.steps.length} steps • {totalMins} minutes
                          </p>
                        </div>
                        <span className="text-xl">✨</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">{tmpl.description}</p>

                      <div className="mt-4 space-y-1.5 border-t border-white/40 pt-3">
                        {tmpl.steps.map((st, i) => (
                          <div
                            key={st.id}
                            className="flex items-center justify-between text-xs text-slate-600 bg-white/50 backdrop-blur-xs border border-white/50 p-2 rounded-xl shadow-xs"
                          >
                            <span>
                              {i + 1}. {st.title}
                            </span>
                            <span className="font-semibold text-slate-400">{st.durationMinutes}m</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-white/40 flex justify-end">
                      <button
                        onClick={() => {
                          addRoutine({
                            ...tmpl,
                            id: undefined as unknown as string,
                          });
                          setActiveTab('myRoutines');
                          sound.playChime('complete');
                        }}
                        className="px-4 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-200/50 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to My Routines</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
