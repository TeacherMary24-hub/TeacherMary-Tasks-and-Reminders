export type ViewType = 'tasks' | 'notes' | 'focus' | 'routinery' | 'calendar' | 'timeline' | 'habits';

export type Priority = 'high' | 'medium' | 'low';

export type ReminderType = 'alert' | 'location' | 'constant';

export type RecurringRule = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string; // hex code
  icon: string;  // lucide icon name
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  categoryId: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  durationMinutes?: number;
  subtasks: SubTask[];
  reminderType: ReminderType;
  locationName?: string;
  recurring: RecurringRule;
  pomodoroGoal: number;
  pomodoroCompleted: number;
  tags: string[];
  googleEventId?: string;
  createdAt: string;
}

export interface NoteAttachment {
  id: string;
  type: 'file' | 'image' | 'audio' | 'link' | 'scanned_doc';
  name: string;
  url: string;
  size?: string;
  transcription?: string;
  timestamp: string;
}

export interface SmartShape {
  type: 'circle' | 'rectangle' | 'triangle' | 'arrow' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface Note {
  id: string;
  title: string;
  content: string; // rich formatting / markdown / text
  tableData?: { headers: string[]; rows: string[][] };
  folderId: string;
  isPinned: boolean;
  isLocked: boolean;
  pinCode?: string;
  tags: string[];
  linkedNoteIds: string[];
  attachments: NoteAttachment[];
  drawingData?: string; // base64 canvas image or vector representation
  updatedAt: string;
  createdAt: string;
}

export interface NoteFolder {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface RoutineStep {
  id: string;
  title: string;
  durationMinutes: number;
  icon: string;
  description?: string;
}

export interface Routine {
  id: string;
  title: string;
  icon: string;
  description: string;
  category: 'morning' | 'teaching' | 'afternoon' | 'evening' | 'wellness';
  startTime?: string; // e.g. "07:00"
  steps: RoutineStep[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO string or YYYY-MM-DDTHH:mm
  end: string;   // ISO string or YYYY-MM-DDTHH:mm
  allDay: boolean;
  categoryId?: string;
  location?: string;
  description?: string;
  googleEventId?: string;
  isTaskSynced?: boolean;
  taskId?: string;
}

export interface PetAccessory {
  id: string;
  name: string;
  type: 'hat' | 'glasses' | 'neck' | 'decor' | 'held';
  cost: number;
  icon: string;
  color?: string;
}

export interface PetState {
  name: string;
  stage: 'egg' | 'baby' | 'fledgling' | 'adventurer';
  energy: number; // 0 to 100
  maxEnergy: number;
  rainbowStones: number;
  level: number;
  equippedAccessories: string[];
  inventory: string[];
  adventureStatus: 'idle' | 'exploring' | 'returned';
  adventureProgress: number; // 0 to 100
  lastAdventureStory?: string;
  happiness: number; // 0 to 100
}

export interface HabitGoal {
  id: string;
  title: string;
  category: 'hydration' | 'movement' | 'mental' | 'nutrition' | 'rest' | 'teaching';
  frequency: 'daily' | 'weekdays';
  targetCount: number;
  currentCount: number;
  completed: boolean;
  energyReward: number;
  stonesReward: number;
  icon: string;
}

export interface MoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mood: 'joyful' | 'calm' | 'tired' | 'stressed' | 'inspired';
  note: string;
  timestamp: string;
}

export interface GratitudeEntry {
  id: string;
  date: string;
  text: string;
  timestamp: string;
}
