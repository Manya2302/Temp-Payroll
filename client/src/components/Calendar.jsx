import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Calendar = ({ calendarData = [], onDateClick, isAdmin = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const getDateColor = (day) => {
    const dateStr = new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
    const entry = calendarData.find(item => {
      const itemDate = new Date(item.date).toISOString().split('T')[0];
      return itemDate === dateStr;
    });

    if (entry) {
      return {
        color: entry.color_code,
        type: entry.day_type,
        title: entry.title,
        description: entry.description,
        id: entry._id || entry.id
      };
    }

    return { color: '#FFFFFF', type: 'Normal', title: '', description: '', id: null };
  };

  const handleDateClickInternal = (day) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (clickedDate <= today && isAdmin) {
      return;
    }

    const dateInfo = getDateColor(day);
    if (onDateClick) {
      onDateClick({
        date: clickedDate,
        ...dateInfo
      });
    }
  };

  const isPastDate = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date <= today;
  };

  const renderDays = () => {
    const days = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 border border-gray-200"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateInfo = getDateColor(day);
      const isPast = isPastDate(day);
      
      days.push(
        <div
          key={day}
          onClick={() => handleDateClickInternal(day)}
          className={`h-20 border border-gray-200 p-2 relative transition-all ${
            isAdmin && !isPast ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''
          } ${isPast && isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ backgroundColor: dateInfo.color }}
        >
          <div className="text-sm font-semibold text-gray-700">{day}</div>
          {dateInfo.title && (
            <div className="text-xs mt-1 text-gray-600 truncate" title={dateInfo.title}>
              {dateInfo.title}
            </div>
          )}
          {dateInfo.type !== 'Normal' && (
            <div className={`absolute bottom-1 right-1 text-xs px-1 rounded ${
              dateInfo.type === 'Holiday' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
            }`}>
              {dateInfo.type === 'Holiday' ? 'H' : 'HD'}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        
        <h2 className="text-2xl font-bold text-gray-800">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center font-semibold text-gray-600 py-2 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0 border border-gray-200">
        {renderDays()}
      </div>

      <div className="mt-6 flex items-center justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-red-100 border border-red-300 rounded"></div>
          <span className="text-sm text-gray-600">Holiday</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-green-100 border border-green-300 rounded"></div>
          <span className="text-sm text-gray-600">Half Day</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-white border border-gray-300 rounded"></div>
          <span className="text-sm text-gray-600">Normal Day</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
