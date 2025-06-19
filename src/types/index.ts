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
  startDate: Date;
  endDate: Date;
  workingDays: string[];
  workingHours: { start: number; end: number; };
}

export interface ProjectHealth {
  healthPercentage: number;
  laggedHours: number;
  remainingHours: number;
  totalRequiredHours: number;
  availableHours: number;
}