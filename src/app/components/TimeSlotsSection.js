import { Clock } from "lucide-react";

export default function TimeSlotsSection({
  selectedDate,
  selectedTime,
  slots,
  dayMap,
  onTimeSelect,
  loadingTimeSlots = false
}) {
  return (
    <div className="space-y-3">
      {loadingTimeSlots ? (
        <div className="text-center py-6">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-gray-600 mt-2">Loading...</p>
        </div>
      ) : (
        <>
          {selectedDate && (
            <div className="text-xs text-gray-600 mb-2">
              {dayMap[selectedDate.getDay()]}, {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}

          {slots.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {slots.map((slot) => {
                const isSelected = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => onTimeSelect(slot)}
                    className={`p-2 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md"
                        : "bg-white border border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <Clock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No slots available</p>
            </div>
          )}

          {selectedTime && (
            <div className="p-2 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-xs text-gray-600">Selected Time</div>
              <div className="text-xs font-semibold text-gray-800">{selectedTime}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
