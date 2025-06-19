import React from 'react';
import { GenericSidebar } from '../GenericSidebar';
import { Calendar } from '../Calendar';
import { TimeStatsPanel } from '../TimeStatsPanel';
import { TaskTypePanel } from '../TaskTypePanel';
import { SettingsPanel } from '../SettingsPanel';
import { useUserContext } from '../../contexts/UserContext';

export const CalendarModule: React.FC = () => {
  const { sidebarCollapsed, setSidebarCollapsed } = useUserContext();

  const panels = [
    {
      collapsed: () => <TimeStatsPanel collapsed={true} />,
      expanded: () => <TimeStatsPanel collapsed={false} />,
    },
    {
      collapsed: () => <SettingsPanel collapsed={true} />,
      expanded: () => <SettingsPanel collapsed={false} />,
    },
    {
      collapsed: () => <TaskTypePanel collapsed={true} />,
      expanded: () => <TaskTypePanel collapsed={false} />,
    },
  ];

  return (
    <div className="flex flex-1 overflow-hidden">
      <GenericSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        title="行程規劃工具"
        panels={panels}
      />
      <Calendar />
    </div>
  );
};