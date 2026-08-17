import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PendingRegistration from "@/models/PendingRegistration";
import { generateOTP, sendOTPEmail } from "@/lib/otpUtils";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      fullname,
      email,
      phonenumber,
      fullAddress,
      city,
      state,
      zip,
    } = body;

    if (
      !fullname ||
      !email ||
      !phonenumber ||
      !fullAddress ||
      !city ||
      !state ||
      !zip
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "All registration fields are required",
        },
        { status: 400 }
      );
    }

    const lowerEmail =
      email.toLowerCase().trim();

    const normalizedPhone =
      phonenumber.replace(/\D/g, "");

    // ============================================================
    // GENERATE OTP
    // ============================================================

    const otp = generateOTP();

    const otpExpires =
      new Date(
        Date.now() + 10 * 60 * 1000
      );

    // ============================================================
    // REMOVE OLD PENDING REGISTRATION
    // ============================================================

    await PendingRegistration.deleteOne({
      email: lowerEmail,
    });

    // ============================================================
    // CREATE PENDING REGISTRATION
    // ============================================================

    await PendingRegistration.create({
      name: fullname.trim(),
      email: lowerEmail,
      phonenumber: normalizedPhone,
      fullAddress: fullAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
      otp,
      otpExpires,
    });

    // ============================================================
    // SEND OTP
    // ============================================================

    // DEVELOPMENT:
    console.log(
      `New Client OTP for ${lowerEmail}: ${otp}`
    );

    // PRODUCTION:
    // await sendOTPEmail(lowerEmail, otp);

    return NextResponse.json({
      success: true,
      message: "Security code sent successfully",
      otpSent: true,
    });

  } catch (error) {

    console.error(
      "register-pending error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      { status: 500 }
    );
  }
}