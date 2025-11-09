import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskItem } from "@/components/TaskItem";
import { AddTaskForm } from "@/components/AddTaskForm";
import { Calendar, History, Repeat } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  recurring: boolean;
  createdAt: string;
  completedAt?: string;
}

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<Task[]>([]);

  useEffect(() => {
    const storedTasks = localStorage.getItem("tasks");
    const storedHistory = localStorage.getItem("history");
    if (storedTasks) setTasks(JSON.parse(storedTasks));
    if (storedHistory) setHistory(JSON.parse(storedHistory));
  }, []);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  const addTask = (title: string, recurring: boolean) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      completed: false,
      recurring,
      createdAt: new Date().toISOString(),
    };
    setTasks([...tasks, newTask]);
    toast.success("Task added!");
  };

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          const updatedTask = {
            ...task,
            completed: !task.completed,
            completedAt: !task.completed ? new Date().toISOString() : undefined,
          };
          
          if (!task.completed) {
            setHistory([updatedTask, ...history]);
            toast.success("Task completed!");
          }
          
          return updatedTask;
        }
        return task;
      })
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
    toast("Task deleted");
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(history.filter((task) => task.id !== id));
    toast("History item removed");
  };

  const todayTasks = tasks.filter((task) => !task.recurring);
  const recurringTasks = tasks.filter((task) => task.recurring);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Task Manager</h1>
          <p className="text-muted-foreground">Organize your daily tasks and track your progress</p>
        </header>

        <div className="mb-6">
          <AddTaskForm onAdd={addTask} />
        </div>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Today</span>
            </TabsTrigger>
            <TabsTrigger value="recurring" className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              <span className="hidden sm:inline">Recurring</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-3 mt-6">
            {todayTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tasks for today. Add one to get started!</p>
              </div>
            ) : (
              todayTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  {...task}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="recurring" className="space-y-3 mt-6">
            {recurringTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Repeat className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recurring tasks yet. Create daily habits!</p>
              </div>
            ) : (
              recurringTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  {...task}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-3 mt-6">
            {history.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No completed tasks yet. Keep going!</p>
              </div>
            ) : (
              history.map((task) => (
                <TaskItem
                  key={task.id}
                  {...task}
                  onToggle={toggleTask}
                  onDelete={deleteHistoryItem}
                  showDate
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
