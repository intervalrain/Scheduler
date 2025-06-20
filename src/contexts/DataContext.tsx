import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Sprint, ProjectHealth, KanbanState } from '../types';

interface BurnChartPoint {
  date: Date;
  remainingHours: number;
  completedTaskId?: string;
  isIdeal: boolean;
}

interface DataContextType {
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
  
  // Burn Chart data
  burnChartData: BurnChartPoint[];
  addBurnChartPoint: (taskId: string) => void;
  
  // Project Health
  projectHealth: ProjectHealth;
  calculateProjectHealth: () => ProjectHealth;
  
  // Helper functions
  getTasksByState: (state: KanbanState) => Task[];
  canMoveTaskToOngoing: (taskId: string) => boolean;
  getDependencyChain: (taskId: string) => string[];
  
  // Sprint helper functions
  getCurrentSprintDates: () => { startDate: Date; endDate: Date } | null;
  getRemainingSprintTime: () => string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Tasks state
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved).map((task: any) => ({
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt)
    })) : [];
  });
  
  // Sprint state
  const [currentSprint, setCurrentSprint] = useState<Sprint | null>(() => {
    const saved = localStorage.getItem("currentSprint");
    if (saved) {
      try {
        const sprintData = JSON.parse(saved);
        // Handle both old and new format
        if (sprintData.startDate) {
          // Old format - convert to new format
          return null; // Clear old format, user will need to reconfigure
        } else {
          // New format
          return {
            ...sprintData,
            createdAt: new Date(sprintData.createdAt)
          };
        }
      } catch {
        return null;
      }
    }
    return null;
  });
  
  const [sprints, setSprints] = useState<Sprint[]>(() => {
    const saved = localStorage.getItem("sprints");
    if (saved) {
      try {
        return JSON.parse(saved).map((sprint: any) => ({
          ...sprint,
          createdAt: new Date(sprint.createdAt)
        })).filter((sprint: any) => !sprint.startDate); // Filter out old format sprints
      } catch {
        return [];
      }
    }
    return [];
  });
  
  // Work Area state
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

  // Burn Chart state
  const [burnChartData, setBurnChartData] = useState<BurnChartPoint[]>(() => {
    const saved = localStorage.getItem("burnChartData");
    return saved ? JSON.parse(saved).map((point: any) => ({
      ...point,
      date: new Date(point.date)
    })) : [];
  });

  // TASK MANAGEMENT FUNCTIONS
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
    
    // Add burn chart point when task is completed
    if (newState === 'done' && task.state !== 'done') {
      addBurnChartPoint(taskId);
    }
    
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

  // BURN CHART FUNCTIONS
  const addBurnChartPoint = (taskId: string): void => {
    const completedTask = tasks.find(t => t.taskId === taskId);
    if (!completedTask || !currentSprint) return;

    const now = new Date();
    const remainingTasks = tasks.filter(t => t.state !== 'done' && t.taskId !== taskId);
    const remainingHours = remainingTasks.reduce((sum, task) => sum + task.workHours, 0);

    const newPoint: BurnChartPoint = {
      date: now,
      remainingHours,
      completedTaskId: taskId,
      isIdeal: false,
    };

    setBurnChartData(prev => [...prev, newPoint]);
  };

  // SPRINT HELPER FUNCTIONS
  const getCurrentSprintDates = (): { startDate: Date; endDate: Date } | null => {
    if (!currentSprint) return null;

    const now = new Date();
    const { iterationWeeks, startDay, createdAt } = currentSprint;

    // Find the first occurrence of the start day on or after the sprint creation date
    const baseDate = new Date(createdAt);
    const dayDiff = (startDay - baseDate.getDay() + 7) % 7;
    const firstSprintStart = new Date(baseDate);
    firstSprintStart.setDate(baseDate.getDate() + dayDiff);

    // Calculate which iteration we're currently in
    const daysSinceFirstSprint = Math.floor((now.getTime() - firstSprintStart.getTime()) / (1000 * 60 * 60 * 24));
    const currentIteration = Math.floor(daysSinceFirstSprint / (iterationWeeks * 7));

    // Calculate current sprint dates
    const startDate = new Date(firstSprintStart);
    startDate.setDate(firstSprintStart.getDate() + (currentIteration * iterationWeeks * 7));
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (iterationWeeks * 7) - 1);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  };

  const getRemainingSprintTime = (): string | null => {
    const sprintDates = getCurrentSprintDates();
    if (!sprintDates) return null;

    const now = new Date();
    const { endDate } = sprintDates;
    
    if (now > endDate) return "Sprint 已結束";

    const diffMs = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

    if (diffDays > 1) {
      return `剩餘 ${diffDays} 天`;
    } else if (diffHours > 1) {
      return `剩餘 ${diffHours} 小時`;
    } else {
      return "即將結束";
    }
  };

  // PROJECT HEALTH CALCULATION
  const calculateProjectHealth = (): ProjectHealth => {
    const sprintDates = getCurrentSprintDates();
    if (!currentSprint || !sprintDates) {
      return {
        healthPercentage: 100,
        laggedHours: 0,
        remainingHours: 0,
        totalRequiredHours: 0,
        availableHours: 0,
      };
    }

    const now = new Date();
    const { endDate } = sprintDates;
    
    // Calculate remaining working days
    const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    const dailyWorkHours = currentSprint.workingHours.end - currentSprint.workingHours.start;
    const workingDayRatio = currentSprint.workingDays.length / 7;
    const availableHours = remainingDays * dailyWorkHours * workingDayRatio;
    
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

  // Generate ideal burn chart points when sprint changes
  useEffect(() => {
    if (currentSprint) {
      const sprintDates = getCurrentSprintDates();
      if (!sprintDates) return;
      
      const { startDate, endDate } = sprintDates;
      const totalHours = tasks.reduce((sum, task) => sum + task.workHours, 0);
      const sprintDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Generate ideal burn line points
      const idealPoints: BurnChartPoint[] = [];
      for (let i = 0; i <= sprintDuration; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const remainingHours = totalHours * (1 - i / sprintDuration);
        idealPoints.push({
          date,
          remainingHours,
          isIdeal: true,
        });
      }
      
      // Only add ideal points if burnChartData is empty
      setBurnChartData(prev => prev.length === 0 ? idealPoints : prev);
    }
  }, [currentSprint, tasks, getCurrentSprintDates]);

  // EFFECTS FOR PERSISTENCE
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

  useEffect(() => {
    localStorage.setItem("burnChartData", JSON.stringify(burnChartData));
  }, [burnChartData]);

  const value: DataContextType = {
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
    burnChartData,
    addBurnChartPoint,
    projectHealth,
    calculateProjectHealth,
    getTasksByState,
    canMoveTaskToOngoing,
    getDependencyChain,
    getCurrentSprintDates,
    getRemainingSprintTime,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};