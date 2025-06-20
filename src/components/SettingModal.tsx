import React, { useState } from 'react';
import { BaseModal } from './ui/base-modal';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useUserContext } from '../contexts/UserContext';
import { useDataContext } from '../contexts/DataContext';

interface SettingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingModal: React.FC<SettingModalProps> = ({ isOpen, onClose }) => {
  const { sprintStartDay, setSprintStartDay } = useUserContext();
  const { currentSprint, setCurrentSprint } = useDataContext();
  
  const [activeTab, setActiveTab] = useState('sprint');
  const [sprintName, setSprintName] = useState(currentSprint?.name || '');
  const [iterationWeeks, setIterationWeeks] = useState(currentSprint?.iterationWeeks || 2);
  const [sprintStartDayLocal, setSprintStartDayLocal] = useState(currentSprint?.startDay ?? sprintStartDay);
  const [workingStart, setWorkingStart] = useState(currentSprint?.workingHours.start || 9);
  const [workingEnd, setWorkingEnd] = useState(currentSprint?.workingHours.end || 17);
  const [workingDays, setWorkingDays] = useState<string[]>(
    currentSprint?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  );

  const handleWorkingDayToggle = (dayKey: string, dayValue: number) => {
    if (workingDays.includes(dayKey)) {
      // Remove day from working days
      const newWorkingDays = workingDays.filter(day => day !== dayKey);
      setWorkingDays(newWorkingDays);
      
      // Clear start day if it's no longer a working day
      if (sprintStartDayLocal === dayValue) {
        setSprintStartDayLocal(-1);
        setSprintStartDay(-1);
      }
    } else {
      // Add day to working days
      setWorkingDays([...workingDays, dayKey]);
    }
  };

  const weekDays = [
    { value: 0, label: '星期日', key: 'Sunday' },
    { value: 1, label: '星期一', key: 'Monday' },
    { value: 2, label: '星期二', key: 'Tuesday' },
    { value: 3, label: '星期三', key: 'Wednesday' },
    { value: 4, label: '星期四', key: 'Thursday' },
    { value: 5, label: '星期五', key: 'Friday' },
    { value: 6, label: '星期六', key: 'Saturday' },
  ];

  const handleSaveSprint = () => {
    if (!sprintName || iterationWeeks < 1 || workingDays.length === 0) return;

    const newSprint = {
      id: currentSprint?.id || Date.now().toString(),
      name: sprintName,
      iterationWeeks: iterationWeeks,
      startDay: sprintStartDayLocal,
      workingDays: workingDays,
      workingHours: {
        start: workingStart,
        end: workingEnd,
      },
      createdAt: currentSprint?.createdAt || new Date(),
    };

    setCurrentSprint(newSprint);
    setSprintStartDay(sprintStartDayLocal);
  };

  const tabs = [
    { id: 'sprint', label: 'Sprint 設定', icon: '📋' },
    // { id: 'data', label: '資料管理', icon: '💾' },
    { id: 'about', label: '關於', icon: 'ℹ️' },
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} className="max-w-4xl w-4xl h-[600px]">
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">設定</h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto">
          {/* Sprint Settings Tab */}
          {activeTab === 'sprint' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Sprint 設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Sprint 名稱</label>
                  <Input
                    value={sprintName}
                    onChange={(e) => setSprintName(e.target.value)}
                    placeholder="例：Sprint 2024-01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Iteration 長度 (週)</label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={iterationWeeks}
                    onChange={(e) => setIterationWeeks(parseInt(e.target.value) || 2)}
                    placeholder="例：2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    設定每個 Sprint 的週數長度 (1-12 週)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">工作開始時間</label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={workingStart}
                      onChange={(e) => setWorkingStart(parseInt(e.target.value) || 9)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">工作結束時間</label>
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
                  <label className="block text-sm font-medium mb-2 text-foreground">工作日設定</label>
                  <div className="grid grid-cols-4 gap-2">
                    {weekDays.map(day => (
                      <label key={day.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={workingDays.includes(day.key)}
                          onChange={() => handleWorkingDayToggle(day.key, day.value)}
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Sprint 開始日 (週幾)</label>
                  <select
                    value={sprintStartDayLocal}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      setSprintStartDayLocal(newValue);
                      setSprintStartDay(newValue);
                    }}
                    className="w-full p-2 border border-input rounded-md bg-background text-foreground"
                  >
                    <option value={-1}>請選擇開始日</option>
                    {weekDays
                      .filter(day => workingDays.includes(day.key))
                      .map(day => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                  </select>
                  {workingDays.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">請先選擇工作日</p>
                  )}
                </div>

                <Button onClick={handleSaveSprint} className="w-full">
                  儲存 Sprint 設定
                </Button>
              </div>
            </CardContent>
          </Card>
          )}

          {/* System Settings Tab */}
          {activeTab === 'system' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">系統設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">🎨 外觀設定</h4>
                    <p className="text-sm text-muted-foreground">主題切換位於右上角</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">📋 介面設定</h4>
                    <p className="text-sm text-muted-foreground">時間設定已整合至側邊欄</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">🔔 通知設定</h4>
                    <p className="text-sm text-muted-foreground">任務完成提醒和截止日期通知</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Management Tab */}
          {activeTab === 'data' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">資料管理</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">💾 匯入/匯出</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        📤 匯出任務資料 (JSON)
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        📥 匯入任務資料
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">🗑️ 資料清理</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        🧹 清理已完成任務
                      </Button>
                      <Button variant="destructive" className="w-full justify-start">
                        ⚠️ 重置所有資料
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">關於</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">開發管理系統</h3>
                    <p className="text-sm text-muted-foreground">版本 1.0.0</p>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>🎯 任務管理與追蹤系統</p>
                    <p>📊 專案健康度監控</p>
                    <p>📈 燃盡圖與進度分析</p>
                    <p>📝 工作區域與筆記</p>
                    <p>📅 Sprint 規劃與管理</p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      © 2025 Scheduler - <u><a href="mailto:intervalrain@gmail.com">Rain Hu</a></u>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            關閉
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}; 