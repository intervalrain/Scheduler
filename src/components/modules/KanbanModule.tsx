import React, { useState } from 'react';
import { useDataContext } from '../../contexts/DataContext';
import { useUserContext } from '../../contexts/UserContext';
import { GenericSidebar } from '../GenericSidebar';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { TaskFormModal } from '../TaskFormModal';
import { TaskDetailModal } from '../TaskDetailModal';
import { Task, KanbanState } from '../../types';
import { Plus, Edit, Trash2, GitBranch, Split, ChevronUp, ChevronDown, Columns3 } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDivide: (task: Task) => void;
  onBranch: (task: Task) => void;
  onMove: (taskId: string, direction: 'up' | 'down') => void;
  onView: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onDivide, onBranch, onMove, onView }) => {
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
            <h4 
              className="font-semibold text-sm cursor-pointer hover:text-blue-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onView(task);
              }}
            >
              {task.taskName}
            </h4>
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
  onTaskView: (task: Task) => void;
  onDrop: (taskId: string, newState: KanbanState) => void;
  onAddTask: (state: KanbanState) => void;
}

interface CombinedColumnProps {
  title: string;
  queueingTasks: Task[];
  ongoingTasks: Task[];
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskDivide: (task: Task) => void;
  onTaskBranch: (task: Task) => void;
  onTaskMove: (taskId: string, direction: 'up' | 'down') => void;
  onTaskView: (task: Task) => void;
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
  onTaskView,
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
              onView={onTaskView}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const CombinedColumn: React.FC<CombinedColumnProps> = ({
  title,
  queueingTasks,
  ongoingTasks,
  onTaskEdit,
  onTaskDelete,
  onTaskDivide,
  onTaskBranch,
  onTaskMove,
  onTaskView,
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
    
    // Determine whether to drop in queueing or ongoing based on position
    const rect = e.currentTarget.getBoundingClientRect();
    const midPoint = rect.top + rect.height / 2;
    const dropY = e.clientY;
    
    if (dropY < midPoint) {
      onDrop(taskId, 'ongoing');
    } else {
      onDrop(taskId, 'queueing');
    }
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
            <span className="text-sm text-muted-foreground">
              {queueingTasks.length + ongoingTasks.length}
            </span>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Ongoing Section */}
          <div className="flex-1 border-b">
            <div className="p-2 bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-green-700 dark:text-green-300">
                  進行中 ({ongoingTasks.length})
                </h4>
                <Button variant="ghost" size="sm" onClick={() => onAddTask('ongoing')}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="p-2 overflow-y-auto flex-1">
              {ongoingTasks.map(task => (
                <TaskCard
                  key={task.taskId}
                  task={task}
                  onEdit={onTaskEdit}
                  onDelete={onTaskDelete}
                  onDivide={onTaskDivide}
                  onBranch={onTaskBranch}
                  onMove={onTaskMove}
                  onView={onTaskView}
                />
              ))}
            </div>
          </div>

          {/* Queueing Section */}
          <div className="flex-1">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  排隊中 ({queueingTasks.length})
                </h4>
                <Button variant="ghost" size="sm" onClick={() => onAddTask('queueing')}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="p-2 overflow-y-auto flex-1">
              {queueingTasks.map(task => (
                <TaskCard
                  key={task.taskId}
                  task={task}
                  onEdit={onTaskEdit}
                  onDelete={onTaskDelete}
                  onDivide={onTaskDivide}
                  onBranch={onTaskBranch}
                  onMove={onTaskMove}
                  onView={onTaskView}
                />
              ))}
            </div>
          </div>
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
  const { sidebarCollapsed, setSidebarCollapsed } = useUserContext();

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'divide' | 'branch'>('add');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [targetState, setTargetState] = useState<KanbanState>('pending');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

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

  const handleViewTask = (task: Task) => {
    setDetailTask(task);
    setShowDetailModal(true);
  };

  const columns = [
    { title: 'Pending 未開始', state: 'pending' },
    { title: 'In Progress 進行中', state: 'combined' }, // Combined column
    { title: 'Done 已完成', state: 'done' },
  ];

  const getTaskStats = () => {
    const pendingTasks = getTasksByState('pending');
    const queueingTasks = getTasksByState('queueing');
    const ongoingTasks = getTasksByState('ongoing');
    const doneTasks = getTasksByState('done');
    
    return {
      total: tasks.length,
      pending: pendingTasks.length,
      queueing: queueingTasks.length,
      ongoing: ongoingTasks.length,
      done: doneTasks.length,
    };
  };

  const taskStats = getTaskStats();

  const items = [
    {
      collapsed: () => (
        <div className="text-center space-y-3">
          <div>
            <Columns3 className="w-6 h-6 mx-auto mb-1 text-blue-600" />
            <div className="text-xs font-medium text-blue-600">看板</div>
          </div>
          <div className="space-y-2">
            <div className="text-xs">
              <div className="text-green-600 font-medium">{taskStats.done}</div>
              <div className="text-xs text-muted-foreground">完成</div>
            </div>
            <div className="text-xs">
              <div className="text-blue-600 font-medium">{taskStats.ongoing}</div>
              <div className="text-xs text-muted-foreground">進行</div>
            </div>
          </div>
        </div>
      ),
      expanded: () => (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Columns3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">看板統計</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">待開始</span>
                <span className="font-medium text-gray-600">{taskStats.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">排隊中</span>
                <span className="font-medium text-orange-600">{taskStats.queueing}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">進行中</span>
                <span className="font-medium text-blue-600">{taskStats.ongoing}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">已完成</span>
                <span className="font-medium text-green-600">{taskStats.done}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">總計</span>
                  <span className="font-bold">{taskStats.total}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <div className="flex flex-1 overflow-hidden">
      <GenericSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        title="Kanban 看板"
        items={items}
      />
      <div className="flex-1 flex flex-col h-full">
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold">Kanban 看板</h2>
          <p className="text-sm text-muted-foreground">拖拽任務卡片來管理工項狀態</p>
        </div>
        
        <div className="flex-1 flex gap-1 overflow-hidden">
        {columns.map(column => (
          <div key={column.state} className="flex-1 border-r last:border-r-0">
            {column.state === 'combined' ? (
              <CombinedColumn
                title={column.title}
                queueingTasks={getTasksByState('queueing')}
                ongoingTasks={getTasksByState('ongoing')}
                onTaskEdit={handleEditTask}
                onTaskDelete={deleteTask}
                onTaskDivide={handleDivideTask}
                onTaskBranch={handleBranchTask}
                onTaskMove={handleTaskMove}
                onTaskView={handleViewTask}
                onDrop={handleTaskDrop}
                onAddTask={handleAddTask}
              />
            ) : (
              <KanbanColumn
                title={column.title}
                state={column.state as KanbanState}
                tasks={getTasksByState(column.state as KanbanState)}
                onTaskEdit={handleEditTask}
                onTaskDelete={deleteTask}
                onTaskDivide={handleDivideTask}
                onTaskBranch={handleBranchTask}
                onTaskMove={handleTaskMove}
                onTaskView={handleViewTask}
                onDrop={handleTaskDrop}
                onAddTask={handleAddTask}
              />
            )}
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

      <TaskDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        task={detailTask}
        onEdit={(task) => {
          setShowDetailModal(false);
          handleEditTask(task);
        }}
      />
      </div>
    </div>
  );
};