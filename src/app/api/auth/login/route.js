// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { generateOTP, sendOTPEmail } from "@/lib/otpUtils";
import twilio from "twilio";

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();

        const { email, phonenumber } = body;

        if (!email || !phonenumber) {
            return NextResponse.json(
                { success: false, message: "Email and phone number are required" },
                { status: 400 }
            );
        }

        const lowerEmail = email.toLowerCase().trim();
        const normalizedPhone = phonenumber.replace(/\D/g, "");

        // 🔍 Check both independently
        const emailUser = await User.findOne({ email: lowerEmail });
        const phoneUser = await User.findOne({ phonenumber: normalizedPhone });

        // =============================
        // 🎯 SCENARIO 4 FIX
        // =============================
        // Email not found BUT phone exists
        if (!emailUser && phoneUser) {
            return NextResponse.json({
                success: true,
                scenario: "phone-exists-different-email",
                message:
                    "An account already exists with this phone number but under a different email.",
            });
        }

        // =============================
        // Scenario 1: New user
        // =============================
        if (!emailUser && !phoneUser) {
            return NextResponse.json({
                success: true,
                scenario: "new-user",
                loginAllowed: false,
            });
        }

        // =============================
        // Scenario 3: Email exists but phone incorrect
        // =============================
        if (emailUser && emailUser.phonenumber !== normalizedPhone) {
            return NextResponse.json({
                success: false,
                scenario: "wrong-phone",
                message: "Phone number is incorrect",
            });
        }

        // =============================
        // Scenario 2: Correct login
        // =============================
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        emailUser.otp = otp;
        emailUser.otpExpires = otpExpires;

        await emailUser.save();

        // ✅ Send Email OTP
        //   await sendOTPEmail(lowerEmail, otp);

        //   // ✅ Send SMS via Twilio
        //   const client = twilio(
        //     process.env.TWILIO_ACCOUNT_SID,
        //     process.env.TWILIO_AUTH_TOKEN
        //   );

        //   await client.verify.v2
        // .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        // .verifications.create({
        //   to: `+1${normalizedPhone}`,
        //   channel: "sms",
        // });

        return NextResponse.json({
            success: true,
            scenario: "login",
            otpSent: true,
        });

    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}