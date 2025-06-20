import React, { useState, useCallback } from 'react';
import { GenericSidebar } from '../GenericSidebar';
import { Calendar } from '../Calendar';
import { SprintInfoPanel } from '../SprintInfoPanel';
import { SettingsPanel } from '../SettingsPanel';
import { useUserContext } from '../../contexts/UserContext';

interface CalendarModuleProps {
  onSettingsClick?: () => void;
}

interface CalendarStats {
  totalBlocks: number;
  blocksByType: { [key: string]: number };
  selectedCellsCount: number;
}

export const CalendarModule: React.FC<CalendarModuleProps> = ({ onSettingsClick }) => {
  const { sidebarCollapsed, setSidebarCollapsed } = useUserContext();
  const [calendarStats, setCalendarStats] = useState<CalendarStats>({
    totalBlocks: 0,
    blocksByType: {},
    selectedCellsCount: 0
  });

  const handleStatsUpdate = useCallback((stats: CalendarStats) => {
    setCalendarStats(stats);
  }, []);

  const items = [
    {
      collapsed: () => (
        <SprintInfoPanel 
          collapsed={true} 
          onSettingsClick={onSettingsClick} 
          calendarStats={calendarStats}
        />
      ),
      expanded: () => (
        <SprintInfoPanel 
          collapsed={false} 
          onSettingsClick={onSettingsClick} 
          calendarStats={calendarStats}
        />
      ),
    },
    {
      type: 'separator' as const,
      label: '時間設定'
    },
    {
      collapsed: () => (
        <SettingsPanel collapsed={true} />
      ),
      expanded: () => (
        <SettingsPanel collapsed={false} />
      ),
    },
  ];

  return (
    <div className="flex flex-1 overflow-hidden">
      <GenericSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        title="Sprint 行事曆"
        items={items}
      />
      <div className="flex-1 overflow-hidden">
        <Calendar 
          onSettingsClick={onSettingsClick} 
          onStatsUpdate={handleStatsUpdate}
        />
      </div>
    </div>
  );
};