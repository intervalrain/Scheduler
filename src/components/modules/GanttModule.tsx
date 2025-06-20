import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar, Clock, Play, RotateCcw, AlertTriangle } from 'lucide-react';
import { useDataContext } from '../../contexts/DataContext';
import { useUserContext } from '../../contexts/UserContext';
import { Task } from '../../types';

interface ScheduledTaskBlock {
  task: Task;
  startDate: Date;
  endDate: Date;
  color: string;
  canStart: boolean;
}

interface TimelineDay {
  date: Date;
  isWorkingDay: boolean;
  tasks: ScheduledTaskBlock[];
}

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

  const taskColors = {
    'pending': '#94a3b8',
    'queueing': '#fbbf24', 
    'ongoing': '#3b82f6',
    'done': '#10b981'
  };

  const generateAutoSchedule = (): ScheduledTaskBlock[] => {
    if (!currentSprint) return [];

    const scheduledTasks: ScheduledTaskBlock[] = [];
    const incompleteTasks = tasks.filter(task => task.state !== 'done');
    
    const sortedTasks = [...incompleteTasks].sort((a, b) => {
      // First priority: ongoing tasks should be scheduled before queued tasks
      if (a.state === 'ongoing' && b.state !== 'ongoing') return -1;
      if (b.state === 'ongoing' && a.state !== 'ongoing') return 1;
      
      // Second priority: task priority
      if (a.priority !== b.priority) return a.priority - b.priority;
      
      // Third priority: dependency chain length (tasks with more dependencies first)
      const aDeps = getDependencyChain(a.taskId).length;
      const bDeps = getDependencyChain(b.taskId).length;
      if (aDeps !== bDeps) return bDeps - aDeps;
      
      // Final priority: creation time
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const dailyWorkHours = currentSprint.workingHours.end - currentSprint.workingHours.start;
    const developmentHours = calculateDevelopHours();
    const availableHoursPerDay = Math.max(0, dailyWorkHours - (developmentHours / 5));
    
    let currentDate = new Date(currentSprint.startDate);
    let currentDayHours = 0;
    const completedTasks = new Set<string>();

    for (const task of sortedTasks) {
      const dependencies = getDependencyChain(task.taskId);
      const canStart = dependencies.every(depId => completedTasks.has(depId));
      
      if (!canStart && task.state === 'pending') continue;

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

      scheduledTasks.push({
        task,
        startDate: taskStartDate,
        endDate: taskEndDate,
        color: taskColors[task.state],
        canStart
      });

      if (task.state === 'done' || remainingHours === 0) {
        completedTasks.add(task.taskId);
      }
    }

    return scheduledTasks;
  };

  const timeline = useMemo((): TimelineDay[] => {
    if (!currentSprint) return [];

    const days: TimelineDay[] = [];
    const scheduledTasks = autoScheduleEnabled ? generateAutoSchedule() : [];
    
    const currentDate = new Date(currentSprint.startDate);
    const endDate = new Date(currentSprint.endDate);

    while (currentDate <= endDate) {
      const isWorkingDay = currentSprint.workingDays.includes(
        currentDate.toLocaleDateString('en-US', { weekday: 'long' })
      );

      const dayTasks = scheduledTasks.filter(scheduled => {
        const taskDate = new Date(currentDate);
        return scheduled.startDate <= taskDate && taskDate <= scheduled.endDate;
      });

      days.push({
        date: new Date(currentDate),
        isWorkingDay,
        tasks: dayTasks
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }, [currentSprint, tasks, autoScheduleEnabled]);

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
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">甘特圖排程</h2>
          <p className="text-muted-foreground">自動任務排程與時間線規劃</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setAutoScheduleEnabled(!autoScheduleEnabled)}
            variant={autoScheduleEnabled ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            {autoScheduleEnabled ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {autoScheduleEnabled ? '重置排程' : '自動排程'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">待完成任務</p>
                <p className="text-2xl font-bold">{stats.totalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">所需工時</p>
                <p className="text-2xl font-bold">{stats.totalHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">被阻擋任務</p>
                <p className="text-2xl font-bold">{stats.blockedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full ${stats.canSchedule ? 'bg-green-600' : 'bg-red-600'}`} />
              <div>
                <p className="text-sm text-muted-foreground">排程狀態</p>
                <p className="text-2xl font-bold">{stats.canSchedule ? '可行' : '超時'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            時間線視圖
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {timeline.map((day, index) => (
              <div key={index} className="flex items-center gap-4 p-2 rounded hover:bg-muted/50">
                <div className="w-24 text-sm font-medium">
                  {day.date.toLocaleDateString('zh-TW', { 
                    month: 'short', 
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </div>
                
                <div className={`w-2 h-2 rounded-full ${
                  day.isWorkingDay ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                
                <div className="flex-1 flex gap-2 overflow-x-auto">
                  {day.tasks.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic">
                      {day.isWorkingDay ? '無排程任務' : '非工作日'}
                    </div>
                  ) : (
                    day.tasks.map((scheduled, taskIndex) => (
                      <div
                        key={taskIndex}
                        className="flex-shrink-0 px-3 py-1 rounded text-xs text-white font-medium"
                        style={{ backgroundColor: scheduled.color }}
                        title={`${scheduled.task.taskName} (${scheduled.task.workHours}h)`}
                      >
                        {scheduled.task.taskName}
                        {!scheduled.canStart && (
                          <AlertTriangle className="w-3 h-3 inline ml-1" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!stats.canSchedule && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <p className="font-semibold">排程警告</p>
                <p className="text-sm">
                  當前任務需要 {stats.totalHours} 小時，但可用時間僅 {projectHealth.availableHours.toFixed(1)} 小時。
                  建議調整 Sprint 時間或減少任務範圍。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};