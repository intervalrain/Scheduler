import React from 'react';
import { Button } from './ui/button';
import { Settings, User, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onSettingsClick: () => void;
  isDarkMode?: boolean;
  onThemeToggle?: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onSettingsClick, 
  isDarkMode = false, 
  onThemeToggle,
  activeTab,
  onTabChange
}) => {

  const tabs = [
    { id: 'calendar', name: '行程表', available: true },
    { id: 'gantt', name: 'Gantt', available: true },
    { id: 'kanban', name: 'Kanban', available: true },
  ];

  return (
    <header className="bg-card border-b shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-foreground">Scheduler</h1>
            
            <nav className="flex space-x-1">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  disabled={!tab.available}
                  onClick={() => tab.available && onTabChange(tab.id)}
                  className={`${
                    !tab.available ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {tab.name}
                  {!tab.available && (
                    <span className="ml-1 text-xs text-muted-foreground">(即將推出)</span>
                  )}
                </Button>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-2">
            {onThemeToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onThemeToggle}
                className="w-9 h-9 p-0"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettingsClick}
              className="w-9 h-9 p-0"
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-9 h-9 p-0"
            >
              <User className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}; 