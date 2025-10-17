import { useState, useEffect } from 'react';
import Layout from "@/components/layout/layout";
import Calendar from '../components/Calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';

const AdminCalendar = () => {
  const [calendarData, setCalendarData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    day_type: 'Normal',
    color_code: '#FFFFFF',
    title: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      const response = await fetch('/api/calendar');
      if (response.ok) {
        const data = await response.json();
        setCalendarData(data);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    }
  };

  const handleDateClick = (dateInfo) => {
    setSelectedDate(dateInfo);
    
    if (dateInfo.id) {
      setFormData({
        day_type: dateInfo.type,
        color_code: dateInfo.color,
        title: dateInfo.title || '',
        description: dateInfo.description || ''
      });
    } else {
      setFormData({
        day_type: 'Normal',
        color_code: '#FFFFFF',
        title: '',
        description: ''
      });
    }
    
    setIsModalOpen(true);
  };

  const handleDayTypeChange = (value) => {
    let color = '#FFFFFF';
    if (value === 'Holiday') {
      color = '#FFB6B6';
    } else if (value === 'Half Day') {
      color = '#B6FFB6';
    }
    
    setFormData({ ...formData, day_type: value, color_code: color });
  };

  const handleSave = async () => {
    try {
      if (selectedDate.id) {
        const response = await fetch(`/api/calendar/${selectedDate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Calendar entry updated successfully",
          });
          fetchCalendarData();
          setIsModalOpen(false);
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.message || "Failed to update entry",
            variant: "destructive"
          });
        }
      } else {
        const response = await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: selectedDate.date,
            ...formData
          })
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Calendar entry created successfully",
          });
          fetchCalendarData();
          setIsModalOpen(false);
        } else {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.message || "Failed to create entry",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error saving calendar entry:', error);
      toast({
        title: "Error",
        description: "An error occurred while saving",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedDate.id) return;

    try {
      const response = await fetch(`/api/calendar/${selectedDate.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Calendar entry deleted successfully",
        });
        fetchCalendarData();
        setIsModalOpen(false);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to delete entry",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting calendar entry:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting",
        variant: "destructive"
      });
    }
  };

  return (
        <Layout>
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <CalendarIcon className="w-8 h-8" />
          Holiday Calendar Management
        </h1>
        <p className="text-gray-600 mt-2">
          Click on any future date to add or edit holidays and half-days
        </p>
      </div>

      <Calendar
        calendarData={calendarData}
        onDateClick={handleDateClick}
        isAdmin={true}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDate?.id ? 'Edit Calendar Entry' : 'Add Calendar Entry'}
            </DialogTitle>
            <DialogDescription>
              {selectedDate?.date && `Date: ${selectedDate.date.toLocaleDateString()}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="day_type">Day Type</Label>
              <Select value={formData.day_type} onValueChange={handleDayTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal Day</SelectItem>
                  <SelectItem value="Holiday">Holiday</SelectItem>
                  <SelectItem value="Half Day">Half Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                placeholder="e.g., Diwali, Christmas"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add notes or details"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            {selectedDate?.id && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
            </Layout>
  );
};

export default AdminCalendar;
