import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Clock,
  UserCheck,
  UserX,
  Timer,
  Plane,
  CalendarX
} from 'lucide-react';

// Attendance status types
const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  HALF_DAY: 'half_day',
  LEAVE: 'leave'
};

// Generate dummy attendance data for 3 months (2 months back + current + 1 month forward)
const generateAttendanceData = () => {
  const data:any= {};
   
  
  // Generate data for 4 months (2 back, current, 1 forward)
  for (let monthOffset = -2; monthOffset <= 1; monthOffset++) {
    const date = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthKey:any = `${year}-${month}`;
    data[monthKey] = {};
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay();
      
      // Skip only Sundays for attendance (Saturday is working day)
      if (dayOfWeek === 0) continue;
      
      // Don't generate future dates beyond current month
      if (monthOffset === 1 && currentDate > new Date()) continue;
      
      // Generate random attendance status
      const random = Math.random();
      let status;
      
      if (random < 0.75) status = ATTENDANCE_STATUS.PRESENT;
      else if (random < 0.85) status = ATTENDANCE_STATUS.LATE;
      else if (random < 0.92) status = ATTENDANCE_STATUS.HALF_DAY;
      else if (random < 0.97) status = ATTENDANCE_STATUS.LEAVE;
      else status = ATTENDANCE_STATUS.ABSENT;
      
      data[monthKey][day] = {
        status,
        timeIn: status === ATTENDANCE_STATUS.ABSENT ? null : 
                status === ATTENDANCE_STATUS.LATE ? '09:30' :
                status === ATTENDANCE_STATUS.HALF_DAY ? '09:00' : '09:00',
        timeOut: status === ATTENDANCE_STATUS.ABSENT ? null :
                 status === ATTENDANCE_STATUS.HALF_DAY ? '13:00' : '18:00',
        hours: status === ATTENDANCE_STATUS.ABSENT ? 0 :
               status === ATTENDANCE_STATUS.HALF_DAY ? 4 : 8
      };
    }
  }
  
  return data;
};

