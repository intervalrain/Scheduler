import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Modal } from './ui/modal';
import { Copy, Download, X } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export const Calendar: React.FC = () => {
  const {
    schedule,
    timeSlots,
    days,
    taskTypes,
    selectedTask,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    dragEnd,
    setDragEnd,
    showModal,
    setShowModal,
    pendingDragData,
    setPendingDragData,
    editingTask,
    setEditingTask,
    updateSchedule,
    generateHTML,
  } = useAppContext();

  const handleMouseDown = (day: string, time: string): void => {
    setIsDragging(true);
    setDragStart({ day, time });
    setDragEnd({ day, time });
  };

  const handleMouseEnter = (day: string, time: string): void => {
    if (isDragging && dragStart) {
      setDragEnd({ day, time });
    }
  };

  const handleMouseUp = (): void => {
    if (isDragging && dragStart && dragEnd) {
      const startIndex = timeSlots.indexOf(dragStart.time);
      const endIndex = timeSlots.indexOf(dragEnd.time);
      const dayIndex = days.indexOf(dragStart.day);
      const endDayIndex = days.indexOf(dragEnd.day);

      if (startIndex !== -1 && endIndex !== -1) {
        const minIndex = Math.min(startIndex, endIndex);
        const maxIndex = Math.max(startIndex, endIndex);
        const minDayIndex = Math.min(dayIndex, endDayIndex);
        const maxDayIndex = Math.max(dayIndex, endDayIndex);

        let canSchedule = true;

        for (let dayIdx = minDayIndex; dayIdx <= maxDayIndex; dayIdx++) {
          for (let timeIdx = minIndex; timeIdx <= maxIndex; timeIdx++) {
            const key = `${days[dayIdx]}-${timeSlots[timeIdx]}`;
            if (schedule[key]) {
              canSchedule = false;
              break;
            }
          }
          if (!canSchedule) break;
        }

        if (canSchedule) {
          setPendingDragData({
            startIndex: minIndex,
            endIndex: maxIndex,
            day: dragStart.day,
            dayStartIndex: minDayIndex,
            dayEndIndex: maxDayIndex,
          } as any);
          setShowModal(true);
        }
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const clearSlot = (day: string, time: string): void => {
    const newSchedule = { ...schedule };
    delete newSchedule[`${day}-${time}`];
    updateSchedule(newSchedule);
  };

  const handleTaskClick = (day: string, time: string): void => {
    const key = `${day}-${time}`;
    const task = schedule[key];
    if (task) {
      setEditingTask({
        key,
        name: task.name,
      });
    }
  };

  const saveTaskEdit = (): void => {
    if (editingTask) {
      const newSchedule = { ...schedule };
      if (newSchedule[editingTask.key]) {
        newSchedule[editingTask.key] = {
          ...newSchedule[editingTask.key],
          name: editingTask.name,
        };
        updateSchedule(newSchedule);
      }
      setEditingTask(null);
    }
  };

  const cancelTaskEdit = (): void => {
    setEditingTask(null);
  };

  const getDragSelection = (): string[] => {
    if (!isDragging || !dragStart || !dragEnd) return [];

    const startIndex = timeSlots.indexOf(dragStart.time);
    const endIndex = timeSlots.indexOf(dragEnd.time);
    const dayIndex = days.indexOf(dragStart.day);
    const endDayIndex = days.indexOf(dragEnd.day);

    if (startIndex === -1 || endIndex === -1) return [];

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);
    const minDayIndex = Math.min(dayIndex, endDayIndex);
    const maxDayIndex = Math.max(dayIndex, endDayIndex);
    const selection: string[] = [];

    for (let dayIdx = minDayIndex; dayIdx <= maxDayIndex; dayIdx++) {
      for (let timeIdx = minIndex; timeIdx <= maxIndex; timeIdx++) {
        selection.push(`${days[dayIdx]}-${timeSlots[timeIdx]}`);
      }
    }

    return selection;
  };

  const handleModalConfirm = (taskTypeId: string, taskName: string): void => {
    if (!pendingDragData) return;

    const taskType = taskTypes.find((t) => t.id === taskTypeId);
    if (!taskType) return;

    const newSchedule = { ...schedule };
    const { startIndex, endIndex, dayStartIndex, dayEndIndex } =
      pendingDragData as any;

    for (let dayIdx = dayStartIndex; dayIdx <= dayEndIndex; dayIdx++) {
      for (let timeIdx = startIndex; timeIdx <= endIndex; timeIdx++) {
        const key = `${days[dayIdx]}-${timeSlots[timeIdx]}`;
        newSchedule[key] = {
          ...taskType,
          name: taskName,
          isMultiSlot: endIndex > startIndex || dayEndIndex > dayStartIndex,
        };
      }
    }

    updateSchedule(newSchedule);
    setPendingDragData(null);
  };

  const dragSelection = getDragSelection();

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 text-foreground">週行程表</h2>

      <Card className="mb-8 p-4">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-3 text-left font-semibold">
                    時間
                  </th>
                  {days.map((day) => (
                    <th
                      key={day}
                      className="border border-border p-3 text-center font-semibold"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody onMouseUp={handleMouseUp}>
                {timeSlots.map((time) => (
                  <tr key={time}>
                    <td className="border border-border p-3 font-medium bg-muted/50">
                      {time}
                    </td>
                    {days.map((day) => {
                      const task = schedule[`${day}-${time}`];
                      const cellKey = `${day}-${time}`;
                      const isInDragSelection = dragSelection.includes(cellKey);
                      const isOccupied = !!task;

                      return (
                        <td
                          key={cellKey}
                          className={`border border-border p-1 h-16 relative cursor-pointer select-none
                            ${isInDragSelection ? "bg-primary/20" : ""}
                            ${isOccupied ? "opacity-90" : "hover:bg-muted/50"}
                          `}
                          onMouseDown={() =>
                            !task && handleMouseDown(day, time)
                          }
                          onMouseEnter={() => handleMouseEnter(day, time)}
                          onDoubleClick={() => task && clearSlot(day, time)}
                          onClick={() => task && handleTaskClick(day, time)}
                        >
                          {task && editingTask?.key === cellKey ? (
                            <div className="bg-white rounded text-sm h-full flex flex-col justify-center relative border-2 border-blue-400 shadow-md">
                              <div className="text-center text-gray-600 text-xs mb-1 px-2">
                                {taskTypes.find((t) => t.id === task.id)?.name || task.id}
                              </div>
                              <div className="px-2">
                                <input
                                  value={editingTask.name}
                                  onChange={(e) =>
                                    setEditingTask({
                                      ...editingTask,
                                      name: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      saveTaskEdit();
                                    } else if (e.key === "Escape") {
                                      cancelTaskEdit();
                                    }
                                  }}
                                  onBlur={saveTaskEdit}
                                  autoFocus
                                  placeholder="任務名稱"
                                  className="w-full text-xs text-gray-800 border-0 bg-transparent focus:outline-none text-center placeholder-gray-400"
                                />
                              </div>
                            </div>
                          ) : task ? (
                            <div
                              style={{ backgroundColor: task.color }}
                              className="text-white p-1 rounded text-sm h-full flex flex-col justify-center relative group"
                            >
                              <div className="text-center">
                                <div className="font-medium text-xs leading-tight">
                                  {taskTypes.find((t) => t.id === task.id)?.name || task.id}
                                </div>
                                {task.name && (
                                  <div className="text-xs opacity-90 leading-tight mt-0.5">
                                    {task.name}
                                  </div>
                                )}
                              </div>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearSlot(day, time);
                                }}
                                variant="ghost"
                                size="sm"
                                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/20 w-5 h-5 p-0 rounded-full"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">HTML 表格代碼</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            className="w-full h-80 font-mono text-sm resize-none"
            value={generateHTML()}
            readOnly
          />
          <div className="mt-4 flex space-x-4">
            <Button
              onClick={() => navigator.clipboard.writeText(generateHTML())}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              複製 HTML
            </Button>
            <Button
              onClick={() => {
                const blob = new Blob([generateHTML()], {
                  type: "text/html",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "schedule.html";
                a.click();
              }}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              下載 HTML
            </Button>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setPendingDragData(null);
        }}
        onConfirm={handleModalConfirm}
        taskTypes={taskTypes}
        preselectedTaskType={selectedTask?.id}
      />
    </div>
  );
};