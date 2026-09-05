// Natural Language Processing (NLP) Parser for Tasks and Dates
import { Priority } from '../types';

export interface ParsedTaskInput {
  title: string;
  dueDate?: string;
  dueTime?: string;
  priority?: Priority;
  tags: string[];
  locationName?: string;
}

export function parseNaturalLanguageTask(input: string): ParsedTaskInput {
  let cleaned = input.trim();
  const tags: string[] = [];
  let priority: Priority | undefined = undefined;
  let dueDate: string | undefined = undefined;
  let dueTime: string | undefined = undefined;
  let locationName: string | undefined = undefined;

  // 1. Extract Tags (#tag)
  const tagMatches = cleaned.match(/#([\w-]+)/g);
  if (tagMatches) {
    tagMatches.forEach((t) => tags.push(t.replace('#', '')));
    cleaned = cleaned.replace(/#([\w-]+)/g, '').trim();
  }

  // 2. Extract Priority (!high, !urgent, !med, !medium, !low)
  if (/(?:!high|!urgent|priority:high)/i.test(cleaned)) {
    priority = 'high';
    cleaned = cleaned.replace(/(?:!high|!urgent|priority:high)/gi, '').trim();
  } else if (/(?:!med|!medium|priority:med(?:ium)?)/i.test(cleaned)) {
    priority = 'medium';
    cleaned = cleaned.replace(/(?:!med|!medium|priority:med(?:ium)?)/gi, '').trim();
  } else if (/(?:!low|priority:low)/i.test(cleaned)) {
    priority = 'low';
    cleaned = cleaned.replace(/(?:!low|priority:low)/gi, '').trim();
  }

  // 3. Extract Location ("in Room 102", "at Library", "at Campus")
  const locMatch = cleaned.match(/\b(?:in|at)\s+([A-Z0-9][a-zA-Z0-9\s]{2,20})(?=\s+(?:tomorrow|today|on|at\s+\d|\b)|$)/);
  if (locMatch && !locMatch[1].match(/^\d/)) {
    // Avoid matching "at 3pm" as location
    if (!locMatch[1].toLowerCase().includes('pm') && !locMatch[1].toLowerCase().includes('am')) {
      locationName = locMatch[1].trim();
      cleaned = cleaned.replace(locMatch[0], '').trim();
    }
  }

  // 4. Extract Date & Time
  const now = new Date();
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // Time extraction: e.g. "at 2pm", "at 14:30", "10:00 am", "3:15pm"
  const timeMatch = cleaned.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i) ||
                    cleaned.match(/\bat\s+(\d{1,2}):(\d{2})\b/i);

  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3]?.toLowerCase();

    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;

    dueTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    cleaned = cleaned.replace(timeMatch[0], '').trim();
  }

  // Relative Dates: "today", "tonight", "tomorrow", "next monday", etc.
  if (/\b(?:today|tonight)\b/i.test(cleaned)) {
    dueDate = formatDate(now);
    cleaned = cleaned.replace(/\b(?:today|tonight)\b/gi, '').trim();
  } else if (/\btomorrow\b/i.test(cleaned)) {
    const tmrw = new Date(now);
    tmrw.setDate(tmrw.getDate() + 1);
    dueDate = formatDate(tmrw);
    cleaned = cleaned.replace(/\btomorrow\b/gi, '').trim();
  } else {
    // Day of week check: "on friday", "this friday", "next monday"
    const dowRegex = new RegExp(`\\b(?:on\\s+|this\\s+|next\\s+)?(${daysOfWeek.join('|')})\\b`, 'i');
    const dowMatch = cleaned.match(dowRegex);
    if (dowMatch) {
      const targetDay = daysOfWeek.indexOf(dowMatch[1].toLowerCase());
      const currentDay = now.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7;
      if (dowMatch[0].toLowerCase().includes('next') && diff < 7) diff += 7;

      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + diff);
      dueDate = formatDate(targetDate);
      cleaned = cleaned.replace(dowMatch[0], '').trim();
    }
  }

  // Clean trailing punctuation or extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').replace(/^[-:,]\s*/, '').replace(/[-:,]\s*$/, '').trim();

  return {
    title: cleaned || input,
    dueDate,
    dueTime,
    priority,
    tags,
    locationName,
  };
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
