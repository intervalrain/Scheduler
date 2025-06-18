import React from 'react';
import { X } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import type { TaskType } from '../../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (taskType: string, taskName: string) => void;
  taskTypes: TaskType[];
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, taskTypes }) => {
  const [selectedTaskType, setSelectedTaskType] = React.useState<string>('');
  const [taskName, setTaskName] = React.useState<string>('');

  React.useEffect(() => {
    if (isOpen) {
      setSelectedTaskType('');
      setTaskName('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (selectedTaskType && taskName.trim()) {
      onConfirm(selectedTaskType, taskName.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">新增任務</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">任務類型</label>
            <Select value={selectedTaskType} onValueChange={setSelectedTaskType}>
              <SelectTrigger>
                <SelectValue placeholder="選擇任務類型" />
              </SelectTrigger>
              <SelectContent>
                {taskTypes.map(task => (
                  <SelectItem key={task.id} value={task.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: task.color }}
                      />
                      {task.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">任務名稱</label>
            <Input
              type="text"
              placeholder="輸入任務名稱"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
            />
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <Button onClick={handleConfirm} disabled={!selectedTaskType || !taskName.trim()}>
            確認
          </Button>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
        </div>
      </div>
    </div>
  );
};