import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

export default function AvailabilitySection({
    scrollContainerRef,
    workCalandar,
    selectedDate,
    selectedTime,
    slots,
    onDateSelect,
    onTimeSelect,
    loadingCalendar,
    loadingTimeSlots,
    totalDuration
}) {
    const [weeks, setWeeks] = useState([]);
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [expandedDateKey, setExpandedDateKey] = useState(null);
    const [dayTimeRanges, setDayTimeRanges] = useState({});
    const dayRefs = useRef({});
    const SLOT_INTERVAL = 30;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const canFitAppointment = (slotIndex, slotList) => {
        if (!totalDuration) return false;

        const requiredSlots = Math.ceil(totalDuration / SLOT_INTERVAL);

        // Not enough remaining slots
        if (slotIndex + requiredSlots > slotList.length) {
            return false;
        }

        // Check if consecutive slots exist
        for (let i = 0; i < requiredSlots; i++) {
            if (!slotList[slotIndex + i]) {
                return false;
            }
        }

        return true;
    };

    const getLocalDateKey = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    const formatTime = (time) => {
        if (!time) return "";

        const [hourStr, minuteStr] = time.split(":");
        let hour = parseInt(hourStr, 10);
        const minutes = minuteStr || "00";

        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12; // convert 0 → 12

        return minutes === "00"
            ? `${hour} ${ampm}`
            : `${hour}:${minutes} ${ampm}`;
    };

    const resolveTimeRange = (dayInfo) => {
        if (!dayInfo) return "OFF";

        const isDayOff =
            dayInfo.is_day_off === 1 ||
            dayInfo.is_day_off === "1" ||
            dayInfo.is_day_off === true;

        if (isDayOff) return "OFF";

        if (dayInfo.from && dayInfo.to) {
            return `${formatTime(dayInfo.from)} – ${formatTime(dayInfo.to)}`;
        }

        return "Available";
    };


    useEffect(() => {
        if (!selectedDate || !Array.isArray(slots) || slots.length === 0) return;

        const key = selectedDate.toISOString().split("T")[0];

        setDayTimeRanges(prev => ({
            ...prev,
            [key]: `${formatTime(slots[0])} – ${formatTime(slots[slots.length - 1])}`
        }));
    }, [selectedDate, slots]);


    /* =========================
       BUILD WEEKS (MONTH BASED)
       ========================= */
    useEffect(() => {
        if (!workCalandar) return;

        const start = new Date(today);
        start.setDate(start.getDate() - start.getDay() + 1); // Monday

        const tempWeeks = [];
        const cursor = new Date(start);

        // build ~3 months of weeks
        for (let w = 0; w < 52; w++){
            const week = [];

            for (let d = 0; d < 7; d++) {
                const date = new Date(cursor);
                date.setHours(0, 0, 0, 0);

                const key = getLocalDateKey(date);
                const dayInfo = workCalandar[key];

                const isDayOff =
                    !dayInfo ||
                    dayInfo.is_day_off === 1 ||
                    dayInfo.is_day_off === "1" ||
                    dayInfo.is_day_off === true;

                const isPast = date < today;
                const isAvailable = !isDayOff && !isPast;

                week.push({
                    key,
                    date,
                    dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
                    label: date.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                    }),
                    isAvailable,
                    isDayOff,
                    isPast,
                    timeLabel: resolveTimeRange(dayInfo),
                });

                cursor.setDate(cursor.getDate() + 1);
            }

            tempWeeks.push(week);
        }

        setWeeks(tempWeeks);
    }, [workCalandar]);

    const getWeekMonth = (week) => {
        const midDay = week[3]?.date || week[0]?.date;
        return new Date(midDay.getFullYear(), midDay.getMonth(), 1);
    };

    /* =========================
       HANDLERS
       ========================= */
    const handleMonthChange = (dir) => {

        const next = new Date(currentMonth);

        if (dir === "prev") {
            next.setMonth(next.getMonth() - 1);
        } else {
            next.setMonth(next.getMonth() + 1);
        }

        setCurrentMonth(next);

        const index = weeks.findIndex(week =>
            week.some(d =>
                d.date.getMonth() === next.getMonth() &&
                d.date.getFullYear() === next.getFullYear()
            )
        );

        if (index !== -1) {
            setCurrentWeekIndex(index);
        }
    };

    const isSameDay = (d1, d2) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const isPastTimeSlot = (slot, date) => {
        if (!isSameDay(date, today)) return false;

        const [hours, minutes = "00"] = slot.split(":").map(Number);

        const slotTime = new Date(date);
        slotTime.setHours(hours, minutes, 0, 0);

        return slotTime <= new Date();
    };


    const handleWeekChange = (dir) => {

        if (dir === "next") {
            const nextIndex = currentWeekIndex + 1;

            if (nextIndex < weeks.length) {
                setCurrentWeekIndex(nextIndex);

                const week = weeks[nextIndex];
                const mid = week[3].date;

                setCurrentMonth(new Date(mid.getFullYear(), mid.getMonth(), 1));
            }
        }

        if (dir === "prev") {
            const prevIndex = currentWeekIndex - 1;

            if (prevIndex >= 0) {
                setCurrentWeekIndex(prevIndex);

                const week = weeks[prevIndex];
                const mid = week[3].date;

                setCurrentMonth(new Date(mid.getFullYear(), mid.getMonth(), 1));
            }
        }
    };


    const smoothScroll = (container, targetY, duration = 600) => {
        const startY = container.scrollTop;
        const distance = targetY - startY;
        let startTime = null;

        const easeInOut = (t) =>
            t < 0.5
                ? 2 * t * t
                : 1 - Math.pow(-2 * t + 2, 2) / 2;

        const animate = (time) => {
            if (!startTime) startTime = time;
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);

            container.scrollTop =
                startY + distance * easeInOut(progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    };

    const handleDayClick = (day) => {
        if (!day.isAvailable) return;

        setExpandedDateKey((prevKey) => {
            if (prevKey === day.key) return null;
            return day.key;
        });

        onDateSelect(day.date);

        // ✅ SCROLL AFTER CLICK
        requestAnimationFrame(() => {
            const container = scrollContainerRef?.current;
            const target = dayRefs.current[day.key];

            if (!container || !target) return;

            const containerRect = container.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();

            const offset = 16;

            const targetY =
                container.scrollTop +
                (targetRect.top - containerRect.top) -
                offset;

            container.scrollTo({
                top: targetY,
                behavior: "smooth",
            });
        });
    };

    // useEffect(() => {
    //     if (currentWeekIndex === 4 && weeks.length > 0) {
    //         setCurrentWeekIndex(weeks.length - 1);
    //     }
    // }, [weeks]);

    const currentWeek = weeks[currentWeekIndex] || [];

    const filteredSlots =
        selectedDate && isSameDay(selectedDate, today)
            ? slots.filter(slot => !isPastTimeSlot(slot, selectedDate))
            : slots;


    /* =========================
       RENDER
       ========================= */
    return (
        <div className="space-y-3">
            {/* MONTH NAV */}
            <div className="flex items-center justify-between">
                <button disabled={
                    currentMonth.getFullYear() === today.getFullYear() &&
                    currentMonth.getMonth() === today.getMonth()
                }
                    onClick={() => handleMonthChange("prev")}>
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-sm font-bold">
                    {currentMonth.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                    })}
                </div>
                <button onClick={() => handleMonthChange("next")}>
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* WEEK NAV */}
            <div className="flex items-center justify-between text-xs text-gray-500">
                <button
                    onClick={() => handleWeekChange("prev")}>
                    <ChevronLeft className="w-4 h-4" />
                </button>
                {currentWeek[0]?.date &&
                    `Week of ${currentWeek[0].date.toLocaleDateString("en-US", {
                        month: "numeric",
                        day: "numeric",
                        year: "2-digit",
                    })}`
                }
                <button
                    // disabled={currentWeekIndex === weeks.length - 1}
                    disabled={false}
                    onClick={() => handleWeekChange("next")}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* DAYS */}
            {loadingCalendar ? (
                <div className="text-center py-6">
                    <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
            ) : (
                currentWeek.map((day) => {
                    const expanded =
                        expandedDateKey === day.key &&
                        selectedDate?.toDateString() === day.date.toDateString();

                    return (
                        <div
                            key={day.key}
                            ref={(el) => {
                                if (el) dayRefs.current[day.key] = el;
                            }}
                            className="border rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() => handleDayClick(day)}
                                disabled={!day.isAvailable}
                                className={`w-full p-3 flex justify-between ${day.isAvailable ? "hover:bg-green-50" : "bg-gray-100 text-gray-400"
                                    }`}
                            >
                                <div>
                                    <div className="font-semibold">{day.dayName}</div>
                                    <div className="text-xs text-gray-500">{day.label}</div>
                                </div>
                                <div className="font-semibold">
                                    {day.isDayOff ? "OFF" : day.timeLabel}
                                </div>
                            </button>

                            {expanded && (
                                <div className="p-3 bg-gray-50 border-t">
                                    {loadingTimeSlots ? (
                                        <div className="text-center py-2">
                                            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                        </div>
                                    ) : filteredSlots.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {filteredSlots.map((slot, index) => {
                                                const isValid = canFitAppointment(index, filteredSlots);

                                                return (
                                                    <button
                                                        key={slot}
                                                        disabled={!isValid}
                                                        onClick={() => isValid && onTimeSelect(slot)}
                                                        className={`p-2 text-xs rounded-lg ${!isValid
                                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                            : selectedTime === slot
                                                                ? "bg-orange-500 text-white"
                                                                : "bg-white border"
                                                            }`}
                                                    >
                                                        {formatTime(slot)}
                                                    </button>
                                                );
                                            })}

                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock className="w-4 h-4" />
                                            {selectedDate && isSameDay(selectedDate, today)
                                                ? "No upcoming slots today"
                                                : "No slots available"}

                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}
