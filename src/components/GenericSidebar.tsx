import React from "react";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";

interface Panel {
  collapsed: (props: any) => React.ReactNode;
  expanded: (props: any) => React.ReactNode;
  props?: any;
}

interface GenericSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  title: string;
  panels: Panel[];
}

export const GenericSidebar: React.FC<GenericSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  title,
  panels,
}) => {
  const { isDarkMode } = useAppContext();

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-1/3"
      } transition-all duration-300 bg-card border-r shadow-lg overflow-hidden flex flex-col`}
    >
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 flex justify-end">
          <Button
            onClick={onToggleCollapse}
            variant="ghost"
            size="sm"
            className={isDarkMode ? `w-10 h-10 p-0 text-white` : `w-10 h-10 p-0`}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {isCollapsed ? (
          <div className={isDarkMode ? `px-2 space-y-3 py-4 text-white` : `px-2 space-y-3 py-4`}>
            {panels.map((panel, index) => (
              <div key={index}>{panel.collapsed(panel.props)}</div>
            ))}
          </div>
        ) : (
          <div className="px-6 pb-6">
            <h2 className="text-2xl font-bold mb-6 text-foreground">{title}</h2>
            {panels.map((panel, index) => (
              <div key={index}>{panel.expanded(panel.props)}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
