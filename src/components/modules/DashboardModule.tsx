import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Card, CardContent, CardHeader } from '../ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Activity,
  Target,
  Calendar
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  description 
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive': return <TrendingUp className="w-3 h-3" />;
      case 'negative': return <TrendingDown className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-muted rounded-lg">
              {icon}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
          {change && (
            <div className={`flex items-center space-x-1 ${getChangeColor()}`}>
              {getChangeIcon()}
              <span className="text-sm font-medium">{change}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, label, color = 'blue' }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  const getColorClasses = () => {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-yellow-500';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getColorClasses()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="text-right text-xs text-muted-foreground">
        {percentage.toFixed(1)}%
      </div>
    </div>
  );
};

export const DashboardModule: React.FC = () => {
  const { 
    tasks, 
    projectHealth, 
    currentSprint, 
    getTasksByState 
  } = useAppContext();

  const getTaskStats = () => {
    const pendingTasks = getTasksByState('pending');
    const queueingTasks = getTasksByState('queueing');
    const ongoingTasks = getTasksByState('ongoing');
    const doneTasks = getTasksByState('done');
    
    return {
      total: tasks.length,
      pending: pendingTasks.length,
      queueing: queueingTasks.length,
      ongoing: ongoingTasks.length,
      done: doneTasks.length,
    };
  };

  const getWorkHourStats = () => {
    const incompleteTasks = tasks.filter(task => task.state !== 'done');
    const completedTasks = tasks.filter(task => task.state === 'done');
    
    const totalHours = tasks.reduce((sum, task) => sum + task.workHours, 0);
    const completedHours = completedTasks.reduce((sum, task) => sum + task.workHours, 0);
    const remainingHours = incompleteTasks.reduce((sum, task) => sum + task.workHours, 0);
    
    return {
      total: totalHours,
      completed: completedHours,
      remaining: remainingHours,
    };
  };

  const getHealthStatus = () => {
    const health = projectHealth.healthPercentage;
    
    if (health >= 80) return { status: 'excellent', color: 'green', text: '優良' };
    if (health >= 60) return { status: 'good', color: 'blue', text: '良好' };
    if (health >= 40) return { status: 'warning', color: 'yellow', text: '警告' };
    return { status: 'critical', color: 'red', text: '危險' };
  };

  const getSprintProgress = () => {
    if (!currentSprint) return null;
    
    const now = new Date();
    const total = currentSprint.endDate.getTime() - currentSprint.startDate.getTime();
    const elapsed = now.getTime() - currentSprint.startDate.getTime();
    const progress = Math.max(0, Math.min(100, (elapsed / total) * 100));
    
    return {
      progress,
      daysRemaining: Math.max(0, Math.ceil((currentSprint.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
    };
  };

  const taskStats = getTaskStats();
  const workHourStats = getWorkHourStats();
  const healthStatus = getHealthStatus();
  const sprintProgress = getSprintProgress();

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">專案儀表板</h2>
        <p className="text-muted-foreground">整體專案健康度與進度追蹤</p>
      </div>

      {/* Health Status */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            專案健康度
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${
                healthStatus.color === 'green' ? 'text-green-600' :
                healthStatus.color === 'blue' ? 'text-blue-600' :
                healthStatus.color === 'yellow' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {projectHealth.healthPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">整體健康度</div>
              <div className={`text-sm font-medium ${
                healthStatus.color === 'green' ? 'text-green-600' :
                healthStatus.color === 'blue' ? 'text-blue-600' :
                healthStatus.color === 'yellow' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {healthStatus.text}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-orange-600">
                {projectHealth.laggedHours.toFixed(1)}h
              </div>
              <div className="text-sm text-muted-foreground">落後工時</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-blue-600">
                {projectHealth.availableHours.toFixed(1)}h
              </div>
              <div className="text-sm text-muted-foreground">可用工時</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-purple-600">
                {projectHealth.totalRequiredHours.toFixed(1)}h
              </div>
              <div className="text-sm text-muted-foreground">需求工時</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="總任務數"
          value={taskStats.total}
          icon={<Target className="w-4 h-4" />}
          description={`${taskStats.done} 已完成`}
        />
        
        <StatCard
          title="進行中任務"
          value={taskStats.ongoing}
          icon={<Activity className="w-4 h-4 text-blue-600" />}
          description={`${taskStats.queueing} 排隊中`}
        />
        
        <StatCard
          title="完成工時"
          value={`${workHourStats.completed}h`}
          icon={<CheckCircle className="w-4 h-4 text-green-600" />}
          description={`剩餘 ${workHourStats.remaining}h`}
        />
        
        {currentSprint && sprintProgress && (
          <StatCard
            title="Sprint 進度"
            value={`${sprintProgress.progress.toFixed(1)}%`}
            icon={<Calendar className="w-4 h-4 text-purple-600" />}
            description={`剩餘 ${sprintProgress.daysRemaining} 天`}
          />
        )}
      </div>

      {/* Progress Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Progress */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">任務進度</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressBar
              value={taskStats.done}
              max={taskStats.total}
              label="已完成任務"
              color="green"
            />
            <ProgressBar
              value={taskStats.ongoing}
              max={taskStats.total}
              label="進行中任務"
              color="blue"
            />
            <ProgressBar
              value={taskStats.queueing}
              max={taskStats.total}
              label="排隊中任務"
              color="yellow"
            />
            <ProgressBar
              value={taskStats.pending}
              max={taskStats.total}
              label="待開始任務"
            />
          </CardContent>
        </Card>

        {/* Work Hour Progress */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">工時進度</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressBar
              value={workHourStats.completed}
              max={workHourStats.total}
              label="已完成工時"
              color="green"
            />
            <ProgressBar
              value={workHourStats.remaining}
              max={workHourStats.total}
              label="剩餘工時"
              color="red"
            />
            {currentSprint && (
              <ProgressBar
                value={projectHealth.availableHours}
                max={projectHealth.totalRequiredHours}
                label="可用 vs 需求工時"
                color={projectHealth.availableHours >= projectHealth.totalRequiredHours ? 'green' : 'red'}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sprint Information */}
      {currentSprint && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              當前 Sprint: {currentSprint.name}
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">開始日期</p>
                <p className="font-medium">{currentSprint.startDate.toLocaleDateString('zh-TW')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">結束日期</p>
                <p className="font-medium">{currentSprint.endDate.toLocaleDateString('zh-TW')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">工作時間</p>
                <p className="font-medium">
                  {currentSprint.workingHours.start}:00 - {currentSprint.workingHours.end}:00
                </p>
              </div>
            </div>
            {sprintProgress && (
              <div className="mt-4">
                <ProgressBar
                  value={sprintProgress.progress}
                  max={100}
                  label="Sprint 時間進度"
                  color="purple"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};