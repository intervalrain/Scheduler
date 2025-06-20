import React, { useState, useMemo, useEffect } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Settings, Plus } from 'lucide-react';
import { TimeBlock } from '../types';

interface SprintCalendarProps {
  onSettingsClick?: () => void;
  onStatsUpdate?: (stats: {
    totalBlocks: number;
    blocksByType: { [key: string]: number };
    selectedCellsCount: number;
  }) => void;
}

export const SprintCalendar: React.FC<SprintCalendarProps> = ({ onSettingsClick, onStatsUpdate }) => {
  const { currentSprint, getCurrentSprintDates, getRemainingSprintTime } = useDataContext();
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [calendarSchedule, setCalendarSchedule] = useState<{[dateKey: string]: TimeBlock[]}>({});
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{date: string; time: number} | null>(null);
  
  // Multi-selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{date: string; time: number} | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{date: string; time: number} | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  
  // Time block type definitions
  const blockTypes = [
    { type: 'meeting', name: '會議', color: '#3b82f6' },
    { type: 'lunch', name: '午休', color: '#10b981' },
    { type: 'integration', name: '整合', color: '#f59e0b' },
    { type: 'development', name: '開發', color: '#8b5cf6' },
    { type: 'research', name: '技術研究', color: '#ef4444' },
    { type: 'break', name: '休息', color: '#6b7280' }
  ] as const;

  // Generate sprint-based weeks
  const { weekDays, timeSlots, sprintInfo } = useMemo(() => {
    if (!currentSprint) {
      return { weekDays: [], timeSlots: [], sprintInfo: null };
    }

    const sprintDates = getCurrentSprintDates();
    if (!sprintDates) {
      return { weekDays: [], timeSlots: [], sprintInfo: null };
    }

    // Get working days from sprint settings
    const workingDayKeys = currentSprint.workingDays;
    const dayMap = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6
    };

    // Generate time slots based on sprint working hours
    const slots = [];
    for (let hour = currentSprint.workingHours.start; hour < currentSprint.workingHours.end; hour++) {
      slots.push(`${hour}:00`);
    }

    const { startDate, endDate } = sprintDates;
    const today = new Date();
    const startDayOfWeek = currentSprint.startDay;

    // Calculate which week we're currently in within the sprint
    const daysSinceSprintStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const baseWeekNumber = Math.floor(daysSinceSprintStart / 7);

    // Apply week offset
    const targetWeekNumber = Math.max(0, baseWeekNumber + currentWeekOffset);

    // Calculate the start of target week (relative to sprint start)
    const targetWeekStart = new Date(startDate);
    targetWeekStart.setDate(startDate.getDate() + (targetWeekNumber * 7));

    // Generate working days for this week in sprint order
    const weekDaysList = [];
    const workingDays = workingDayKeys
      .map(key => dayMap[key as keyof typeof dayMap])
      .filter(day => day !== undefined)
      .sort((a, b) => {
        // Sort relative to sprint start day
        const aOffset = (a - startDayOfWeek + 7) % 7;
        const bOffset = (b - startDayOfWeek + 7) % 7;
        return aOffset - bOffset;
      });

    for (const dayOfWeek of workingDays) {
      const dayDate = new Date(targetWeekStart);
      const dayOffset = (dayOfWeek - startDayOfWeek + 7) % 7;
      dayDate.setDate(targetWeekStart.getDate() + dayOffset);
      
      // Only include days within the current sprint
      if (dayDate >= startDate && dayDate <= endDate) {
        weekDaysList.push({
          date: dayDate,
          dayName: ['日', '一', '二', '三', '四', '五', '六'][dayOfWeek],
          fullDayName: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][dayOfWeek],
          dayOfWeek: dayOfWeek
        });
      }
    }

    return {
      weekDays: weekDaysList,
      timeSlots: slots,
      sprintInfo: {
        startDate,
        endDate,
        currentWeek: targetWeekNumber + 1,
        totalWeeks: currentSprint.iterationWeeks,
        remainingTime: getRemainingSprintTime()
      }
    };
  }, [currentSprint, getCurrentSprintDates, getRemainingSprintTime, currentWeekOffset]);

  const getWeekInfo = () => {
    if (!sprintInfo) return '';
    
    return `第 ${sprintInfo.currentWeek} 週 / 共 ${sprintInfo.totalWeeks} 週`;
  };
  
  // Delete time block
  const deleteTimeBlock = (blockId: string, date: string) => {
    setCalendarSchedule(prev => {
      const newSchedule = { ...prev };
      if (newSchedule[date]) {
        newSchedule[date] = newSchedule[date].filter(block => block.id !== blockId);
        if (newSchedule[date].length === 0) {
          delete newSchedule[date];
        }
      }
      return newSchedule;
    });
  };

  const goToPreviousWeek = () => {
    if (!currentSprint) return;
    
    const sprintDates = getCurrentSprintDates();
    if (!sprintDates) return;
    
    const today = new Date();
    const daysSinceSprintStart = Math.floor((today.getTime() - sprintDates.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentWeekInSprint = Math.floor(daysSinceSprintStart / 7);
    const minOffset = -currentWeekInSprint;
    
    setCurrentWeekOffset(prev => Math.max(minOffset, prev - 1));
  };

  const goToNextWeek = () => {
    if (!currentSprint) return;
    
    const sprintDates = getCurrentSprintDates();
    if (!sprintDates) return;
    
    const today = new Date();
    const daysSinceSprintStart = Math.floor((today.getTime() - sprintDates.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentWeekInSprint = Math.floor(daysSinceSprintStart / 7);
    const maxOffset = currentSprint.iterationWeeks - 1 - currentWeekInSprint;
    
    setCurrentWeekOffset(prev => Math.min(maxOffset, prev + 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekOffset(0);
  };

  // Check if navigation buttons should be disabled
  const getNavigationState = () => {
    if (!currentSprint) return { canGoPrev: false, canGoNext: false };
    
    const sprintDates = getCurrentSprintDates();
    if (!sprintDates) return { canGoPrev: false, canGoNext: false };
    
    const today = new Date();
    const daysSinceSprintStart = Math.floor((today.getTime() - sprintDates.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentWeekInSprint = Math.floor(daysSinceSprintStart / 7);
    const minOffset = -currentWeekInSprint;
    const maxOffset = currentSprint.iterationWeeks - 1 - currentWeekInSprint;
    
    return {
      canGoPrev: currentWeekOffset > minOffset,
      canGoNext: currentWeekOffset < maxOffset
    };
  };

  const navigationState = getNavigationState();
  
  // Multi-selection helper functions
  const getCellKey = (date: string, time: number) => `${date}-${time}`;
  
  const getSelectedCellsInRange = () => {
    if (!selectionStart || !selectionEnd || !weekDays.length) return new Set<string>();
    
    const selectedSet = new Set<string>();
    
    // Find date indices
    const startDateIndex = weekDays.findIndex(day => 
      day.date.toISOString().split('T')[0] === selectionStart.date
    );
    const endDateIndex = weekDays.findIndex(day => 
      day.date.toISOString().split('T')[0] === selectionEnd.date
    );
    
    if (startDateIndex === -1 || endDateIndex === -1) return selectedSet;
    
    // Determine range bounds
    const minDateIndex = Math.min(startDateIndex, endDateIndex);
    const maxDateIndex = Math.max(startDateIndex, endDateIndex);
    const minTime = Math.min(selectionStart.time, selectionEnd.time);
    const maxTime = Math.max(selectionStart.time, selectionEnd.time);
    
    // Select all cells in the rectangular range
    for (let dateIndex = minDateIndex; dateIndex <= maxDateIndex; dateIndex++) {
      const day = weekDays[dateIndex];
      const dateStr = day.date.toISOString().split('T')[0];
      
      for (let time = minTime; time <= maxTime; time++) {
        selectedSet.add(getCellKey(dateStr, time));
      }
    }
    
    return selectedSet;
  };
  
  // Update selected cells when selection range changes
  const currentSelectedCells = isSelecting ? getSelectedCellsInRange() : selectedCells;
  
  // Handle mouse events for selection
  const handleMouseDown = (date: string, time: number) => {
    setIsSelecting(true);
    setSelectionStart({ date, time });
    setSelectionEnd({ date, time });
    setSelectedCells(new Set());
  };
  
  const handleMouseEnter = (date: string, time: number) => {
    if (isSelecting && selectionStart) {
      setSelectionEnd({ date, time });
    }
  };
  
  const handleMouseUp = () => {
    if (isSelecting && selectionStart && selectionEnd) {
      setSelectedCells(getSelectedCellsInRange());
      setShowQuickCreate(true);
    }
    setIsSelecting(false);
  };
  
  // Clear selection
  const clearSelection = () => {
    setSelectedCells(new Set());
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsSelecting(false);
  };
  
  // Render individual time cell with time blocks
  const renderTimeCell = (day: any, hour: number) => {
    const dateStr = day.date.toISOString().split('T')[0];
    const cellKey = getCellKey(dateStr, hour);
    const dayBlocks = calendarSchedule[dateStr] || [];
    const cellBlocks = dayBlocks.filter(block => 
      hour >= block.startTime && hour < (block.startTime + block.duration)
    );
    
    const isSelected = currentSelectedCells.has(cellKey);
    const hasBlocks = cellBlocks.length > 0;
    
    return (
      <div
        key={cellKey}
        className={`border-r border-b min-h-16 p-1 transition-colors cursor-pointer relative group select-none ${
          isSelected ? 'bg-blue-200 dark:bg-blue-800' : 'hover:bg-muted/50'
        }`}
        onMouseDown={() => !hasBlocks && handleMouseDown(dateStr, hour)}
        onMouseEnter={() => handleMouseEnter(dateStr, hour)}
        onMouseUp={handleMouseUp}
        onClick={() => !isSelecting && hasBlocks === false && handleCellClick(dateStr, hour)}
        onDrop={(e) => handleDrop(e, dateStr, hour)}
        onDragOver={(e) => e.preventDefault()}
        title={isSelected ? `已選取 - ${day.fullDayName} ${hour}:00` : `點擊選取 - ${day.fullDayName} ${hour}:00`}
      >
        {cellBlocks.length > 0 ? (
          cellBlocks.map(block => (
            <div
              key={block.id}
              className="absolute inset-1 rounded text-white text-xs p-1 cursor-move flex items-center justify-center font-medium"
              style={{ 
                backgroundColor: block.color,
                height: `${(block.duration * 100)}%`,
                zIndex: 10
              }}
              draggable
              onDragStart={(e) => handleDragStart(e, block)}
              title={`${block.title} (${block.duration}h)`}
            >
              {block.title}
            </div>
          ))
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-primary/10 rounded px-2 py-1">
              <Plus className="w-3 h-3 text-primary" />
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Handle cell click for creating time blocks
  const handleCellClick = (date: string, hour: number) => {
    setSelectedCell({ date, time: hour });
    setShowQuickCreate(true);
  };
  
  // Handle drag start
  const handleDragStart = (e: React.DragEvent, block: TimeBlock) => {
    e.dataTransfer.setData('timeBlock', JSON.stringify(block));
  };
  
  // Handle drop
  const handleDrop = (e: React.DragEvent, date: string, hour: number) => {
    e.preventDefault();
    const blockData = e.dataTransfer.getData('timeBlock');
    if (blockData) {
      try {
        const block: TimeBlock = JSON.parse(blockData);
        moveTimeBlock(block, date, hour);
      } catch (error) {
        console.error('Error parsing dropped time block:', error);
      }
    }
  };
  
  // Move time block to new position
  const moveTimeBlock = (block: TimeBlock, newDate: string, newTime: number) => {
    setCalendarSchedule(prev => {
      const newSchedule = { ...prev };
      
      // Remove from old position
      if (newSchedule[block.date]) {
        newSchedule[block.date] = newSchedule[block.date].filter(b => b.id !== block.id);
        if (newSchedule[block.date].length === 0) {
          delete newSchedule[block.date];
        }
      }
      
      // Add to new position
      const updatedBlock = { ...block, date: newDate, startTime: newTime };
      if (!newSchedule[newDate]) {
        newSchedule[newDate] = [];
      }
      newSchedule[newDate].push(updatedBlock);
      
      return newSchedule;
    });
  };
  
  // Create new time block(s) - supports both single cell and multi-cell selection
  const createTimeBlock = (type: string, title: string) => {
    const blockType = blockTypes.find(bt => bt.type === type);
    if (!blockType) return;
    
    // Use selected cells if available, otherwise use single selected cell
    const cellsToProcess = selectedCells.size > 0 ? selectedCells : 
      (selectedCell ? new Set([getCellKey(selectedCell.date, selectedCell.time)]) : new Set());
    
    if (cellsToProcess.size === 0) return;
    
    setCalendarSchedule(prev => {
      const newSchedule = { ...prev };
      
      // Group cells by date for efficient processing
      const cellsByDate: { [date: string]: number[] } = {};
      
      cellsToProcess.forEach(cellKey => {
        const cellKeyStr = cellKey as string;
        const [date, timeStr] = cellKeyStr.split('-');
        const time = parseInt(timeStr);
        
        if (!cellsByDate[date]) {
          cellsByDate[date] = [];
        }
        cellsByDate[date].push(time);
      });
      
      // Create blocks for each date
      Object.entries(cellsByDate).forEach(([date, times]) => {
        times.sort((a, b) => a - b); // Sort times in ascending order
        
        // Create continuous blocks
        let blockStart = times[0];
        let blockEnd = times[0];
        
        for (let i = 1; i <= times.length; i++) {
          const currentTime = times[i];
          
          // If current time is not consecutive or we're at the end
          if (i === times.length || currentTime !== blockEnd + 1) {
            // Create a block from blockStart to blockEnd
            const newBlock: TimeBlock = {
              id: `block-${Date.now()}-${Math.random()}`,
              type: type as TimeBlock['type'],
              title: title || blockType.name,
              startTime: blockStart,
              duration: blockEnd - blockStart + 1,
              date: date,
              color: blockType.color
            };
            
            if (!newSchedule[date]) {
              newSchedule[date] = [];
            }
            newSchedule[date].push(newBlock);
            
            // Start a new block if we're not at the end
            if (i < times.length) {
              blockStart = currentTime;
              blockEnd = currentTime;
            }
          } else {
            blockEnd = currentTime;
          }
        }
      });
      
      return newSchedule;
    });
    
    // Clear selections
    clearSelection();
    setShowQuickCreate(false);
    setSelectedCell(null);
  };
  
  // Get statistics for selected cells and blocks
  const getCalendarStats = () => {
    const stats = {
      totalBlocks: 0,
      blocksByType: {} as { [key: string]: number },
      selectedCellsCount: currentSelectedCells.size
    };
    
    Object.values(calendarSchedule).forEach(dayBlocks => {
      dayBlocks.forEach(block => {
        stats.totalBlocks++;
        stats.blocksByType[block.type] = (stats.blocksByType[block.type] || 0) + 1;
      });
    });
    
    return stats;
  };
  
  // Update parent component with stats when they change
  useEffect(() => {
    if (onStatsUpdate) {
      const stats = getCalendarStats();
      onStatsUpdate(stats);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarSchedule, currentSelectedCells, onStatsUpdate]);
  
  // Global mouse up handler to end selection
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        setIsSelecting(false);
        if (selectionStart && selectionEnd) {
          setSelectedCells(getSelectedCellsInRange());
          setShowQuickCreate(true);
        }
      }
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isSelecting, selectionStart, selectionEnd]);

  if (!currentSprint) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2 text-foreground">尚未設定 Sprint</h3>
          <p className="text-muted-foreground mb-4">
            請先在設定中配置 Sprint 資訊才能使用行事曆功能
          </p>
          <Button variant="outline" className="gap-2" onClick={onSettingsClick}>
            <Settings className="w-4 h-4" />
            前往設定
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Calendar Header */}
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Sprint 行事曆</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {currentSprint.name} • {getWeekInfo()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToPreviousWeek}
                disabled={!navigationState.canGoPrev}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                本週
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNextWeek}
                disabled={!navigationState.canGoNext}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 p-0 overflow-auto">
          <div className="grid min-h-full" style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, 1fr)` }}>
            {/* Time column header */}
            <div className="border-r border-b p-2 bg-muted">
              <span className="text-sm font-medium text-foreground">時間</span>
            </div>

            {/* Day headers */}
            {weekDays.map((day, index) => (
              <div key={index} className="border-r border-b p-2 bg-muted text-center">
                <div className="text-sm font-medium text-foreground">{day.fullDayName}</div>
                <div className="text-xs text-muted-foreground">
                  {day.date.getMonth() + 1}/{day.date.getDate()}
                </div>
              </div>
            ))}

            {/* Time slots and cells */}
            {timeSlots.map((time, timeIndex) => (
              <React.Fragment key={time}>
                {/* Time label */}
                <div className="border-r border-b p-2 bg-muted text-right">
                  <span className="text-sm text-foreground">{time}</span>
                </div>

                {/* Day cells */}
                {weekDays.map((day, dayIndex) => 
                  renderTimeCell(day, parseInt(time.split(':')[0]))
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Create Modal */}
      {showQuickCreate && (selectedCell || selectedCells.size > 0) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { clearSelection(); setShowQuickCreate(false); }}>
          <Card className="w-96" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>新增時間塊</CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedCells.size > 0 
                  ? `已選取 ${selectedCells.size} 個時間格` 
                  : selectedCell 
                    ? `${selectedCell.date} ${selectedCell.time}:00`
                    : ''
                }
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {blockTypes.map(blockType => (
                  <Button
                    key={blockType.type}
                    variant="outline"
                    className="h-12 flex flex-col items-center justify-center"
                    style={{ borderColor: blockType.color }}
                    onClick={() => createTimeBlock(blockType.type, blockType.name)}
                  >
                    <div 
                      className="w-3 h-3 rounded mb-1" 
                      style={{ backgroundColor: blockType.color }}
                    />
                    <span className="text-xs">{blockType.name}</span>
                  </Button>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { clearSelection(); setShowQuickCreate(false); }}>
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};