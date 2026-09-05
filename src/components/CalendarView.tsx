import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CalendarEvent } from '../types';
import { sound } from '../utils/audio';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  CheckCircle2,
  CalendarCheck,
  Globe,
  Tag,
} from 'lucide-react';

export const CalendarView: React.FC = () => {
  const {
    calendarEvents,
    addCalendarEvent,
    deleteCalendarEvent,
    categories,
    isGoogleCalendarConnected,
    connectGoogleCalendar,
    syncWithGoogleCalendar,
    autoSyncGoogleCalendar,
    setAutoSyncGoogleCalendar,
  } = useApp();

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // New Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventCategory, setEventCategory] = useState(categories[0]?.id || 'cat-teaching');
  const [isAllDay, setIsAllDay] = useState(false);

  // Calendar Navigation
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleSyncGoogle = async () => {
    setIsSyncing(true);
    try {
      if (!isGoogleCalendarConnected) {
        await connectGoogleCalendar();
      } else {
        await syncWithGoogleCalendar();
      }
    } catch (err) {
      console.warn('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    await addCalendarEvent({
      title: eventTitle.trim(),
      start: `${eventDate}T${eventStartTime}`,
      end: `${eventDate}T${eventEndTime}`,
      allDay: isAllDay,
      location: eventLocation.trim() || undefined,
      description: eventDescription.trim() || undefined,
      categoryId: eventCategory,
    });

    setEventTitle('');
    setEventLocation('');
    setEventDescription('');
    setIsEventModalOpen(false);
  };

  // Month Grid Calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays: { dayNumber: number; dateStr: string; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevM = month === 0 ? 12 : month;
    const prevY = month === 0 ? year - 1 : year;
    calendarDays.push({
      dayNumber: d,
      dateStr: `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      dayNumber: i,
      dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      isCurrentMonth: true,
    });
  }

  // Next month leading days (fill up to 35 or 42 cells)
  const remainingCells = (7 - (calendarDays.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const nextM = month === 11 ? 1 : month + 2;
    const nextY = month === 11 ? year + 1 : year;
    calendarDays.push({
      dayNumber: i,
      dateStr: `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      isCurrentMonth: false,
    });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="flex-1 h-screen overflow-y-auto p-6 sm:p-8 flex flex-col">
      <div className="max-w-6xl w-full mx-auto space-y-6 flex-1 flex flex-col">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center space-x-2">
              <span>Classroom Calendar</span>
              {isGoogleCalendarConnected && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100/80 border border-emerald-200/60 text-emerald-800 flex items-center space-x-1 backdrop-blur-xs shadow-xs">
                  <Globe className="w-3 h-3 text-emerald-600" />
                  <span>Google Calendar Synced</span>
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Class periods, meetings, deadlines, and school events automatically synchronized with your Google Calendar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSyncGoogle}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 text-slate-700 text-xs font-semibold hover:bg-white/80 flex items-center space-x-1.5 shadow-xs cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span>{isGoogleCalendarConnected ? 'Sync with Google' : 'Connect Google Calendar'}</span>
            </button>

            <button
              onClick={() => setIsEventModalOpen(true)}
              className="px-4 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-indigo-200/50 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Event</span>
            </button>
          </div>
        </div>

        {/* View switcher and month controller */}
        <div className="bg-white/45 backdrop-blur-xl rounded-2xl border border-white/60 p-4 shadow-lg shadow-slate-200/30 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-extrabold text-slate-800 min-w-44">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center space-x-1">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-lg border border-white/60 bg-white/50 text-slate-600 hover:bg-white/80 cursor-pointer shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1 text-xs font-semibold rounded-lg border border-white/60 bg-white/50 text-slate-600 hover:bg-white/80 cursor-pointer shadow-xs"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-lg border border-white/60 bg-white/50 text-slate-600 hover:bg-white/80 cursor-pointer shadow-xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center bg-white/50 backdrop-blur-md p-1 rounded-xl text-xs font-semibold border border-white/50 shadow-xs">
            {(['month', 'week', 'day', 'agenda'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1.5 rounded-lg capitalize cursor-pointer transition-colors ${
                  viewMode === m ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* VIEW 1: MONTH VIEW */}
        {viewMode === 'month' && (
          <div className="bg-white/45 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg shadow-slate-200/30 overflow-hidden flex-1 flex flex-col">
            {/* Days of week header */}
            <div className="grid grid-cols-7 bg-white/60 backdrop-blur-md border-b border-white/40 text-center py-2.5 text-xs font-bold text-slate-600">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Day Cells Grid */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-white/40">
              {calendarDays.map((cell, idx) => {
                const dayEvents = calendarEvents.filter((e) => e.start.startsWith(cell.dateStr));
                const isToday = cell.dateStr === todayStr;

                return (
                  <div
                    key={idx}
                    className={`min-h-24 p-2 flex flex-col justify-between transition-colors ${
                      cell.isCurrentMonth ? 'bg-white/30 backdrop-blur-xs' : 'bg-white/10 opacity-60'
                    } ${isToday ? 'bg-indigo-50/60' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : cell.isCurrentMonth
                            ? 'text-slate-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                    </div>

                    {/* Events pills inside cell */}
                    <div className="space-y-1 flex-1 overflow-y-auto max-h-20">
                      {dayEvents.map((evt) => {
                        const cat = categories.find((c) => c.id === evt.categoryId);
                        return (
                          <div
                            key={evt.id}
                            className="p-1 rounded-lg text-[11px] font-semibold text-white truncate shadow-xs flex items-center justify-between"
                            style={{ backgroundColor: cat?.color || '#4F46E5' }}
                            title={`${evt.title} ${evt.location ? `(${evt.location})` : ''}`}
                          >
                            <span className="truncate">{evt.title}</span>
                            {evt.googleEventId && <Globe className="w-2.5 h-2.5 shrink-0 opacity-80" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: AGENDA / LIST VIEW */}
        {(viewMode === 'agenda' || viewMode === 'week' || viewMode === 'day') && (
          <div className="bg-white/45 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg shadow-slate-200/30 p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-800">
              {viewMode === 'day' ? 'Today’s Detailed Events' : 'Upcoming Schedule & Appointments'}
            </h4>

            {calendarEvents.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No scheduled events found.</p>
            ) : (
              <div className="divide-y divide-white/40">
                {calendarEvents.map((evt) => {
                  const cat = categories.find((c) => c.id === evt.categoryId);
                  const startHour = evt.start.includes('T') ? evt.start.split('T')[1] : 'All day';
                  const endHour = evt.end?.includes('T') ? evt.end.split('T')[1] : '';

                  return (
                    <div key={evt.id} className="py-3 flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-3">
                        <div
                          className="w-3.5 h-3.5 rounded-full mt-1 shrink-0 shadow-xs"
                          style={{ backgroundColor: cat?.color || '#4F46E5' }}
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-slate-800">{evt.title}</h4>
                            {evt.googleEventId && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 border border-white/60 text-slate-600 font-semibold flex items-center space-x-1 shadow-xs">
                                <Globe className="w-2.5 h-2.5 text-indigo-600" />
                                <span>Synced</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>
                                {evt.start.split('T')[0]} • {startHour} {endHour ? `- ${endHour}` : ''}
                              </span>
                            </span>
                            {evt.location && (
                              <span className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{evt.location}</span>
                              </span>
                            )}
                          </div>
                          {evt.description && (
                            <p className="text-xs text-slate-500 mt-1.5">{evt.description}</p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteCalendarEvent(evt.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 cursor-pointer transition-colors"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Event Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-white/60 space-y-4">
            <div className="flex items-center justify-between border-b border-white/40 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Create Calendar Event</h3>
              <button onClick={() => setIsEventModalOpen(false)} className="text-slate-400 font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. Period 2 English Discussion / Faculty Meeting"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-white/70 backdrop-blur-md border border-white/60 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:bg-white/90 shadow-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-white/70 backdrop-blur-md border border-white/60 rounded-xl px-3 py-2 text-slate-800 shadow-xs focus:bg-white/90"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Category</label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value)}
                    className="w-full bg-white/70 backdrop-blur-md border border-white/60 rounded-xl px-3 py-2 text-slate-800 shadow-xs focus:bg-white/90 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Start Time</label>
                  <input
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full bg-white/70 backdrop-blur-md border border-white/60 rounded-xl px-3 py-2 text-slate-800 shadow-xs focus:bg-white/90"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">End Time</label>
                  <input
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full bg-white/70 backdrop-blur-md border border-white/60 rounded-xl px-3 py-2 text-slate-800 shadow-xs focus:bg-white/90"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Room 204, Campus Library"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full bg-white/70 backdrop-blur-md border border-white/60 rounded-xl px-3 py-2 text-slate-800 shadow-xs focus:bg-white/90"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Agenda or notes for this period..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full bg-white/70 backdrop-blur-md border border-white/60 rounded-xl px-3 py-2 text-slate-800 shadow-xs focus:bg-white/90"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <p className="text-[11px] text-slate-400">
                  {isGoogleCalendarConnected ? 'Will automatically sync to Google Calendar' : 'Local event (connect G-Cal to sync)'}
                </p>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEventModalOpen(false)}
                    className="px-4 py-2 bg-white/60 hover:bg-white/90 border border-white/60 rounded-xl font-semibold text-slate-700 cursor-pointer shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-xl font-bold cursor-pointer shadow-md shadow-indigo-200/50"
                  >
                    Save Event
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
