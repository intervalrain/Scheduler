import React, { useState, useEffect, useRef } from 'react';
import { BaseModal } from './ui/base-modal';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useUserContext } from '../contexts/UserContext';
import { useDataContext } from '../contexts/DataContext';
import { Keyboard, Settings, Save, X } from 'lucide-react';

interface SettingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingModal: React.FC<SettingModalProps> = ({ isOpen, onClose }) => {
  const { sprintStartDay, setSprintStartDay } = useUserContext();
  const { currentSprint, setCurrentSprint } = useDataContext();
  
  const [activeTab, setActiveTab] = useState<'sprint' | 'hotkeys' | 'other'>('sprint');
  const [sprintName, setSprintName] = useState(currentSprint?.name || '');
  const [sprintStart, setSprintStart] = useState(
    currentSprint?.startDate.toISOString().split('T')[0] || ''
  );
  const [sprintEnd, setSprintEnd] = useState(
    currentSprint?.endDate.toISOString().split('T')[0] || ''
  );
  const [workingStart, setWorkingStart] = useState(currentSprint?.workingHours.start || 9);
  const [workingEnd, setWorkingEnd] = useState(currentSprint?.workingHours.end || 17);
  
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        
        case 'ArrowLeft':
        case 'ArrowRight':
          event.preventDefault();
          const currentTabIndex = ['sprint', 'hotkeys', 'other'].indexOf(activeTab);
          const direction = event.key === 'ArrowRight' ? 1 : -1;
          const newIndex = (currentTabIndex + direction + 3) % 3;
          const newTab = ['sprint', 'hotkeys', 'other'][newIndex] as 'sprint' | 'hotkeys' | 'other';
          setActiveTab(newTab);
          tabRefs.current[newIndex]?.focus();
          break;

