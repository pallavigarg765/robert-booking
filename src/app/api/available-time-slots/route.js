import { getAvailableTimeSlots } from "../../utils/simplybook";

function normalizeIntervals(result, date, performerId) {
  if (!result) {
    return [];
  }

  let value = result;

  // Result:
  // {
  //   "2026-10-06": {
  //      "123": [
  //         ["09:00:00", "13:00:00"],
  //         ["14:00:00", "17:00:00"]
  //      ]
  //   }
  // }
  if (result?.[date]) {
    value = result[date];

    if (
      performerId &&
      value &&
      !Array.isArray(value) &&
      value[performerId] !== undefined
    ) {
      value = value[performerId];
    }
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((interval) => {
      // ["09:00:00", "13:00:00"]
      if (Array.isArray(interval) && interval.length >= 2) {
        return {
          from: String(interval[0]).substring(0, 5),
          to: String(interval[1]).substring(0, 5),
        };
      }

      // {
      //   from: "09:00",
      //   to: "13:00"
      // }
      if (
        interval &&
        typeof interval === "object" &&
        interval.from &&
        interval.to
      ) {
        return {
          from: String(interval.from).substring(0, 5),
          to: String(interval.to).substring(0, 5),
        };
      }

      return null;
    })
    .filter(
      (interval) =>
        interval?.from &&
        interval?.to
    );
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const eventId = searchParams.get("eventId");
    const performerId = searchParams.get("performerId");
    const date = searchParams.get("date");

    if (!eventId || !performerId || !date) {
      return Response.json(
        {
          success: false,
          data: [],
          message:
            "eventId, performerId and date are required",
        },
        { status: 400 }
      );
    }

    const result = await getAvailableTimeSlots({
      eventId,
      performerId,
      fromDate: date,
      toDate: date,
      count: 1,
    });

    const intervals = normalizeIntervals(
      result,
      date,
      performerId
    );

    return Response.json(
      {
        success: true,
        data: intervals,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Available time intervals error:",
      error
    );

    return Response.json(
      {
        success: false,
        data: [],
        message:
          error?.message ||
          "Unable to fetch availability",
      },
      { status: 500 }
    );
  }
}