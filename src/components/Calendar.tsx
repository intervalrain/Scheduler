import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { useUserContext } from '../contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Settings, Plus } from 'lucide-react';
import { TimeBlock } from '../types';

interface CalendarProps {
  onSettingsClick?: () => void;
  onStatsUpdate?: (stats: {
    totalBlocks: number;
    blocksByType: { [key: string]: number };
    selectedCellsCount: number;
  }) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ onSettingsClick, onStatsUpdate }) => {
  const { currentSprint, getCurrentSprintDates, getRemainingSprintTime } = useDataContext();
  const { timeConfig } = useUserContext();
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [calendarSchedule, setCalendarSchedule] = useState<{[dateKey: string]: TimeBlock[]}>({});
  
  // Initialize with a test time block and clean up bad data  
  useEffect(() => {
    // Clear localStorage to start fresh and fix any corrupted data
    localStorage.removeItem('calendarSchedule');
    
    // Clean up any existing bad data
    setCalendarSchedule(prev => {
      const cleaned = { ...prev };
      // Remove the invalid '2025' key if it exists
      if (cleaned['2025']) {
        delete cleaned['2025'];
        console.log('Removed invalid date key: 2025');
      }
      return cleaned;
    });
    
    // Create visible test blocks for debugging
    const today = new Date();
    const testDate = today.toISOString().split('T')[0]; // Proper YYYY-MM-DD format
    
    console.log('Creating test blocks for date:', testDate);
    console.log('Today is:', today.toDateString());
    
    // Create multiple test blocks at different times to ensure visibility
    const testSchedule = {
      [testDate]: [
        {
          id: 'debug-test-block-1',
          type: 'meeting' as const,
          title: '🔴 TEST 9AM',
          startTime: 9,  // Fixed at 9 AM
          duration: 1,   // 1 hour duration
          date: testDate,
          color: '#ff0000'
        },
        {
          id: 'debug-test-block-2', 
          type: 'development' as const,
          title: '🟢 TEST 2PM',
          startTime: 14, // Fixed at 2 PM
          duration: 2,   // 2 hour duration
          date: testDate,
          color: '#00ff00'
        },
        {
          id: 'debug-test-block-3',
          type: 'integration' as const, 
          title: '🔵 TEST 11AM',
          startTime: 11, // Fixed at 11 AM
          duration: 1,   // 1 hour duration
          date: testDate,
          color: '#0000ff'
        }
      ]
    };
    
    console.log('Setting test schedule:', testSchedule);
    setCalendarSchedule(testSchedule);
  }, []);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{date: string; time: number} | null>(null);
  
  // Multi-selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{date: string; time: number} | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{date: string; time: number} | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  
  // Debug: Monitor state changes
  useEffect(() => {
    console.log('\n=== STATE CHANGE ===');
    console.log('showQuickCreate changed to:', showQuickCreate);
    console.log('selectedCell:', selectedCell);
  }, [showQuickCreate, selectedCell]);
  
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

    // Generate time slots based on timeConfig (prioritize user preference over Sprint bounds)
    const slots = [];
    // Use timeConfig as primary source, with Sprint working hours as fallback
    const effectiveStartTime = timeConfig.startTime || currentSprint.workingHours.start;
    const effectiveEndTime = timeConfig.endTime || currentSprint.workingHours.end;
    
    let currentTime = effectiveStartTime;
    while (currentTime < effectiveEndTime) {
      const hour = Math.floor(currentTime);
      const minutes = Math.round((currentTime % 1) * 60);
      const timeLabel = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      slots.push(timeLabel);
      currentTime += timeConfig.duration;
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
  }, [currentSprint, getCurrentSprintDates, getRemainingSprintTime, currentWeekOffset, timeConfig.startTime, timeConfig.endTime, timeConfig.duration]);

  const getWeekInfo = () => {
    if (!sprintInfo) return '';
    
    return `第 ${sprintInfo.currentWeek} 週 / 共 ${sprintInfo.totalWeeks} 週`;
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
  const getCellKey = (date: string, time: number) => `${date}-${time.toFixed(2)}`;
  
  const getSelectedCellsInRange = useCallback(() => {
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
    
    // Select all cells in the rectangular range using timeConfig.duration for proper stepping
    for (let dateIndex = minDateIndex; dateIndex <= maxDateIndex; dateIndex++) {
      const day = weekDays[dateIndex];
      const dateStr = day.date.toISOString().split('T')[0];
      
      let currentTime = minTime;
      while (currentTime <= maxTime) {
        selectedSet.add(getCellKey(dateStr, currentTime));
        currentTime += timeConfig.duration;
      }
    }
    
    return selectedSet;
  }, [selectionStart, selectionEnd, weekDays, timeConfig.duration]);
  
  // Update selected cells when selection range changes
  const currentSelectedCells = isSelecting ? getSelectedCellsInRange() : selectedCells;
  
  // Handle mouse events for selection
  const handleMouseDown = (date: string, timeSlot: number) => {
    setIsSelecting(true);
    setSelectionStart({ date, time: timeSlot });
    setSelectionEnd({ date, time: timeSlot });
    setSelectedCells(new Set());
  };
  
  const handleMouseEnter = (date: string, timeSlot: number) => {
    if (isSelecting && selectionStart) {
      setSelectionEnd({ date, time: timeSlot });
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
  const renderTimeCell = (day: any, timeSlot: number) => {
    const dateStr = day.date.toISOString().split('T')[0];
    const cellKey = getCellKey(dateStr, timeSlot);
    const dayBlocks = calendarSchedule[dateStr] || [];
    
    // Debug: Log when we're checking a date (whether it has blocks or not)
    if (timeSlot === 9 || timeSlot === 11 || timeSlot === 14 || timeSlot === 10) {
      console.log(`\n=== CELL CHECK (${timeSlot}) ===`);
      console.log(`Checking date: ${dateStr}`);
      console.log(`TimeSlot: ${timeSlot}`);
      console.log(`Available dates in calendarSchedule:`, Object.keys(calendarSchedule));
      console.log(`Blocks for this date (${dateStr}):`, dayBlocks);
      console.log(`dayBlocks.length: ${dayBlocks.length}`);
    }
    // Find blocks that should be displayed in this cell
    const cellBlocks = dayBlocks.filter(block => {
      const blockStartTime = block.startTime;
      const blockEndTime = block.startTime + block.duration;
      // Use proper tolerance for floating point comparisons
      const tolerance = 0.001;
      return (timeSlot >= blockStartTime - tolerance) && (timeSlot < blockEndTime + tolerance);
    });
    
    
    const isSelected = currentSelectedCells.has(cellKey);
    const hasBlocks = cellBlocks.length > 0;
    
    // Format time for display
    const hour = Math.floor(timeSlot);
    const minute = Math.round((timeSlot % 1) * 60);
    const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    return (
      <div
        key={cellKey}
        className={`border-r border-b min-h-16 p-1 transition-colors cursor-pointer relative group select-none ${
          isSelected ? 'bg-blue-200 dark:bg-blue-800' : 'hover:bg-muted/50'
        }`}
        style={{ position: 'relative', zIndex: 1 }}
        onMouseDown={() => {
          console.log('Cell mouse down - hasBlocks:', hasBlocks);
          if (!hasBlocks) handleMouseDown(dateStr, timeSlot);
        }}
        onMouseEnter={() => handleMouseEnter(dateStr, timeSlot)}
        onMouseUp={handleMouseUp}
        onClick={() => {
          console.log('Cell click - isSelecting:', isSelecting, 'hasBlocks:', hasBlocks);
          if (!isSelecting && hasBlocks === false) {
            handleCellClick(dateStr, timeSlot);
          } else {
            console.log('Click ignored - isSelecting:', isSelecting, 'hasBlocks:', hasBlocks);
          }
        }}
        onDrop={(e) => handleDrop(e, dateStr, timeSlot)}
        onDragOver={(e) => e.preventDefault()}
        title={isSelected ? `已選取 - ${day.fullDayName} ${timeLabel}` : `點擊選取 - ${day.fullDayName} ${timeLabel}`}
      >
        {/* Time blocks - Enhanced debugging version */}
        {cellBlocks.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {cellBlocks.map(block => {
              console.log('\n=== BLOCK RENDER CHECK ===');
              console.log('Block:', block);
              console.log('Current timeSlot:', timeSlot);
              console.log('Block startTime:', block.startTime);
              console.log('Time difference:', Math.abs(block.startTime - timeSlot));
              
              // More flexible time matching
              const tolerance = 1.0; // Much larger tolerance for debugging
              const timeDifference = Math.abs(block.startTime - timeSlot);
              const isStartingSlot = timeDifference <= tolerance;
              
              console.log('Tolerance:', tolerance);
              console.log('Time difference:', timeDifference);
              console.log('Is starting slot?', isStartingSlot);
              
              if (!isStartingSlot) {
                console.log('Skipping block - not starting slot');
                return null;
              }

              console.log('🎉 RENDERING TIME BLOCK:', block.title);
              
              const durationInSlots = Math.round(block.duration / timeConfig.duration);
              const blockHeight = `${Math.max(1, durationInSlots) * 64 - 4}px`;

              return (
                <div
                  key={`${block.id}-visual-${timeSlot}`}
                  className="absolute rounded text-white text-sm p-2 cursor-move flex items-center justify-center font-bold shadow-lg border-4 border-yellow-300"
                  style={{ 
                    backgroundColor: block.color || '#ff0000',
                    height: blockHeight,
                    width: 'calc(100% - 8px)',
                    zIndex: 9999,
                    minHeight: '56px',
                    top: '2px',
                    left: '2px',
                    right: '2px',
                    pointerEvents: 'auto',
                    outline: '3px solid #000000'
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block)}
                  title={`${block.title} (${block.duration}h)`}
                >
                  <span className="text-white font-bold text-center">
                    {block.title}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Empty cell hover indicator */}
        {!hasBlocks && (
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
  const handleCellClick = (date: string, timeSlot: number) => {
    console.log('\n=== CELL CLICK ===');
    console.log('Date:', date);
    console.log('TimeSlot:', timeSlot);
    
    // Clear any existing selection first
    clearSelection();
    
    // Set new selection
    const newCell = { date, time: timeSlot };
    setSelectedCell(newCell);
    setShowQuickCreate(true);
    
    console.log('Selected cell set to:', newCell);
    console.log('Show quick create set to: true');
    
    // Check state after a brief delay
    setTimeout(() => {
      console.log('\n=== STATE CHECK AFTER CLICK ===');
      console.log('Current selectedCell:', selectedCell);
      console.log('Current showQuickCreate:', showQuickCreate);
    }, 100);
  };
  
  // Handle drag start
  const handleDragStart = (e: React.DragEvent, block: TimeBlock) => {
    e.dataTransfer.setData('timeBlock', JSON.stringify(block));
  };
  
  // Handle drop
  const handleDrop = (e: React.DragEvent, date: string, timeSlot: number) => {
    e.preventDefault();
    const blockData = e.dataTransfer.getData('timeBlock');
    if (blockData) {
      try {
        const block: TimeBlock = JSON.parse(blockData);
        moveTimeBlock(block, date, timeSlot);
      } catch (error) {
        console.error('Error parsing dropped time block:', error);
      }
    }
  };
  
  // Move time block to new position
  const moveTimeBlock = (block: TimeBlock, newDate: string, newTimeSlot: number) => {
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
      const updatedBlock = { ...block, date: newDate, startTime: newTimeSlot };
      if (!newSchedule[newDate]) {
        newSchedule[newDate] = [];
      }
      newSchedule[newDate].push(updatedBlock);
      
      return newSchedule;
    });
  };
  
  // Create new time block(s) - supports both single cell and multi-cell selection
  const createTimeBlock = (type: string, title: string) => {
    console.log('\n=== CREATE TIME BLOCK START ===');
    console.log('Type:', type);
    console.log('Title:', title);
    
    const blockType = blockTypes.find(bt => bt.type === type);
    console.log('Block type found:', blockType);
    if (!blockType) {
      console.log('ERROR: Block type not found!');
      return;
    }
    
    // Use selected cells if available, otherwise use single selected cell
    const cellsToProcess = selectedCells.size > 0 ? selectedCells : 
      (selectedCell ? new Set([getCellKey(selectedCell.date, selectedCell.time)]) : new Set());
    
    console.log('Cells to process:', Array.from(cellsToProcess));
    console.log('Selected cells size:', selectedCells.size);
    console.log('Selected cell:', selectedCell);
    
    if (cellsToProcess.size === 0) {
      console.log('ERROR: No cells to process!');
      return;
    }
    
    console.log('Creating time block for selected cells...');
    
    setCalendarSchedule(prev => {
      const newSchedule = { ...prev };
      
      // Group cells by date for efficient processing
      const cellsByDate: { [date: string]: number[] } = {};
      
      cellsToProcess.forEach(cellKey => {
        const cellKeyStr = cellKey as string;
        console.log('Processing cell key:', cellKeyStr);
        const [date, timeStr] = cellKeyStr.split('-');
        const time = parseFloat(timeStr);
        
        console.log('Extracted date:', date);
        console.log('Extracted time:', time);
        
        if (!cellsByDate[date]) {
          cellsByDate[date] = [];
        }
        cellsByDate[date].push(time);
      });
      
      console.log('Cells grouped by date:', cellsByDate);
      
      // Create blocks for each date
      Object.entries(cellsByDate).forEach(([date, times]) => {
        if (times.length === 0) return;
        times.sort((a, b) => a - b); // Sort times in ascending order
        
        // Create continuous blocks
        let blockStart = times[0];
        let blockEnd = times[0];
        
        for (let i = 1; i <= times.length; i++) {
          const currentTime = times[i];
          
          // If current time is not consecutive (with tolerance for float precision) or we're at the end
          if (i === times.length || Math.abs(currentTime - (blockEnd + timeConfig.duration)) > 0.001) {
            // Create a block from blockStart to blockEnd
            const newBlock: TimeBlock = {
              id: `block-${Date.now()}-${Math.random()}`,
              type: type as TimeBlock['type'],
              title: title || blockType.name,
              startTime: blockStart,
              duration: blockEnd - blockStart + timeConfig.duration,
              date: date,
              color: blockType.color
            };
            
            console.log('\n🎆 CREATING NEW BLOCK:');
            console.log('New Block:', newBlock);
            console.log('Date:', date);
            console.log('Block start time:', blockStart);
            console.log('Block duration:', newBlock.duration);
            
            if (!newSchedule[date]) {
              newSchedule[date] = [];
              console.log('Created new date entry for:', date);
            }
            newSchedule[date].push(newBlock);
            console.log('Added block to schedule. Total blocks for date:', newSchedule[date].length);
            
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
      
      console.log('\n=== FINAL SCHEDULE ===');
      console.log('Updated schedule:', newSchedule);
      console.log('All dates in schedule:', Object.keys(newSchedule));
      console.log('Blocks per date:');
      Object.entries(newSchedule).forEach(([date, blocks]) => {
        console.log(`  ${date}: ${blocks.length} blocks`, blocks.map(b => `${b.title}@${b.startTime}`));
      });
      console.log('=== CREATE TIME BLOCK END ===\n');
      
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
  
  // Calendar schedule tracking and persistence
  useEffect(() => {
    console.log('=== CALENDAR SCHEDULE DEBUG ===');
    console.log('Calendar schedule state:', calendarSchedule);
    console.log('Number of dates with blocks:', Object.keys(calendarSchedule).length);
    
    Object.entries(calendarSchedule).forEach(([date, blocks]) => {
      console.log(`Date ${date} has ${blocks.length} blocks:`, blocks);
    });
    
    if (Object.keys(calendarSchedule).length > 0) {
      localStorage.setItem('calendarSchedule', JSON.stringify(calendarSchedule));
    }
  }, [calendarSchedule]);
  
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
  }, [isSelecting, selectionStart, selectionEnd, getSelectedCellsInRange]);

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
    <div className="flex flex-col h-full overflow-hidden p-4">
      {/* Calendar Header */}
      <Card className="mb-4 flex-shrink-0">
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
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="h-full overflow-y-scroll overflow-x-auto" style={{ maxHeight: 'calc(100vh - 200px)', minHeight: '400px' }}>
            <div className="grid w-full" style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, minmax(120px, 1fr))`, minHeight: 'max-content' }}>
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
                {weekDays.map((day, dayIndex) => {
                  // Parse time more carefully to handle fractional hours
                  const [hourStr, minuteStr] = time.split(':');
                  const hour = parseInt(hourStr);
                  const minute = parseInt(minuteStr);
                  const timeSlot = hour + (minute / 60); // Convert to decimal hour
                  
                  // Debug time slot generation for key hours
                  if (hour === 9 || hour === 11 || hour === 14) {
                    console.log(`Time slot generation - Time: ${time}, Hour: ${hour}, TimeSlot: ${timeSlot}`);
                  }
                  
                  return renderTimeCell(day, timeSlot);
                })}
              </React.Fragment>
            ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Create Modal - Debug */}
      {(() => {
        console.log('\n=== MODAL RENDER CHECK ===', {
          showQuickCreate,
          selectedCell,
          selectedCellsSize: selectedCells.size,
          shouldShow: showQuickCreate && (selectedCell || selectedCells.size > 0)
        });
        return null;
      })()}
      
      {showQuickCreate && (selectedCell || selectedCells.size > 0) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => {
          console.log('Modal background clicked');
          if (e.target === e.currentTarget) {
            clearSelection(); 
            setShowQuickCreate(false);
          }
        }}>
          <Card className="w-96" onClick={(e) => {
            console.log('Card clicked');
            e.stopPropagation();
          }}>
            <CardHeader>
              <CardTitle>新增時間塊</CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedCells.size > 0 
                  ? `已選取 ${selectedCells.size} 個時間格` 
                  : selectedCell 
                    ? (() => {
                        const hour = Math.floor(selectedCell.time);
                        const minute = Math.round((selectedCell.time % 1) * 60);
                        return `${selectedCell.date} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                      })()
                    : ''
                }
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {blockTypes.map(blockType => (
                  <button
                    key={blockType.type}
                    className="h-12 flex flex-col items-center justify-center border-2 rounded-md hover:bg-gray-100 transition-colors"
                    style={{ borderColor: blockType.color, backgroundColor: 'white' }}
                    onMouseDown={(e) => {
                      console.log('\n=== BUTTON MOUSE DOWN ===');
                      console.log('Button type:', blockType.type);
                    }}
                    onClick={(e) => {
                      console.log('\n=== RAW BUTTON CLICK ===');
                      console.log('Event target:', e.target);
                      console.log('Button type:', blockType.type);
                      console.log('Button name:', blockType.name);
                      
                      // 直接調用創建邏輯，不使用 React Button 組件
                      e.preventDefault();
                      e.stopPropagation();
                      
                      alert(`點擊了 ${blockType.name} 按鈕！`);
                      
                      try {
                        createTimeBlock(blockType.type, blockType.name);
                        console.log('createTimeBlock called successfully');
                      } catch (error) {
                        console.error('Error in createTimeBlock:', error);
                      }
                    }}
                  >
                    <div 
                      className="w-3 h-3 rounded mb-1 pointer-events-none" 
                      style={{ backgroundColor: blockType.color }}
                    />
                    <span className="text-xs pointer-events-none">{blockType.name}</span>
                  </button>
                ))}
              </div>
              
              {/* 測試用的簡單按鈕 */}
              <div className="mt-4 space-y-2">
                <button 
                  className="w-full bg-red-500 text-white p-2 rounded"
                  onClick={() => {
                    console.log('\n=== SIMPLE TEST BUTTON ===');
                    console.log('Selected cell:', selectedCell);
                    console.log('Selected cells:', Array.from(selectedCells));
                    
                    if (selectedCell) {
                      console.log('Creating block for date:', selectedCell.date);
                      console.log('Creating block for time:', selectedCell.time);
                    }
                    
                    alert(`測試按鈕工作正常！選中的日期: ${selectedCell?.date || 'None'}`);
                    createTimeBlock('meeting', 'TEST BLOCK');
                  }}
                >
                  🚨 測試按鈕（直接創建會議）
                </button>
                
                {/* Debug info display */}
                <div className="text-xs bg-gray-100 p-2 rounded">
                  <div>選中日期: {selectedCell?.date || 'None'}</div>
                  <div>選中時間: {selectedCell?.time || 'None'}</div>
                  <div>可用日期: {Object.keys(calendarSchedule).join(', ')}</div>
                </div>
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