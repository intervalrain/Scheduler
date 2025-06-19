import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip } from './ui/tooltip';
import { Clock, Settings } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import type { Schedule } from '../types';

interface TimeStatsPanelProps {
  collapsed: boolean;
}

export const TimeStatsPanel: React.FC<TimeStatsPanelProps> = ({ collapsed }) => {
  const { 
    timeConfig, 
    setTimeConfig, 
    calculateRemainingHours, 
    calculateDevelopHours,
    schedule,
    updateSchedule,
    timeSlots
  } = useAppContext();

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
      <>
        <div className="text-center">
          <Tooltip
            content={
              <div>
                <h3 className="font-semibold mb-2">剩餘時間</h3>
                <p className="text-lg text-muted-foreground">
                  還有 {calculateRemainingHours()} 小時的空閒時段
                </p>
              </div>
            }
          >
            <div className="flex flex-col items-center space-y-1 cursor-help">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold text-primary">
                {calculateRemainingHours()}
              </span>
            </div>
          </Tooltip>
        </div>
      </>
    );
  }

  return (
    <>
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {calculateRemainingHours()}
            </p>
            <p className="text-sm text-muted-foreground">
              剩餘時間 (小時)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {calculateDevelopHours()}
            </p>
            <p className="text-sm text-muted-foreground">
              開發時間 (小時)
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}; 