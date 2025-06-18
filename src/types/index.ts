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