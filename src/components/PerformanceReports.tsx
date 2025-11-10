import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";

interface PerformanceReportsProps {
  userId: string;
}

export const PerformanceReports = ({ userId }: PerformanceReportsProps) => {
  const [open, setOpen] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState({ completed: 0, score: 0 });
  const [monthlyStats, setMonthlyStats] = useState({ completed: 0, score: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchStats();
    }
  }, [open, userId]);

  const fetchStats = async () => {
    setLoading(true);
    
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Fetch weekly stats
    const { data: weeklyData } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("completed", true)
      .gte("completed_at", weekStart.toISOString())
      .lte("completed_at", weekEnd.toISOString());

    // Fetch monthly stats
    const { data: monthlyData } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("completed", true)
      .gte("completed_at", monthStart.toISOString())
      .lte("completed_at", monthEnd.toISOString());

    const weeklyCompleted = weeklyData?.length || 0;
    const monthlyCompleted = monthlyData?.length || 0;

    // Calculate scores (recurring tasks worth 2 points, regular tasks worth 1 point)
    const weeklyScore = weeklyData?.reduce((sum, task) => sum + (task.recurring ? 2 : 1), 0) || 0;
    const monthlyScore = monthlyData?.reduce((sum, task) => sum + (task.recurring ? 2 : 1), 0) || 0;

    setWeeklyStats({ completed: weeklyCompleted, score: weeklyScore });
    setMonthlyStats({ completed: monthlyCompleted, score: monthlyScore });
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <BarChart3 className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Performance Reports</DialogTitle>
          <DialogDescription>
            Track your productivity with weekly and monthly statistics
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">This Week</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : (
                  <>
                    <div className="flex justify-between items-center p-4 bg-card border border-border rounded-lg">
                      <span className="text-muted-foreground">Tasks Completed</span>
                      <span className="text-2xl font-bold text-primary">{weeklyStats.completed}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-card border border-border rounded-lg">
                      <span className="text-muted-foreground">Score Earned</span>
                      <span className="text-2xl font-bold text-primary">{weeklyStats.score}</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-4">
                      Week: {format(startOfWeek(new Date(), { weekStartsOn: 1 }), "MMM d")} - {format(endOfWeek(new Date(), { weekStartsOn: 1 }), "MMM d, yyyy")}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : (
                  <>
                    <div className="flex justify-between items-center p-4 bg-card border border-border rounded-lg">
                      <span className="text-muted-foreground">Tasks Completed</span>
                      <span className="text-2xl font-bold text-primary">{monthlyStats.completed}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-card border border-border rounded-lg">
                      <span className="text-muted-foreground">Score Earned</span>
                      <span className="text-2xl font-bold text-primary">{monthlyStats.score}</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-4">
                      Month: {format(startOfMonth(new Date()), "MMM d")} - {format(endOfMonth(new Date()), "MMM d, yyyy")}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
