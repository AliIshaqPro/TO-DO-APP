import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";

interface AddTaskFormProps {
  onAdd: (title: string, recurring: boolean) => void;
}

export const AddTaskForm = ({ onAdd }: AddTaskFormProps) => {
  const [title, setTitle] = useState("");
  const [recurring, setRecurring] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), recurring);
      setTitle("");
      setRecurring(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 bg-card rounded-xl border border-border shadow-task">
      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 bg-secondary border-border focus-visible:ring-primary"
        />
        <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90">
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      
      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
        <Checkbox
          checked={recurring}
          onCheckedChange={(checked) => setRecurring(checked as boolean)}
        />
        <span>Repeat daily</span>
      </label>
    </form>
  );
};
