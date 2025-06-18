import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Copy, Download, Plus, X } from 'lucide-react';
import type { TaskType, TimeConfig, Schedule, DragState } from './types';

const App: React.FC = () => {
  const [schedule, setSchedule] = useState<Schedule>({});
  const [timeConfig, setTimeConfig] = useState<TimeConfig>({
    startTime: 9,
    endTime: 17,
    duration: 1
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<DragState | null>(null);
  const [dragEnd, setDragEnd] = useState<DragState | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [showAddTask, setShowAddTask] = useState<boolean>(false);
  const [newTaskName, setNewTaskName] = useState<string>('');
  const [newTaskColor, setNewTaskColor] = useState<string>('#3b82f6');

  const [taskTypes, setTaskTypes] = useState<TaskType[]>([
    { id: 'standup', name: '站會', color: '#3b82f6' },
    { id: 'development', name: 'ABP 開發', color: '#10b981' },
    { id: 'frontend', name: 'React 前端', color: '#8b5cf6' },
    { id: 'ml', name: 'TensorFlow', color: '#f97316' },
    { id: 'meeting', name: '會議', color: '#ef4444' },
    { id: 'research', name: '技術研究', color: '#eab308' }
  ]);

  const days: string[] = ['Wednesday', 'Thursday', 'Friday', 'Monday', 'Tuesday'];

  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    let currentTime = timeConfig.startTime;
    
    while (currentTime < timeConfig.endTime) {
      if (currentTime === 12) {
        currentTime += timeConfig.duration;
        continue;
      }
      
      const endTime = currentTime + timeConfig.duration;
      const startHour = Math.floor(currentTime);
      const startMin = (currentTime % 1) * 60;
      const endHour = Math.floor(endTime);
      const endMin = (endTime % 1) * 60;
      
      const timeSlot = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
      slots.push(timeSlot);
      
      currentTime += timeConfig.duration;
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const addNewTask = (): void => {
    if (newTaskName.trim()) {
      const newTask = {
        id: Date.now().toString(),
        name: newTaskName,
        color: newTaskColor
      };
      setTaskTypes([...taskTypes, newTask]);
      setNewTaskName('');
      setNewTaskColor('#3b82f6');
      setShowAddTask(false);
    }
  };

  const handleTaskSelect = (task: TaskType): void => {
    setSelectedTask(task);
  };

  const handleMouseDown = (day: string, time: string): void => {
    if (!selectedTask) return;
    setIsDragging(true);
    setDragStart({ day, time });
    setDragEnd({ day, time });
  };

  const handleMouseEnter = (day: string, time: string): void => {
    if (isDragging && dragStart) {
      setDragEnd({ day, time });
    }
  };

  const handleMouseUp = (): void => {
    if (isDragging && dragStart && dragEnd && selectedTask) {
      const startIndex = timeSlots.indexOf(dragStart.time);
      const endIndex = timeSlots.indexOf(dragEnd.time);
      const dayIndex = days.indexOf(dragStart.day);
      const endDayIndex = days.indexOf(dragEnd.day);

      if (dayIndex === endDayIndex && startIndex !== -1 && endIndex !== -1) {
        const minIndex = Math.min(startIndex, endIndex);
        const maxIndex = Math.max(startIndex, endIndex);
        
        const newSchedule: Schedule = { ...schedule };
        let canSchedule = true;

        for (let i = minIndex; i <= maxIndex; i++) {
          const key = `${dragStart.day}-${timeSlots[i]}`;
          if (newSchedule[key]) {
            canSchedule = false;
            break;
          }
        }

        if (canSchedule) {
          for (let i = minIndex; i <= maxIndex; i++) {
            const key = `${dragStart.day}-${timeSlots[i]}`;
            newSchedule[key] = { ...selectedTask, isMultiSlot: maxIndex > minIndex };
          }
          setSchedule(newSchedule);
        }
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const clearSlot = (day: string, time: string): void => {
    const newSchedule: Schedule = { ...schedule };
    delete newSchedule[`${day}-${time}`];
    setSchedule(newSchedule);
  };

  const getDragSelection = (): string[] => {
    if (!isDragging || !dragStart || !dragEnd) return [];
    
    const startIndex = timeSlots.indexOf(dragStart.time);
    const endIndex = timeSlots.indexOf(dragEnd.time);
    const dayIndex = days.indexOf(dragStart.day);
    const endDayIndex = days.indexOf(dragEnd.day);

    if (dayIndex !== endDayIndex || startIndex === -1 || endIndex === -1) return [];

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);
    const selection: string[] = [];

    for (let i = minIndex; i <= maxIndex; i++) {
      selection.push(`${dragStart.day}-${timeSlots[i]}`);
    }

    return selection;
  };

  const generateHTML = (): string => {
    let html = `|時間|Wednesday|Thursday|Friday|Monday|Tuesday|\n|---|---|---|---|---|---|\n`;
    
    const allSlots: { time: string; hour: number; processed?: boolean }[] = [];
    timeSlots.forEach(time => {
      const startHour = parseInt(time.split(':')[0]);
      allSlots.push({ time, hour: startHour });
    });
    
    allSlots.sort((a, b) => a.hour - b.hour);
    
    allSlots.forEach(slot => {
      if (slot.hour === 12) return;
      
      if (slot.hour > 12 && !allSlots.some(s => s.hour === 12 && s.processed)) {
        html += `|12:00-13:00|🍽️ Lunch Break|🍽️ Lunch Break|🍽️ Lunch Break|🍽️ Lunch Break|🍽️ Lunch Break|\n`;
        const slot12 = allSlots.find(s => s.hour === 12);
        if (slot12) slot12.processed = true;
      }
      
      html += `|${slot.time}|`;
      days.forEach(day => {
        const task = schedule[`${day}-${slot.time}`];
        html += `${task ? task.name : ''}|`;
      });
      html += '\n';
    });
    
    if (!allSlots.some(s => s.hour === 12 && s.processed)) {
      html += `|12:00-13:00|🍽️ Lunch Break|🍽️ Lunch Break|🍽️ Lunch Break|🍽️ Lunch Break|🍽️ Lunch Break|\n`;
    }
    
    return html;
  };


  const dragSelection = getDragSelection();

  return (
    <div className="flex h-screen bg-background">
      <div className="w-1/3 p-6 bg-card border-r shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-foreground">行程規劃工具</h2>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">時間設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">開始時間</label>
              <Input
                type="number"
                min="0"
                max="23"
                value={timeConfig.startTime.toString()}
                onChange={(e) => setTimeConfig(prev => ({ ...prev, startTime: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">結束時間</label>
              <Input
                type="number"
                min="1"
                max="24"
                value={timeConfig.endTime.toString()}
                onChange={(e) => setTimeConfig(prev => ({ ...prev, endTime: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">時段長度 (小時)</label>
              <Select value={timeConfig.duration.toString()} onValueChange={(value) => setTimeConfig(prev => ({ ...prev, duration: parseFloat(value) }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">30分鐘</SelectItem>
                  <SelectItem value="1">1小時</SelectItem>
                  <SelectItem value="2">2小時</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">任務類型</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {taskTypes.map(task => (
              <Button
                key={task.id}
                onClick={() => handleTaskSelect(task)}
                style={{ backgroundColor: task.color }}
                variant="default"
                className={`${selectedTask?.id === task.id ? 'ring-4 ring-ring' : ''} text-white w-full justify-start hover:opacity-90 transition-all duration-200 shadow-md`}
              >
                {task.name}
              </Button>
            ))}
            
            {!showAddTask && (
              <Button
                onClick={() => setShowAddTask(true)}
                variant="outline"
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                新增任務類型
              </Button>
            )}
            
            {showAddTask && (
              <Card className="bg-muted/50">
                <CardContent className="p-3 space-y-3">
                  <Input
                    type="text"
                    placeholder="任務名稱"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newTaskColor}
                      onChange={(e) => setNewTaskColor(e.target.value)}
                      className="w-8 h-8 border border-border rounded cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground">選擇顏色</span>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addNewTask} size="sm">
                      新增
                    </Button>
                    <Button onClick={() => setShowAddTask(false)} variant="outline" size="sm">
                      <X className="w-4 h-4 mr-1" />
                      取消
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
        {selectedTask && (
          <Card className="mt-4">
            <CardContent className="p-3">
              <p className="text-sm text-muted-foreground">已選擇: <span className="font-semibold text-foreground">{selectedTask.name}</span></p>
              <p className="text-xs text-muted-foreground mt-1">在右側行程表拖拽選擇時段</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex-1 p-6">
        <h2 className="text-2xl font-bold mb-6 text-foreground">週行程表</h2>
        
        <Card className="mb-8">
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left font-semibold">時間</th>
                    {days.map(day => (
                      <th key={day} className="border border-border p-3 text-center font-semibold">{day}</th>
                    ))}
                  </tr>
                </thead>
            <tbody onMouseUp={handleMouseUp}>
              {timeSlots.map((time, index) => {
                const currentHour = parseInt(time.split(':')[0]);
                const showLunchBefore = currentHour > 12 && !timeSlots.slice(0, index).some(t => parseInt(t.split(':')[0]) > 12);
                
                return (
                  <React.Fragment key={time}>
                    {showLunchBefore && (
                      <tr>
                        <td className="border border-border p-3 font-medium bg-muted/50">12:00-13:00</td>
                        <td colSpan={5} className="border border-border p-3 text-center bg-yellow-100 font-medium">
                          🍽️ Lunch Break
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="border border-border p-3 font-medium bg-muted/50">{time}</td>
                      {days.map(day => {
                        const task = schedule[`${day}-${time}`];
                        const cellKey = `${day}-${time}`;
                        const isInDragSelection = dragSelection.includes(cellKey);
                        const isOccupied = !!task;

                        return (
                          <td
                            key={cellKey}
                            className={`border border-border p-1 h-16 relative cursor-pointer select-none
                              ${isInDragSelection ? 'bg-primary/20' : ''}
                              ${isOccupied ? 'opacity-90' : 'hover:bg-muted/50'}
                            `}
                            onMouseDown={() => handleMouseDown(day, time)}
                            onMouseEnter={() => handleMouseEnter(day, time)}
                            onDoubleClick={() => task && clearSlot(day, time)}
                          >
                            {task && (
                              <div style={{ backgroundColor: task.color }} className="text-white p-2 rounded text-sm font-medium h-full flex items-center justify-center">
                                {task.name}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Azure DevOps Wiki 代碼</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              className="w-full h-80 font-mono text-sm resize-none"
              value={generateHTML()}
              readOnly
            />
            <div className="mt-4 flex space-x-4">
              <Button
                onClick={() => navigator.clipboard.writeText(generateHTML())}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                複製 Markdown
              </Button>
              <Button
                onClick={() => {
                  const blob = new Blob([generateHTML()], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'schedule.md';
                  a.click();
                }}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                下載 Markdown
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default App;