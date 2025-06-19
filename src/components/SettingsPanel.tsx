import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip } from './ui/tooltip';
import { Settings } from 'lucide-react';
import { useUserContext } from '../contexts/UserContext';
import type { Schedule } from '../types';

interface SettingsPanelProps {
  collapsed: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ collapsed }) => {
  const { 
    timeConfig, 
    setTimeConfig, 
    schedule,
    updateSchedule,
    timeSlots
  } = useUserContext();

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

  if (collapsed) {
    return (
      <div className="text-center">
        <Tooltip
          content={
            <div className="w-64">
              <h3 className="font-semibold mb-3">時間設定</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    開始時間
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={timeConfig.startTime.toString()}
                    onChange={(e) =>
                      handleTimeConfigChange(
                        "startTime",
                        parseInt(e.target.value)
                      )
                    }
                    className="h-8"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    結束時間
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    value={timeConfig.endTime.toString()}
                    onChange={(e) =>
                      handleTimeConfigChange(
                        "endTime",
                        parseInt(e.target.value)
                      )
                    }
                    className="h-8"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    時段長度
                  </label>
                  <Select
                    value={timeConfig.duration.toString()}
                    onValueChange={(value) =>
                      handleDurationChange(parseFloat(value))
                    }
                  >
                    <SelectTrigger className="h-8">
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
              </div>
            </div>
          }
        >
          <div className="flex flex-col items-center space-y-1 cursor-pointer hover:bg-muted/30 rounded-md p-2 transition-colors">
            <Settings className="w-5 h-5" />
            <span className="text-xs">
              {timeConfig.duration === 0.5
                ? "30m"
                : `${timeConfig.duration}h`}
            </span>
          </div>
        </Tooltip>
      </div>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">時間設定</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            開始時間
          </label>
          <Input
            type="number"
            min="0"
            max="23"
            value={timeConfig.startTime.toString()}
            onChange={(e) =>
              handleTimeConfigChange(
                "startTime",
                parseInt(e.target.value)
              )
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            結束時間
          </label>
          <Input
            type="number"
            min="1"
            max="24"
            value={timeConfig.endTime.toString()}
            onChange={(e) =>
              handleTimeConfigChange(
                "endTime",
                parseInt(e.target.value)
              )
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            時段長度 (小時)
          </label>
          <Select
            value={timeConfig.duration.toString()}
            onValueChange={(value) =>
              handleDurationChange(parseFloat(value))
            }
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
  );
};