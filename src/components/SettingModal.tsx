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
  
  const [sprintName, setSprintName] = useState(currentSprint?.name || '');
  const [sprintStart, setSprintStart] = useState(
    currentSprint?.startDate.toISOString().split('T')[0] || ''
  );
  const [sprintEnd, setSprintEnd] = useState(
    currentSprint?.endDate.toISOString().split('T')[0] || ''
  );
  const [workingStart, setWorkingStart] = useState(currentSprint?.workingHours.start || 9);
  const [workingEnd, setWorkingEnd] = useState(currentSprint?.workingHours.end || 17);

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

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">設定</h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="space-y-6">
          {/* Sprint Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Sprint 設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

                <Button onClick={handleSaveSprint} className="w-full">
                  儲存 Sprint 設定
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Other Settings */}
          <Card>
            <CardHeader>
              <CardTitle>其他設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">📋 時間設定已移至側邊欄</p>
                <p className="mb-2">🎨 主題設定 (右上角切換)</p>
                <p className="mb-2">💾 資料匯入/匯出</p>
                <p className="mb-2">🔔 通知設定</p>
                <p>⚙️ 更多設定選項將在未來版本中加入...</p>
              </div>
            </CardContent>
          </Card>
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