
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import User from "@/models/User";

import {
  bookSimplyBook,
  bookMultipleSimplyBookServices,
  getAvailableTimeSlots,
  getSimplyBookClientByEmail,
} from "../../../utils/simplybook";

export const runtime = "nodejs";

function normalizeEmail(email) {
  return typeof email === "string"
    ? email.trim().toLowerCase()
    : "";
}

async function saveBookingToMongoDB({
  clientData,
  performerId,
  date,
  time,
  services,
  result,
  clientaddress,
}) {
  await connectDB();

  const email = normalizeEmail(clientData.email);

  // Find or create the customer.
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name: clientData.name.trim(),
      email,
      phone: clientData.phone.trim(),
      address: clientaddress?.fullAddress || "",
    });
  } else {
    user.name = clientData.name.trim();
    user.phone = clientData.phone.trim();

    if (clientaddress?.fullAddress) {
      user.address = clientaddress.fullAddress;
    }

    await user.save();
  }

  // Keep the service names and IDs for the previous-bookings UI.
  
const savedServices = Array.isArray(services)
  ? Object.fromEntries(
      services.map((service) => [
        String(service.eventId),
        true,
      ])
    )
  : {};


  const booking = await Booking.create({
    fullname: clientData.name.trim(),
    email,
    phonenumber: clientData.phone.trim(),

    // This is the SimplyBook provider/unit ID.
    provider: String(performerId),

    date,
    time,

    clientaddress: {
  fullAddress: clientaddress?.fullAddress?.trim() || "",
  ...(clientaddress?.lat != null
    ? { lat: Number(clientaddress.lat) }
    : {}),
  ...(clientaddress?.lon != null
    ? { lon: Number(clientaddress.lon) }
    : {}),
  city: clientaddress?.city?.trim() || "",
  state: clientaddress?.state?.trim() || "",
  zip: clientaddress?.zip?.trim() || "",
},

    services: savedServices,
    userId: user._id,

    // Keep the original SimplyBook response for reference.
    simplybookResponse: result,
  });

  console.log("[SimplyBook] Booking saved to MongoDB:", {
    bookingId: String(booking._id),
    email,
    provider: String(performerId),
    database: Booking.db.name,
    collection: Booking.collection.name,
  });

  return booking;
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();

    const {
      action = "book",
      eventId,
      performerId,
      date,
      time,
      clientData,
      additional = {},
      services = [],
      clientaddress,
    } = body;

    // Availability checks must not create local booking records.
    if (action === "availability") {
      const availability = await getAvailableTimeSlots({
        eventId,
        performerId,
        fromDate: date,
        toDate: date,
        count: 1,
      });

      return NextResponse.json({
        success: true,
        availability,
      });
    }

    if (
      !clientData?.name?.trim() ||
      !clientData?.email?.trim() ||
      !clientData?.phone?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Client name, email and phone are required.",
        },
        { status: 400 }
      );
    }

    if (!performerId || !date || !time) {
      return NextResponse.json(
        {
          success: false,
          message: "Provider, date and time are required.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(clientData.email);

    // Get the customer's SimplyBook authorization.
    const clientAuth =
      await getSimplyBookClientByEmail(normalizedEmail);

    if (!clientAuth?.clientId || !clientAuth?.clientHash) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The customer is not linked to a SimplyBook client, " +
            "or their authorization details are unavailable.",
        },
        { status: 400 }
      );
    }

    let simplyBookResult;
    let selectedServices = [];

    // Create the appointment(s) in SimplyBook first.
    if (action === "bookMultiple") {
      if (!Array.isArray(services) || services.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "At least one service is required.",
          },
          { status: 400 }
        );
      }

      selectedServices = services;

      simplyBookResult = await bookMultipleSimplyBookServices({
        services,
        performerId,
        date,
        startTime: time,
        clientData: {
          ...clientData,
          email: normalizedEmail,
        },
        clientAuth,
        additional,
      });
    } else if (action === "book") {
      if (!eventId) {
        return NextResponse.json(
          {
            success: false,
            message: "A service/event ID is required.",
          },
          { status: 400 }
        );
      }

      selectedServices = [
        {
          eventId: Number(eventId),
          name:
            services?.[0]?.name ||
            `Service ${eventId}`,
          duration: Number(services?.[0]?.duration || 60),
          price: services?.[0]?.price ?? null,
        },
      ];

      simplyBookResult = await bookSimplyBook({
        eventId,
        performerId,
        date,
        time,
        clientData: {
          ...clientData,
          email: normalizedEmail,
        },
        clientAuth,
        additional,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Unsupported action: ${action}`,
        },
        { status: 400 }
      );
    }

    // SimplyBook has successfully created the appointment(s).
    // Now persist a local record for the previous-bookings UI.
    try {
      const localBooking = await saveBookingToMongoDB({
        clientData: {
          ...clientData,
          email: normalizedEmail,
        },
        performerId,
        date,
        time,
        services: selectedServices,
        result: simplyBookResult,
        clientaddress,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Booking created successfully.",
          booking: simplyBookResult,
          localBookingId: String(localBooking._id),
          localRecordSaved: true,
        },
        { status: 200 }
      );
    } catch (dbError) {
      // The external booking already exists. Do not report that the
      // appointment failed, as the customer might submit it again.
      console.error(
        "[SimplyBook] Appointment created, but MongoDB save failed:",
        {
          message: dbError?.message,
          name: dbError?.name,
          stack: dbError?.stack,
          database: Booking.db?.name,
          collection: Booking.collection?.name,
          email: normalizedEmail,
        }
      );

      return NextResponse.json(
        {
          success: true,
          message:
            "The appointment was created in SimplyBook, but its local history record could not be saved.",
          booking: simplyBookResult,
          localRecordSaved: false,
          persistenceWarning:
            "Check the server logs and Booking schema.",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("[SimplyBook] Booking request failed:", {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to process the SimplyBook booking.",
      },
      { status: 500 }
    );
  }
}
