// app/api/auth/verify-otp/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request) {
  try {
    await connectDB();
    const { email, phonenumber, otp } = await request.json();

    // Validation
      if (!email || !phonenumber || !otp) {
      return NextResponse.json(
        { success: false, data: [] },
        { status: 200 }
      );
    }

    // Find user
    const user = await User.findOne({ email, phonenumber });

    if (!user) {
      return NextResponse.json(
        { success: false, data: [] },
        { status: 200 }
      );
    }

    // Check if OTP exists and is not expired
    if (!user.otp || !user.otpExpires) {
      return NextResponse.json(
        { success: false, data: [] },
        { status: 200 }
      );
    }

    if (user.otpExpires < new Date()) {
      return NextResponse.json(
        { success: false, data: [] },
        { status: 200 }
      );
    }

    // Verify OTP (for testing, 1234 is accepted)
    if (user.otp !== otp) {
      return NextResponse.json(
        { success: false, data: [] },
        { status: 200 }
      );
    }

    // OTP is valid — mark as verified
    user.otp = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    await user.save();

    // ✅ Get last pushed address (if any)
    const lastAddress =
      user.address && user.address.length > 0
        ? user.address[user.address.length - 1]
        : null;

    return NextResponse.json(
      {
        success: true,
        message: "OTP verified successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phonenumber: user.phonenumber,
          isVerified: user.isVerified,
          lastAddress, // 👈 include the latest address here
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying OTP:", error);
   return NextResponse.json(
      { success: false, data: [] },
      { status: 200 }
    );
  }
}
