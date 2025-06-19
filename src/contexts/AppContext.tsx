import React, { createContext, useContext, useState, useEffect } from 'react';
import type { TaskType, TimeConfig, Schedule, DragState, Task, Sprint, ProjectHealth, KanbanState } from '../types';

interface AppContextType {
  // Schedule state (legacy calendar system)
  schedule: Schedule;
  setSchedule: (schedule: Schedule) => void;
  updateSchedule: (schedule: Schedule) => void;
  
  // Config state
  timeConfig: TimeConfig;
  setTimeConfig: React.Dispatch<React.SetStateAction<TimeConfig>>;
  
  // UI state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Task types (legacy)
  taskTypes: TaskType[];
  setTaskTypes: React.Dispatch<React.SetStateAction<TaskType[]>>;
  selectedTask: TaskType | null;
  setSelectedTask: React.Dispatch<React.SetStateAction<TaskType | null>>;
  
  // Drag state
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  dragStart: DragState | null;
  setDragStart: React.Dispatch<React.SetStateAction<DragState | null>>;
  dragEnd: DragState | null;
  setDragEnd: React.Dispatch<React.SetStateAction<DragState | null>>;
  
  // Modal state
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  pendingDragData: any;
  setPendingDragData: React.Dispatch<React.SetStateAction<any>>;
  
  // Edit state
  editingTask: { key: string; name: string } | null;
  setEditingTask: React.Dispatch<React.SetStateAction<{ key: string; name: string } | null>>;
  
  // History state
  history: Schedule[];
  setHistory: React.Dispatch<React.SetStateAction<Schedule[]>>;
  currentHistoryIndex: number;
  setCurrentHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  
  // NEW TASK MANAGEMENT SYSTEM
  // Tasks state
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (task: Omit<Task, 'taskId' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, newState: KanbanState) => boolean;
  divideTask: (taskId: string, newTask: Omit<Task, 'taskId' | 'createdAt' | 'updatedAt'>) => void;
  branchTask: (taskId: string, taskA: Omit<Task, 'taskId' | 'createdAt' | 'updatedAt'>, taskB: Omit<Task, 'taskId' | 'createdAt' | 'updatedAt'>) => void;
  
  // Sprint state
  currentSprint: Sprint | null;
  setCurrentSprint: React.Dispatch<React.SetStateAction<Sprint | null>>;
  sprints: Sprint[];
  setSprints: React.Dispatch<React.SetStateAction<Sprint[]>>;
  
  // Work Area state
  currentWorkTask: Task | null;
  setCurrentWorkTask: React.Dispatch<React.SetStateAction<Task | null>>;
  
  // Project Health
  projectHealth: ProjectHealth;
  calculateProjectHealth: () => ProjectHealth;
  
  // Computed values (legacy)
  timeSlots: string[];
  days: string[];
  
  // Helper functions (legacy)
  calculateRemainingHours: () => number;
  calculateDevelopHours: () => number;
  generateHTML: () => string;
  saveToHistory: (newSchedule: Schedule) => void;
  
