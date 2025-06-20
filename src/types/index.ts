export interface TaskType {
  id: string;
  name: string;
  color: string;
}

export interface TimeConfig {
  startTime: number;
  endTime: number;
  duration: number;
}

export interface ScheduledTask extends TaskType {
  isMultiSlot?: boolean;
}

export interface Schedule {
  [key: string]: ScheduledTask;
}

// Enhanced Calendar Time Block types
export interface TimeBlock {
  id: string;
  type: 'meeting' | 'lunch' | 'integration' | 'development' | 'research' | 'break';
  title: string;
  startTime: number; // Hour in 24h format (e.g., 9 for 9:00)
  duration: number; // Duration in hours (e.g., 0.5 for 30 minutes)
  date: string; // Date in YYYY-MM-DD format
  color: string;
  description?: string;
}

export interface CalendarDay {
  date: string;
  blocks: TimeBlock[];
}

export interface CalendarSchedule {
  [dateKey: string]: TimeBlock[];
}

export interface DragState {
  day: string;
  time: string;
}

export type KanbanState = 'pending' | 'queueing' | 'ongoing' | 'done';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  taskId: string;
  taskName: string;
  category: string;
  dependencies: string[];
  state: KanbanState;
  iteration: string;
  workHours: number;
  description: string;
  notes: string;
  items: ChecklistItem[];
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sprint {
  id: string;
  name: string;
  iterationWeeks: number; // Length in weeks (1, 2, 3, 4, 5, 6...)
  startDay: number; // Day of week (0=Sunday, 1=Monday, etc.)
  workingDays: string[];
  workingHours: { start: number; end: number; };
  createdAt: Date; // When this sprint configuration was created
}

export interface ProjectHealth {
  healthPercentage: number;
  laggedHours: number;
  remainingHours: number;
  totalRequiredHours: number;
  availableHours: number;
}