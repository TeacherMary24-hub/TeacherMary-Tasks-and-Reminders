import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { sound } from '../utils/audio';
import {
  Clock,
  CheckCircle2,
  Circle,
  Calendar,
  Sparkles,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface TimelineItem {
  id: string;
  type: 'task' | 'event' | 'routine';
  title: string;
  startMinutes: number; // minutes from 00:00
  endMinutes: number;   // minutes from 00:00
  startTimeStr: string;
  endTimeStr: string;
  completed?: boolean;
  color: string;
  location?: string;
  description?: string;
}

export const TimelineView: React.FC = () => {
  const { tasks, calendarEvents, routines, categories, toggleTaskComplete, addTask } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentMinutes, setCurrentMinutes] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  // Keep current time scrubber updated
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Time range: 06:00 (360m) to 23:00 (1380m)
  const START_HOUR = 6;
  const END_HOUR = 23;
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  // Compile timeline items for selectedDate
  const timelineItems: TimelineItem[] = [];

  // 1. Tasks for selectedDate with dueTime
  tasks.forEach((t) => {
    if (t.dueDate === selectedDate && t.dueTime) {
      const [h, m] = t.dueTime.split(':').map(Number);
      const start = h * 60 + m;
      const duration = t.durationMinutes || 30;
      const end = start + duration;
      const cat = categories.find((c) => c.id === t.categoryId);

      timelineItems.push({
        id: t.id,
        type: 'task',
        title: t.title,
        startMinutes: start,
        endMinutes: end,
        startTimeStr: t.dueTime,
        endTimeStr: `${String(Math.floor(end / 60) % 24).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`,
        completed: t.completed,
        color: cat?.color || '#4F46E5',
        location: t.locationName,
        description: t.description,
      });
    }
  });

  // 2. Calendar events for selectedDate
  calendarEvents.forEach((e) => {
    if (e.start.startsWith(selectedDate) && e.start.includes('T')) {
      const startTimePart = e.start.split('T')[1].slice(0, 5);
      const endTimePart = e.end?.includes('T') ? e.end.split('T')[1].slice(0, 5) : startTimePart;
      const [sh, sm] = startTimePart.split(':').map(Number);
      const [eh, em] = endTimePart.split(':').map(Number);
      const start = sh * 60 + sm;
      let end = eh * 60 + em;
      if (end <= start) end = start + 45;
      const cat = categories.find((c) => c.id === e.categoryId);

      timelineItems.push({
        id: e.id,
        type: 'event',
        title: e.title,
        startMinutes: start,
        endMinutes: end,
        startTimeStr: startTimePart,
        endTimeStr: endTimePart,
        color: cat?.color || '#059669',
        location: e.location,
        description: e.description,
      });
    }
  });

  // 3. Routines with scheduled start times
  routines.forEach((r) => {
    if (r.startTime) {
      const [rh, rm] = r.startTime.split(':').map(Number);
      const start = rh * 60 + rm;
      const totalDur = r.steps.reduce((acc, s) => acc + s.durationMinutes, 0);
      const end = start + totalDur;

      timelineItems.push({
        id: r.id,
        type: 'routine',
        title: `Routine: ${r.title}`,
        startMinutes: start,
        endMinutes: end,
        startTimeStr: r.startTime,
        endTimeStr: `${String(Math.floor(end / 60) % 24).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`,
        color: '#7C3AED',
        description: `${r.steps.length} guided habit steps`,
      });
    }
  });

  // Sort chronological
  timelineItems.sort((a, b) => a.startMinutes - b.startMinutes);

  // Active Block detection
  const activeBlock = timelineItems.find(
    (item) => currentMinutes >= item.startMinutes && currentMinutes < item.endMinutes
  );

  return (
    <div className="flex-1 h-screen overflow-y-auto p-6 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Structured Timeline <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100/80 border border-indigo-200/60 text-indigo-700 backdrop-blur-xs">Visual Time-Blocking</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Merges tasks, calendar periods, and guided routines into a single seamless chronological daily flow.
            </p>
          </div>

          {/* Date Selector */}
          <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/60 shadow-xs">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Currently Active Banner */}
        {activeBlock && (
          <div className="bg-indigo-600/90 backdrop-blur-xl border border-indigo-400/30 text-white rounded-3xl p-5 shadow-xl shadow-indigo-200/40 flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                  Currently Active Time-Block
                </span>
                <h4 className="text-base font-bold leading-tight">{activeBlock.title}</h4>
                <p className="text-xs text-indigo-100">
                  {activeBlock.startTimeStr} - {activeBlock.endTimeStr} ({activeBlock.endMinutes - currentMinutes} mins remaining)
                </p>
              </div>
            </div>
            {activeBlock.type === 'task' && (
              <button
                onClick={() => toggleTaskComplete(activeBlock.id)}
                className="px-4 py-2 rounded-xl bg-white text-indigo-900 font-bold text-xs hover:bg-indigo-50 transition-colors shadow-xs cursor-pointer"
              >
                {activeBlock.completed ? 'Completed' : 'Mark Done'}
              </button>
            )}
          </div>
        )}

        {/* Timeline Canvas */}
        <div className="bg-white/45 backdrop-blur-xl rounded-3xl border border-white/60 p-6 sm:p-8 shadow-lg shadow-slate-200/30 relative">
          <div className="relative pl-16 space-y-8">
            {/* Current Time Scrubber line */}
            {selectedDate === new Date().toISOString().split('T')[0] &&
              currentMinutes >= START_HOUR * 60 &&
              currentMinutes <= END_HOUR * 60 && (
                <div
                  className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
                  style={{
                    top: `${((currentMinutes - START_HOUR * 60) / ((END_HOUR - START_HOUR) * 60)) * 100}%`,
                  }}
                >
                  <span className="w-14 text-right pr-2 text-[10px] font-mono font-bold text-rose-500">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 shadow-sm" />
                  <div className="flex-1 h-0.5 bg-rose-500/80" />
                </div>
              )}

            {/* Hour markers grid */}
            {hours.map((hour) => {
              const hourMinutes = hour * 60;
              const nextHourMinutes = (hour + 1) * 60;
              const itemsInHour = timelineItems.filter(
                (item) => item.startMinutes >= hourMinutes && item.startMinutes < nextHourMinutes
              );

              return (
                <div key={hour} className="relative min-h-16 border-t border-white/40 pt-2">
                  <span className="absolute -left-16 top-0 text-xs font-bold text-slate-400 font-mono">
                    {String(hour).padStart(2, '0')}:00
                  </span>

                  {/* Items starting in this hour */}
                  <div className="space-y-2">
                    {itemsInHour.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                          item.completed
                            ? 'bg-white/30 backdrop-blur-xs border-white/40 opacity-65'
                            : 'bg-white/65 backdrop-blur-md border-white/60 hover:border-white/90 hover:bg-white/80 shadow-xs'
                        }`}
                        style={{ borderLeftWidth: '5px', borderLeftColor: item.color }}
                      >
                        <div className="flex items-start space-x-3 flex-1">
                          {item.type === 'task' ? (
                            <button
                              onClick={() => toggleTaskComplete(item.id)}
                              className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                            >
                              {item.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>
                          ) : (
                            <div
                              className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-xs"
                              style={{ backgroundColor: item.color }}
                            />
                          )}

                          <div>
                            <div className="flex items-center space-x-2">
                              <h4
                                className={`text-sm font-bold ${
                                  item.completed ? 'line-through text-slate-400' : 'text-slate-800'
                                }`}
                              >
                                {item.title}
                              </h4>
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-white/60 border border-white/60 text-slate-600 shadow-xs">
                                {item.type}
                              </span>
                            </div>

                            <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                              <span className="font-semibold text-slate-600">
                                {item.startTimeStr} - {item.endTimeStr}
                              </span>
                              {item.location && (
                                <span className="flex items-center space-x-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{item.location}</span>
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
