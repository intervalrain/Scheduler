import React, { useState, useEffect } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { Task, KanbanState } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { BaseModal } from './ui/base-modal';
import { X } from 'lucide-react';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit' | 'divide' | 'branch';
  task?: Task | null;
  targetState?: KanbanState;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  mode,
  task,
  targetState = 'pending'
}) => {
  const { addTask, updateTask, divideTask, branchTask, tasks } = useDataContext();

  const [formData, setFormData] = useState({
    taskName: '',
    category: '',
    description: '',
    workHours: 1,
    iteration: '',
    dependencies: [] as string[],
    priority: 1,
  });

  const [branchTaskA, setBranchTaskA] = useState({
    taskName: '',
    category: '',
    description: '',
    workHours: 1,
    iteration: '',
    dependencies: [] as string[],
    priority: 1,
  });

  const [branchTaskB, setBranchTaskB] = useState({
    taskName: '',
    category: '',
    description: '',
    workHours: 1,
    iteration: '',
    dependencies: [] as string[],
    priority: 1,
  });

  useEffect(() => {
    if (task && (mode === 'edit' || mode === 'divide' || mode === 'branch')) {
      setFormData({
        taskName: task.taskName,
        category: task.category,
        description: task.description,
        workHours: task.workHours,
        iteration: task.iteration,
        dependencies: task.dependencies,
        priority: task.priority,
      });
    } else {
      setFormData({
        taskName: '',
        category: '',
        description: '',
        workHours: 1,
        iteration: '',
        dependencies: [],
        priority: 1,
      });
    }
  }, [task, mode, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.taskName.trim()) return;

    switch (mode) {
      case 'add':
        addTask({
          ...formData,
          state: targetState,
          notes: '',
          items: [],
        });
        break;
        
      case 'edit':
        if (task) {
          updateTask(task.taskId, formData);
        }
        break;
        
      case 'divide':
        if (task) {
          divideTask(task.taskId, {
            ...formData,
            state: task.state,
            notes: '',
            items: [],
          });
        }
        break;
        
      case 'branch':
        if (task) {
          branchTask(
            task.taskId,
            {
              ...branchTaskA,
              state: task.state,
              notes: '',
              items: [],
            },
            {
              ...branchTaskB,
              state: task.state,
              notes: '',
              items: [],
            }
          );
        }
        break;
    }
    
    onClose();
  };

  const getTitle = () => {
    switch (mode) {
      case 'add': return '新增任務';
      case 'edit': return '編輯任務';
      case 'divide': return '拆分任務';
      case 'branch': return '分支任務';
      default: return '任務';
    }
  };

  const availableTasks = tasks.filter(t => t.taskId !== task?.taskId);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-xl font-semibold">{getTitle()}</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'branch' ? (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-medium mb-3 text-foreground">任務 A (依賴於任務 B)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">任務名稱</label>
                    <Input
                      placeholder="輸入任務 A 名稱"
                      value={branchTaskA.taskName}
                      onChange={(e) => setBranchTaskA(prev => ({ ...prev, taskName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">分類</label>
                    <Input
                      placeholder="任務分類"
                      value={branchTaskA.category}
                      onChange={(e) => setBranchTaskA(prev => ({ ...prev, category: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">描述</label>
                    <Textarea
                      placeholder="任務描述"
                      value={branchTaskA.description}
                      onChange={(e) => setBranchTaskA(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">工時 (小時)</label>
                    <Input
                      type="number"
                      placeholder="預估工時"
                      min="0.5"
                      step="0.5"
                      value={branchTaskA.workHours}
                      onChange={(e) => setBranchTaskA(prev => ({ ...prev, workHours: parseFloat(e.target.value) || 1 }))}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-medium mb-3 text-foreground">任務 B (被依賴的任務)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">任務名稱</label>
                    <Input
                      placeholder="輸入任務 B 名稱"
                      value={branchTaskB.taskName}
                      onChange={(e) => setBranchTaskB(prev => ({ ...prev, taskName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">分類</label>
                    <Input
                      placeholder="任務分類"
                      value={branchTaskB.category}
                      onChange={(e) => setBranchTaskB(prev => ({ ...prev, category: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">描述</label>
                    <Textarea
                      placeholder="任務描述"
                      value={branchTaskB.description}
                      onChange={(e) => setBranchTaskB(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">工時 (小時)</label>
                    <Input
                      type="number"
                      placeholder="預估工時"
                      min="0.5"
                      step="0.5"
                      value={branchTaskB.workHours}
                      onChange={(e) => setBranchTaskB(prev => ({ ...prev, workHours: parseFloat(e.target.value) || 1 }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  任務名稱 <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="輸入任務名稱"
                  value={formData.taskName}
                  onChange={(e) => setFormData(prev => ({ ...prev, taskName: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">分類</label>
                <Input
                  placeholder="例：前端開發、後端 API、測試等"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">描述</label>
                <Textarea
                  placeholder="詳細描述任務內容和要求"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">預估工時 (小時)</label>
                  <Input
                    type="number"
                    placeholder="例：4"
                    min="0.5"
                    step="0.5"
                    value={formData.workHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, workHours: parseFloat(e.target.value) || 1 }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">迭代版本</label>
                  <Input
                    placeholder="例：v1.0, Sprint-1"
                    value={formData.iteration}
                    onChange={(e) => setFormData(prev => ({ ...prev, iteration: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  優先順序 (數字越小優先級越高)
                </label>
                <Input
                  type="number"
                  placeholder="例：1, 2, 3..."
                  min="1"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                />
              </div>

              {availableTasks.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">依賴任務</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availableTasks.map(availableTask => (
                      <label key={availableTask.taskId} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.dependencies.includes(availableTask.taskId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                dependencies: [...prev.dependencies, availableTask.taskId]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                dependencies: prev.dependencies.filter(id => id !== availableTask.taskId)
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{availableTask.taskName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit">
              {mode === 'add' ? '新增' : 
               mode === 'edit' ? '更新' : 
               mode === 'divide' ? '拆分' : '分支'}
            </Button>
          </div>
        </form>
    </BaseModal>
  );
};