const EmployeeAttendanceCalendar = ({empId}:{empId:any}) => {
  console.log("Employee ID:", empId);
  // State to manage current date and attendance data
  const [currentDate, setCurrentDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [attendanceData] = useState(() => generateAttendanceData());
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const monthKey = `${currentYear}-${currentMonth}`;
  
  // Get calendar data for current month
  const calendarData = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(currentYear, currentMonth, day);
      const isSunday = dateObj.getDay() === 0;
      const isToday = dateObj.toDateString() === new Date().toDateString();
      const isFuture = dateObj > new Date();
      
      days.push({
        day,
        date: dateObj,
        isSunday,
        isToday,
        isFuture,
        attendance: attendanceData[monthKey]?.[day] || null
      });
    }
    
    return days;
  }, [currentYear, currentMonth, attendanceData, monthKey]);
  
  // Calculate monthly statistics
  const monthlyStats = useMemo(() => {
    const monthData = attendanceData[monthKey] || {};
    const stats:any = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      leave: 0,
      totalWorkingDays: 0
    };
    
    Object.values(monthData).forEach((day:any) => {
      stats.totalWorkingDays++;
      switch (day.status) {
        case ATTENDANCE_STATUS.PRESENT:
          stats.present++;
          break;
        case ATTENDANCE_STATUS.ABSENT:
          stats.absent++;
          break;
        case ATTENDANCE_STATUS.LATE:
          stats.late++;
          break;
        case ATTENDANCE_STATUS.HALF_DAY:
          stats.halfDay++;
          break;
        case ATTENDANCE_STATUS.LEAVE:
          stats.leave++;
          break;
      }
    });
    
    // Calculate leaves left (assuming 24 leaves per year, 2 per month)
    const monthlyLeaveQuota:any = 2;
    stats.leavesLeft = Math.max(0, monthlyLeaveQuota - stats.leave);
    
    return stats;
  }, [attendanceData, monthKey]);
  
  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  };
  
  // Get status background classes
  const getStatusBgColor = (status:any) => {
    switch (status) {
      case ATTENDANCE_STATUS.PRESENT:
        return 'bg-green-100 border-green-300 text-green-800';
      case ATTENDANCE_STATUS.ABSENT:
        return 'bg-red-100 border-red-300 text-red-800';
      case ATTENDANCE_STATUS.LATE:
        return 'bg-purple-100 border-purple-300 text-purple-800';
      case ATTENDANCE_STATUS.HALF_DAY:
        return 'bg-pink-100 border-pink-300 text-pink-800';
      case ATTENDANCE_STATUS.LEAVE:
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-white border-gray-200 text-gray-700';
    }
  };
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Attendance</h1>
          <p className="text-sm text-gray-600">Track daily attendance and monthly statistics</p>
        </div>
        <Button onClick={goToToday} variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Today
        </Button>
      </div>
      
      {/* Monthly Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-green-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Present</p>
                <p className="text-lg font-bold text-green-600">{monthlyStats.present}</p>
              </div>
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-red-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Absent</p>
                <p className="text-lg font-bold text-red-600">{monthlyStats.absent}</p>
              </div>
              <UserX className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Late</p>
                <p className="text-lg font-bold text-purple-600">{monthlyStats.late}</p>
              </div>
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-pink-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Half Day</p>
                <p className="text-lg font-bold text-pink-600">{monthlyStats.halfDay}</p>
              </div>
              <Timer className="h-5 w-5 text-pink-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Leave</p>
                <p className="text-lg font-bold text-blue-600">{monthlyStats.leave}</p>
              </div>
              <Plane className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Leaves Left</p>
                <p className="text-lg font-bold text-orange-600">{monthlyStats.leavesLeft}</p>
              </div>
              <CalendarX className="h-5 w-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Calendar */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {monthNames[currentMonth]} {currentYear}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 border-b">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarData.map((dayData, index) => {
              if (!dayData) {
                return <div key={index} className="p-2 h-16"></div>;
              }
              
              const { day, isSunday, isToday, isFuture, attendance } = dayData;
              
              // Sunday styling
              if (isSunday) {
                return (
                  <div
                    key={day}
                    className={`
                      relative p-2 h-16 border border-gray-200 bg-gray-100
                      ${isToday ? 'ring-2 ring-blue-500' : ''}
                      flex flex-col items-center justify-center
                    `}
                  >
                    <div className="text-sm font-medium text-gray-600">{day}</div>
                    <div className="text-xs text-gray-500 font-medium mt-1">Week Off</div>
                  </div>
                );
              }
              
              // Regular working days
              const bgColorClass = attendance ? getStatusBgColor(attendance.status) : 'bg-white border-gray-200 text-gray-700';
              
              return (
                <div
                  key={day}
                  className={`
                    relative p-2 h-16 border cursor-pointer hover:shadow-sm transition-shadow
                    ${bgColorClass}
                    ${isToday ? 'ring-2 ring-blue-500' : ''}
                    ${isFuture ? 'opacity-50' : ''}
                    flex flex-col
                  `}
                  title={attendance ? `${attendance.status.replace('_', ' ').toUpperCase()} ${attendance.timeIn ? `(${attendance.timeIn} - ${attendance.timeOut})` : ''}` : 'No data'}
                >
                  <div className="text-sm font-medium">{day}</div>
                  {attendance && (
                    <div className="text-xs mt-1 capitalize font-medium">
                      {attendance.status.replace('_', ' ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Legend</h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 rounded border bg-green-100 border-green-300"></div>
                <span className="text-xs text-gray-600">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 rounded border bg-red-100 border-red-300"></div>
                <span className="text-xs text-gray-600">Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 rounded border bg-purple-100 border-purple-300"></div>
                <span className="text-xs text-gray-600">Late</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 rounded border bg-pink-100 border-pink-300"></div>
                <span className="text-xs text-gray-600">Half Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 rounded border bg-blue-100 border-blue-300"></div>
                <span className="text-xs text-gray-600">Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 rounded border bg-gray-100 border-gray-200"></div>
                <span className="text-xs text-gray-600">Week Off</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeAttendanceCalendar;