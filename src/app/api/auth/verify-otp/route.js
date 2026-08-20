import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import PendingRegistration from "@/models/PendingRegistration";

export async function POST(request) {
    try {
        await connectDB();

        const {
            email,
            phonenumber,
            otp,
            clientType,
        } = await request.json();

        if (
            !email ||
            !phonenumber ||
            !otp ||
            !clientType
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Missing fields",
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
                        message: "User not found",
                    },
                    { status: 404 }
                );
            }

            // ========================================================
            // DEVELOPMENT OTP
            // ========================================================

            let isVerified = false;

            if (otp === "123456") {
                isVerified = true;
            } else {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Invalid security code. Please enter the correct code.",
                    },
                    { status: 400 }
                );
            }

            if (!isVerified) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Invalid security code.",
                    },
                    { status: 400 }
                );
            }

            // ========================================================
            // MARK USER VERIFIED
            // ========================================================

            user.isVerified = true;
            user.otp = undefined;
            user.otpExpires = undefined;

            await user.save();

            // ========================================================
            // RETURN EXISTING USER
            // ========================================================

            return NextResponse.json(
                {
                    success: true,
                    message:
                        "OTP verified successfully",

                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        phonenumber:
                            user.phonenumber,

                        isVerified: true,

                        fullAddress:
                            user.fullAddress || "",

                        city:
                            user.city || "",

                        state:
                            user.state || "",

                        zip:
                            user.zip || "",

                        lat:
                            user.lat || "",

                        lon:
                            user.lon || "",

                        simplyBookClientId:
                            user.simplyBookClientId ||
                            null,
                    },
                },
                { status: 200 }
            );
        }

        // ============================================================
        // NEW CLIENT
        //
        // IMPORTANT:
        //
        // OTP verification ONLY verifies the pending registration.
        //
        // NO USER IS CREATED HERE.
        // NO SIMPLYBOOK CLIENT IS CREATED HERE.
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

            // ========================================================
            // DEVELOPMENT OTP
            // ========================================================

            let isVerified = false;

            if (otp === "123456") {
                isVerified = true;
            } else {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Invalid security code. Please enter the correct code.",
                    },
                    { status: 400 }
                );
            }

            if (!isVerified) {
                return NextResponse.json(
                    {
                        success: false,
                        message:
                            "Invalid security code.",
                    },
                    { status: 400 }
                );
            }

            // ========================================================
            // MARK PENDING REGISTRATION AS VERIFIED
            // ========================================================

            pending.otpVerified = true;

            await pending.save();

            // ========================================================
            // DO NOT CREATE USER HERE
            // ========================================================

            return NextResponse.json(
                {
                    success: true,
                    message:
                        "OTP verified successfully",

                    user: {
                        email:
                            pending.email,

                        phonenumber:
                            pending.phonenumber,

                        isVerified: true,
                    },
                },
                { status: 200 }
            );
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
            "Error verifying OTP:",
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