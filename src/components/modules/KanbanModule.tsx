import React, { useState } from 'react';
import { useDataContext } from '../../contexts/DataContext';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { TaskFormModal } from '../TaskFormModal';
import { Task, KanbanState } from '../../types';
import { Plus, Edit, Trash2, GitBranch, Split, ChevronUp, ChevronDown } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDivide: (task: Task) => void;
  onBranch: (task: Task) => void;
  onMove: (taskId: string, direction: 'up' | 'down') => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onDivide, onBranch, onMove }) => {
  const { tasks } = useDataContext();
  const [isDragging, setIsDragging] = useState(false);

  const getDependentTaskNames = (depIds: string[]): string => {
    return depIds
      .map(id => tasks.find(t => t.taskId === id)?.taskName)
      .filter(Boolean)
      .join(', ');
  };

  const getCompletionPercentage = (): number => {
    if (task.items.length === 0) return 0;
    const completedItems = task.items.filter(item => item.completed).length;
    return Math.round((completedItems / task.items.length) * 100);
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', task.taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <Card 
      className={`mb-3 cursor-move transition-all ${isDragging ? 'opacity-50 rotate-2' : 'hover:shadow-md'}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{task.taskName}</h4>
            <p className="text-xs text-muted-foreground">{task.category}</p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onMove(task.taskId, 'up')}>
              <ChevronUp className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onMove(task.taskId, 'down')}>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>工時: {task.workHours}h</span>
            <span>完成度: {getCompletionPercentage()}%</span>
          </div>
          
          {task.dependencies.length > 0 && (
            <div className="text-xs text-orange-600">
              依賴: {getDependentTaskNames(task.dependencies)}
            </div>
          )}
          
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          )}
          
          <div className="flex gap-1 pt-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
              <Edit className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDivide(task)}>
              <Split className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onBranch(task)}>
              <GitBranch className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(task.taskId)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface KanbanColumnProps {
  title: string;
  state: KanbanState;
  tasks: Task[];
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskDivide: (task: Task) => void;
  onTaskBranch: (task: Task) => void;
  onTaskMove: (taskId: string, direction: 'up' | 'down') => void;
  onDrop: (taskId: string, newState: KanbanState) => void;
  onAddTask: (state: KanbanState) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  state,
  tasks,
  onTaskEdit,
  onTaskDelete,
  onTaskDivide,
  onTaskBranch,
  onTaskMove,
  onDrop,
  onAddTask
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    onDrop(taskId, state);
  };

  return (
    <div 
      className={`flex-1 min-h-0 ${isDragOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">{title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{tasks.length}</span>
            <Button variant="ghost" size="sm" onClick={() => onAddTask(state)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {tasks.map(task => (
            <TaskCard
              key={task.taskId}
              task={task}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
              onDivide={onTaskDivide}
              onBranch={onTaskBranch}
              onMove={onTaskMove}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const KanbanModule: React.FC = () => {
  const { 
    tasks, 
    getTasksByState, 
    moveTask, 
    updateTask, 
    deleteTask, 
    canMoveTaskToOngoing,
    getDependencyChain
  } = useDataContext();

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'divide' | 'branch'>('add');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [targetState, setTargetState] = useState<KanbanState>('pending');

  const handleTaskDrop = (taskId: string, newState: KanbanState) => {
    if (newState === 'ongoing' && !canMoveTaskToOngoing(taskId)) {
      const dependencyChain = getDependencyChain(taskId);
      if (dependencyChain.length > 0) {
        // For now, just show an alert instead of moving dependencies
        alert(`此任務依賴其他任務，無法移動到進行中。請先完成依賴任務。`);
        return;
      }
    }
    moveTask(taskId, newState);
  };

  const handleTaskMove = (taskId: string, direction: 'up' | 'down') => {
    const task = tasks.find(t => t.taskId === taskId);
    if (!task) return;

    const sameCategoryTasks = getTasksByState(task.state);
    const currentIndex = sameCategoryTasks.findIndex(t => t.taskId === taskId);
    
    if (direction === 'up' && currentIndex > 0) {
      const targetTask = sameCategoryTasks[currentIndex - 1];
      updateTask(taskId, { priority: targetTask.priority - 1 });
    } else if (direction === 'down' && currentIndex < sameCategoryTasks.length - 1) {
      const targetTask = sameCategoryTasks[currentIndex + 1];
      updateTask(taskId, { priority: targetTask.priority + 1 });
    }
  };

  const handleAddTask = (state: KanbanState) => {
    setModalMode('add');
    setTargetState(state);
    setSelectedTask(null);
    setShowModal(true);
  };

  const handleEditTask = (task: Task) => {
    setModalMode('edit');
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleDivideTask = (task: Task) => {
    setModalMode('divide');
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleBranchTask = (task: Task) => {
    setModalMode('branch');
    setSelectedTask(task);
    setShowModal(true);
  };

  const columns = [
    { title: 'Pending 未開始', state: 'pending' as KanbanState },
    { title: 'Queueing 排隊中', state: 'queueing' as KanbanState },
    { title: 'Ongoing 進行中', state: 'ongoing' as KanbanState },
    { title: 'Done 已完成', state: 'done' as KanbanState },
  ];

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-2xl font-bold">Kanban 看板</h2>
        <p className="text-sm text-muted-foreground">拖拽任務卡片來管理工項狀態</p>
      </div>
      
      <div className="flex-1 flex gap-1 overflow-hidden">
        {columns.map(column => (
          <div key={column.state} className="flex-1 border-r last:border-r-0">
            <KanbanColumn
              title={column.title}
              state={column.state}
              tasks={getTasksByState(column.state)}
              onTaskEdit={handleEditTask}
              onTaskDelete={deleteTask}
              onTaskDivide={handleDivideTask}
              onTaskBranch={handleBranchTask}
              onTaskMove={handleTaskMove}
              onDrop={handleTaskDrop}
              onAddTask={handleAddTask}
            />
          </div>
        ))}
      </div>

      <TaskFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        mode={modalMode}
        task={selectedTask}
        targetState={targetState}
      />
    </div>
  );
};