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

  // PROJECT HEALTH CALCULATION
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

  // Generate ideal burn chart points when sprint changes
  useEffect(() => {
    if (currentSprint) {
      const totalHours = tasks.reduce((sum, task) => sum + task.workHours, 0);
      const sprintDuration = Math.ceil((currentSprint.endDate.getTime() - currentSprint.startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Generate ideal burn line points
      const idealPoints: BurnChartPoint[] = [];
      for (let i = 0; i <= sprintDuration; i++) {
        const date = new Date(currentSprint.startDate.getTime() + i * 24 * 60 * 60 * 1000);
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
  }, [currentSprint, tasks]);

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
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};