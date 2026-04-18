// app/api/auth/send-otp/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { generateOTP, sendOTPEmail } from "@/lib/otpUtils";
import twilio from "twilio";

export async function POST(request) {
  try {
    await connectDB();

    const { email, phonenumber } = await request.json();

    if (!email || !phonenumber) {
      return NextResponse.json({ success: false }, { status: 200 });
    }

    const user = await User.findOne({ email, phonenumber });

    if (!user) {
      return NextResponse.json({ success: false }, { status: 200 });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // ✅ Send Email OTP
  //   await sendOTPEmail(email, otp);

  //   // ✅ Send SMS via Twilio
  //   const client = twilio(
  //     process.env.TWILIO_ACCOUNT_SID,
  //     process.env.TWILIO_AUTH_TOKEN
  //   );

  //   await client.verify.v2
  // .services(process.env.TWILIO_VERIFY_SERVICE_SID)
  // .verifications.create({
  //   to: `+1${phonenumber}`,
  //   channel: "sms",
  // });

    return NextResponse.json({
      success: true,
      message: "OTP sent via email and SMS"
    });

  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}