import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req) {
  try {
    await connectDB();

    const {
      email,
      phonenumber,
      fullAddress,
      city,
      state,
      zip,
      lat,
      lon,
    } = await req.json();

    // ✅ Validate only required fields
    if (!email || !phonenumber) {
      return NextResponse.json(
        { success: false, message: "Email and phone are required" },
        { status: 400 }
      );
    }

    // 🔍 Find existing user (MUST exist)
    const user = await User.findOne({
      email: email.toLowerCase(),
      phonenumber,
    });

    // ❌ If user not found → something wrong in flow
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found. Please register first." },
        { status: 404 }
      );
    }

    // ✅ Update address (ONLY if not already saved)
    if (!user.fullAddress) {
      user.fullAddress = fullAddress;
      user.city = city;
      user.state = state;
      user.zip = zip;
      user.lat = lat;
      user.lon = lon;
    }

    // ✅ Always mark verified after OTP
    user.isVerified = true;

    await user.save();

    return NextResponse.json({
      success: true,
      message: "User details saved successfully",
      user,
    });

  } catch (error) {
    console.error("Save user details error:", error);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}