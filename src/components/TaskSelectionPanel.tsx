import React from 'react';
import { useDataContext } from '../contexts/DataContext';
import { Task } from '../types';
import { Play } from 'lucide-react';

interface TaskSelectionPanelProps {
  collapsed: boolean;
  onTaskSelect: (task: Task) => void;
  currentWorkTask: Task | null;
}

export const TaskSelectionPanel: React.FC<TaskSelectionPanelProps> = ({ 
  collapsed, 
  onTaskSelect,
  currentWorkTask 
}) => {
  const { getTasksByState } = useDataContext();

  const ongoingTasks = getTasksByState('ongoing');
  const queueingTasks = getTasksByState('queueing');

  if (collapsed) {
    return (
      <div className="text-center space-y-3">
        <div>
          <Play className="w-6 h-6 mx-auto mb-1 text-blue-600" />
          <div className="text-xs font-medium text-blue-600">工作</div>
        </div>
        
        <div className="space-y-2">
          <div className="text-xs">
            <div className="text-green-600 font-medium">{ongoingTasks.length}</div>
            <div className="text-xs text-muted-foreground">進行</div>
          </div>
          <div className="text-xs">
            <div className="text-orange-600 font-medium">{queueingTasks.length}</div>
            <div className="text-xs text-muted-foreground">排隊</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ongoing Tasks */}
      <div>
        <h4 className="text-sm font-medium text-green-600 mb-2">
          進行中 ({ongoingTasks.length})
        </h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {ongoingTasks.map(task => (
            <div
              key={task.taskId}
              className={`p-2 rounded cursor-pointer transition-colors ${
                currentWorkTask?.taskId === task.taskId 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                  : 'hover:bg-muted'
              }`}
              onClick={() => onTaskSelect(task)}
            >
              <div className="text-sm font-medium">{task.taskName}</div>
              <div className="text-xs text-muted-foreground">{task.category}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-border" />

      {/* Queueing Tasks */}
      <div>
        <h4 className="text-sm font-medium text-orange-600 mb-2">
          排隊中 ({queueingTasks.length})
        </h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {queueingTasks.map(task => (
            <div
              key={task.taskId}
              className={`p-2 rounded cursor-pointer transition-colors ${
                currentWorkTask?.taskId === task.taskId 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                  : 'hover:bg-muted'
              }`}
              onClick={() => onTaskSelect(task)}
            >
              <div className="text-sm font-medium">{task.taskName}</div>
              <div className="text-xs text-muted-foreground">{task.category}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};