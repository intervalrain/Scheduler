import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar, Clock, Play, RotateCcw, AlertTriangle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useDataContext } from '../../contexts/DataContext';
import { useUserContext } from '../../contexts/UserContext';
import { Task } from '../../types';

interface GanttTask {
  task: Task;
  startDate: Date;
  endDate: Date;
  duration: number;
  progress: number;
  color: string;
  canStart: boolean;
  dependencies: string[];
}

interface GanttColumn {
  date: Date;
  isWorkingDay: boolean;
  isToday: boolean;
  dayOfWeek: string;
}

type ViewMode = 'day' | 'week' | 'month';

export const GanttModule: React.FC = () => {
  const { 
    tasks, 
    currentSprint, 
    projectHealth, 
    getTasksByState, 
    canMoveTaskToOngoing,
    getDependencyChain 
  } = useDataContext();
  
  const { calculateDevelopHours } = useUserContext();
  
  const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [columnWidth, setColumnWidth] = useState(40);
  const ganttRef = useRef<HTMLDivElement>(null);

  const taskColors = {
    'pending': '#94a3b8',
    'queueing': '#fbbf24', 
    'ongoing': '#3b82f6',
    'done': '#10b981'
  };

  // Generate timeline columns based on view mode
  const generateTimelineColumns = useMemo((): GanttColumn[] => {
    if (!currentSprint) return [];

    const columns: GanttColumn[] = [];
    const startDate = new Date(currentSprint.startDate);
    const endDate = new Date(currentSprint.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let current = new Date(startDate);
    
    while (current <= endDate) {
      const isWorkingDay = currentSprint.workingDays.includes(
        current.toLocaleDateString('en-US', { weekday: 'long' })
      );
      
      const currentDate = new Date(current);
      currentDate.setHours(0, 0, 0, 0);
      
      columns.push({
        date: new Date(current),
        isWorkingDay,
        isToday: currentDate.getTime() === today.getTime(),
        dayOfWeek: current.toLocaleDateString('zh-TW', { weekday: 'short' })
      });

      if (viewMode === 'day') {
        current.setDate(current.getDate() + 1);
      } else if (viewMode === 'week') {
        current.setDate(current.getDate() + 7);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }

    return columns;
  }, [currentSprint, viewMode]);

  // Generate Gantt tasks with calculated positions
  const generateGanttTasks = useMemo((): GanttTask[] => {
    if (!currentSprint) return [];

    const ganttTasks: GanttTask[] = [];
    const incompleteTasks = tasks.filter(task => task.state !== 'done');
    
    const sortedTasks = [...incompleteTasks].sort((a, b) => {
      if (a.state === 'ongoing' && b.state !== 'ongoing') return -1;
      if (b.state === 'ongoing' && a.state !== 'ongoing') return 1;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const dailyWorkHours = currentSprint.workingHours.end - currentSprint.workingHours.start;
    const developmentHours = calculateDevelopHours();
    const availableHoursPerDay = Math.max(0, dailyWorkHours - (developmentHours / 5));
    
    let currentDate = new Date(currentSprint.startDate);
    let currentDayHours = 0;
    const completedTasks = new Set<string>();

    // Add completed tasks first
    const doneTasks = tasks.filter(task => task.state === 'done');
    doneTasks.forEach(task => {
      const duration = Math.max(1, task.workHours / 8); // Convert hours to days
      const startDate = new Date(task.createdAt);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration - 1);

      ganttTasks.push({
        task,
        startDate,
        endDate,
        duration,
        progress: 100,
        color: taskColors[task.state],
        canStart: true,
        dependencies: task.dependencies
      });
      completedTasks.add(task.taskId);
    });

    // Schedule incomplete tasks
    for (const task of sortedTasks) {
      const dependencies = getDependencyChain(task.taskId);
      const canStart = dependencies.every(depId => completedTasks.has(depId));
      
      if (!canStart && task.state === 'pending') {
        // Place blocked tasks after their dependencies
        const taskStartDate = new Date(currentSprint.endDate);
        const duration = Math.max(1, task.workHours / 8);
        const taskEndDate = new Date(taskStartDate);
        taskEndDate.setDate(taskEndDate.getDate() + duration - 1);

        ganttTasks.push({
          task,
          startDate: taskStartDate,
          endDate: taskEndDate,
          duration,
          progress: 0,
          color: taskColors[task.state],
          canStart: false,
          dependencies: task.dependencies
        });
        continue;
      }

      let remainingHours = task.workHours;
      const taskStartDate = new Date(currentDate);
      
      while (remainingHours > 0 && currentDate <= currentSprint.endDate) {
        const isWorkingDay = currentSprint.workingDays.includes(
          currentDate.toLocaleDateString('en-US', { weekday: 'long' })
        );

        if (isWorkingDay) {
          const hoursThisDay = Math.min(remainingHours, availableHoursPerDay - currentDayHours);
          
          if (hoursThisDay > 0) {
            remainingHours -= hoursThisDay;
            currentDayHours += hoursThisDay;
          }

          if (currentDayHours >= availableHoursPerDay || remainingHours === 0) {
            currentDate.setDate(currentDate.getDate() + 1);
            currentDayHours = 0;
          }
        } else {
          currentDate.setDate(currentDate.getDate() + 1);
          currentDayHours = 0;
        }
      }

      const taskEndDate = new Date(currentDate);
      if (remainingHours === 0) {
        taskEndDate.setDate(taskEndDate.getDate() - 1);
      }

      const duration = Math.max(1, (taskEndDate.getTime() - taskStartDate.getTime()) / (1000 * 60 * 60 * 24) + 1);
      const progress = task.state === 'ongoing' ? 30 : task.state === 'queueing' ? 10 : 0;

      ganttTasks.push({
        task,
        startDate: taskStartDate,
        endDate: taskEndDate,
        duration,
        progress,
        color: taskColors[task.state],
        canStart,
        dependencies: task.dependencies
      });

      if (remainingHours === 0) {
        completedTasks.add(task.taskId);
      }
    }

    return ganttTasks;
  }, [currentSprint, tasks, autoScheduleEnabled, calculateDevelopHours, getDependencyChain]);

  // Calculate task position and width in the Gantt chart
  const getTaskPosition = (ganttTask: GanttTask) => {
    if (!currentSprint) return { left: 0, width: 0 };

    const sprintStart = currentSprint.startDate.getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    
    const startOffset = Math.max(0, (ganttTask.startDate.getTime() - sprintStart) / dayMs);
    const taskDuration = (ganttTask.endDate.getTime() - ganttTask.startDate.getTime()) / dayMs + 1;
    
    return {
      left: startOffset * columnWidth,
      width: Math.max(columnWidth / 2, taskDuration * columnWidth)
    };
  };

  const getTaskStats = () => {
    const incompleteTasks = tasks.filter(task => task.state !== 'done');
    const totalHours = incompleteTasks.reduce((sum, task) => sum + task.workHours, 0);
    const blockedTasks = incompleteTasks.filter(task => !canMoveTaskToOngoing(task.taskId));
    
    return {
      totalTasks: incompleteTasks.length,
      totalHours,
      blockedTasks: blockedTasks.length,
      canSchedule: projectHealth.availableHours >= totalHours
    };
  };

  const stats = getTaskStats();
  const timelineColumns = generateTimelineColumns;
  const ganttTasks = autoScheduleEnabled ? generateGanttTasks : [];

  if (!currentSprint) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">設定 Sprint</h2>
            <p className="text-muted-foreground">
              請先在儀表板中設定當前 Sprint 以使用甘特圖功能
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">甘特圖</h2>
          <p className="text-muted-foreground">項目時間線與任務排程</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Controls */}
          <div className="flex border rounded-lg">
            {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode)}
                className="px-3 py-1 text-xs"
              >
                {mode === 'day' ? '日' : mode === 'week' ? '週' : '月'}
              </Button>
            ))}
          </div>

          {/* Zoom Controls */}
          <div className="flex border rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setColumnWidth(Math.max(20, columnWidth - 10))}
              className="px-2"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setColumnWidth(Math.min(80, columnWidth + 10))}
              className="px-2"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Auto Schedule Toggle */}
          <Button
            onClick={() => setAutoScheduleEnabled(!autoScheduleEnabled)}
            variant={autoScheduleEnabled ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            {autoScheduleEnabled ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {autoScheduleEnabled ? '重置' : '自動排程'}
          </Button>
        </div>
      </div>

      {/* Gantt Chart */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          <div className="flex h-full">
            {/* Task List Panel */}
            <div className="w-80 border-r bg-muted/30 flex flex-col">
              <div className="p-4 border-b bg-background">
                <h3 className="font-semibold">任務列表</h3>
                <div className="text-sm text-muted-foreground mt-1">
                  {stats.totalTasks} 個任務
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {(autoScheduleEnabled ? ganttTasks : tasks.filter(t => t.state !== 'done')).map((item, index) => {
                  const task = 'task' in item ? item.task : item;
                  const ganttTask = 'task' in item ? item : null;
                  
                  return (
                    <div
                      key={task.taskId}
                      className="flex items-center gap-3 p-3 border-b hover:bg-muted/50 cursor-pointer"
                      style={{ height: '48px' }}
                    >
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: taskColors[task.state] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {task.taskName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {task.workHours}h • {task.state}
                          {ganttTask && !ganttTask.canStart && (
                            <span className="text-red-500 ml-1">• 被阻擋</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Panel */}
            <div className="flex-1 overflow-hidden">
              <div ref={ganttRef} className="h-full overflow-auto">
                {/* Timeline Header */}
                <div className="sticky top-0 bg-background border-b z-10">
                  <div className="flex">
                    {timelineColumns.map((column, index) => (
                      <div
                        key={index}
                        className={`border-r text-center py-2 px-1 text-xs font-medium ${
                          column.isToday ? 'bg-primary/10 text-primary' : ''
                        } ${!column.isWorkingDay ? 'bg-muted/50 text-muted-foreground' : ''}`}
                        style={{ minWidth: columnWidth, width: columnWidth }}
                      >
                        <div>{column.date.getDate()}</div>
                        <div className="text-xs opacity-70">{column.dayOfWeek}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Task Bars */}
                <div className="relative">
                  {/* Timeline Grid */}
                  <div className="absolute inset-0 flex">
                    {timelineColumns.map((column, index) => (
                      <div
                        key={index}
                        className={`border-r ${
                          column.isToday ? 'bg-primary/5' : 
                          !column.isWorkingDay ? 'bg-muted/30' : ''
                        }`}
                        style={{ minWidth: columnWidth, width: columnWidth }}
                      />
                    ))}
                  </div>

                  {/* Task Rows */}
                  {(autoScheduleEnabled ? ganttTasks : tasks.filter(t => t.state !== 'done')).map((item, index) => {
                    const task = 'task' in item ? item.task : item;
                    const ganttTask = 'task' in item ? item : null;
                    const position = ganttTask ? getTaskPosition(ganttTask) : { left: 0, width: 0 };
                    
                    return (
                      <div
                        key={task.taskId}
                        className="relative border-b"
                        style={{ height: '48px' }}
                      >
                        {ganttTask && autoScheduleEnabled && (
                          <div
                            className="absolute top-2 h-6 rounded-md shadow-sm border flex items-center justify-center text-xs text-white font-medium cursor-pointer hover:shadow-md transition-shadow"
                            style={{
                              left: position.left,
                              width: position.width,
                              backgroundColor: ganttTask.color,
                              opacity: ganttTask.canStart ? 1 : 0.6
                            }}
                            title={`${task.taskName} (${ganttTask.duration.toFixed(1)} 天)`}
                          >
                            <div className="truncate px-2">
                              {task.taskName}
                              {ganttTask.progress > 0 && (
                                <span className="ml-1">({ganttTask.progress}%)</span>
                              )}
                            </div>
                            {ganttTask.progress > 0 && (
                              <div
                                className="absolute left-0 top-0 h-full bg-black/20 rounded-l-md"
                                style={{ width: `${ganttTask.progress}%` }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>總任務: {stats.totalTasks}</span>
          <span>總工時: {stats.totalHours}h</span>
          <span>被阻擋: {stats.blockedTasks}</span>
        </div>
        <div className={`flex items-center gap-2 ${stats.canSchedule ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`w-2 h-2 rounded-full ${stats.canSchedule ? 'bg-green-600' : 'bg-red-600'}`} />
          <span>{stats.canSchedule ? '排程可行' : '時間不足'}</span>
        </div>
      </div>
    </div>
  );
};