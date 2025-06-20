import React from 'react';
import { GenericSidebar } from '../GenericSidebar';
import { Card, CardContent } from '../ui/card';
import { useUserContext } from '../../contexts/UserContext';
import { Construction, BarChart } from 'lucide-react';

export const GanttModule: React.FC = () => {
  const { sidebarCollapsed, setSidebarCollapsed } = useUserContext();

  const items = [
    {
      collapsed: () => (
        <div className="text-center space-y-3">
          <div>
            <BarChart className="w-6 h-6 mx-auto mb-1 text-blue-600" />
            <div className="text-xs font-medium text-blue-600">甘特</div>
          </div>
          <div className="text-xs text-muted-foreground px-2">
            開發中
          </div>
        </div>
      ),
      expanded: () => (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">甘特圖表</h3>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>📊 專案時間軸視圖</p>
              <p>📈 任務依賴關係</p>
              <p>📅 里程碑追蹤</p>
              <p>⏱️ 關鍵路徑分析</p>
            </div>
            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
              功能開發中，敬請期待！
            </div>
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <div className="flex flex-1 overflow-hidden">
      <GenericSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        title="Gantt 圖表"
        items={items}
      />
      <div className="flex-1 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Construction className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Gantt 圖表</h2>
            <p className="text-muted-foreground">
              此功能正在開發中，敬請期待！
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};