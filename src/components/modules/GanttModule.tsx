import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Construction } from 'lucide-react';

export const GanttModule: React.FC = () => {
  return (
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
  );
};