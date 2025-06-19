import React from 'react';
import { TaskTypePanel } from './TaskTypePanel';
import { TimeStatsPanel } from './TimeStatsPanel';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppContext();

  return (
    <div
      className={`${
        sidebarCollapsed ? "w-16" : "w-1/3"
      } transition-all duration-300 bg-card border-r shadow-lg overflow-hidden flex flex-col`}
    >
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 flex justify-end">
          <Button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {sidebarCollapsed ? (
          <div className="px-2 space-y-3 py-4">
            <TimeStatsPanel collapsed={true} />
            <TaskTypePanel collapsed={true} />
          </div>
        ) : (
          <div className="px-6 pb-6">
            <h2 className="text-2xl font-bold mb-6 text-foreground">
              行程規劃工具
            </h2>
            <TimeStatsPanel collapsed={false} />
            <TaskTypePanel collapsed={false} />
          </div>
        )}
      </div>
    </div>
  );
}; 