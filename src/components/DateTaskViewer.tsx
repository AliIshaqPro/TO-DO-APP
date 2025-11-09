import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TaskItem } from "@/components/TaskItem";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  recurring: boolean;
  created_at: string;
  completed_at?: string;
}

interface DateTaskViewerProps {
  tasks: Task[];
  history: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const DateTaskViewer = ({
  tasks,
  history,
  onToggle,
  onDelete,
}: DateTaskViewerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [open, setOpen] = useState(false);

  const getTasksForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    
    // Get tasks created on this date
    const createdTasks = tasks.filter((task) => {
      const taskDate = format(new Date(task.created_at), "yyyy-MM-dd");
      return taskDate === dateStr;
    });

    // Get tasks completed on this date from history
    const completedTasks = history.filter((task) => {
      if (!task.completed_at) return false;
      const completedDate = format(new Date(task.completed_at), "yyyy-MM-dd");
      return completedDate === dateStr;
    });

    return { createdTasks, completedTasks };
  };

  const { createdTasks, completedTasks } = selectedDate
    ? getTasksForDate(selectedDate)
    : { createdTasks: [], completedTasks: [] };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CalendarIcon className="h-4 w-4" />
          View by Date
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>View Tasks by Date</DialogTitle>
          <DialogDescription>
            Select a date to view all tasks created or completed on that day
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-6">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {selectedDate && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground">
                  Tasks Created ({createdTasks.length})
                </h3>
                {createdTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tasks created on this date
                  </p>
                ) : (
                  <div className="space-y-2">
                    {createdTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        {...task}
                        onToggle={onToggle}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground">
                  Tasks Completed ({completedTasks.length})
                </h3>
                {completedTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tasks completed on this date
                  </p>
                ) : (
                  <div className="space-y-2">
                    {completedTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        {...task}
                        onToggle={onToggle}
                        onDelete={onDelete}
                        showDate
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
