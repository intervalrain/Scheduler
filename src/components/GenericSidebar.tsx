import React from "react";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useUserContext } from "../contexts/UserContext";

interface Panel {
  collapsed: (props: any) => React.ReactNode;
  expanded: (props: any) => React.ReactNode;
  props?: any;
}

interface Separator {
  type: 'separator';
  label?: string;
}

type SidebarItem = Panel | Separator;

interface GenericSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  title: string;
  items: SidebarItem[];
}

export const GenericSidebar: React.FC<GenericSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  title,
  items,
}) => {
  const { isDarkMode } = useUserContext();

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
            {items.map((item, index) => {
              if ('type' in item && item.type === 'separator') {
                return (
                  <div key={index} className="border-t border-border my-2" />
                );
              }
              const panel = item as Panel;
              return <div key={index}>{panel.collapsed(panel.props)}</div>;
            })}
          </div>
        ) : (
          <div className="px-6 pb-6">
            <h2 className="text-2xl font-bold mb-6 text-foreground">{title}</h2>
            {items.map((item, index) => {
              if ('type' in item && item.type === 'separator') {
                return (
                  <div key={index} className="my-6">
                    <div className="border-t border-border" />
                    {item.label && (
                      <div className="text-sm text-muted-foreground mt-2 font-medium">
                        {item.label}
                      </div>
                    )}
                  </div>
                );
              }
              const panel = item as Panel;
              return <div key={index}>{panel.expanded(panel.props)}</div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
};
