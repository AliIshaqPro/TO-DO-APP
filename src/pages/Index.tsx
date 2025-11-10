import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TaskItem } from "@/components/TaskItem";
import { AddTaskForm } from "@/components/AddTaskForm";
import { NotificationCenter, Notification } from "@/components/NotificationCenter";
import { DateTaskViewer } from "@/components/DateTaskViewer";
import { PerformanceReports } from "@/components/PerformanceReports";
import { Calendar, History, Repeat, LogOut, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  recurring: boolean;
  created_at: string;
  completed_at?: string;
  position: number;
  user_id: string;
}

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("position", { ascending: true });

    if (error) {
      toast.error("Failed to load tasks");
      console.error(error);
    } else {
      setTasks(data);
    }
    setLoading(false);
  };

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setNotifications(data.map(n => ({
        ...n,
        type: n.type as "success" | "info" | "warning"
      })));
    }
  };

  const addNotification = async (
    title: string,
    message: string,
    type: "success" | "info" | "warning" = "info"
  ) => {
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: user.id,
        title,
        message,
        type,
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
    } else {
      setNotifications([{ ...data, type: data.type as "success" | "info" | "warning" }, ...notifications]);
    }
  };

  const addTask = async (title: string, recurring: boolean) => {
    if (!user) return;

    const maxPosition = tasks.length > 0 ? Math.max(...tasks.map((t) => t.position)) : -1;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        title,
        recurring,
        completed: false,
        position: maxPosition + 1,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add task");
      console.error(error);
    } else {
      setTasks([...tasks, data]);
      toast.success("Task added!");
      addNotification(
        "Task Created",
        `"${title}" has been added to your ${recurring ? "recurring" : "today's"} tasks`,
        "success"
      );
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newCompleted = !task.completed;
    const { error } = await supabase
      .from("tasks")
      .update({
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update task");
      console.error(error);
    } else {
      if (newCompleted) {
        // Keep all tasks in tasks list but mark as completed
        setTasks(tasks.map((t) => 
          t.id === id 
            ? { ...t, completed: true, completed_at: new Date().toISOString() }
            : t
        ));
        toast.success("Task completed!");
        addNotification("Task Completed! 🎉", `Great job completing "${task.title}"`, "success");
      } else {
        // Uncompleting a task
        setTasks(tasks.map((t) => 
          t.id === id 
            ? { ...t, completed: false, completed_at: undefined }
            : t
        ));
      }
    }
  };

  const deleteTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete task");
      console.error(error);
    } else {
      setTasks(tasks.filter((t) => t.id !== id));
      toast("Task deleted");
      if (task) {
        addNotification("Task Deleted", `"${task.title}" has been removed`, "warning");
      }
    }
  };

  const deleteHistoryItem = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete task");
      console.error(error);
    } else {
      setTasks(tasks.filter((t) => t.id !== id));
      toast("Task deleted");
      if (task) {
        addNotification("Task Deleted", `"${task.title}" has been removed`, "warning");
      }
    }
  };

  const markNotificationAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) {
      console.error(error);
    } else {
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);

    if (error) {
      console.error(error);
    } else {
      setNotifications(notifications.filter((n) => n.id !== id));
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;

    const { error } = await supabase.from("notifications").delete().eq("user_id", user.id);

    if (error) {
      console.error(error);
    } else {
      setNotifications([]);
    }
  };

  const handleDragEnd = async (event: DragEndEvent, isRecurring: boolean) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const taskList = isRecurring ? recurringTasks : todayTasks;
    const oldIndex = taskList.findIndex((t) => t.id === active.id);
    const newIndex = taskList.findIndex((t) => t.id === over.id);

    const newOrder = arrayMove(taskList, oldIndex, newIndex);
    const updatedTasks = newOrder.map((task, index) => ({
      ...task,
      position: index,
    }));

    // Optimistic update
    const otherTasks = tasks.filter((t) => t.recurring !== isRecurring);
    setTasks([...otherTasks, ...updatedTasks]);

    // Update positions in database
    const updates = updatedTasks.map((task) =>
      supabase.from("tasks").update({ position: task.position }).eq("id", task.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      toast.error("Failed to update task order");
      fetchTasks(); // Revert on error
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  const todayTasks = tasks.filter((task) => !task.recurring && !task.completed).sort((a, b) => a.position - b.position);
  const recurringTasks = tasks.filter((task) => task.recurring).sort((a, b) => a.position - b.position);
  const allTodayTasks = [...todayTasks, ...recurringTasks].sort((a, b) => a.position - b.position);
  const completedTasks = tasks.filter((task) => task.completed).sort((a, b) => {
    const dateA = new Date(a.completed_at || 0).getTime();
    const dateB = new Date(b.completed_at || 0).getTime();
    return dateB - dateA; // Most recent first
  });

  // Only count incomplete tasks for progress (recurring tasks count even when completed)
  const completedCount = allTodayTasks.filter((t) => t.completed).length;
  const totalCount = allTodayTasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 mb-2">
          <div className="flex justify-between items-center mb-4">
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <DateTaskViewer
                tasks={tasks}
                history={completedTasks}
                onToggle={toggleTask}
                onDelete={deleteTask}
              />
              <PerformanceReports userId={user.id} />
              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={markNotificationAsRead}
                onDelete={deleteNotification}
                onClearAll={clearAllNotifications}
              />
            </div>
          </div>
          {totalCount > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Today's Progress</span>
                <span className="font-medium">{Math.round(progressPercentage)}% completed</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
        </div>

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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(e, false)}
            >
              <SortableContext items={allTodayTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                {allTodayTasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No tasks for today. Add one to get started!</p>
                  </div>
                ) : (
                  allTodayTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      id={task.id}
                      title={task.title}
                      completed={task.completed}
                      recurring={task.recurring}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                    />
                  ))
                )}
              </SortableContext>
            </DndContext>
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
                  id={task.id}
                  title={task.title}
                  completed={task.completed}
                  recurring={task.recurring}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  showCheckbox={false}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-3 mt-6">
            {completedTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No completed tasks yet. Keep going!</p>
              </div>
            ) : (
              completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  completed={task.completed}
                  recurring={task.recurring}
                  onToggle={toggleTask}
                  onDelete={deleteHistoryItem}
                  showDate
                  completedAt={task.completed_at}
                  showCheckbox={false}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            size="icon"
            className="fixed bottom-8 right-8 rounded-full shadow-lg"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Index;
