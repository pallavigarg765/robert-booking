import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import User from "@/models/User";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim();

    // Escape user input before using it in a regular expression.
    const escapedEmail = email?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const filter = email
      ? { email: { $regex: `^${escapedEmail}$`, $options: "i" } }
      : {};

    const [bookings, totalBookings] = await Promise.all([
      Booking.find(filter).sort({ createdAt: -1 }).lean(),
      Booking.countDocuments({}),
    ]);

    console.log("Bookings GET diagnostics:", {
      requestedEmail: email || "(no email filter)",
      totalBookings,
      matchingBookings: bookings.length,
      database: Booking.db.name,
      collection: Booking.collection.name,
    });

    return NextResponse.json({
      success: true,
      totalBookings,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch bookings",
        data: [],
      },
      { status: 500 }
    );
  }
}


export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    // 1. Extract and normalize request data
    const {
      fullname,
      email,
      phonenumber,
      provider,
      date,
      time,
      clientaddress,
      services = {},
    } = body;

    const normalizedFullname =
      typeof fullname === "string" ? fullname.trim() : "";

    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    const normalizedPhone =
      typeof phonenumber === "string" || typeof phonenumber === "number"
        ? String(phonenumber).trim()
        : "";

    // 2. Validate required fields
    const missingFields = [];

    if (!normalizedFullname) missingFields.push("fullname");
    if (!normalizedEmail) missingFields.push("email");
    if (!normalizedPhone) missingFields.push("phonenumber");
    if (!provider) missingFields.push("provider");
    if (!date) missingFields.push("date");
    if (!time) missingFields.push("time");

    if (missingFields.length > 0) {
      return Response.json(
        {
          success: false,
          message: "Please provide all required booking fields.",
          missingFields,
        },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return Response.json(
        {
          success: false,
          message: "Please provide a valid email address.",
        },
        { status: 400 }
      );
    }

    // Validate address without rejecting valid 0 coordinates
    if (
      !clientaddress ||
      typeof clientaddress.fullAddress !== "string" ||
      !clientaddress.fullAddress.trim() ||
      clientaddress.lat == null ||
      clientaddress.lon == null ||
      !Number.isFinite(Number(clientaddress.lat)) ||
      !Number.isFinite(Number(clientaddress.lon)) ||
      Number(clientaddress.lat) < -90 ||
      Number(clientaddress.lat) > 90 ||
      Number(clientaddress.lon) < -180 ||
      Number(clientaddress.lon) > 180
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Please provide a valid address with latitude and longitude.",
        },
        { status: 400 }
      );
    }

    if (
      typeof services !== "object" ||
      services === null ||
      Array.isArray(services)
    ) {
      return Response.json(
        {
          success: false,
          message: "The services field must be an object.",
        },
        { status: 400 }
      );
    }

    // 3. Find or create the user
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      user.name = normalizedFullname;
      user.phone = normalizedPhone;
      user.address = clientaddress.fullAddress.trim();
      await user.save();
    } else {
      user = await User.create({
        name: normalizedFullname,
        email: normalizedEmail,
        phone: normalizedPhone,
        address: clientaddress.fullAddress.trim(),
      });
    }

    console.log("[Booking POST] User resolved:", {
      userId: String(user._id),
      email: normalizedEmail,
    });

    // 4. Normalize service data into a plain object
    const servicesMap = { ...services };

    // 5. Create the booking
    const booking = await Booking.create({
      fullname: normalizedFullname,
      email: normalizedEmail,
      phonenumber: normalizedPhone,
      provider,
      date,
      time,
      clientaddress: {
        ...clientaddress,
        fullAddress: clientaddress.fullAddress.trim(),
        lat: Number(clientaddress.lat),
        lon: Number(clientaddress.lon),
      },
      services: servicesMap,
      userId: user._id,
    });

    console.log("[Booking POST] Booking created successfully:", {
      bookingId: String(booking._id),
      database: Booking.db.name,
      collection: Booking.collection.name,
      email: normalizedEmail,
      provider: String(provider),
    });

    // 6. Return the created booking
    return Response.json(
      {
        success: true,
        message: "Booking created successfully.",
        booking: booking.toObject(),
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Booking POST] Failed to create booking:", {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      database: Booking?.db?.name,
      collection: Booking?.collection?.name,
    });

    return Response.json(
      {
        success: false,
        message: "Failed to create booking.",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "An unexpected server error occurred.",
      },
      { status: 500 }
    );
  }
}
