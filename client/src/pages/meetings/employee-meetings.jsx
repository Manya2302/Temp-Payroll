import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Video, Calendar, Clock, Users, FileText } from "lucide-react";
import Layout from "@/components/layout/layout";
import { format } from "date-fns";

export default function EmployeeMeetings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: meetings, isLoading } = useQuery({
    queryKey: ["/api/meetings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/meetings");
      return res.json();
    },
  });

  const upcomingMeetings = meetings?.filter(m => 
    m.status === 'scheduled' || m.status === 'ongoing'
  ).sort((a, b) => new Date(a.date) - new Date(b.date)) || [];

  const pastMeetings = meetings?.filter(m => 
    m.status === 'completed'
  ).sort((a, b) => new Date(b.date) - new Date(a.date)) || [];

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
      ongoing: { variant: "default", className: "bg-green-50 text-green-700 border-green-200" },
      completed: { variant: "secondary", className: "bg-gray-50 text-gray-700 border-gray-200" },
    };
    return statusConfig[status] || statusConfig.scheduled;
  };

  const handleJoinMeeting = (meeting) => {
    setLocation(`/meetings/room/${meeting.roomName}`);
  };

  if (user?.role === 'admin') {
    setLocation("/admin/meetings");
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Meetings</h1>
          <p className="text-gray-600 mt-2">View and join scheduled meetings</p>
        </div>

        {/* Upcoming Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Upcoming Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : upcomingMeetings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMeetings.map((meeting) => (
                  <div
                    key={meeting._id}
                    className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg">{meeting.title}</h3>
                      <Badge {...getStatusBadge(meeting.status)}>
                        {meeting.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(meeting.date), 'EEEE, MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        {meeting.time}
                      </div>
                    </div>

                    {meeting.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {meeting.description}
                      </p>
                    )}

                    {meeting.agenda && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Agenda:</p>
                        <p className="text-xs text-gray-600 line-clamp-2">{meeting.agenda}</p>
                      </div>
                    )}

                    {meeting.participants && meeting.participants.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <Users className="h-3 w-3" />
                        {meeting.participants.filter(p => p.joined).length} / {meeting.participants.length} joined
                      </div>
                    )}

                    {meeting.status === 'ongoing' && (
                      <Button
                        className="w-full"
                        onClick={() => handleJoinMeeting(meeting)}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join Meeting
                      </Button>
                    )}

                    {meeting.status === 'scheduled' && (
                      <Button
                        className="w-full"
                        variant="outline"
                        disabled
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Scheduled
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Video className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">No upcoming meetings</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Meetings */}
        {pastMeetings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Past Meetings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pastMeetings.slice(0, 5).map((meeting) => (
                  <div
                    key={meeting._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-600">
                          {format(new Date(meeting.date), 'MMM dd, yyyy')}
                        </span>
                        <span className="text-sm text-gray-600">{meeting.time}</span>
                      </div>
                    </div>
                    <Badge {...getStatusBadge(meeting.status)}>
                      {meeting.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
