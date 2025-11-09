import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Repeat, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskItemProps {
  id: string;
  title: string;
  completed: boolean;
  recurring: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  showDate?: boolean;
  completedAt?: string;
  completed_at?: string;
}

export const TaskItem = ({
  id,
  title,
  completed,
  recurring,
  onToggle,
  onDelete,
  showDate,
  completedAt,
  completed_at,
}: TaskItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const displayDate = completedAt || completed_at;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 p-4 rounded-xl bg-card border border-border transition-smooth shadow-task hover:shadow-task-hover",
        completed && "opacity-60",
        isDragging && "opacity-50 z-50"
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground transition-colors"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <Checkbox
        id={id}
        checked={completed}
        onCheckedChange={() => onToggle(id)}
        className="h-5 w-5"
      />
      <label
        htmlFor={id}
        className={cn(
          "flex-1 text-base cursor-pointer transition-smooth",
          completed && "line-through text-muted-foreground"
        )}
      >
        {title}
      </label>
      
      <div className="flex items-center gap-2">
        {recurring && (
          <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-md">
            <Repeat className="h-3 w-3" />
            <span>Daily</span>
          </div>
        )}
        
        {showDate && displayDate && (
          <span className="text-xs text-muted-foreground">
            {new Date(displayDate).toLocaleDateString()}
          </span>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(id)}
          className="opacity-0 group-hover:opacity-100 transition-smooth hover:bg-destructive/20 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
