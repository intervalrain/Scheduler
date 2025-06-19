import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Tooltip } from './ui/tooltip';
import { Plus, X, Target } from 'lucide-react';
import { useUserContext } from '../contexts/UserContext';
import type { TaskType } from '../types';

interface TaskTypePanelProps {
  collapsed: boolean;
}

export const TaskTypePanel: React.FC<TaskTypePanelProps> = ({ collapsed }) => {
  const { 
    taskTypes, 
    setTaskTypes, 
    selectedTask, 
    setSelectedTask,
    schedule,
    updateSchedule
  } = useUserContext();
  
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskColor, setNewTaskColor] = useState('#3b82f6');

  const handleTaskSelect = (task: TaskType) => {
    if (selectedTask?.id === task.id) {
      setSelectedTask(null);
    } else {
      setSelectedTask(task);
    }
  };

  const removeTaskType = (taskId: string) => {
    setTaskTypes(taskTypes.filter((task) => task.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
    const newSchedule = { ...schedule };
    Object.keys(newSchedule).forEach((key) => {
      if (newSchedule[key].id === taskId) {
        delete newSchedule[key];
      }
    });
    updateSchedule(newSchedule);
  };

  const addNewTask = () => {
    if (newTaskName.trim()) {
      const newTask = {
        id: Date.now().toString(),
        name: newTaskName,
        color: newTaskColor,
      };
      setTaskTypes([...taskTypes, newTask]);
      setNewTaskName('');
      setNewTaskColor('#3b82f6');
      setShowAddTask(false);
    }
  };

  if (collapsed) {
    return (
      <div className="text-center">
        <Tooltip
          content={
            <div className="w-72">
              <h3 className="font-semibold mb-3">任務類型</h3>
              <div className="space-y-2">
                {taskTypes.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/50 group ${
                      selectedTask?.id === task.id
                        ? "bg-primary/10 ring-1 ring-primary"
                        : ""
                    }`}
                    onClick={() => handleTaskSelect(task)}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: task.color }}
                    />
                    <span className="text-sm flex-1">{task.name}</span>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTaskType(task.id);
                      }}
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {selectedTask && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    已選擇:{" "}
                    <span className="font-semibold text-foreground">
                      {selectedTask.name}
                    </span>
                  </p>
                </div>
              )}
              {!showAddTask && (
                <Button
                  onClick={() => setShowAddTask(true)}
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新增任務類型
                </Button>
              )}
            </div>
          }
        >
          <div
            className={`flex flex-col items-center space-y-1 cursor-pointer ${
              selectedTask ? "text-primary" : ""
            }`}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: selectedTask?.color || "#94a3b8",
              }}
            >
              <Target className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs">
              {selectedTask?.name.substring(0, 2) || "選擇"}
            </span>
          </div>
        </Tooltip>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">任務類型</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {taskTypes.map((task) => (
          <div key={task.id} className="relative group">
            <Button
              onClick={() => handleTaskSelect(task)}
              style={{ backgroundColor: task.color }}
              variant="default"
              className={`${
                selectedTask?.id === task.id ? "ring-4 ring-ring" : ""
              } text-white w-full justify-start hover:opacity-90 transition-all duration-200 shadow-md`}
            >
              {task.name}
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                removeTaskType(task.id);
              }}
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/20 w-6 h-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
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
                <span className="text-sm text-muted-foreground">
                  選擇顏色
                </span>
              </div>
              <div className="flex gap-2">
                <Button onClick={addNewTask} size="sm">
                  新增
                </Button>
                <Button
                  onClick={() => setShowAddTask(false)}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-1" />
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
      {selectedTask && (
        <Card className="mt-4">
          <CardContent className="p-3">
            <p className="text-sm text-muted-foreground">
              已選擇:{" "}
              <span className="font-semibold text-foreground">
                {selectedTask.name}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              在右側行程表拖拽選擇時段
            </p>
          </CardContent>
        </Card>
      )}
    </Card>
  );
}; 