        case '1':
        case '2':  
        case '3':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const tabIndex = parseInt(event.key) - 1;
            const tabs = ['sprint', 'hotkeys', 'other'] as const;
            if (tabIndex < tabs.length) {
              setActiveTab(tabs[tabIndex]);
              tabRefs.current[tabIndex]?.focus();
            }
          }
          break;

        case 's':
          if ((event.ctrlKey || event.metaKey) && activeTab === 'sprint') {
            event.preventDefault();
            handleSaveSprint();
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, activeTab, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        tabRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  const weekDays = [
    { value: 0, label: '星期日' },
    { value: 1, label: '星期一' },
    { value: 2, label: '星期二' },
    { value: 3, label: '星期三' },
    { value: 4, label: '星期四' },
    { value: 5, label: '星期五' },
    { value: 6, label: '星期六' },
  ];

  const handleSaveSprint = () => {
    if (!sprintName || !sprintStart || !sprintEnd) return;

    const newSprint = {
      id: currentSprint?.id || Date.now().toString(),
      name: sprintName,
      startDate: new Date(sprintStart),
      endDate: new Date(sprintEnd),
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], // Default working days
      workingHours: {
        start: workingStart,
        end: workingEnd,
      },
    };

    setCurrentSprint(newSprint);
  };

  const hotkeys = [
    { category: '導航', items: [
      { key: 'Tab', description: '在元素間移動焦點' },
      { key: 'Shift + Tab', description: '反向移動焦點' },
      { key: 'Enter', description: '執行選中的動作' },
      { key: 'Escape', description: '關閉模態框或取消操作' },
      { key: 'Space', description: '切換按鈕或選擇項目' },
    ]},
    { category: '模組切換', items: [
      { key: 'Ctrl + 1', description: '切換到儀表板模組' },
      { key: 'Ctrl + 2', description: '切換到甘特圖模組' },
      { key: 'Ctrl + 3', description: '切換到看板模組' },
      { key: 'Ctrl + 4', description: '切換到工作區模組' },
      { key: 'Ctrl + 5', description: '切換到日曆模組' },
    ]},
    { category: '任務操作', items: [
      { key: 'Ctrl + N', description: '新增任務' },
      { key: 'Ctrl + E', description: '編輯選中任務' },
      { key: 'Ctrl + D', description: '刪除選中任務' },
      { key: 'Ctrl + M', description: '移動任務狀態' },
      { key: 'Ctrl + C', description: '複製任務' },
    ]},
    { category: '快速功能', items: [
      { key: 'Ctrl + S', description: '儲存當前設定' },
      { key: 'Ctrl + ,', description: '開啟設定面板' },
      { key: 'Ctrl + /', description: '顯示快捷鍵說明' },
      { key: 'F11', description: '全螢幕模式' },
      { key: 'Ctrl + R', description: '重新整理資料' },
    ]},
    { category: '日曆操作', items: [
      { key: '←/→', description: '移動到前一天/後一天' },
      { key: '↑/↓', description: '移動到前一週/後一週' },
      { key: 'Home', description: '跳到今天' },
      { key: 'Page Up/Down', description: '切換月份' },
      { key: 'Delete', description: '刪除選中的行程' },
    ]},
    { category: '甘特圖操作', items: [
      { key: 'Ctrl + A', description: '自動排程任務' },
      { key: 'Ctrl + Z', description: '撤銷上一個操作' },
      { key: 'Ctrl + Y', description: '重做操作' },
      { key: '+/-', description: '放大/縮小時間軸' },
      { key: 'Ctrl + F', description: '搜尋任務' },
    ]},
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sprint':
        return (
          <div className="h-full space-y-4">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="w-5 h-5" />
                  Sprint 設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Sprint 名稱</label>
                    <Input
                      value={sprintName}
                      onChange={(e) => setSprintName(e.target.value)}
                      placeholder="例：Sprint 2024-01"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">開始日期</label>
                      <Input
                        type="date"
                        value={sprintStart}
                        onChange={(e) => setSprintStart(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">結束日期</label>
                      <Input
                        type="date"
                        value={sprintEnd}
                        onChange={(e) => setSprintEnd(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">工作開始時間</label>
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={workingStart}
                        onChange={(e) => setWorkingStart(parseInt(e.target.value) || 9)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">工作結束時間</label>
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={workingEnd}
                        onChange={(e) => setWorkingEnd(parseInt(e.target.value) || 17)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Sprint 開始日 (週幾)</label>
                    <select
                      value={sprintStartDay}
                      onChange={(e) => setSprintStartDay(parseInt(e.target.value))}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    >
                      {weekDays.map(day => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button onClick={handleSaveSprint} className="w-full flex items-center gap-2 mt-6">
                    <Save className="w-4 h-4" />
                    儲存 Sprint 設定
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'hotkeys':
        return (
          <div className="h-full">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-4 flex-shrink-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Keyboard className="w-5 h-5" />
                  鍵盤快捷鍵
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-6">
                  {hotkeys.map((category, categoryIndex) => (
                    <div key={categoryIndex}>
                      <h3 className="text-base font-semibold mb-3 text-primary border-b pb-2 sticky top-0 bg-background">
                        {category.category}
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {category.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                            <span className="text-sm flex-1 mr-2">{item.description}</span>
                            <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono font-medium shadow-sm whitespace-nowrap">
                              {item.key}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold mb-2 text-sm">💡 使用提示</h4>
                    <ul className="text-xs space-y-1">
                      <li>• 按 <kbd className="px-1 py-0.5 rounded text-xs">Tab</kbd> 鍵可以在所有可互動元素間導航</li>
                      <li>• 在任何輸入欄位中按 <kbd className="px-1 py-0.5 rounded text-xs">Escape</kbd> 可以取消編輯</li>
                      <li>• 快捷鍵組合中的 <kbd className="px-1 py-0.5 rounded text-xs">Ctrl</kbd> 在 Mac 上對應 <kbd className="px-1 py-0.5 rounded text-xs">Cmd</kbd></li>
                      <li>• 按 <kbd className="px-1 py-0.5 rounded text-xs">Ctrl + /</kbd> 可以隨時查看此快捷鍵列表</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'other':
        return (
          <div className="h-full">
            <Card className="h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">其他設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <span className="text-lg">📋</span>
                    <span>時間設定已移至側邊欄</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <span className="text-lg">🎨</span>
                    <span>主題設定 (右上角切換)</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <span className="text-lg">💾</span>
                    <span>資料匯入/匯出</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <span className="text-lg">🔔</span>
                    <span>通知設定</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <span className="text-lg">⚙️</span>
                    <span>更多設定選項將在未來版本中加入...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} className="w-[800px] h-[1000px] max-w-none max-h-none">
      <div ref={modalRef} className="flex flex-col h-full p-6" tabIndex={-1}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold">設定</h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b mb-6 flex-shrink-0" role="tablist">
          <button
            ref={(el) => (tabRefs.current[0] = el)}
            onClick={() => setActiveTab('sprint')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('sprint');
              }
            }}
            role="tab"
            aria-selected={activeTab === 'sprint'}
            aria-controls="sprint-panel"
            tabIndex={activeTab === 'sprint' ? 0 : -1}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-t-lg ${
              activeTab === 'sprint'
                ? 'border-b-2 border-primary text-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Sprint 設定</span>
            <span className="sm:hidden">Sprint</span>
            <span className="text-xs opacity-60 hidden md:inline">(Ctrl+1)</span>
          </button>
          <button
            ref={(el) => (tabRefs.current[1] = el)}
            onClick={() => setActiveTab('hotkeys')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('hotkeys');
              }
            }}
            role="tab"
            aria-selected={activeTab === 'hotkeys'}
            aria-controls="hotkeys-panel"
            tabIndex={activeTab === 'hotkeys' ? 0 : -1}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-t-lg ${
              activeTab === 'hotkeys'
                ? 'border-b-2 border-primary text-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span className="hidden sm:inline">快捷鍵</span>
            <span className="sm:hidden">鍵盤</span>
            <span className="text-xs opacity-60 hidden md:inline">(Ctrl+2)</span>
          </button>
          <button
            ref={(el) => (tabRefs.current[2] = el)}
            onClick={() => setActiveTab('other')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('other');
              }
            }}
            role="tab"
            aria-selected={activeTab === 'other'}
            aria-controls="other-panel"
            tabIndex={activeTab === 'other' ? 0 : -1}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-t-lg ${
              activeTab === 'other'
                ? 'border-b-2 border-primary text-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <span className="hidden sm:inline">其他設定</span>
            <span className="sm:hidden">其他</span>
            <span className="text-xs opacity-60 hidden md:inline">(Ctrl+3)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0">
          <div
            id={`${activeTab}-panel`}
            role="tabpanel"
            aria-labelledby={`${activeTab}-tab`}
            className="h-full overflow-y-auto"
            tabIndex={0}
          >
            {renderTabContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            關閉
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}; 