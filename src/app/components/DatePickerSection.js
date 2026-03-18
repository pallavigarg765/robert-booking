import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DatePickerSection({
  selectedDate,
  workCalandar,
  loadingCalendar,
  onDateSelect,
  onTimeReset,
  currentMonth,  // 👈 Now received from parent
  onMonthChange
}) {
  const [weeks, setWeeks] = useState([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  useEffect(() => {
    if (!workCalandar) {
      console.log('⚠️ No workCalendar data available');
      return;
    }
    
    console.log('📅 Building calendar for:', currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    console.log('📊 Work calendar data:', workCalandar);
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    const startDate = new Date(firstDay);
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const endDate = new Date(lastDay);
    const endDayOfWeek = endDate.getDay();
    endDate.setDate(endDate.getDate() + (endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek));
    
    const currentDate = new Date(startDate);
    const tempWeeks = [];
    let currentWeek = [];
    let dayCount = 0;
    let availableCount = 0;
    
    // Get today's date at midnight in local timezone for accurate comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    while (currentDate <= endDate) {
      // Create date at midnight in local timezone to avoid timezone issues
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const y = date.getFullYear();
      const m = date.getMonth() + 1;
      const d = date.getDate();
      const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      
      const isCurrentMonth = y === year && m === month;
      const dayInfo = workCalandar?.[key];
      
      // Check if day is available - is_day_off can be string "0"/"1" or number 0/1 or boolean
      let isDayOff = true; // Default to day off if no info
      if (dayInfo) {
        // Handle various formats of is_day_off
        if (typeof dayInfo.is_day_off === 'string') {
          isDayOff = dayInfo.is_day_off === '1' || dayInfo.is_day_off.toLowerCase() === 'true';
        } else if (typeof dayInfo.is_day_off === 'number') {
          isDayOff = dayInfo.is_day_off === 1;
        } else if (typeof dayInfo.is_day_off === 'boolean') {
          isDayOff = dayInfo.is_day_off;
        }
      }
      
      const isAvailable = isCurrentMonth && dayInfo && !isDayOff;
      
      // Compare dates properly without timezone issues
      const isPast = date.getTime() < today.getTime();
      
      if (isAvailable && !isPast) {
        availableCount++;
        console.log(`✅ Available: ${key}`, { dayInfo, isDayOff, isPast });
      } else if (dayInfo) {
        console.log(`❌ Not available: ${key}`, { 
          isCurrentMonth, 
          hasDayInfo: !!dayInfo, 
          isDayOff, 
          isPast,
          is_day_off_raw: dayInfo.is_day_off,
          is_day_off_type: typeof dayInfo.is_day_off
        });
      }
      
      currentWeek.push({
        date,
        day: date.getDate(),
        isCurrentMonth,
        isAvailable: isAvailable && !isPast,
        isPast,
        isToday: date.getTime() === today.getTime(),
        isSelected: selectedDate && date.getTime() === new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime(),
        key
      });
      
      dayCount++;
      
      if (dayCount % 7 === 0) {
        tempWeeks.push(currentWeek);
        currentWeek = [];
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (currentWeek.length > 0) {
      tempWeeks.push(currentWeek);
    }
    
    console.log(`📊 Generated ${tempWeeks.length} weeks with ${availableCount} available dates`);
    setWeeks(tempWeeks);
    
    // Auto-navigate to first week with available dates
    if (!selectedDate && tempWeeks.length > 0) {
      const firstAvailableWeek = tempWeeks.findIndex(week => 
        week.some(day => day.isAvailable)
      );
      if (firstAvailableWeek !== -1) {
        setCurrentWeekIndex(firstAvailableWeek);
        console.log(`🎯 Auto-navigated to week ${firstAvailableWeek + 1} (first with available dates)`);
      } else {
        console.log('⚠️ No weeks with available dates found');
      }
    } else if (selectedDate) {
      const selectedWeekIndex = tempWeeks.findIndex(week => 
        week.some(day => day.date.toDateString() === selectedDate.toDateString())
      );
      if (selectedWeekIndex !== -1) {
        setCurrentWeekIndex(selectedWeekIndex);
      }
    }
  }, [workCalandar, currentMonth, selectedDate]);

  const handleMonthChange = (direction) => {
    const newDate = new Date(currentMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    
    console.log('📅 Month navigation requested:', newDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    
    // Reset to first week when changing months
    setCurrentWeekIndex(0);
    
    // Call parent to update month and fetch new calendar data
    if (onMonthChange) {
      onMonthChange(newDate);
    }
  };

  const handleWeekChange = (direction) => {
    if (direction === 'prev' && currentWeekIndex > 0) {
      setCurrentWeekIndex(currentWeekIndex - 1);
    } else if (direction === 'next' && currentWeekIndex < weeks.length - 1) {
      setCurrentWeekIndex(currentWeekIndex + 1);
    }
  };

  const handleDateSelect = (date) => {
    // Create today's date at midnight in local timezone for accurate comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create the selected date at midnight in local timezone
    const selectedDateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (selectedDateMidnight.getTime() < today.getTime()) {
      console.log('❌ Date is in the past, cannot select');
      return;
    }
    
    console.log('✅ Date selected:', date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
    
    // Call the parent's onDateSelect handler
    if (onDateSelect) {
      onDateSelect(date);
    }
    
    // Reset time when date changes
    if (onTimeReset) {
      onTimeReset();
    }
  };

  return (
    <div className="space-y-3">
      {loadingCalendar ? (
        <div className="text-center py-6">
          <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-gray-600 mt-2">Loading...</p>
        </div>
      ) : (
        <>
          {/* Month Navigation */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <button
              type="button"
              onClick={() => handleMonthChange('prev')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="text-sm font-bold text-gray-800">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <button
              type="button"
              onClick={() => handleMonthChange('next')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Week Navigation */}
          {weeks.length > 0 && (
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-200">
              <button
                type="button"
                onClick={() => handleWeekChange('prev')}
                disabled={currentWeekIndex === 0}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="text-xs font-medium text-gray-600">
                Week {currentWeekIndex + 1} of {weeks.length}
              </div>
              <button
                type="button"
                onClick={() => handleWeekChange('next')}
                disabled={currentWeekIndex === weeks.length - 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}

          {/* Week Days */}
          <div className="space-y-1.5">
            {weeks[currentWeekIndex]?.map((day, index) => {
              const dayAbbr = day.date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
              
              if (day.isSelected) {
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-bold">{dayAbbr}</div>
                      <div className="text-base font-bold">{day.day}</div>
                      <div className="text-xs opacity-90">
                        {day.date.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                );
              }
              
              if (!day.isAvailable || day.isPast) {
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm">{dayAbbr}</div>
                      <div className="text-base">{day.day}</div>
                      <div className="text-xs">
                        {day.date.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                );
              }
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDateSelect(day.date);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all hover:shadow-md ${
                    day.isToday
                      ? 'bg-blue-50 border-blue-300 hover:bg-blue-100 hover:border-blue-400'
                      : 'bg-white border-gray-200 hover:border-green-400 hover:bg-green-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-sm font-semibold ${day.isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                      {dayAbbr}
                    </div>
                    <div className={`text-base font-bold ${day.isToday ? 'text-blue-700' : 'text-gray-800'}`}>
                      {day.day}
                    </div>
                    <div className={`text-xs ${day.isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                      {day.date.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    day.isToday ? 'border-blue-500 bg-blue-200' : 'border-gray-300'
                  }`}></div>
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div className="p-3 bg-green-50 rounded-xl border-2 border-green-200 mt-3">
              <div className="text-xs font-medium text-gray-600 mb-1">Selected Date</div>
              <div className="text-sm font-bold text-gray-800">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          )}

          {weeks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No available dates for this month</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
