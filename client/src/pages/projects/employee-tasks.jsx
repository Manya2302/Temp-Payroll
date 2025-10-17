import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Layout from '@/components/layout/layout';
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  Clock,
  Calendar,
  TrendingUp,
  ListChecks,
  Package,
  AlertCircle,
} from "lucide-react";

export default function EmployeeTasks() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [completingTask, setCompletingTask] = useState(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/user");
      if (res.ok) {
        const data = await res.json();
        console.log("[EmployeeTasks] User data:", data);
        setUser(data);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      console.log("[EmployeeTasks] Fetching tasks for user:", user);
      const url = `/api/projects/user/${user.id}/tasks`;
      console.log("[EmployeeTasks] Fetching from:", url);
      const res = await fetch(url);
      console.log("[EmployeeTasks] Response status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("[EmployeeTasks] Tasks data:", data);
        setTasks(data);
      } else {
        const error = await res.text();
        console.error("[EmployeeTasks] Failed to fetch tasks:", res.status, error);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  const handleCompleteSubtask = async (projectId, dayNumber, subtaskIndex) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/days/${dayNumber}/complete`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subtaskIndex }),
        },
      );

      if (res.ok) {
        toast({
          title: "Subtask completed!",
          description: "Task progress updated",
        });
        fetchTasks();
      } else {
        throw new Error("Failed to complete subtask");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete subtask",
        variant: "destructive",
      });
    }
  };

  const handleCompleteDay = async (projectId, dayNumber) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/days/${dayNumber}/complete`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comments: comment }),
        },
      );

      if (res.ok) {
        toast({
          title: "✅ Day completed!",
          description: "Great work! Your progress has been recorded.",
        });
        setCompletingTask(null);
        setComment("");
        fetchTasks();
      } else {
        throw new Error("Failed to complete day");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete day",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-gray-500",
      in_progress: "bg-yellow-500",
      completed: "bg-green-500",
      approved: "bg-emerald-500",
      blocked: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Low: "bg-blue-100 text-blue-800",
      Medium: "bg-yellow-100 text-yellow-800",
      High: "bg-orange-100 text-orange-800",
      Critical: "bg-red-100 text-red-800",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  const pendingTasks = tasks.filter(
    (t) => t.status === "pending" || t.status === "in_progress",
  );
  const completedTasks = tasks.filter(
    (t) => t.status === "completed" || t.status === "approved",
  );

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground">
            View and complete your assigned project tasks
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks.length}</div>
            </CardContent>
          </Card>
        </div>

        {pendingTasks.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Pending Tasks</h2>
            <div className="space-y-4">
              {pendingTasks.map((task) => {
                const isCompleting =
                  completingTask === `${task.projectId}-${task.dayNumber}`;
                const allSubtasksCompleted =
                  task.subtasks && task.subtasks.every((st) => st.completed);

                return (
                  <Card
                    key={`${task.projectId}-${task.dayNumber}`}
                    className="border-l-4 border-l-yellow-500"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {task.projectTitle}
                          </CardTitle>
                          <CardDescription>
                            Day {task.dayNumber} •{" "}
                            {new Date(task.date).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Task Summary</h4>
                        <p className="text-sm text-muted-foreground">
                          {task.taskSummary}
                        </p>
                      </div>

                      {task.subtasks && task.subtasks.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Subtasks</h4>
                          <ul className="space-y-2">
                            {task.subtasks.map((subtask, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={subtask.completed}
                                  onChange={() =>
                                    handleCompleteSubtask(
                                      task.projectId,
                                      task.dayNumber,
                                      idx,
                                    )
                                  }
                                  className="mt-1 rounded"
                                />
                                <span
                                  className={`text-sm ${subtask.completed ? "line-through text-muted-foreground" : ""}`}
                                >
                                  {subtask.title}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {task.expectedDeliverables &&
                        task.expectedDeliverables.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">
                              Expected Deliverables
                            </h4>
                            <ul className="list-disc list-inside space-y-1">
                              {task.expectedDeliverables.map((del, idx) => (
                                <li
                                  key={idx}
                                  className="text-sm text-muted-foreground"
                                >
                                  {del}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Estimated: {task.estimatedHours} hours</span>
                      </div>

                      <div className="pt-4 border-t">
                        {!isCompleting ? (
                          <Button
                            onClick={() =>
                              setCompletingTask(
                                `${task.projectId}-${task.dayNumber}`,
                              )
                            }
                            className="w-full"
                            variant={
                              allSubtasksCompleted ? "default" : "outline"
                            }
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Complete Day
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Add comments about your work (optional)"
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() =>
                                  handleCompleteDay(
                                    task.projectId,
                                    task.dayNumber,
                                  )
                                }
                                disabled={loading}
                                className="flex-1"
                              >
                                {loading
                                  ? "Submitting..."
                                  : "Submit Completion"}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setCompletingTask(null);
                                  setComment("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Completed Tasks</h2>
            <div className="space-y-4">
              {completedTasks.map((task) => (
                <Card
                  key={`${task.projectId}-${task.dayNumber}`}
                  className="border-l-4 border-l-green-500 opacity-75"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          {task.projectTitle}
                        </CardTitle>
                        <CardDescription>
                          Day {task.dayNumber} •{" "}
                          {new Date(task.date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Completed
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {task.taskSummary}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">
                No tasks assigned yet
              </p>
              <p className="text-sm text-muted-foreground">
                Check back later for new assignments
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
