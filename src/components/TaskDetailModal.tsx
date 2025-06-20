import React from 'react';
import { useDataContext } from '../contexts/DataContext';
import { Task } from '../types';
import { BaseModal } from './ui/base-modal';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  X, 
  Clock, 
  Tag, 
  FileText, 
  CheckCircle2, 
  Circle,
  ArrowRight,
  Edit
} from 'lucide-react';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onEdit?: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  task,
  onEdit 
}) => {
  const { tasks } = useDataContext();

  if (!task) return null;

  const getDependentTaskNames = (depIds: string[]): Task[] => {
    return depIds
      .map(id => tasks.find(t => t.taskId === id))
      .filter(Boolean) as Task[];
  };

  const getCompletionPercentage = (): number => {
    if (task.items.length === 0) return 0;
    const completedItems = task.items.filter(item => item.completed).length;
    return Math.round((completedItems / task.items.length) * 100);
  };

  const getStateColor = (state: string): string => {
    switch (state) {
      case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'queueing': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'ongoing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'done': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStateLabel = (state: string): string => {
    switch (state) {
      case 'pending': return '未開始';
      case 'queueing': return '排隊中';
      case 'ongoing': return '進行中';
      case 'done': return '已完成';
      default: return state;
    }
  };

  const dependentTasks = getDependentTaskNames(task.dependencies);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-xl font-semibold text-foreground">任務詳細資訊</h2>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
              <Edit className="w-4 h-4 mr-2" />
              編輯
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Task Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">{task.taskName}</h1>
              <div className="flex items-center gap-3">
                <Badge className={getStateColor(task.state)}>
                  {getStateLabel(task.state)}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Tag className="w-4 h-4" />
                  {task.category || '未分類'}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {task.workHours}h
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{getCompletionPercentage()}%</div>
              <div className="text-sm text-muted-foreground">完成度</div>
            </div>
          </div>

          {task.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <FileText className="w-4 h-4" />
                  描述
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{task.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">基本資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">優先順序</label>
                  <p className="text-foreground">{task.priority}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">迭代版本</label>
                  <p className="text-foreground">{task.iteration || '未設定'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">建立時間</label>
                  <p className="text-foreground">{task.createdAt.toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">更新時間</label>
                  <p className="text-foreground">{task.updatedAt.toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dependencies */}
          {dependentTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <ArrowRight className="w-4 h-4" />
                  依賴任務
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dependentTasks.map(depTask => (
                    <div key={depTask.taskId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{depTask.taskName}</p>
                        <p className="text-sm text-muted-foreground">{depTask.category}</p>
                      </div>
                      <Badge className={getStateColor(depTask.state)}>
                        {getStateLabel(depTask.state)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Checklist */}
        {task.items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="w-4 h-4" />
                檢查清單 ({task.items.filter(i => i.completed).length}/{task.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {task.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded border">
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span 
                      className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {task.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <FileText className="w-4 h-4" />
                筆記
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap text-foreground font-sans">{task.notes}</pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </BaseModal>
  );
};