import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Repeat, Trash2, GripVertical, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";

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
  showCheckbox?: boolean;
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
  showCheckbox = true,
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
      {showCheckbox && (
        <button
          className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground transition-colors"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
      )}
      
      <div
        className={cn(
          "flex-1 text-base transition-smooth",
          completed && "line-through text-muted-foreground"
        )}
      >
        {title}
      </div>
      
      <div className="flex items-center gap-2">
        {recurring && (
          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
            <Repeat className="h-3 w-3 mr-1" />
            Daily
          </Badge>
        )}
        
        {showDate && displayDate && (
          <span className="text-xs text-muted-foreground">
            {new Date(displayDate).toLocaleDateString()}
          </span>
        )}

        {showCheckbox && !completed && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark as Completed
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Complete Task?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base pt-2">
                  Are you sure you want to mark <span className="font-semibold text-foreground">"{title}"</span> as completed?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onToggle(id)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
