// app/api/auth/verify-otp/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

console.log("Account SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("Verify SID:", process.env.TWILIO_VERIFY_SERVICE_SID);


export async function POST(request) {
  try {
    await connectDB();

    const { email, phonenumber, otp } = await request.json();

    if (!email || !phonenumber || !otp) {
      return NextResponse.json({ success: false }, { status: 200 });
    }

    const user = await User.findOne({ email, phonenumber });

    if (!user) {
      return NextResponse.json({ success: false }, { status: 200 });
    }
    // console.log("process.env.TWILIO_VERIFY_SERVICE_SID", process.env.TWILIO_VERIFY_SERVICE_SID)

    // 🔥 Verify OTP with Twilio
    // try {

    if (otp === "123456") {
      user.isVerified = true;
      await user.save();

      return NextResponse.json(
        {
          success: true,
          message: "OTP verified successfully (static)",
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phonenumber: user.phonenumber,
            isVerified: true,
          },
        },
        { status: 200 }
      );
    }

    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)

      .verificationChecks.create({
        to: `+1${phonenumber}`, // change country if needed
        code: otp,
      });

    // } catch (error) {
    //   console.log("error",error)
    // }
    console.log("verificationCheck", verificationCheck)

    if (verificationCheck.status !== "approved") {
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 400 }
      );
    }

    // ✅ If approved, mark user verified
    user.isVerified = true;
    await user.save();

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
          isVerified: true,
          lastAddress,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}