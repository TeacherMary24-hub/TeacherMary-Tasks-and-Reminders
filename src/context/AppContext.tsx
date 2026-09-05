import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ViewType,
  Task,
  Category,
  Note,
  NoteFolder,
  Routine,
  CalendarEvent,
  PetState,
  PetAccessory,
  HabitGoal,
  MoodEntry,
  GratitudeEntry,
} from '../types';
import { sound } from '../utils/audio';
import { googleCalendar } from '../services/googleCalendar';
import confetti from 'canvas-confetti';

interface AppContextType {
  // Navigation
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;

  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'pomodoroCompleted'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  toggleSubTask: (taskId: string, subtaskId: string) => void;
  addSubTask: (taskId: string, title: string) => void;
  deleteSubTask: (taskId: string, subtaskId: string) => void;

  // Categories
  categories: Category[];
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Notes
  notes: Note[];
  folders: NoteFolder[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addFolder: (name: string, icon?: string, color?: string) => void;
  updateFolder: (id: string, updates: Partial<NoteFolder>) => void;
  deleteFolder: (id: string) => void;

  // Routines
  routines: Routine[];
  addRoutine: (routine: Omit<Routine, 'id'>) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;

  // Calendar
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent>;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => Promise<void>;
  isGoogleCalendarConnected: boolean;
  connectGoogleCalendar: () => Promise<void>;
  disconnectGoogleCalendar: () => void;
  syncWithGoogleCalendar: () => Promise<{ added: number; updated: number }>;
  autoSyncGoogleCalendar: boolean;
  setAutoSyncGoogleCalendar: (enabled: boolean) => void;

  // Pet & Habits
  pet: PetState;
  habitGoals: HabitGoal[];
  shopAccessories: PetAccessory[];
  feedPet: () => void;
  petBird: () => void;
  sendPetOnAdventure: () => void;
  claimAdventureReward: () => void;
  buyAccessory: (accessory: PetAccessory) => void;
  toggleEquipAccessory: (accessoryId: string) => void;
  toggleHabit: (habitId: string) => void;
  addHabitGoal: (habit: Omit<HabitGoal, 'id' | 'completed' | 'currentCount'>) => void;

  // Wellness
  moodEntries: MoodEntry[];
  addMoodEntry: (mood: MoodEntry['mood'], note: string) => void;
  gratitudeEntries: GratitudeEntry[];
  addGratitudeEntry: (text: string) => void;

  // Active focus task linkage
  activeFocusTaskId: string | null;
  setActiveFocusTaskId: (taskId: string | null) => void;
  recordFocusSession: (minutes: number, taskId?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Seed Data
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-teaching', name: 'Teaching & Grading', color: '#4F46E5', icon: 'GraduationCap' },
  { id: 'cat-lesson', name: 'Lesson Plans', color: '#059669', icon: 'BookOpen' },
  { id: 'cat-admin', name: 'Administrative', color: '#EA580C', icon: 'ClipboardList' },
  { id: 'cat-meetings', name: 'Parent & Meetings', color: '#7C3AED', icon: 'Users' },
  { id: 'cat-wellness', name: 'Self-Care & Health', color: '#EC4899', icon: 'Heart' },
  { id: 'cat-supplies', name: 'Classroom Supplies', color: '#0284C7', icon: 'Package' },
];

const getTodayDate = () => new Date().toISOString().split('T')[0];
const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const DEFAULT_TASKS: Task[] = [
  {
    id: 't-1',
    title: 'Grade English Literature Midterm Essays',
    description: 'Review 28 student essays on themes of empathy in To Kill a Mockingbird.',
    completed: false,
    priority: 'high',
    categoryId: 'cat-teaching',
    dueDate: getTodayDate(),
    dueTime: '15:30',
    durationMinutes: 45,
    subtasks: [
      { id: 'st-1', title: 'Grade Period 2 essays (14 papers)', completed: true },
      { id: 'st-2', title: 'Grade Period 4 essays (14 papers)', completed: false },
      { id: 'st-3', title: 'Upload rubric scores to gradebook portal', completed: false },
    ],
    reminderType: 'constant',
    locationName: 'Faculty Workroom 104',
    recurring: 'none',
    pomodoroGoal: 3,
    pomodoroCompleted: 1,
    tags: ['English9', 'Grading', 'Midterms'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 't-2',
    title: 'Finalize Science Fair Presentation Handouts',
    description: 'Print judging rubrics and student display tags.',
    completed: false,
    priority: 'medium',
    categoryId: 'cat-lesson',
    dueDate: getTomorrowDate(),
    dueTime: '10:00',
    durationMinutes: 30,
    subtasks: [
      { id: 'st-4', title: 'Proofread project safety guidelines', completed: true },
      { id: 'st-5', title: 'Print 45 double-sided handouts in library', completed: false },
    ],
    reminderType: 'location',
    locationName: 'Campus Library',
    recurring: 'none',
    pomodoroGoal: 2,
    pomodoroCompleted: 0,
    tags: ['ScienceFair', 'Printouts'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 't-3',
    title: 'Parent-Teacher Conference with Mrs. Henderson',
    description: 'Discuss Leo’s impressive improvements in analytical reading.',
    completed: false,
    priority: 'high',
    categoryId: 'cat-meetings',
    dueDate: getTodayDate(),
    dueTime: '16:15',
    durationMinutes: 25,
    subtasks: [
      { id: 'st-6', title: 'Pull recent reading progress chart', completed: false },
      { id: 'st-7', title: 'Prepare recommended book list', completed: false },
    ],
    reminderType: 'alert',
    locationName: 'Room 204',
    recurring: 'none',
    pomodoroGoal: 1,
    pomodoroCompleted: 0,
    tags: ['Parents', 'Conferences'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 't-4',
    title: 'Submit Bi-weekly Department Curriculum Report',
    description: 'Report on standard pacing and unit mastery.',
    completed: true,
    priority: 'medium',
    categoryId: 'cat-admin',
    dueDate: getTodayDate(),
    dueTime: '11:00',
    durationMinutes: 20,
    subtasks: [
      { id: 'st-8', title: 'Compile unit quiz statistics', completed: true },
      { id: 'st-9', title: 'Submit online form to VP office', completed: true },
    ],
    reminderType: 'alert',
    recurring: 'weekly',
    pomodoroGoal: 1,
    pomodoroCompleted: 1,
    tags: ['Admin', 'Curriculum'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 't-5',
    title: 'Order colored whiteboard markers & sticky tabs',
    completed: false,
    priority: 'low',
    categoryId: 'cat-supplies',
    dueDate: getTomorrowDate(),
    dueTime: '17:00',
    subtasks: [],
    reminderType: 'alert',
    recurring: 'none',
    pomodoroGoal: 1,
    pomodoroCompleted: 0,
    tags: ['Supplies'],
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_FOLDERS: NoteFolder[] = [
  { id: 'f-1', name: 'Lesson Plans', icon: 'BookOpen', color: '#059669' },
  { id: 'f-2', name: 'Class 9A English', icon: 'GraduationCap', color: '#4F46E5' },
  { id: 'f-3', name: 'Department Meetings', icon: 'Users', color: '#7C3AED' },
  { id: 'f-4', name: 'Personal & Well-being', icon: 'Heart', color: '#EC4899' },
];

const DEFAULT_NOTES: Note[] = [
  {
    id: 'n-1',
    title: 'Unit 4: Poetry & Figurative Language Exploration',
    content: `# Unit 4: Poetry & Figurative Language\n\n### Objective\nStudents will analyze how sensory imagery, metaphors, and symbolism evoke emotional resonance in 20th-century poems.\n\n### Key Discussion Prompts\n- What is the difference between literal and implied meaning?\n- How does the poet's choice of meter change the reader's heartbeat?\n\n### Classroom Interactive Checklist\n- [x] Introduce Robert Frost "The Road Not Taken"\n- [ ] Group activity: Annotate stanzas on mini whiteboards\n- [ ] Exit ticket: Write a 4-line original metaphor poem`,
    tableData: {
      headers: ['Stanza', 'Literary Device', 'Student Example', 'Mastery Level'],
      rows: [
        ['Stanza 1', 'Visual Imagery', 'Yellow wood diverged', '95% Proficient'],
        ['Stanza 2', 'Metaphor of Choice', 'Grassy and wanted wear', '88% Proficient'],
        ['Stanza 4', 'Reflective Irony', 'Told with a sigh', 'Pending Discussion'],
      ],
    },
    folderId: 'f-2',
    isPinned: true,
    isLocked: false,
    tags: ['Poetry', 'LessonPlan', 'Class9A'],
    linkedNoteIds: [],
    attachments: [
      {
        id: 'att-1',
        type: 'scanned_doc',
        name: 'Frost_Poem_Annotated_Sheet.pdf',
        url: '#',
        size: '1.2 MB',
        timestamp: 'Today, 9:15 AM',
      },
      {
        id: 'att-2',
        type: 'audio',
        name: 'Poetry_Meter_Explanation.m4a',
        url: '#',
        size: '3.4 MB',
        transcription: 'Remember that iambic pentameter sounds like a natural walking stride or human heartbeat...',
        timestamp: 'Yesterday, 3:45 PM',
      },
    ],
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'n-2',
    title: 'Department Curriculum Alignment & Assessment Sync',
    content: `# English Department Alignment Meeting\n\n**Date:** September 5, 2026\n**Attendees:** TeacherMary, Mr. Davis, Principal Sterling\n\n### Action Items\n- [x] Confirm mid-term grading submission window\n- [ ] Draft standardized rubric for creative writing\n- [ ] Order supplementary modern literature anthologies\n\n*Note:* Refer to >>Unit 4: Poetry & Figurative Language Exploration for the pacing schedule.`,
    folderId: 'f-3',
    isPinned: false,
    isLocked: false,
    tags: ['Meeting', 'Curriculum', 'Admin'],
    linkedNoteIds: ['n-1'],
    attachments: [],
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'n-3',
    title: 'Confidential: Student Accommodations & IEP Strategies',
    content: `# Student Support & Learning Accommodations (Protected)\n\n### Period 2\n- Leo Henderson: Preferred front seating, extended time for written free response (1.5x), graphic organizer support.\n- Maya Chen: Visual rubric checklist before independent drafting sessions.\n\n### Period 4\n- Jordan Smith: Regular check-ins during group work, audio reading companion enabled.`,
    folderId: 'f-2',
    isPinned: false,
    isLocked: true,
    pinCode: '1234',
    tags: ['IEP', 'Confidential', 'Support'],
    linkedNoteIds: [],
    attachments: [],
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_ROUTINES: Routine[] = [
  {
    id: 'r-1',
    title: "Teacher's Energizing Morning",
    icon: 'Sun',
    description: 'Start the day calm, hydrated, and focused before the classroom bell rings.',
    category: 'morning',
    startTime: '06:45',
    steps: [
      { id: 'rs-1', title: 'Hydration & Lemon Water', durationMinutes: 2, icon: 'Droplets', description: 'Rehydrate body and mind with a tall glass of water.' },
      { id: 'rs-2', title: 'Mindful Morning Stretch', durationMinutes: 5, icon: 'Activity', description: 'Gentle neck, shoulder, and spinal release.' },
      { id: 'rs-3', title: 'Review Daily Schedule & Attendance', durationMinutes: 4, icon: 'Calendar', description: 'Glance over periods, conferences, and deadlines.' },
      { id: 'rs-4', title: 'Classroom Gratitude Intention', durationMinutes: 3, icon: 'Heart', description: 'Set an intention to be patient, supportive, and clear.' },
    ],
  },
  {
    id: 'r-2',
    title: 'Classroom Setup & Bellwork Launch',
    icon: 'Sparkles',
    description: 'Set up technology, materials, and a welcoming atmosphere for period 1.',
    category: 'teaching',
    startTime: '07:45',
    steps: [
      { id: 'rs-5', title: 'Power On Smartboard & Display Bellwork', durationMinutes: 3, icon: 'Monitor', description: 'Project the opening warm-up question on screen.' },
      { id: 'rs-6', title: 'Distribute Worksheets to Table Carts', durationMinutes: 4, icon: 'FileText', description: 'Organize handouts by table groups.' },
      { id: 'rs-7', title: 'Play Ambient Classroom Background Tunes', durationMinutes: 2, icon: 'Music', description: 'Gentle classical or lofi instrumental sounds.' },
      { id: 'rs-8', title: 'Stand at Doorway to Greet Students', durationMinutes: 5, icon: 'Smile', description: 'Warm personal greetings to set a positive tone.' },
    ],
  },
  {
    id: 'r-3',
    title: 'Afternoon Deep Grading Block',
    icon: 'Flame',
    description: 'Focused sprint to clear essay stacks and lesson preparations.',
    category: 'afternoon',
    startTime: '15:15',
    steps: [
      { id: 'rs-9', title: 'Desk Tidy & Fresh Herbal Tea', durationMinutes: 3, icon: 'Coffee', description: 'Clear all clutter and steep chamomile or green tea.' },
      { id: 'rs-10', title: 'Essay Grading Focus Sprint (Part 1)', durationMinutes: 25, icon: 'Clock', description: 'Deep focused evaluation without checking phone.' },
      { id: 'rs-11', title: 'Five-Minute Hallway Walk & Eye Rest', durationMinutes: 5, icon: 'Footprints', description: 'Rest eyes from screens and stretch legs.' },
      { id: 'rs-12', title: 'Record Grades & Update Student Portals', durationMinutes: 10, icon: 'CheckCircle2', description: 'Enter grades and write encouragement notes.' },
    ],
  },
  {
    id: 'r-4',
    title: 'Teacher Evening Decompression & Wind-Down',
    icon: 'Moon',
    description: 'Leave school thoughts at school and transition into restful evening.',
    category: 'evening',
    startTime: '20:30',
    steps: [
      { id: 'rs-13', title: 'Pack Teacher Bag & Outfits for Tomorrow', durationMinutes: 5, icon: 'Briefcase', description: 'Remove morning rush stress.' },
      { id: 'rs-14', title: 'Gratitude Reflection for Today', durationMinutes: 5, icon: 'BookOpen', description: 'Write down 3 bright moments from students today.' },
      { id: 'rs-15', title: 'Guided 4-7-8 Breathing Relaxation', durationMinutes: 4, icon: 'Wind', description: 'Calm nervous system for deep restful sleep.' },
    ],
  },
];

const DEFAULT_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'Period 1: 9th Grade English Honors',
    start: `${getTodayDate()}T08:00`,
    end: `${getTodayDate()}T09:20`,
    allDay: false,
    categoryId: 'cat-teaching',
    location: 'Room 204',
    description: 'Discussion on Scout’s perspective in chapters 9-11.',
  },
  {
    id: 'evt-2',
    title: 'Period 3: Creative Writing Workshop',
    start: `${getTodayDate()}T10:45`,
    end: `${getTodayDate()}T12:00`,
    allDay: false,
    categoryId: 'cat-teaching',
    location: 'Room 204',
    description: 'Peer review circles on personal narrative drafts.',
  },
  {
    id: 'evt-3',
    title: 'Faculty & Department Lunch Gathering',
    start: `${getTodayDate()}T12:05`,
    end: `${getTodayDate()}T12:50`,
    allDay: false,
    categoryId: 'cat-wellness',
    location: 'Staff Courtyard',
  },
  {
    id: 'evt-4',
    title: 'Parent Conference: Mrs. Henderson',
    start: `${getTodayDate()}T16:15`,
    end: `${getTodayDate()}T16:45`,
    allDay: false,
    categoryId: 'cat-meetings',
    location: 'Room 204 / Phone',
  },
  {
    id: 'evt-5',
    title: 'District Curriculum Webinar',
    start: `${getTomorrowDate()}T15:00`,
    end: `${getTomorrowDate()}T16:30`,
    allDay: false,
    categoryId: 'cat-admin',
    location: 'Zoom / District Portal',
  },
];

const DEFAULT_PET: PetState = {
  name: 'Pip',
  stage: 'baby',
  energy: 70,
  maxEnergy: 100,
  rainbowStones: 320,
  level: 4,
  equippedAccessories: ['acc-spectacles', 'acc-scarf'],
  inventory: ['acc-spectacles', 'acc-scarf', 'acc-apple'],
  adventureStatus: 'idle',
  adventureProgress: 0,
  lastAdventureStory: 'Pip explored the school courtyard garden, watched a friendly butterfly, and discovered an inspiring four-leaf clover!',
  happiness: 92,
};

const DEFAULT_SHOP_ITEMS: PetAccessory[] = [
  { id: 'acc-spectacles', name: "Teacher's Reading Spectacles", type: 'glasses', cost: 120, icon: 'Glasses', color: '#B45309' },
  { id: 'acc-gradcap', name: 'Mini Graduation Mortarboard', type: 'hat', cost: 250, icon: 'GraduationCap', color: '#1E293B' },
  { id: 'acc-scarf', name: 'Cozy Plaid Autumn Scarf', type: 'neck', cost: 140, icon: 'Shirt', color: '#DC2626' },
  { id: 'acc-apple', name: 'Shiny Red Teacher’s Apple', type: 'held', cost: 90, icon: 'Apple', color: '#EF4444' },
  { id: 'acc-beret', name: 'Poet’s Mustard Yellow Beret', type: 'hat', cost: 180, icon: 'Crown', color: '#EAB308' },
  { id: 'acc-bowtie', name: 'Scholarly Velvet Bowtie', type: 'neck', cost: 110, icon: 'Sparkles', color: '#4F46E5' },
  { id: 'acc-mug', name: '#1 Teacher Coffee Mug', type: 'held', cost: 130, icon: 'Coffee', color: '#059669' },
  { id: 'acc-nest', name: 'Vintage Bookshelf Nest Decor', type: 'decor', cost: 300, icon: 'BookMarked', color: '#9333EA' },
];

const DEFAULT_HABITS: HabitGoal[] = [
  { id: 'h-1', title: 'Drink 2 Liters of Water', category: 'hydration', frequency: 'daily', targetCount: 4, currentCount: 3, completed: false, energyReward: 15, stonesReward: 20, icon: 'Droplets' },
  { id: 'h-2', title: 'Stand & Stretch between Periods', category: 'movement', frequency: 'daily', targetCount: 3, currentCount: 2, completed: false, energyReward: 20, stonesReward: 25, icon: 'Activity' },
  { id: 'h-3', title: 'Mindful 5-minute Breathing Break', category: 'mental', frequency: 'daily', targetCount: 1, currentCount: 1, completed: true, energyReward: 25, stonesReward: 30, icon: 'Wind' },
  { id: 'h-4', title: 'Eat a Healthy Nourishing Lunch', category: 'nutrition', frequency: 'daily', targetCount: 1, currentCount: 1, completed: true, energyReward: 20, stonesReward: 25, icon: 'Apple' },
  { id: 'h-5', title: 'Send 1 encouraging note to a student', category: 'teaching', frequency: 'weekdays', targetCount: 1, currentCount: 0, completed: false, energyReward: 30, stonesReward: 40, icon: 'HeartHandshake' },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ViewType>('tasks');

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tm_tasks');
    return saved ? JSON.parse(saved) : DEFAULT_TASKS;
  });

  // Categories
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('tm_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  // Notes & Folders
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('tm_notes');
    return saved ? JSON.parse(saved) : DEFAULT_NOTES;
  });

  const [folders, setFolders] = useState<NoteFolder[]>(() => {
    const saved = localStorage.getItem('tm_folders');
    return saved ? JSON.parse(saved) : DEFAULT_FOLDERS;
  });

  // Routines
  const [routines, setRoutines] = useState<Routine[]>(() => {
    const saved = localStorage.getItem('tm_routines');
    return saved ? JSON.parse(saved) : DEFAULT_ROUTINES;
  });

  // Calendar
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('tm_calendar');
    return saved ? JSON.parse(saved) : DEFAULT_CALENDAR_EVENTS;
  });

  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState<boolean>(() => {
    return googleCalendar.isConnected();
  });

  const [autoSyncGoogleCalendar, setAutoSyncGoogleCalendar] = useState<boolean>(() => {
    return localStorage.getItem('tm_autosync_gcal') === 'true';
  });

  // Pet & Habits
  const [pet, setPet] = useState<PetState>(() => {
    const saved = localStorage.getItem('tm_pet');
    return saved ? JSON.parse(saved) : DEFAULT_PET;
  });

  const [habitGoals, setHabitGoals] = useState<HabitGoal[]>(() => {
    const saved = localStorage.getItem('tm_habits');
    return saved ? JSON.parse(saved) : DEFAULT_HABITS;
  });

  const [shopAccessories] = useState<PetAccessory[]>(DEFAULT_SHOP_ITEMS);

  // Wellness
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>(() => {
    const saved = localStorage.getItem('tm_moods');
    return saved ? JSON.parse(saved) : [
      { id: 'm-1', date: getTodayDate(), mood: 'inspired', note: 'Period 2 had an engaging literary debate!', timestamp: '11:45 AM' },
    ];
  });

  const [gratitudeEntries, setGratitudeEntries] = useState<GratitudeEntry[]>(() => {
    const saved = localStorage.getItem('tm_gratitude');
    return saved ? JSON.parse(saved) : [
      { id: 'g-1', date: getTodayDate(), text: 'Leo raised his hand to read his poem aloud with pride today.', timestamp: '12:30 PM' },
    ];
  });

  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string | null>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('tm_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('tm_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('tm_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('tm_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('tm_routines', JSON.stringify(routines));
  }, [routines]);

  useEffect(() => {
    localStorage.setItem('tm_calendar', JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    localStorage.setItem('tm_pet', JSON.stringify(pet));
  }, [pet]);

  useEffect(() => {
    localStorage.setItem('tm_habits', JSON.stringify(habitGoals));
  }, [habitGoals]);

  useEffect(() => {
    localStorage.setItem('tm_moods', JSON.stringify(moodEntries));
  }, [moodEntries]);

  useEffect(() => {
    localStorage.setItem('tm_gratitude', JSON.stringify(gratitudeEntries));
  }, [gratitudeEntries]);

  useEffect(() => {
    localStorage.setItem('tm_autosync_gcal', String(autoSyncGoogleCalendar));
  }, [autoSyncGoogleCalendar]);

  // Google Calendar Auth subscription
  useEffect(() => {
    const unsubscribe = googleCalendar.subscribe((status) => {
      setIsGoogleCalendarConnected(status);
    });
    return unsubscribe;
  }, []);

  // Reward helper: adds energy and stones to pet
  const rewardPet = (energy: number, stones: number, reason?: string) => {
    setPet((prev) => {
      const newEnergy = Math.min(prev.maxEnergy, prev.energy + energy);
      const newStones = prev.rainbowStones + stones;
      const newHappiness = Math.min(100, prev.happiness + 5);

      // Level check
      let newLevel = prev.level;
      let newStage = prev.stage;
      if (newStones > 500 && prev.level < 5) {
        newLevel = 5;
        newStage = 'adventurer';
      } else if (newStones > 200 && prev.level < 3) {
        newLevel = 3;
        newStage = 'fledgling';
      }

      return {
        ...prev,
        energy: newEnergy,
        rainbowStones: newStones,
        happiness: newHappiness,
        level: newLevel,
        stage: newStage,
      };
    });
  };

  // Tasks actions
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'pomodoroCompleted'>): Task => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pomodoroCompleted: 0,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);

    // If task has date and time, also sync to calendar
    if (newTask.dueDate) {
      const startTime = newTask.dueTime || '09:00';
      const [h, m] = startTime.split(':').map(Number);
      const duration = newTask.durationMinutes || 30;
      const endMinutes = h * 60 + m + duration;
      const endH = String(Math.floor(endMinutes / 60) % 24).padStart(2, '0');
      const endM = String(endMinutes % 60).padStart(2, '0');

      const newCalEvent: CalendarEvent = {
        id: `cal-task-${newTask.id}`,
        title: `[Task] ${newTask.title}`,
        start: `${newTask.dueDate}T${startTime}`,
        end: `${newTask.dueDate}T${endH}:${endM}`,
        allDay: !newTask.dueTime,
        categoryId: newTask.categoryId,
        location: newTask.locationName,
        description: newTask.description,
        isTaskSynced: true,
        taskId: newTask.id,
      };

      setCalendarEvents((prev) => [...prev, newCalEvent]);

      // If auto-sync to Google Calendar is on
      if (autoSyncGoogleCalendar && googleCalendar.isConnected()) {
        googleCalendar.createEvent({
          title: `[Task] ${newTask.title}`,
          description: newTask.description,
          location: newTask.locationName,
          startDateTime: `${newTask.dueDate}T${startTime}`,
          endDateTime: `${newTask.dueDate}T${endH}:${endM}`,
          allDay: !newTask.dueTime,
        }).catch((err) => console.warn('Auto-sync task to GCal failed:', err));
      }
    }

    sound.playChime('bell');
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          return updated;
        }
        return t;
      })
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setCalendarEvents((prev) => prev.filter((e) => e.taskId !== id));
  };

  const toggleTaskComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextState = !t.completed;
          if (nextState) {
            // Task completed!
            sound.playChime('complete');
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.8 },
              colors: ['#4F46E5', '#10B981', '#F59E0B', '#EC4899'],
            });
            rewardPet(15, 25, `Completed: ${t.title}`);
          }
          return { ...t, completed: nextState };
        }
        return t;
      })
    );
  };

  const toggleSubTask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = t.subtasks.map((st) => {
            if (st.id === subtaskId) {
              const next = !st.completed;
              if (next) sound.playChime('bell');
              return { ...st, completed: next };
            }
            return st;
          });
          return { ...t, subtasks: updatedSubtasks };
        }
        return t;
      })
    );
  };

  const addSubTask = (taskId: string, title: string) => {
    if (!title.trim()) return;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newSub: { id: string; title: string; completed: boolean } = {
            id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            title: title.trim(),
            completed: false,
          };
          return { ...t, subtasks: [...t.subtasks, newSub] };
        }
        return t;
      })
    );
  };

  const deleteSubTask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return { ...t, subtasks: t.subtasks.filter((st) => st.id !== subtaskId) };
        }
        return t;
      })
    );
  };

  // Categories actions
  const addCategory = (cat: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Notes actions
  const addNote = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
    const newNote: Note = {
      ...noteData,
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
    sound.playChime('bell');
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n))
    );
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const addFolder = (name: string, icon: string = 'Folder', color: string = '#6B7280') => {
    const newFolder: NoteFolder = {
      id: `folder-${Date.now()}`,
      name,
      icon,
      color,
    };
    setFolders((prev) => [...prev, newFolder]);
  };

  const updateFolder = (id: string, updates: Partial<NoteFolder>) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const deleteFolder = (id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setNotes((prev) =>
      prev.map((n) => (n.folderId === id ? { ...n, folderId: 'f-1' } : n))
    );
  };

  // Routines actions
  const addRoutine = (routineData: Omit<Routine, 'id'>) => {
    const newRoutine: Routine = {
      ...routineData,
      id: `routine-${Date.now()}`,
    };
    setRoutines((prev) => [...prev, newRoutine]);
  };

  const updateRoutine = (id: string, updates: Partial<Routine>) => {
    setRoutines((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const deleteRoutine = (id: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
  };

  // Calendar actions
  const addCalendarEvent = async (eventData: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
    let gEventId: string | undefined = undefined;

    if (autoSyncGoogleCalendar && googleCalendar.isConnected()) {
      try {
        const gEvent = await googleCalendar.createEvent({
          title: eventData.title,
          description: eventData.description,
          location: eventData.location,
          startDateTime: eventData.start,
          endDateTime: eventData.end,
          allDay: eventData.allDay,
        });
        gEventId = gEvent.id;
      } catch (err) {
        console.warn('Google Calendar event push failed:', err);
      }
    }

    const newEvent: CalendarEvent = {
      ...eventData,
      id: `evt-${Date.now()}`,
      googleEventId: gEventId,
    };

    setCalendarEvents((prev) => [...prev, newEvent]);
    sound.playChime('bell');
    return newEvent;
  };

  const updateCalendarEvent = (id: string, updates: Partial<CalendarEvent>) => {
    setCalendarEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const deleteCalendarEvent = async (id: string) => {
    const event = calendarEvents.find((e) => e.id === id);
    if (event?.googleEventId && googleCalendar.isConnected()) {
      try {
        await googleCalendar.deleteEvent(event.googleEventId);
      } catch (err) {
        console.warn('Google Calendar delete error:', err);
      }
    }
    setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const connectGoogleCalendar = async () => {
    try {
      await googleCalendar.signIn();
      setIsGoogleCalendarConnected(true);
      await syncWithGoogleCalendar();
    } catch (err) {
      console.error('Sign in with Google error:', err);
      throw err;
    }
  };

  const disconnectGoogleCalendar = () => {
    googleCalendar.signOut();
    setIsGoogleCalendarConnected(false);
  };

  const syncWithGoogleCalendar = async (): Promise<{ added: number; updated: number }> => {
    if (!googleCalendar.isConnected()) {
      throw new Error('Please connect your Google Calendar first.');
    }

    try {
      const gEvents = await googleCalendar.fetchEvents();
      let addedCount = 0;

      setCalendarEvents((prev) => {
        const existingGoogleIds = new Set(prev.map((e) => e.googleEventId).filter(Boolean));
        const newEvents: CalendarEvent[] = [];

        gEvents.forEach((g) => {
          if (!existingGoogleIds.has(g.id)) {
            const isAllDay = !g.start.dateTime && !!g.start.date;
            const startStr = g.start.dateTime || `${g.start.date}T09:00`;
            const endStr = g.end.dateTime || `${g.end.date}T10:00`;

            newEvents.push({
              id: `gcal-${g.id}`,
              title: g.summary || 'Untitled Event',
              start: startStr,
              end: endStr,
              allDay: isAllDay,
              location: g.location,
              description: g.description,
              googleEventId: g.id,
              categoryId: 'cat-teaching',
            });
            addedCount++;
          }
        });

        return [...prev, ...newEvents];
      });

      confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.9 },
      });

      return { added: addedCount, updated: 0 };
    } catch (err) {
      console.error('Sync failed:', err);
      throw err;
    }
  };

  // Pet actions
  const feedPet = () => {
    if (pet.rainbowStones < 10) {
      sound.playChime('buzz');
      return;
    }
    setPet((prev) => ({
      ...prev,
      rainbowStones: prev.rainbowStones - 10,
      energy: Math.min(prev.maxEnergy, prev.energy + 10),
      happiness: Math.min(100, prev.happiness + 8),
    }));
    sound.playChime('complete');
  };

  const petBird = () => {
    setPet((prev) => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 5),
    }));
    sound.playChime('bell');
  };

  const sendPetOnAdventure = () => {
    if (pet.energy < 30 || pet.adventureStatus === 'exploring') {
      sound.playChime('buzz');
      return;
    }

    setPet((prev) => ({
      ...prev,
      energy: prev.energy - 30,
      adventureStatus: 'exploring',
      adventureProgress: 0,
    }));
    sound.playChime('complete');

    // Simulate adventure exploration progress
    const stories = [
      'Pip visited the school library courtyard, made friends with a bluebird, and brought back a golden bookmark!',
      'Pip perched near the classroom window, watched students read their poems, and found an enchanted apple!',
      'Pip flew over the botanical arboretum, discovered a cozy sunny bench, and collected shiny rainbow pebbles!',
    ];
    const pickedStory = stories[Math.floor(Math.random() * stories.length)];

    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      if (progress >= 100) {
        clearInterval(interval);
        setPet((p) => ({
          ...p,
          adventureStatus: 'returned',
          adventureProgress: 100,
          lastAdventureStory: pickedStory,
        }));
        sound.playChime('bell');
      } else {
        setPet((p) => ({ ...p, adventureProgress: progress }));
      }
    }, 1500);
  };

  const claimAdventureReward = () => {
    const rewardStones = 75;
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#F59E0B', '#10B981', '#EC4899', '#6366F1'],
    });
    setPet((prev) => ({
      ...prev,
      adventureStatus: 'idle',
      adventureProgress: 0,
      rainbowStones: prev.rainbowStones + rewardStones,
      happiness: 100,
    }));
    sound.playChime('complete');
  };

  const buyAccessory = (acc: PetAccessory) => {
    if (pet.rainbowStones < acc.cost || pet.inventory.includes(acc.id)) {
      sound.playChime('buzz');
      return;
    }
    setPet((prev) => ({
      ...prev,
      rainbowStones: prev.rainbowStones - acc.cost,
      inventory: [...prev.inventory, acc.id],
      equippedAccessories: [...prev.equippedAccessories, acc.id],
    }));
    sound.playChime('complete');
    confetti({ particleCount: 40, spread: 50 });
  };

  const toggleEquipAccessory = (accId: string) => {
    setPet((prev) => {
      const isEquipped = prev.equippedAccessories.includes(accId);
      return {
        ...prev,
        equippedAccessories: isEquipped
          ? prev.equippedAccessories.filter((id) => id !== accId)
          : [...prev.equippedAccessories, accId],
      };
    });
    sound.playChime('bell');
  };

  const toggleHabit = (habitId: string) => {
    setHabitGoals((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const nextCount = h.currentCount >= h.targetCount ? 0 : h.currentCount + 1;
          const isComplete = nextCount >= h.targetCount;
          if (isComplete && !h.completed) {
            sound.playChime('complete');
            rewardPet(h.energyReward, h.stonesReward, `Habit: ${h.title}`);
            confetti({ particleCount: 40, spread: 50 });
          } else {
            sound.playChime('bell');
          }
          return { ...h, currentCount: nextCount, completed: isComplete };
        }
        return h;
      })
    );
  };

  const addHabitGoal = (habitData: Omit<HabitGoal, 'id' | 'completed' | 'currentCount'>) => {
    const newHabit: HabitGoal = {
      ...habitData,
      id: `habit-${Date.now()}`,
      currentCount: 0,
      completed: false,
    };
    setHabitGoals((prev) => [...prev, newHabit]);
    sound.playChime('bell');
  };

  // Wellness actions
  const addMoodEntry = (mood: MoodEntry['mood'], note: string) => {
    const newEntry: MoodEntry = {
      id: `mood-${Date.now()}`,
      date: getTodayDate(),
      mood,
      note,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMoodEntries((prev) => [newEntry, ...prev]);
    rewardPet(10, 15, 'Mood check-in');
    sound.playChime('complete');
  };

  const addGratitudeEntry = (text: string) => {
    if (!text.trim()) return;
    const newEntry: GratitudeEntry = {
      id: `gratitude-${Date.now()}`,
      date: getTodayDate(),
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setGratitudeEntries((prev) => [newEntry, ...prev]);
    rewardPet(10, 20, 'Gratitude entry');
    sound.playChime('complete');
  };

  // Focus linkage
  const recordFocusSession = (minutes: number, taskId?: string) => {
    rewardPet(25, 40, 'Completed Pomodoro focus');
    confetti({ particleCount: 50, spread: 60 });
    if (taskId) {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            return { ...t, pomodoroCompleted: t.pomodoroCompleted + 1 };
          }
          return t;
        })
      );
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
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
        notes,
        folders,
        addNote,
        updateNote,
        deleteNote,
        addFolder,
        updateFolder,
        deleteFolder,
        routines,
        addRoutine,
        updateRoutine,
        deleteRoutine,
        calendarEvents,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        isGoogleCalendarConnected,
        connectGoogleCalendar,
        disconnectGoogleCalendar,
        syncWithGoogleCalendar,
        autoSyncGoogleCalendar,
        setAutoSyncGoogleCalendar,
        pet,
        habitGoals,
        shopAccessories,
        feedPet,
        petBird,
        sendPetOnAdventure,
        claimAdventureReward,
        buyAccessory,
        toggleEquipAccessory,
        toggleHabit,
        addHabitGoal,
        moodEntries,
        addMoodEntry,
        gratitudeEntries,
        addGratitudeEntry,
        activeFocusTaskId,
        setActiveFocusTaskId,
        recordFocusSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
