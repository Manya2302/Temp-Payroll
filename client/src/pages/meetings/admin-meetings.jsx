import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Video, Calendar, Clock, Plus, Play, CheckCircle2, Trash2 } from "lucide-react";
import Layout from "@/components/layout/layout";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AdminMeetings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    description: "",
    agenda: "",
    reason: ""
  });

  const { data: meetings, isLoading } = useQuery({
    queryKey: ["/api/meetings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/meetings");
      return res.json();
    },
  });

  const scheduleMeetingMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/meetings", data);
      if (!res.ok) throw new Error("Failed to schedule meeting");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({
        title: "Success",
        description: "Meeting scheduled successfully",
      });
      setFormData({
        title: "",
        date: "",
        time: "",
        description: "",
        agenda: "",
        reason: ""
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startMeetingMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiRequest("PATCH", `/api/meetings/${id}/start`);
      if (!res.ok) throw new Error("Failed to start meeting");
      return res.json();
    },
    onSuccess: (meeting) => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({
        title: "Meeting Started",
        description: "Redirecting to meeting room...",
      });
      setLocation(`/meetings/room/${meeting.roomName}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const completeMeetingMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiRequest("PATCH", `/api/meetings/${id}/complete`);
      if (!res.ok) throw new Error("Failed to complete meeting");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({
        title: "Success",
        description: "Meeting marked as completed",
      });
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiRequest("DELETE", `/api/meetings/${id}`);
      if (!res.ok) throw new Error("Failed to delete meeting");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({
        title: "Success",
        description: "Meeting deleted successfully",
      });
    },
  });

  const handleScheduleMeeting = (e) => {
    e.preventDefault();
    scheduleMeetingMutation.mutate(formData);
  };

  const handleStartMeeting = (meeting) => {
    if (meeting.status === 'scheduled') {
      startMeetingMutation.mutate(meeting._id);
    } else if (meeting.status === 'ongoing') {
      setLocation(`/meetings/room/${meeting.roomName}`);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
      ongoing: { variant: "default", className: "bg-green-50 text-green-700 border-green-200" },
      completed: { variant: "secondary", className: "bg-gray-50 text-gray-700 border-gray-200" },
      cancelled: { variant: "destructive", className: "bg-red-50 text-red-700 border-red-200" }
    };
    return statusConfig[status] || statusConfig.scheduled;
  };

  if (user?.role !== 'admin') {
    setLocation("/");
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meeting Management</h1>
          <p className="text-gray-600 mt-2">Schedule and manage team meetings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Schedule Meeting Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Schedule New Meeting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScheduleMeeting} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Title *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Monthly Team Sync"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time *
                    </label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the meeting"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agenda
                  </label>
                  <Textarea
                    value={formData.agenda}
                    onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                    placeholder="Meeting agenda and topics to discuss"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason/Purpose
                  </label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Why this meeting is important"
                    rows={2}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={scheduleMeetingMutation.isPending}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {scheduleMeetingMutation.isPending ? "Scheduling..." : "Schedule Meeting"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Past & Upcoming Meetings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                All Meetings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : meetings && meetings.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {meetings.map((meeting) => (
                    <div
                      key={meeting._id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(meeting.date), 'MMM dd, yyyy')}
                            <Clock className="h-3 w-3 ml-2" />
                            {meeting.time}
                          </div>
                        </div>
                        <Badge {...getStatusBadge(meeting.status)}>
                          {meeting.status}
                        </Badge>
                      </div>

                      {meeting.description && (
                        <p className="text-sm text-gray-600 mb-2">{meeting.description}</p>
                      )}

                      {meeting.participants && meeting.participants.length > 0 && (
                        <p className="text-xs text-gray-500 mb-3">
                          {meeting.participants.filter(p => p.joined).length} / {meeting.participants.length} joined
                        </p>
                      )}

                      <div className="flex gap-2">
                        {meeting.status === 'scheduled' && (
                          <Button
                            size="sm"
                            onClick={() => handleStartMeeting(meeting)}
                            disabled={startMeetingMutation.isPending}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </Button>
                        )}
                        
                        {meeting.status === 'ongoing' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStartMeeting(meeting)}
                            >
                              <Video className="h-3 w-3 mr-1" />
                              Join
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => completeMeetingMutation.mutate(meeting._id)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                          </>
                        )}

                        {meeting.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this meeting?")) {
                                deleteMeetingMutation.mutate(meeting._id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Video className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">No meetings scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
