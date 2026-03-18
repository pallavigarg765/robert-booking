import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import User from "@/models/User";

export async function GET(request) {
  try {
    await connectDB();

    // Get search params from URL
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email"); // optional

    let filter = {};
    if (email) {
      filter.email = email; // filter by email if provided
    }

    // Find and sort by most recent first
    const bookings = await Booking.find(filter).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        count: bookings.length,
        data: bookings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching bookings:", error);
   return NextResponse.json(
      { success: false, data: [] },
      { status: 200 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

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

    // Validation
    if (
      !fullname ||
      !email ||
      !phonenumber ||
      !provider ||
      !date ||
      !time ||
      !clientaddress?.fullAddress ||
      !clientaddress?.lat ||
      !clientaddress?.lon
    ) {
        return NextResponse.json(
        { success: false, data: [] },
        { status: 200 }
      );
    }

    // Check if user exists, if not create new user
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user with the first address from booking
      user = await User.create({
        name: fullname,
        email: email,
        phonenumber,
        address: [
          {
            fullAddress: clientaddress.fullAddress,
            lat: clientaddress.lat,
            lon: clientaddress.lon,
            city: clientaddress.city || "",
            state: clientaddress.state || "",
          },
        ],
      });
    } else {
      // Update user name if different
      if (user.name !== fullname) {
        user.name = fullname;
      }

      // Check if this address already exists
      const existingIndex = user.address.findIndex(
        (addr) => addr.fullAddress === clientaddress.fullAddress
      );

      if (existingIndex > -1) {
        // Move existing address to top
        const [existingAddress] = user.address.splice(existingIndex, 1);
        user.address.unshift(existingAddress);
      } else {
        // Add new address to top
        user.address.unshift({
          fullAddress: clientaddress.fullAddress,
          lat: clientaddress.lat,
          lon: clientaddress.lon,
          city: clientaddress.city || "",
          state: clientaddress.state || "",
        });
      }

      await user.save();
    }

    // Convert services object to Map for MongoDB
    const servicesMap = new Map(Object.entries(services));

    // Create booking with dynamic services
    const newBooking = await Booking.create({
      fullname,
      email,
      phonenumber,
      provider,
      date,
      time,
      clientaddress,
      services: servicesMap,
      userId: user._id, // link booking to user
    });

    // Convert Map back to object for response
    const bookingResponse = newBooking.toObject();
    bookingResponse.services = Object.fromEntries(servicesMap);

    return NextResponse.json(
      {
        success: true,
        message: "Booking created successfully",
        booking: bookingResponse,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating booking:", error);
     return NextResponse.json(
      { success: false, data: [] },
      { status: 200 }
    );
  }
}