  // New helper functions
  getTasksByState: (state: KanbanState) => Task[];
  canMoveTaskToOngoing: (taskId: string) => boolean;
  getDependencyChain: (taskId: string) => string[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedule, setSchedule] = useState<Schedule>({});
  const [timeConfig, setTimeConfig] = useState<TimeConfig>(() => {
    const saved = localStorage.getItem("timeConfig");
    return saved
      ? JSON.parse(saved)
      : {
          startTime: 9,
          endTime: 17,
          duration: 1,
        };
  });
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("isDarkMode");
    return saved ? JSON.parse(saved) : false;
  });
  
  const [taskTypes, setTaskTypes] = useState<TaskType[]>(() => {
    const saved = localStorage.getItem("taskTypes");
    return saved
      ? JSON.parse(saved)
      : [
          { id: "meeting", name: "會議", color: "#3b82f6" },
          { id: "development", name: "開發", color: "#10b981" },
          { id: "integration", name: "整合", color: "#ef4444" },
          { id: "research", name: "技術研究", color: "#eab308" },
          { id: "lunch", name: "午休", color: "#f97316" },
        ];
  });
  
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<DragState | null>(null);
  const [dragEnd, setDragEnd] = useState<DragState | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [pendingDragData, setPendingDragData] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<{ key: string; name: string } | null>(null);
  const [history, setHistory] = useState<Schedule[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);

  // NEW TASK MANAGEMENT STATE
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved).map((task: any) => ({
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt)
    })) : [];
  });
  
  const [currentSprint, setCurrentSprint] = useState<Sprint | null>(() => {
    const saved = localStorage.getItem("currentSprint");
    return saved ? {
      ...JSON.parse(saved),
      startDate: new Date(JSON.parse(saved).startDate),
      endDate: new Date(JSON.parse(saved).endDate)
    } : null;
  });
  
  const [sprints, setSprints] = useState<Sprint[]>(() => {
    const saved = localStorage.getItem("sprints");
    return saved ? JSON.parse(saved).map((sprint: any) => ({
      ...sprint,
      startDate: new Date(sprint.startDate),
      endDate: new Date(sprint.endDate)
    })) : [];
  });
  
  const [currentWorkTask, setCurrentWorkTask] = useState<Task | null>(() => {
    const saved = localStorage.getItem("currentWorkTask");
    if (saved) {
      const taskData = JSON.parse(saved);
      return {
        ...taskData,
        createdAt: new Date(taskData.createdAt),
        updatedAt: new Date(taskData.updatedAt)
      };
    }
    return null;
  });

  // NEW TASK MANAGEMENT FUNCTIONS
  const generateTaskId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const addTask = (taskData: Omit<Task, 'taskId' | 'createdAt' | 'updatedAt'>): void => {
    const newTask: Task = {
      ...taskData,
      taskId: generateTaskId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (taskId: string, updates: Partial<Task>): void => {
    setTasks(prev => prev.map(task => 
      task.taskId === taskId 
        ? { ...task, ...updates, updatedAt: new Date() }
        : task
    ));
  };

  const deleteTask = (taskId: string): void => {
    setTasks(prev => {
      const newTasks = prev.filter(task => task.taskId !== taskId);
      return newTasks.map(task => ({
        ...task,
        dependencies: task.dependencies.filter(depId => depId !== taskId)
      }));
    });
  };

  const getTasksByState = (state: KanbanState): Task[] => {
    return tasks.filter(task => task.state === state).sort((a, b) => a.priority - b.priority);
  };

  const getDependencyChain = (taskId: string): string[] => {
    const visited = new Set<string>();
    const chain: string[] = [];
    
    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const task = tasks.find(t => t.taskId === id);
      if (task) {
        task.dependencies.forEach(depId => {
          traverse(depId);
          if (!chain.includes(depId)) chain.push(depId);
        });
      }
    };
    
    traverse(taskId);
    return chain;
  };

  const canMoveTaskToOngoing = (taskId: string): boolean => {
    const task = tasks.find(t => t.taskId === taskId);
    if (!task) return false;
    
    return task.dependencies.every(depId => {
      const depTask = tasks.find(t => t.taskId === depId);
      return depTask?.state === 'done';
    });
  };

  const moveTask = (taskId: string, newState: KanbanState): boolean => {
    const task = tasks.find(t => t.taskId === taskId);
    if (!task) return false;

    if (newState === 'ongoing' && !canMoveTaskToOngoing(taskId)) {
      return false;
    }

    updateTask(taskId, { state: newState });
    return true;
  };

  const divideTask = (taskId: string, newTaskData: Omit<Task, 'taskId' | 'createdAt' | 'updatedAt'>): void => {
    const originalTask = tasks.find(t => t.taskId === taskId);
    if (!originalTask) return;

    const newTask: Task = {
      ...newTaskData,
      taskId: generateTaskId(),
      state: originalTask.state,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTasks(prev => [...prev, newTask]);
  };

  const branchTask = (taskId: string, taskAData: Omit<Task, 'taskId' | 'createdAt' | 'updatedAt'>, taskBData: Omit<Task, 'taskId' | 'createdAt' | 'updatedAt'>): void => {
    const originalTask = tasks.find(t => t.taskId === taskId);
    if (!originalTask) return;

    const taskBId = generateTaskId();
    const taskAId = generateTaskId();

    const taskB: Task = {
      ...taskBData,
      taskId: taskBId,
      state: originalTask.state === 'ongoing' ? 'ongoing' : originalTask.state,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const taskA: Task = {
      ...taskAData,
      taskId: taskAId,
      dependencies: [...taskAData.dependencies, taskBId],
      state: originalTask.state === 'ongoing' ? 'queueing' : originalTask.state,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTasks(prev => [...prev.filter(t => t.taskId !== taskId), taskA, taskB]);
  };

  const calculateProjectHealth = (): ProjectHealth => {
    if (!currentSprint) {
      return {
        healthPercentage: 100,
        laggedHours: 0,
        remainingHours: 0,
        totalRequiredHours: 0,
        availableHours: 0,
      };
    }

    const now = new Date();
    const sprintStart = currentSprint.startDate;
    const sprintEnd = currentSprint.endDate;
    
    const totalSprintDays = Math.ceil((sprintEnd.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((now.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, totalSprintDays - elapsedDays);
    
    const dailyWorkHours = currentSprint.workingHours.end - currentSprint.workingHours.start;
    const availableHours = remainingDays * dailyWorkHours * currentSprint.workingDays.length / 7;
    
    const incompleteTasks = tasks.filter(task => task.state !== 'done');
    const totalRequiredHours = incompleteTasks.reduce((sum, task) => sum + task.workHours, 0);
    
    const laggedHours = Math.max(0, totalRequiredHours - availableHours);
    const healthPercentage = availableHours > 0 
      ? Math.min(100, Math.max(0, (1 - laggedHours / availableHours) * 100))
      : totalRequiredHours === 0 ? 100 : 0;

    return {
      healthPercentage,
      laggedHours,
      remainingHours: availableHours,
      totalRequiredHours,
      availableHours,
    };
  };

  const projectHealth = calculateProjectHealth();

  const days: string[] = [
    "Wednesday",
    "Thursday", 
    "Friday",
    "Monday",
    "Tuesday",
  ];

  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    let currentTime = timeConfig.startTime;

    while (currentTime < timeConfig.endTime) {
      const endTime = currentTime + timeConfig.duration;
      const startHour = Math.floor(currentTime);
      const startMin = (currentTime % 1) * 60;
      const endHour = Math.floor(endTime);
      const endMin = (endTime % 1) * 60;

      const timeSlot = `${startHour.toString().padStart(2, "0")}:${startMin
        .toString()
        .padStart(2, "0")}-${endHour.toString().padStart(2, "0")}:${endMin
        .toString()
        .padStart(2, "0")}`;
      slots.push(timeSlot);

      currentTime += timeConfig.duration;
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const calculateRemainingHours = (): number => {
    const totalSlots = timeSlots.length * days.length;
    const occupiedSlots = Object.keys(schedule).length;
    return (totalSlots - occupiedSlots) * timeConfig.duration;
  };

  const calculateDevelopHours = (): number => {
    let count = 0;
    Object.values(schedule).forEach((task) => {
      if (task.id === "development") {
        count++;
      }
    });
    return count * timeConfig.duration;
  };

  const generateHTML = (): string => {
    let html = `<table border="1" style="border-collapse: collapse; width: 100%;">
  <thead>
    <tr>
      <th style="padding: 8px; text-align: center;">時間</th>
      <th style="padding: 8px; text-align: center;">Wednesday</th>
      <th style="padding: 8px; text-align: center;">Thursday</th>
      <th style="padding: 8px; text-align: center;">Friday</th>
      <th style="padding: 8px; text-align: center;">Monday</th>
      <th style="padding: 8px; text-align: center;">Tuesday</th>
    </tr>
  </thead>
  <tbody>\n`;

    timeSlots.forEach((time) => {
      html += `    <tr>
      <td style="padding: 8px; text-align: center; font-weight: bold;">${time}</td>`;
      days.forEach((day) => {
        const task = schedule[`${day}-${time}`];
        const cellContent = task ? task.name : "";
        const cellStyle = task
          ? `background-color: ${task.color}; color: white; font-weight: bold;`
          : "";
        html += `
      <td style="padding: 8px; text-align: center; ${cellStyle}">${cellContent}</td>`;
      });
      html += `
    </tr>\n`;
    });

    html += `  </tbody>
</table>`;

    return html;
  };

  const saveToHistory = (newSchedule: Schedule): void => {
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    newHistory.push({ ...schedule });
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setCurrentHistoryIndex((prev) => prev + 1);
    }
    setHistory(newHistory);
  };

  const updateSchedule = (newSchedule: Schedule): void => {
    saveToHistory(newSchedule);
    setSchedule(newSchedule);
  };

  // Effects
  useEffect(() => {
    localStorage.setItem("timeConfig", JSON.stringify(timeConfig));
  }, [timeConfig]);

  useEffect(() => {
    localStorage.setItem("taskTypes", JSON.stringify(taskTypes));
  }, [taskTypes]);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    if (Object.keys(schedule).length > 0) {
      localStorage.setItem("schedule", JSON.stringify(schedule));
    }
  }, [schedule]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (currentHistoryIndex >= 0 && history.length > 0) {
          const previousSchedule = history[currentHistoryIndex];
          setSchedule(previousSchedule);
          setCurrentHistoryIndex((prev) => prev - 1);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentHistoryIndex, history]);

  useEffect(() => {
    const savedSchedule = localStorage.getItem("schedule");
    if (savedSchedule) {
      try {
        const parsedSchedule = JSON.parse(savedSchedule);
        if (Object.keys(parsedSchedule).length > 0) {
          setSchedule(parsedSchedule);
        }
      } catch (error) {
        console.error("Error loading schedule from localStorage:", error);
      }
    }
  }, []);

  // NEW EFFECTS FOR TASK SYSTEM
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (currentSprint) {
      localStorage.setItem("currentSprint", JSON.stringify(currentSprint));
    }
  }, [currentSprint]);

  useEffect(() => {
    localStorage.setItem("sprints", JSON.stringify(sprints));
  }, [sprints]);

  useEffect(() => {
    if (currentWorkTask) {
      localStorage.setItem("currentWorkTask", JSON.stringify(currentWorkTask));
    }
  }, [currentWorkTask]);

  const value: AppContextType = {
    // Legacy calendar system
    schedule,
    setSchedule,
    updateSchedule,
    timeConfig,
    setTimeConfig,
    sidebarCollapsed,
    setSidebarCollapsed,
    isDarkMode,
    setIsDarkMode,
    taskTypes,
    setTaskTypes,
    selectedTask,
    setSelectedTask,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    dragEnd,
    setDragEnd,
    showModal,
    setShowModal,
    pendingDragData,
    setPendingDragData,
    editingTask,
    setEditingTask,
    history,
    setHistory,
    currentHistoryIndex,
    setCurrentHistoryIndex,
    timeSlots,
    days,
    calculateRemainingHours,
    calculateDevelopHours,
    generateHTML,
    saveToHistory,
    
    // New task management system
    tasks,
    setTasks,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    divideTask,
    branchTask,
    currentSprint,
    setCurrentSprint,
    sprints,
    setSprints,
    currentWorkTask,
    setCurrentWorkTask,
    projectHealth,
    calculateProjectHealth,
    getTasksByState,
    canMoveTaskToOngoing,
    getDependencyChain,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};