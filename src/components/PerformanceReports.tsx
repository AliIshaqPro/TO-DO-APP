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
import { BarChart3, TrendingUp, Target, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, addWeeks } from "date-fns";

interface PerformanceReportsProps {
  userId: string;
}

interface WeekStats {
  weekNumber: number;
  completed: number;
  score: number;
  dateRange: string;
}

export const PerformanceReports = ({ userId }: PerformanceReportsProps) => {
  const [open, setOpen] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState({ completed: 0, score: 0, scoreOutOf100: 0 });
  const [monthlyStats, setMonthlyStats] = useState({ completed: 0, score: 0, scoreOutOf100: 0 });
  const [weeklyBreakdown, setWeeklyBreakdown] = useState<WeekStats[]>([]);
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

    // Calculate score out of 100 (normalize to 100)
    const maxWeeklyScore = 50; // Assume ~7 tasks per day, ~3.5 days worth = ~25 tasks, half recurring = 37.5, round to 50
    const maxMonthlyScore = 200; // Assume ~30 days, 200 is reasonable
    const weeklyScoreOutOf100 = Math.min(100, Math.round((weeklyScore / maxWeeklyScore) * 100));
    const monthlyScoreOutOf100 = Math.min(100, Math.round((monthlyScore / maxMonthlyScore) * 100));

    setWeeklyStats({ completed: weeklyCompleted, score: weeklyScore, scoreOutOf100: weeklyScoreOutOf100 });
    setMonthlyStats({ completed: monthlyCompleted, score: monthlyScore, scoreOutOf100: monthlyScoreOutOf100 });

    // Calculate weekly breakdown for the month
    const weeks: WeekStats[] = [];
    for (let i = 0; i < 4; i++) {
      const weekStartDate = addWeeks(monthStart, i);
      const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
      
      const { data: weekData } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("completed", true)
        .gte("completed_at", weekStartDate.toISOString())
        .lte("completed_at", weekEndDate.toISOString());

      const weekCompleted = weekData?.length || 0;
      const weekScore = weekData?.reduce((sum, task) => sum + (task.recurring ? 2 : 1), 0) || 0;

      weeks.push({
        weekNumber: i + 1,
        completed: weekCompleted,
        score: weekScore,
        dateRange: `${format(weekStartDate, "MMM d")} - ${format(weekEndDate, "MMM d")}`
      });
    }

    setWeeklyBreakdown(weeks);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <BarChart3 className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BarChart3 className="h-6 w-6 text-primary" />
            Performance Reports
          </DialogTitle>
          <DialogDescription>
            Track your productivity with detailed weekly and monthly analytics
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-11">
            <TabsTrigger value="weekly" className="text-base">Weekly Report</TabsTrigger>
            <TabsTrigger value="monthly" className="text-base">Monthly Report</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4 mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Tasks Completed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary">{weeklyStats.completed}</div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Performance Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary">{weeklyStats.scoreOutOf100}/100</div>
                      <p className="text-xs text-muted-foreground mt-1">{weeklyStats.score} points earned</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(startOfWeek(new Date(), { weekStartsOn: 1 }), "MMM d")} - {format(endOfWeek(new Date(), { weekStartsOn: 1 }), "MMM d, yyyy")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4 mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Tasks Completed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary">{monthlyStats.completed}</div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Performance Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary">{monthlyStats.scoreOutOf100}/100</div>
                      <p className="text-xs text-muted-foreground mt-1">{monthlyStats.score} points earned</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(startOfMonth(new Date()), "MMM d")} - {format(endOfMonth(new Date()), "MMM d, yyyy")}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Weekly Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {weeklyBreakdown.map((week) => (
                      <div 
                        key={week.weekNumber}
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium">Week {week.weekNumber}</div>
                          <div className="text-xs text-muted-foreground">{week.dateRange}</div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Tasks</div>
                            <div className="text-lg font-bold text-primary">{week.completed}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Score</div>
                            <div className="text-lg font-bold text-primary">{week.score}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
