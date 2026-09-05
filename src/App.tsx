/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { TasksView } from './components/TasksView';
import { NotesView } from './components/NotesView';
import { TodayFocusView } from './components/TodayFocusView';
import { RoutineryView } from './components/RoutineryView';
import { CalendarView } from './components/CalendarView';
import { TimelineView } from './components/TimelineView';
import { HabitsView } from './components/HabitsView';

const MainLayout: React.FC = () => {
  const { activeView } = useApp();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-rose-100 via-teal-50 to-indigo-100 font-sans text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Persistent stay-open Sidebar */}
      <Sidebar />

      {/* Dynamic Centralized Viewport */}
      <main className="flex-1 flex overflow-hidden backdrop-blur-xs">
        {activeView === 'tasks' && <TasksView />}
        {activeView === 'notes' && <NotesView />}
        {activeView === 'focus' && <TodayFocusView />}
        {activeView === 'routinery' && <RoutineryView />}
        {activeView === 'calendar' && <CalendarView />}
        {activeView === 'timeline' && <TimelineView />}
        {activeView === 'habits' && <HabitsView />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
