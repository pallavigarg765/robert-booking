import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import PendingRegistration from "@/models/PendingRegistration";
import { generateOTP } from "@/lib/otpUtils";
import twilio from "twilio";

export async function POST(request) {
    try {
        await connectDB();

        const {
            email,
            phonenumber,
            clientType,
        } = await request.json();

        if (!email || !phonenumber) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Email and phone number are required",
                },
                { status: 400 }
            );
        }

        const lowerEmail =
            email.toLowerCase().trim();

        const normalizedPhone =
            phonenumber.replace(/\D/g, "");

        // ============================================================
        // RETURNING CLIENT
        // ============================================================

        if (clientType === "returning") {
            const user = await User.findOne({
                email: lowerEmail,
                phonenumber: normalizedPhone,
            });

            if (!user) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Unable to find your account.",
                    },
                    { status: 404 }
                );
            }

            const otp = generateOTP();

            const otpExpires = new Date(
                Date.now() + 10 * 60 * 1000
            );

            user.otp = otp;
            user.otpExpires = otpExpires;

            await user.save();

            // ========================================================
            // EMAIL / SMS
            // ========================================================

            // await sendOTPEmail(lowerEmail, otp);

            // const client = twilio(
            //     process.env.TWILIO_ACCOUNT_SID,
            //     process.env.TWILIO_AUTH_TOKEN
            // );

            // await client.verify.v2
            //     .services(
            //         process.env.TWILIO_VERIFY_SERVICE_SID
            //     )
            //     .verifications.create({
            //         to: `+1${normalizedPhone}`,
            //         channel: "sms",
            //     });

            return NextResponse.json({
                success: true,
                message:
                    "OTP sent successfully",
            });
        }

        // ============================================================
        // NEW CLIENT
        // ============================================================

        if (clientType === "new") {
            const pending =
                await PendingRegistration.findOne({
                    email: lowerEmail,
                    phonenumber: normalizedPhone,
                });

            if (!pending) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Registration session not found. Please start again.",
                    },
                    { status: 404 }
                );
            }

            const otp = generateOTP();

            const otpExpires = new Date(
                Date.now() + 10 * 60 * 1000
            );

            pending.otp = otp;
            pending.otpExpires = otpExpires;
            pending.otpVerified = false;

            await pending.save();

            console.log(
                `New Client OTP for ${lowerEmail}: ${otp}`
            );

            // ========================================================
            // EMAIL / SMS
            // ========================================================

            // await sendOTPEmail(lowerEmail, otp);

            // const client = twilio(
            //     process.env.TWILIO_ACCOUNT_SID,
            //     process.env.TWILIO_AUTH_TOKEN
            // );

            // await client.verify.v2
            //     .services(
            //         process.env.TWILIO_VERIFY_SERVICE_SID
            //     )
            //     .verifications.create({
            //         to: `+1${normalizedPhone}`,
            //         channel: "sms",
            //     });

            return NextResponse.json({
                success: true,
                message:
                    "OTP sent successfully",
            });
        }

        return NextResponse.json(
            {
                success: false,
                message: "Invalid client type",
            },
            { status: 400 }
        );

    } catch (error) {
        console.error(
            "Error sending OTP:",
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