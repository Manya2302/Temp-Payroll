import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, Users, TrendingUp, CheckCircle2, Clock, AlertCircle, Edit, Download, Sparkles, ThumbsUp } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ProjectDetail() {
  const [match, params] = useRoute('/admin/projects/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refineInstructions, setRefineInstructions] = useState('');
  const [refining, setRefining] = useState(false);
  const [showRefineDialog, setShowRefineDialog] = useState(false);

  useEffect(() => {
    if (params?.id) {
      fetchProject();
    }
  }, [params?.id]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch project',
          variant: 'destructive'
        });
        setLocation('/admin/projects');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch project',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = () => {
    if (!project) return;

    const exportData = project.days.map(day => ({
      'Day Number': day.dayNumber,
      'Date': new Date(day.date).toLocaleDateString(),
      'Task Summary': day.taskSummary,
      'Subtasks': day.subtasks?.join(', ') || '',
      'Expected Deliverables': day.expectedDeliverables?.join(', ') || '',
      'Estimated Hours': day.estimatedHours,
      'Status': day.status,
      'Assigned To': day.assignees?.map(a => a.name).join(', ') || '',
      'Completed At': day.completedAt ? new Date(day.completedAt).toLocaleDateString() : ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Project Plan');
    XLSX.writeFile(wb, `${project.projectTitle.replace(/[^a-z0-9]/gi, '_')}_plan.xlsx`);

    toast({
      title: 'Exported!',
      description: 'Project plan downloaded as Excel file'
    });
  };

  const handleUpdateDayStatus = async (dayNumber, newStatus) => {
    const res = await fetch(`/api/projects/${params.id}/days/${dayNumber}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to update status' }));
      throw new Error(error.message || 'Failed to update status');
    }

    await fetchProject();
    return true;
  };

  const handleApproveDay = async (dayNumber) => {
    try {
      await handleUpdateDayStatus(dayNumber, 'approved');
      toast({
        title: '✅ Day approved!',
        description: `Day ${dayNumber} has been approved`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve day',
        variant: 'destructive'
      });
    }
  };

  const handleRefinePlan = async () => {
    if (!refineInstructions.trim()) {
      toast({
        title: 'Missing instructions',
        description: 'Please provide refinement instructions',
        variant: 'destructive'
      });
      return;
    }

    setRefining(true);
    try {
      const res = await fetch(`/api/projects/${params.id}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refinementInstructions: refineInstructions })
      });

      if (res.ok) {
        const updated = await res.json();
        setProject(updated);
        toast({
          title: '✨ Plan refined successfully!',
          description: 'AI has updated your project plan'
        });
        setShowRefineDialog(false);
        setRefineInstructions('');
      } else {
        throw new Error('Failed to refine plan');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refine plan',
        variant: 'destructive'
      });
    } finally {
      setRefining(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-gray-500',
      'in_progress': 'bg-yellow-500',
      'completed': 'bg-green-500',
      'completed_pending_approval': 'bg-blue-500',
      'approved': 'bg-emerald-500',
      'blocked': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'bg-blue-100 text-blue-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-orange-100 text-orange-800',
      'Critical': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (!project) {
    return <div className="container mx-auto p-6">Project not found</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation('/admin/projects')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{project.projectTitle}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showRefineDialog} onOpenChange={setShowRefineDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                Refine Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Refine Project Plan with AI</DialogTitle>
                <DialogDescription>
                  Provide instructions for how you want to modify the project plan
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="E.g., Add more testing tasks, increase estimated hours for Day 3, split Day 5 into two days..."
                  value={refineInstructions}
                  onChange={(e) => setRefineInstructions(e.target.value)}
                  rows={5}
                />
                <Button onClick={handleRefinePlan} disabled={refining} className="w-full">
                  {refining ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                      Refining...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Refine with AI
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={handleExportToExcel} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.progress}%</div>
            <Progress value={project.progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={`${getStatusColor(project.status.toLowerCase().replace(' ', '_'))} text-white`}>
              {project.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.assignedEmployees.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Start Date</p>
            <p className="text-lg">{new Date(project.startDate).toLocaleDateString()}</p>
          </div>
          {project.endDate && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">End Date</p>
              <p className="text-lg">{new Date(project.endDate).toLocaleDateString()}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Days</p>
            <p className="text-lg">{project.days.length} days</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Distribution Strategy</p>
            <p className="text-lg capitalize">{project.distributionSettings?.strategy?.replace('-', ' ')}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {project.assignedEmployees.map(emp => (
              <div key={emp.userId} className="flex items-center gap-2 p-2 border rounded">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{emp.name}</p>
                  {emp.role && <p className="text-xs text-muted-foreground">{emp.role}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Day-by-Day Timeline</CardTitle>
          <CardDescription>AI-generated task distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {project.days.map((day, index) => (
              <div key={index} className={`border-l-4 ${day.status === 'completed' || day.status === 'approved' ? 'border-green-500' : day.status === 'in_progress' ? 'border-yellow-500' : 'border-gray-300'} p-4 rounded bg-card`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">Day {day.dayNumber}</h3>
                    <p className="text-sm text-muted-foreground">{new Date(day.date).toLocaleDateString()}</p>
                  </div>
                  <Badge className={`${getStatusColor(day.status)} text-white`}>
                    {day.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Task Summary</h4>
                    <p className="text-sm text-muted-foreground">{day.taskSummary}</p>
                  </div>

                  {day.subtasks && day.subtasks.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Subtasks</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {day.subtasks.map((subtask, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground">{subtask}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {day.expectedDeliverables && day.expectedDeliverables.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Expected Deliverables</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {day.expectedDeliverables.map((deliverable, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground">{deliverable}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {day.estimatedHours} hours
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {day.assignees?.length || 0} assignee(s)
                    </span>
                  </div>

                  {day.assignees && day.assignees.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Assigned to: {day.assignees.map(a => a.name).join(', ')}
                      </p>
                    </div>
                  )}

                  {day.completedAt && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-green-600">
                        ✓ Completed on {new Date(day.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {day.status === 'completed_pending_approval' && (
                    <div className="pt-3 border-t">
                      <Button 
                        onClick={() => handleApproveDay(day.dayNumber)} 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                      >
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        Approve Completion
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
