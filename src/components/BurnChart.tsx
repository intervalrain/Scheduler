import React, { useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { Card, CardContent, CardHeader } from './ui/card';
import { TrendingDown, Target } from 'lucide-react';

interface BurnChartPoint {
  date: Date;
  remainingHours: number;
  completedTaskId?: string;
  isIdeal: boolean;
}

export const BurnChart: React.FC = () => {
  const { burnChartData, currentSprint, tasks } = useDataContext();

  const chartData = useMemo(() => {
    if (!currentSprint || burnChartData.length === 0) return null;

    const totalHours = tasks.reduce((sum, task) => sum + task.workHours, 0);
    const sprintDuration = Math.ceil(
      (currentSprint.endDate.getTime() - currentSprint.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Generate ideal burn line
    const idealLine: BurnChartPoint[] = [];
    for (let i = 0; i <= sprintDuration; i++) {
      const date = new Date(currentSprint.startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const remainingHours = totalHours * (1 - i / sprintDuration);
      idealLine.push({
        date,
        remainingHours,
        isIdeal: true,
      });
    }

    // Combine with actual data
    const actualData = burnChartData.filter(point => !point.isIdeal);
    
    return {
      idealLine,
      actualData,
      totalHours,
      sprintDuration,
    };
  }, [burnChartData, currentSprint, tasks]);

  if (!chartData || !currentSprint) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Burn Chart
          </h3>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            需要設定 Sprint 才能顯示 Burn Chart
          </div>
        </CardContent>
      </Card>
    );
  }

  const { idealLine, actualData, totalHours } = chartData;
  const chartWidth = 600;
  const chartHeight = 300;
  const padding = 40;

  // Calculate scales
  const xScale = (date: Date) => {
    const daysSinceStart = (date.getTime() - currentSprint.startDate.getTime()) / (1000 * 60 * 60 * 24);
    return padding + (daysSinceStart / chartData.sprintDuration) * (chartWidth - 2 * padding);
  };

  const yScale = (hours: number) => {
    return chartHeight - padding - (hours / totalHours) * (chartHeight - 2 * padding);
  };

  // Generate path for ideal line
  const idealPath = idealLine
    .map((point, index) => {
      const x = xScale(point.date);
      const y = yScale(point.remainingHours);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Generate path for actual data
  const actualPath = actualData.length > 1 
    ? actualData
        .map((point, index) => {
          const x = xScale(point.date);
          const y = yScale(point.remainingHours);
          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ')
    : '';

  const getHealthStatus = () => {
    if (actualData.length === 0) return 'unknown';
    
    const latestActual = actualData[actualData.length - 1];
    const now = new Date();
    const correspondingIdeal = idealLine.find(point => 
      Math.abs(point.date.getTime() - now.getTime()) < 24 * 60 * 60 * 1000
    );
    
    if (!correspondingIdeal) return 'unknown';
    
    if (latestActual.remainingHours <= correspondingIdeal.remainingHours) {
      return 'healthy'; // Below ideal line = healthy
    } else {
      return 'unhealthy'; // Above ideal line = behind schedule
    }
  };

  const healthStatus = getHealthStatus();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Burn Chart
          </h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            healthStatus === 'healthy' ? 'bg-green-100 text-green-700' :
            healthStatus === 'unhealthy' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {healthStatus === 'healthy' ? '健康' :
             healthStatus === 'unhealthy' ? '落後' : '未知'}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <svg width={chartWidth} height={chartHeight} className="border rounded">
            {/* Grid lines */}
            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const y = yScale(totalHours * (1 - ratio));
              return (
                <g key={ratio}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={chartWidth - padding}
                    y2={y}
                    stroke="#e5e5e5"
                    strokeWidth="1"
                  />
                  <text
                    x={padding - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="12"
                    fill="#666"
                  >
                    {Math.round(totalHours * ratio)}h
                  </text>
                </g>
              );
            })}

            {/* Vertical grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const dayIndex = Math.round(chartData.sprintDuration * ratio);
              const date = new Date(currentSprint.startDate.getTime() + dayIndex * 24 * 60 * 60 * 1000);
              const x = xScale(date);
              return (
                <g key={ratio}>
                  <line
                    x1={x}
                    y1={padding}
                    x2={x}
                    y2={chartHeight - padding}
                    stroke="#e5e5e5"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={chartHeight - padding + 20}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#666"
                  >
                    {formatDate(date)}
                  </text>
                </g>
              );
            })}

            {/* Ideal burn line */}
            <path
              d={idealPath}
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
            />

            {/* Actual burn line */}
            {actualPath && (
              <path
                d={actualPath}
                stroke={healthStatus === 'healthy' ? '#10b981' : '#ef4444'}
                strokeWidth="3"
                fill="none"
              />
            )}

            {/* Data points */}
            {actualData.map((point, index) => (
              <g key={index}>
                <circle
                  cx={xScale(point.date)}
                  cy={yScale(point.remainingHours)}
                  r="4"
                  fill={healthStatus === 'healthy' ? '#10b981' : '#ef4444'}
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Tooltip on hover could be added here */}
              </g>
            ))}

            {/* Axes labels */}
            <text
              x={chartWidth / 2}
              y={chartHeight - 5}
              textAnchor="middle"
              fontSize="14"
              fill="#374151"
              fontWeight="500"
            >
              時間
            </text>
            <text
              x={15}
              y={chartHeight / 2}
              textAnchor="middle"
              fontSize="14"
              fill="#374151"
              fontWeight="500"
              transform={`rotate(-90 15 ${chartHeight / 2})`}
            >
              剩餘工時
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gray-400" style={{ borderStyle: 'dashed' }}></div>
            <span>理想燃盡線</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-0.5 ${healthStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>實際燃盡線</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span>任務完成點</span>
          </div>
        </div>

        {/* Status explanation */}
        <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
          <p className="font-medium mb-1">健康度說明:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• 實際線在理想線<span className="text-green-600 font-medium">下方</span> = 進度超前 (健康)</li>
            <li>• 實際線在理想線<span className="text-red-600 font-medium">上方</span> = 進度落後 (不健康)</li>
            <li>• 每完成一個任務會在圖表上新增一個點</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};