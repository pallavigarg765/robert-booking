import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import {
    ChevronsLeft,
    ChevronsRight
} from "lucide-react";
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
    const [viewMode, setViewMode] = useState("weekNav");

    const [lastWeekAnchor, setLastWeekAnchor] = useState(null);
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


    const buildMonthGrid = (monthDate) => {
        if (!workCalandar) return [];
        const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

        const startDay = (start.getDay() + 6) % 7; // make Monday first
        const daysInMonth = end.getDate();

        const grid = [];
        let week = [];

        // empty cells before month starts
        for (let i = 0; i < startDay; i++) {
            week.push(null);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
            const key = getLocalDateKey(date);
            const dayInfo = workCalandar?.[key];
            const isDayOff =
                !dayInfo ||
                dayInfo.is_day_off === 1 ||
                dayInfo.is_day_off === "1" ||
                dayInfo.is_day_off === true;

            const isPast = date < today;

            week.push({
                date,
                key,
                isAvailable: !isDayOff && !isPast,
                isPast,
            });

            if (week.length === 7) {
                grid.push(week);
                week = [];
            }
        }

        if (week.length) grid.push(week);

        return grid;
    };

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
        for (let w = 0; w < 52; w++) {
            const week = [];

            for (let d = 0; d < 7; d++) {
                const date = new Date(cursor);
                date.setHours(0, 0, 0, 0);

                const key = getLocalDateKey(date);
                const dayInfo = workCalandar?.[key];
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


    const findWeekIndexByDate = (date) => {
        return weeks.findIndex(week =>
            week.some(day =>
                day.date.getFullYear() === date.getFullYear() &&
                day.date.getMonth() === date.getMonth() &&
                day.date.getDate() === date.getDate()
            )
        );
    };

    /* =========================
       HANDLERS
       ========================= */
    const handleMonthChange = (dir) => {
        let tempMonth = new Date(currentMonth);

        while (true) {
            if (dir === "prev") {
                tempMonth.setMonth(tempMonth.getMonth() - 1);
            } else {
                tempMonth.setMonth(tempMonth.getMonth() + 1);
            }

            // Stop if out of range (safety)
            const yearDiff = Math.abs(tempMonth.getFullYear() - today.getFullYear());
            if (yearDiff > 2) return;

            // Check if this month has any available day
            const daysInMonth = new Date(
                tempMonth.getFullYear(),
                tempMonth.getMonth() + 1,
                0
            ).getDate();

            let hasAvailable = false;

            for (let d = 1; d <= daysInMonth; d++) {
                const date = new Date(
                    tempMonth.getFullYear(),
                    tempMonth.getMonth(),
                    d
                );

                const key = getLocalDateKey(date);
                const dayInfo = workCalandar?.[key];

                const isDayOff =
                    !dayInfo ||
                    dayInfo.is_day_off === 1 ||
                    dayInfo.is_day_off === "1" ||
                    dayInfo.is_day_off === true;

                const isPast = date < today;

                if (!isDayOff && !isPast) {
                    hasAvailable = true;
                    break;
                }
            }

            if (hasAvailable) {
                setCurrentMonth(new Date(tempMonth));

                // Select first available date in that month
                for (let d = 1; d <= daysInMonth; d++) {
                    const date = new Date(
                        tempMonth.getFullYear(),
                        tempMonth.getMonth(),
                        d
                    );

                    const key = getLocalDateKey(date);
                    const dayInfo = workCalandar?.[key];

                    const isDayOff =
                        !dayInfo ||
                        dayInfo.is_day_off === 1 ||
                        dayInfo.is_day_off === "1" ||
                        dayInfo.is_day_off === true;

                    const isPast = date < today;

                    if (!isDayOff && !isPast) {
                        onDateSelect(date);

                        // ✅ FIX: sync week index
                        // const newWeekIndex = findWeekIndexByDate(date);
                        // if (newWeekIndex !== -1) {
                        //     setCurrentWeekIndex(newWeekIndex);
                        // }

                        break;
                    }
                }

                setExpandedDateKey(null);
                break;
            }
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
        const base = new Date(selectedDate || today);
        base.setHours(0, 0, 0, 0);

        const day = base.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;

        const currentMonday = new Date(base);
        currentMonday.setDate(base.getDate() + diffToMonday);

        let targetMonday = new Date(currentMonday);

        if (dir === "next") {
            targetMonday.setDate(currentMonday.getDate() + 7);
        }

        if (dir === "prev") {
            // ✅ KEY FIX
            if (!isSameDay(base, currentMonday)) {
                // If not already Monday → go to same week's Monday
                targetMonday = currentMonday;
            } else {
                // If already Monday → go to previous week
                targetMonday.setDate(currentMonday.getDate() - 7);
            }
        }

        // ❌ Prevent going before current month
        // ✅ Prevent going to a week that is completely in the past
        const endOfTargetWeek = new Date(targetMonday);
        endOfTargetWeek.setDate(targetMonday.getDate() + 6);

        if (endOfTargetWeek < today) return;
        // ✅ Now find first available day inside that week
        let selectedDay = null;

        for (let i = 0; i < 7; i++) {
            const checkDate = new Date(targetMonday);
            checkDate.setDate(targetMonday.getDate() + i);

            const key = getLocalDateKey(checkDate);
            const dayInfo = workCalandar?.[key];

            const isDayOff =
                !dayInfo ||
                dayInfo.is_day_off === 1 ||
                dayInfo.is_day_off === "1" ||
                dayInfo.is_day_off === true;

            const isPast = checkDate < today;

            if (!isDayOff && !isPast) {
                selectedDay = checkDate;
                break;
            }
        }

        if (!selectedDay) return;

        onDateSelect(selectedDay);

        setCurrentMonth(
            new Date(
                selectedDay.getFullYear(),
                selectedDay.getMonth(),
                1
            )
        );

        setExpandedDateKey(null);
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

        onDateSelect(day.date);

        setExpandedDateKey((prevKey) =>
            prevKey === day.key ? null : day.key
        );

        setViewMode("day");


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


    const displayWeek = (() => {
        const baseDate = selectedDate || today;
        const result = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(baseDate);
            date.setDate(baseDate.getDate() + i);

            const key = getLocalDateKey(date);
            const dayInfo = workCalandar?.[key];

            const isDayOff =
                !dayInfo ||
                dayInfo.is_day_off === 1 ||
                dayInfo.is_day_off === "1" ||
                dayInfo.is_day_off === true;

            const isPast = date < today;

            result.push({
                key,
                date,
                label: date.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                }),
                isAvailable: !isDayOff && !isPast,
                isDayOff,
                timeLabel: resolveTimeRange(dayInfo),
            });
        }

        return result;
    })();

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
                <div className="flex gap-2">

                    {/* Previous Month */}
                    <button
                        onClick={() => handleMonthChange("prev")}
                    >
                        <ChevronsLeft className="w-5 h-5" />
                    </button>

                    {/* Previous Week */}
                    <button
                        onClick={() => handleWeekChange("prev")}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                </div>

                <div className="text-sm font-bold">
                    {currentMonth.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                    })}
                </div>

                <div className="flex gap-2">

                    {/* Next Week */}
                    <button
                        onClick={() => handleWeekChange("next")}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Next Month */}
                    <button
                        onClick={() => handleMonthChange("next")}
                    >
                        <ChevronsRight className="w-5 h-5" />
                    </button>

                </div>
            </div>

            {/* CALENDAR GRID */}
            <div className="border rounded-xl p-3 bg-white">
                <div className="grid grid-cols-7 text-xs text-gray-400 mb-2 text-center">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                        <div key={d}>{d}</div>
                    ))}
                </div>

                {buildMonthGrid(currentMonth).map((week, i) => (
                    <div key={i} className="grid grid-cols-7 text-center mb-1">
                        {week.map((day, j) => {
                            if (!day) return <div key={j}></div>;

                            const isSelected =
                                selectedDate &&
                                isSameDay(selectedDate, day.date);

                            const isToday = isSameDay(day.date, today);
                            return (
                                <button
                                    key={day.key}
                                    disabled={!day.isAvailable}
                                    onClick={() => onDateSelect(day.date)}   // only highlight
                                    onDoubleClick={() =>
                                        handleDayClick({
                                            ...day,
                                            dayName: day.date.toLocaleDateString("en-US", { weekday: "short" }),
                                            label: day.date.toLocaleDateString("en-US", {
                                                weekday: "long",
                                                month: "short",
                                                day: "numeric",
                                            }),
                                            timeLabel: "",
                                        })
                                    }
                                    className={`p-2 text-sm rounded-full
    ${day.isPast ? "text-gray-300" : ""}
    ${!day.isAvailable ? "text-gray-400" : ""}
    ${isSelected ? "bg-orange-500 text-white" : ""}
 ${!isSelected && isToday ? "bg-orange-100 text-orange-600 font-semibold" : ""}
`}
                                >
                                    {day.date.getDate()}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* WEEK NAV */}
            {/* <div className="flex items-center justify-between text-xs text-gray-500">
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
            </div> */}

            {/* DAYS */}
            {loadingCalendar ? (
                <div className="text-center py-6">
                    <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
            ) : (
                displayWeek.map((day) => {
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
                                // onDoubleClick={() => handleDayClick(day)}
                                disabled={!day.isAvailable}
                                className={`w-full p-3 flex justify-between ${day.isAvailable ? "hover:bg-green-50" : "bg-gray-100 text-gray-400"
                                    }`}
                            >
                                <div>
                                    {/* <div> */}
                                    <div className="font-semibold">{day.label}</div>
                                    {/* </div> */}
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
