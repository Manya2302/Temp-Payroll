import { useState, useEffect } from 'react';
import Calendar from '../components/Calendar';
import Layout from "@/components/layout/layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar as CalendarIcon } from 'lucide-react';

const EmployeeCalendar = () => {
  const [calendarData, setCalendarData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

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
    if (dateInfo.type !== 'Normal') {
      setSelectedDate(dateInfo);
      setIsModalOpen(true);
    }
  };

  return (
    <Layout>
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <CalendarIcon className="w-8 h-8" />
          Company Holiday Calendar
        </h1>
        <p className="text-gray-600 mt-2">
          View company holidays and half-days
        </p>
      </div>

      <Calendar
        calendarData={calendarData}
        onDateClick={handleDateClick}
        isAdmin={false}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDate?.type === 'Holiday' ? '🎉 Holiday' : '⏰ Half Day'}
            </DialogTitle>
            <DialogDescription>
              {selectedDate?.date && selectedDate.date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedDate?.title && (
              <div>
                <h3 className="font-semibold text-gray-700">Title</h3>
                <p className="text-gray-600">{selectedDate.title}</p>
              </div>
            )}

            {selectedDate?.description && (
              <div>
                <h3 className="font-semibold text-gray-700">Description</h3>
                <p className="text-gray-600">{selectedDate.description}</p>
              </div>
            )}

            {!selectedDate?.title && !selectedDate?.description && (
              <p className="text-gray-500 text-center py-4">
                No additional information available
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </Layout>
  );
};

export default EmployeeCalendar;
