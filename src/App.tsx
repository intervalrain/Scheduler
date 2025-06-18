import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Copy, Download, Plus, X } from 'lucide-react';
import { Modal } from './components/ui/modal';
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
  const [showModal, setShowModal] = useState<boolean>(false);
  const [pendingDragData, setPendingDragData] = useState<{startIndex: number; endIndex: number; day: string} | null>(null);

  const [taskTypes, setTaskTypes] = useState<TaskType[]>([
    { id: 'meeting', name: '會議', color: '#3b82f6' },
    { id: 'development', name: '開發', color: '#10b981' },
    { id: 'integration', name: '整合', color: '#ef4444' },
    { id: 'research', name: '技術研究', color: '#eab308' },
    { id: 'lunch', name: '午休', color: '#f97316' }
  ]);

  const days: string[] = ['Wednesday', 'Thursday', 'Friday', 'Monday', 'Tuesday'];

  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    let currentTime = timeConfig.startTime;
    
    while (currentTime < timeConfig.endTime) {
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

  const calculateRemainingHours = (): number => {
    const totalSlots = timeSlots.length * days.length;
    const occupiedSlots = Object.keys(schedule).length;
    return (totalSlots - occupiedSlots) * timeConfig.duration;
  };

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
    if (isDragging && dragStart && dragEnd) {
      const startIndex = timeSlots.indexOf(dragStart.time);
      const endIndex = timeSlots.indexOf(dragEnd.time);
      const dayIndex = days.indexOf(dragStart.day);
      const endDayIndex = days.indexOf(dragEnd.day);

      if (startIndex !== -1 && endIndex !== -1) {
        const minIndex = Math.min(startIndex, endIndex);
        const maxIndex = Math.max(startIndex, endIndex);
        const minDayIndex = Math.min(dayIndex, endDayIndex);
        const maxDayIndex = Math.max(dayIndex, endDayIndex);
        
        let canSchedule = true;
        
        for (let dayIdx = minDayIndex; dayIdx <= maxDayIndex; dayIdx++) {
          for (let timeIdx = minIndex; timeIdx <= maxIndex; timeIdx++) {
            const key = `${days[dayIdx]}-${timeSlots[timeIdx]}`;
            if (schedule[key]) {
              canSchedule = false;
              break;
            }
          }
          if (!canSchedule) break;
        }

        if (canSchedule) {
          setPendingDragData({ 
            startIndex: minIndex, 
            endIndex: maxIndex, 
            day: dragStart.day,
            dayStartIndex: minDayIndex,
            dayEndIndex: maxDayIndex
          } as any);
          setShowModal(true);
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

    if (startIndex === -1 || endIndex === -1) return [];

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);
    const minDayIndex = Math.min(dayIndex, endDayIndex);
    const maxDayIndex = Math.max(dayIndex, endDayIndex);
    const selection: string[] = [];

    for (let dayIdx = minDayIndex; dayIdx <= maxDayIndex; dayIdx++) {
      for (let timeIdx = minIndex; timeIdx <= maxIndex; timeIdx++) {
        selection.push(`${days[dayIdx]}-${timeSlots[timeIdx]}`);
      }
    }

    return selection;
  };

  const handleModalConfirm = (taskTypeId: string, taskName: string): void => {
    if (!pendingDragData) return;
    
    const taskType = taskTypes.find(t => t.id === taskTypeId);
    if (!taskType) return;
    
    const newSchedule: Schedule = { ...schedule };
    const { startIndex, endIndex, dayStartIndex, dayEndIndex } = pendingDragData as any;
    
    for (let dayIdx = dayStartIndex; dayIdx <= dayEndIndex; dayIdx++) {
      for (let timeIdx = startIndex; timeIdx <= endIndex; timeIdx++) {
        const key = `${days[dayIdx]}-${timeSlots[timeIdx]}`;
        newSchedule[key] = { 
          ...taskType, 
          name: taskName,
          isMultiSlot: endIndex > startIndex || dayEndIndex > dayStartIndex 
        };
      }
    }
    
    setSchedule(newSchedule);
    setPendingDragData(null);
  };

  const generateHTML = (): string => {
    let html = `<table border="1" style="border-collapse: collapse; width: 100%;">
  <thead>
    <tr style="background-color: #f5f5f5;">
      <th style="padding: 8px; text-align: center;">時間</th>
      <th style="padding: 8px; text-align: center;">Wednesday</th>
      <th style="padding: 8px; text-align: center;">Thursday</th>
      <th style="padding: 8px; text-align: center;">Friday</th>
      <th style="padding: 8px; text-align: center;">Monday</th>
      <th style="padding: 8px; text-align: center;">Tuesday</th>
    </tr>
  </thead>
  <tbody>\n`;
    
    timeSlots.forEach(time => {
      html += `    <tr>
      <td style="padding: 8px; text-align: center; font-weight: bold;">${time}</td>`;
      days.forEach(day => {
        const task = schedule[`${day}-${time}`];
        const cellContent = task ? task.name : '';
        const cellStyle = task ? `background-color: ${task.color}; color: white; font-weight: bold;` : '';
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


  const dragSelection = getDragSelection();

  return (
    <div className="flex h-screen bg-background">
      <div className="w-1/3 p-6 bg-card border-r shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-foreground">行程規劃工具</h2>
        
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{calculateRemainingHours()}</p>
              <p className="text-sm text-muted-foreground">剩餘時間 (小時)</p>
            </div>
          </CardContent>
        </Card>
        
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
              {timeSlots.map((time) => (
                <tr key={time}>
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
                ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">HTML 表格代碼</CardTitle>
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
                複製 HTML
              </Button>
              <Button
                onClick={() => {
                  const blob = new Blob([generateHTML()], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'schedule.html';
                  a.click();
                }}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                下載 HTML
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setPendingDragData(null);
          }}
          onConfirm={handleModalConfirm}
          taskTypes={taskTypes}
        />
      </div>
    </div>
  );
};

export default App;