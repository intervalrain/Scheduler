import React from 'react';
import { useDataContext } from '../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp,
  Settings
} from 'lucide-react';

interface SprintInfoPanelProps {
  collapsed: boolean;
  onSettingsClick?: () => void;
  calendarStats?: {
    totalBlocks: number;
    blocksByType: { [key: string]: number };
    selectedCellsCount: number;
  };
}

export const SprintInfoPanel: React.FC<SprintInfoPanelProps> = ({ 
  collapsed, 
  onSettingsClick,
  calendarStats 
}) => {
  const { 
    currentSprint, 
    getCurrentSprintDates, 
    getRemainingSprintTime,
    getTasksByState 
  } = useDataContext();

  const sprintDates = getCurrentSprintDates();
  const remainingTime = getRemainingSprintTime();
  const pendingTasks = getTasksByState('pending');
  const ongoingTasks = getTasksByState('ongoing');
  const queueingTasks = getTasksByState('queueing');

  if (collapsed) {
    if (!currentSprint) {
      return (
        <div className="text-center space-y-3">
          <div>
            <Settings className="w-6 h-6 mx-auto mb-1 text-red-600" />
            <div className="text-xs font-medium text-red-600">設定</div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSettingsClick}
            className="w-full text-xs"
          >
            <Settings className="w-3 h-3" />
          </Button>
        </div>
      );
    }

    const currentWeek = Math.floor((new Date().getTime() - sprintDates?.startDate.getTime()!) / (1000 * 60 * 60 * 24 * 7)) + 1;
    
    return (
      <div className="text-center space-y-3">
        <div>
          <Calendar className="w-6 h-6 mx-auto mb-1 text-blue-600" />
          <div className="text-xs font-medium text-blue-600">第{currentWeek}週</div>
        </div>
        
        <div className="border-t border-border pt-2 space-y-2">
          <div>
            <Clock className="w-5 h-5 mx-auto mb-1 text-orange-600" />
            <div className="text-xs font-medium text-orange-600">
              {remainingTime ? remainingTime.split(' ')[0] : '--'}
            </div>
          </div>
          
          {calendarStats && (
            <div>
              <div className="text-purple-600 font-medium text-sm">{calendarStats.totalBlocks}</div>
              <div className="text-xs text-muted-foreground">時間塊</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!currentSprint) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Calendar className="w-4 h-4" />
            Sprint 資訊
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">尚未設定 Sprint</p>
          <Button onClick={onSettingsClick} className="w-full">
            <Settings className="w-4 h-4 mr-2" />
            前往設定
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sprint Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Calendar className="w-4 h-4" />
            {currentSprint.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-3 h-3" />
              <span className="text-muted-foreground">剩餘時間:</span>
              <span className="font-medium text-foreground">{remainingTime}</span>
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-3 h-3" />
              <span className="text-muted-foreground">Iteration:</span>
              <span className="font-medium text-foreground">{currentSprint.iterationWeeks} 週</span>
            </div>
          </div>

          {sprintDates && (
            <div className="text-xs text-muted-foreground">
              <div>{sprintDates.startDate.toLocaleDateString()} - {sprintDates.endDate.toLocaleDateString()}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="w-4 h-4" />
            任務概覽
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">進行中</span>
            <span className="font-medium text-blue-600">{ongoingTasks.length}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">排隊中</span>
            <span className="font-medium text-orange-600">{queueingTasks.length}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">待開始</span>
            <span className="font-medium text-gray-600">{pendingTasks.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Clock className="w-4 h-4" />
            工作時間
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">每日時間</span>
              <span className="font-medium text-foreground">
                {currentSprint.workingHours.start}:00 - {currentSprint.workingHours.end}:00
              </span>
            </div>
          </div>
          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">工作日</span>
              <span className="font-medium text-foreground">
                {currentSprint.workingDays.length} 天/週
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Blocks Statistics */}
      {calendarStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Target className="w-4 h-4" />
              行事曆統計
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">總時間塊</span>
                <span className="font-medium text-foreground">{calendarStats.totalBlocks}</span>
              </div>
            </div>
            
            {calendarStats.selectedCellsCount > 0 && (
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">已選取格數</span>
                  <span className="font-medium text-blue-600">{calendarStats.selectedCellsCount}</span>
                </div>
              </div>
            )}
            
            {Object.keys(calendarStats.blocksByType).length > 0 && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">時間塊類型分布:</div>
                {Object.entries(calendarStats.blocksByType).map(([type, count]) => {
                  const typeNames: { [key: string]: string } = {
                    'meeting': '會議',
                    'lunch': '午休',
                    'integration': '整合',
                    'development': '開發',
                    'research': '技術研究',
                    'break': '休息'
                  };
                  return (
                    <div key={type} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{typeNames[type] || type}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};