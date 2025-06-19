import React from 'react';
import { BaseModal } from './ui/base-modal';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAppContext } from '../contexts/AppContext';
import type { Schedule } from '../types';

interface SettingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingModal: React.FC<SettingModalProps> = ({ isOpen, onClose }) => {
  const { timeConfig, setTimeConfig, schedule, updateSchedule, timeSlots } = useAppContext();

  const handleTimeConfigChange = (field: keyof typeof timeConfig, value: number) => {
    setTimeConfig(prev => ({ ...prev, [field]: value }));
  };

  const convertScheduleForNewDuration = (newDuration: number): Schedule => {
    const newSchedule: Schedule = {};
    const currentSlots = timeSlots;
    const newSlots = generateTimeSlotsWithDuration(newDuration);

    Object.entries(schedule).forEach(([key, task]) => {
      const [day, timeSlot] = key.split("-", 2);
      const currentSlotIndex = currentSlots.indexOf(timeSlot);

      if (currentSlotIndex !== -1) {
        const timeInHours =
          timeConfig.startTime + currentSlotIndex * timeConfig.duration;
        const newSlotIndex = Math.floor(
          (timeInHours - timeConfig.startTime) / newDuration
        );

        if (newSlotIndex >= 0 && newSlotIndex < newSlots.length) {
          const newKey = `${day}-${newSlots[newSlotIndex]}`;

          if (!newSchedule[newKey]) {
            newSchedule[newKey] = {
              ...task,
              isMultiSlot: false,
            };
          }
        }
      }
    });

    return newSchedule;
  };

  const generateTimeSlotsWithDuration = (duration: number): string[] => {
    const slots: string[] = [];
    let currentTime = timeConfig.startTime;

    while (currentTime < timeConfig.endTime) {
      const endTime = currentTime + duration;
      const startHour = Math.floor(currentTime);
      const startMin = (currentTime % 1) * 60;
      const endHour = Math.floor(endTime);
      const endMin = (endTime % 1) * 60;

      const timeSlot = `${startHour.toString().padStart(2, "0")}:${startMin
        .toString()
        .padStart(2, "0")}-${endHour.toString().padStart(2, "0")}:${endMin
        .toString()
        .padStart(2, "0")}`;
      slots.push(timeSlot);

      currentTime += duration;
    }
    return slots;
  };

  const handleDurationChange = (newDuration: number) => {
    if (newDuration !== timeConfig.duration) {
      const convertedSchedule = convertScheduleForNewDuration(newDuration);
      setTimeConfig(prev => ({ ...prev, duration: newDuration }));
      updateSchedule(convertedSchedule);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">設定</h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>時間設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    開始時間
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={timeConfig.startTime}
                    onChange={(e) =>
                      handleTimeConfigChange('startTime', parseInt(e.target.value))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    結束時間
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    value={timeConfig.endTime}
                    onChange={(e) =>
                      handleTimeConfigChange('endTime', parseInt(e.target.value))
                    }
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  時段長度
                </label>
                <Select
                  value={timeConfig.duration.toString()}
                  onValueChange={(value) => handleDurationChange(parseFloat(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">30分鐘</SelectItem>
                    <SelectItem value="1">1小時</SelectItem>
                    <SelectItem value="2">2小時</SelectItem>
                    <SelectItem value="4">4小時</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>其他設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                更多設定選項將在未來版本中加入...
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={onClose}>
            確定
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}; 