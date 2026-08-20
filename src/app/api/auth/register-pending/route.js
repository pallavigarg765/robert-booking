import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PendingRegistration from "@/models/PendingRegistration";
import { generateOTP } from "@/lib/otpUtils";

export async function POST(request) {
    try {
        await connectDB();

        const body = await request.json();

        const {
            mode = "start",

            fullname,
            email,
            phonenumber,

            fullAddress,
            city,
            state,
            zip,
        } = body;

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
        // START REGISTRATION
        //
        // This ONLY creates the temporary registration session.
        //
        // It does NOT create User.
        // It does NOT create SimplyBook client.
        // ============================================================

        if (mode === "start") {
            const otp = generateOTP();

            const otpExpires = new Date(
                Date.now() + 10 * 60 * 1000
            );

            // Remove any previous pending session
            // for this email.
            await PendingRegistration.deleteMany({
                email: lowerEmail,
            });

            const pending =
                await PendingRegistration.create({
                    name: "",
                    email: lowerEmail,
                    phonenumber: normalizedPhone,

                    fullAddress: "",
                    city: "",
                    state: "",
                    zip: "",

                    otp,
                    otpExpires,

                    otpVerified: false,
                });

            console.log(
                `New Client OTP for ${lowerEmail}: ${otp}`
            );

            return NextResponse.json(
                {
                    success: true,
                    message:
                        "Registration session created",
                    registrationId: pending._id,
                    otpSent: true,
                },
                { status: 200 }
            );
        }

        // ============================================================
        // UPDATE PROFILE
        //
        // This is optional compatibility support.
        //
        // It does NOT create the User.
        // ============================================================

        if (mode === "update-profile") {
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

            if (!pending.otpVerified) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Please verify your security code first.",
                    },
                    { status: 400 }
                );
            }

            if (
                !fullname ||
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

            pending.name =
                fullname.trim();

            pending.fullAddress =
                fullAddress.trim();

            pending.city =
                city.trim();

            pending.state =
                state.trim();

            pending.zip =
                zip.trim();

            await pending.save();

            return NextResponse.json(
                {
                    success: true,
                    message:
                        "Registration details updated",
                },
                { status: 200 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: "Invalid registration mode",
            },
            { status: 400 }
        );

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