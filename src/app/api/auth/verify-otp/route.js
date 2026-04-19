// app/api/auth/verify-otp/route.js

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request) {
  try {
    await connectDB();

    const { email, phonenumber, otp } = await request.json();

    if (!email || !phonenumber || !otp) {
      return NextResponse.json(
        { success: false, message: "Missing fields" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email, phonenumber });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    let isVerified = false;

    // ✅ STATIC OTP (DEV)
    if (otp === "123456") {
      isVerified = true;
    } else {
      // ✅ TWILIO VERIFY
      const verificationCheck = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({
          to: `+1${phonenumber}`,
          code: otp,
        });

      if (verificationCheck.status !== "approved") {
        return NextResponse.json(
          { success: false, message: "Invalid OTP" },
          { status: 400 }
        );
      }

      isVerified = true;
    }

    // ✅ Update user
    user.isVerified = true;
    await user.save();

    // ✅ RETURN DIRECT ADDRESS (NO lastAddress nonsense)
    return NextResponse.json(
      {
        success: true,
        message: "OTP verified successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phonenumber: user.phonenumber,
          isVerified: true,

          // 🔥 DIRECT FIELDS (THIS IS THE FIX)
          fullAddress: user.fullAddress || "",
          city: user.city || "",
          state: user.state || "",
          zip: user.zip || "",
          lat: user.lat || "",
          lon: user.lon || "",
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error verifying OTP:", error);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}