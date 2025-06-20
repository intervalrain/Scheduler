import React, { useState, useEffect } from 'react';
import { useDataContext } from '../../contexts/DataContext';
import { useUserContext } from '../../contexts/UserContext';
import { GenericSidebar } from '../GenericSidebar';
import { TaskSelectionPanel } from '../TaskSelectionPanel';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { MarkdownEditor } from '../MarkdownEditor';
import { Task, ChecklistItem } from '../../types';
import { 
  Play, 
  Plus, 
  Check, 
  X, 
  Edit,
  CheckCircle2,
  Circle
} from 'lucide-react';

export const WorkAreaModule: React.FC = () => {
  const { 
    currentWorkTask, 
    setCurrentWorkTask, 
    updateTask
  } = useDataContext();
  const { sidebarCollapsed, setSidebarCollapsed } = useUserContext();

  const [markdownNotes, setMarkdownNotes] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    if (currentWorkTask) {
      setMarkdownNotes(currentWorkTask.notes);
    }
  }, [currentWorkTask]);

  const handleTaskSelect = (task: Task) => {
    setCurrentWorkTask(task);
    setMarkdownNotes(task.notes);
  };

  const handleSaveNotes = () => {
    if (currentWorkTask) {
      updateTask(currentWorkTask.taskId, { notes: markdownNotes });
      setCurrentWorkTask({ ...currentWorkTask, notes: markdownNotes });
    }
  };

  const handleAddChecklistItem = () => {
    if (!currentWorkTask || !newChecklistItem.trim()) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newChecklistItem.trim(),
      completed: false,
    };

    const updatedItems = [...currentWorkTask.items, newItem];
    updateTask(currentWorkTask.taskId, { items: updatedItems });
    setCurrentWorkTask({ ...currentWorkTask, items: updatedItems });
    setNewChecklistItem('');
  };

  const handleToggleChecklistItem = (itemId: string) => {
    if (!currentWorkTask) return;

    const updatedItems = currentWorkTask.items.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateTask(currentWorkTask.taskId, { items: updatedItems });
    setCurrentWorkTask({ ...currentWorkTask, items: updatedItems });
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    if (!currentWorkTask) return;

    const updatedItems = currentWorkTask.items.filter(item => item.id !== itemId);
    updateTask(currentWorkTask.taskId, { items: updatedItems });
    setCurrentWorkTask({ ...currentWorkTask, items: updatedItems });
  };

  const handleEditChecklistItem = (itemId: string, newText: string) => {
    if (!currentWorkTask || !newText.trim()) return;

    const updatedItems = currentWorkTask.items.map(item =>
      item.id === itemId ? { ...item, text: newText.trim() } : item
    );
    updateTask(currentWorkTask.taskId, { items: updatedItems });
    setCurrentWorkTask({ ...currentWorkTask, items: updatedItems });
    setEditingItemId(null);
    setEditingText('');
  };

  const getCompletionPercentage = (): number => {
    if (!currentWorkTask || currentWorkTask.items.length === 0) return 0;
    const completedItems = currentWorkTask.items.filter(item => item.completed).length;
    return Math.round((completedItems / currentWorkTask.items.length) * 100);
  };

  const items = [
    {
      collapsed: () => (
        <TaskSelectionPanel 
          collapsed={true} 
          onTaskSelect={handleTaskSelect}
          currentWorkTask={currentWorkTask}
        />
      ),
      expanded: () => (
        <TaskSelectionPanel 
          collapsed={false} 
          onTaskSelect={handleTaskSelect}
          currentWorkTask={currentWorkTask}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-1 overflow-hidden">
      <GenericSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        title="工作區域"
        items={items}
      />

      {/* Work Area */}
      <div className="flex-1 flex flex-col space-y-4 overflow-hidden p-4">
        {currentWorkTask ? (
          <>
            {/* Task Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{currentWorkTask.taskName}</h2>
                    <p className="text-muted-foreground">{currentWorkTask.category} • {currentWorkTask.workHours}h</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">{getCompletionPercentage()}%</div>
                    <div className="text-sm text-muted-foreground">完成度</div>
                  </div>
                </div>
                {currentWorkTask.description && (
                  <p className="text-sm text-muted-foreground mt-2">{currentWorkTask.description}</p>
                )}
              </CardHeader>
            </Card>

            <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
              {/* Checklist */}
              <Card className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      檢查清單 ({currentWorkTask.items.filter(i => i.completed).length}/{currentWorkTask.items.length})
                    </h3>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="新增檢查項目..."
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                    />
                    <Button onClick={handleAddChecklistItem} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {currentWorkTask.items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-2 rounded border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleChecklistItem(item.id)}
                          className="p-0 w-6 h-6"
                        >
                          {item.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </Button>
                        
                        {editingItemId === item.id ? (
                          <div className="flex-1 flex gap-2">
                            <Input
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditChecklistItem(item.id, editingText);
                                if (e.key === 'Escape') {
                                  setEditingItemId(null);
                                  setEditingText('');
                                }
                              }}
                              className="text-sm"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditChecklistItem(item.id, editingText)}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingItemId(null);
                                setEditingText('');
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-between">
                            <span 
                              className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}
                            >
                              {item.text}
                            </span>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingItemId(item.id);
                                  setEditingText(item.text);
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteChecklistItem(item.id)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Markdown Notes */}
              <MarkdownEditor
                value={markdownNotes}
                onChange={setMarkdownNotes}
                onSave={handleSaveNotes}
                placeholder="在此處撰寫 Markdown 筆記..."
                className="flex-1"
              />
            </div>
          </>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <CardContent className="text-center">
              <Play className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">選擇工作任務</h3>
              <p className="text-muted-foreground">
                從左側選擇一個進行中或排隊中的任務開始工作
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};