import React, { createContext, useContext, useState, useEffect } from 'react';
import type { TaskType, TimeConfig, Schedule, DragState } from '../types';

interface AppContextType {
  // Schedule state
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
  
  // Task types
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
  
  // Computed values
  timeSlots: string[];
  days: string[];
  
  // Helper functions
  calculateRemainingHours: () => number;
  calculateDevelopHours: () => number;
  generateHTML: () => string;
  saveToHistory: (newSchedule: Schedule) => void;
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

  const value: AppContextType = {
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};