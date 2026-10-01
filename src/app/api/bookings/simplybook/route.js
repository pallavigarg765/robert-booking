import { NextResponse } from "next/server";

import {
  bookSimplyBook,
  bookMultipleSimplyBookServices,
  getAvailableTimeSlots,
  getSimplyBookClientByEmail,
} from "../../../utils/simplybook";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      action = "book",
      eventId,
      performerId,
      date,
      time,
      clientData,
      additional = {},
      services,
    } = body;

    // Check availability without creating a booking.
    if (action === "availability") {
      const result = await getAvailableTimeSlots({
        eventId,
        performerId,
        fromDate: date,
        toDate: date,
        count: 1,
      });

      return NextResponse.json({
        success: true,
        availability: result,
      });
    }

    // Validate customer details before booking.
    if (
      !clientData?.name ||
      !clientData?.email ||
      !clientData?.phone
    ) {
      throw new Error(
        "Client name, email and phone are required"
      );
    }

    // Retrieve the customer's SimplyBook authorization
    // from the server, rather than trusting browser input.
    const clientAuth = await getSimplyBookClientByEmail(
      clientData.email
    );

    if (!clientAuth?.clientId || !clientAuth?.clientHash) {
      throw new Error(
        "This customer is not linked to a SimplyBook client, " +
          "or their authorization details are unavailable."
      );
    }

    // Book multiple services consecutively.
    if (action === "bookMultiple") {
      const result = await bookMultipleSimplyBookServices({
        services,
        performerId,
        date,
        startTime: time,
        clientData,
        clientAuth,
        additional,
      });

      return NextResponse.json({
        success: true,
        bookings: result,
      });
    }

    // Default: book one service.
    const result = await bookSimplyBook({
      eventId,
      performerId,
      date,
      time,
      clientData,
      clientAuth,
      additional,
    });

    return NextResponse.json({
      success: true,
      booking: result,
    });
  } catch (error) {
    console.error("SimplyBook booking error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to process SimplyBook booking",
      },
      { status: 400 }
    );
  }
}