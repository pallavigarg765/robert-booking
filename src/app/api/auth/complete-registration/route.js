import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import PendingRegistration from "@/models/PendingRegistration";
import { addSimplyBookClient } from "../../../utils/simplybook";

export async function POST(request) {
    try {
        await connectDB();

        const {
            name,
            email,
            phonenumber,
            fullAddress,
            city,
            state,
            zip,
        } = await request.json();

        if (
            !name ||
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
        // FIND VERIFIED PENDING REGISTRATION
        // ============================================================

        const pending =
            await PendingRegistration.findOne({
                email: lowerEmail,
                phonenumber: normalizedPhone,
                otpVerified: true,
            });

        if (!pending) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Registration session not found or OTP has not been verified. Please start again.",
                },
                { status: 404 }
            );
        }

        // ============================================================
        // DOUBLE-CHECK EMAIL
        //
        // New client cannot use an existing email.
        // ============================================================

        const existingUser =
            await User.findOne({
                email: lowerEmail,
            });

        if (existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Account exists: Choose another email to create your account.",
                },
                { status: 409 }
            );
        }

        // ============================================================
        // UPDATE PENDING PROFILE
        // ============================================================

        pending.name = name.trim();
        pending.fullAddress =
            fullAddress.trim();
        pending.city = city.trim();
        pending.state = state.trim();
        pending.zip = zip.trim();

        await pending.save();

        // ============================================================
        // CREATE SIMPLYBOOK CLIENT
        // ============================================================

        let simplyBookClientId = null;

        try {
            const clientData = {
                name:
                    pending.name,

                email:
                    pending.email,

                phone:
                    `+1${pending.phonenumber}`,

                address1:
                    pending.fullAddress || "",

                address2:
                    pending.state || "",

                city:
                    pending.city || "",

                zip:
                    pending.zip || "",

                country_id: "US",
            };

            simplyBookClientId =
                await addSimplyBookClient(
                    clientData,
                    false
                );

        } catch (err) {
            console.error(
                "SimplyBook client creation failed:",
                err.message
            );
        }

        // ============================================================
        // CREATE ACTUAL USER
        // ============================================================

        const newUser =
            await User.create({
                name:
                    pending.name,

                email:
                    pending.email,

                phonenumber:
                    pending.phonenumber,

                fullAddress:
                    pending.fullAddress,

                city:
                    pending.city,

                state:
                    pending.state,

                zip:
                    pending.zip,

                simplyBookClientId,

                isVerified: true,
            });

        // ============================================================
        // DELETE PENDING REGISTRATION
        // ============================================================

        await PendingRegistration.deleteOne({
            _id: pending._id,
        });

        // ============================================================
        // RETURN CREATED USER
        // ============================================================

        return NextResponse.json(
            {
                success: true,

                message:
                    "Account created successfully",

                user: {
                    id:
                        newUser._id,

                    name:
                        newUser.name,

                    email:
                        newUser.email,

                    phonenumber:
                        newUser.phonenumber,

                    isVerified:
                        true,

                    fullAddress:
                        newUser.fullAddress || "",

                    city:
                        newUser.city || "",

                    state:
                        newUser.state || "",

                    zip:
                        newUser.zip || "",

                    lat:
                        newUser.lat || "",

                    lon:
                        newUser.lon || "",

                    simplyBookClientId:
                        newUser.simplyBookClientId ||
                        null,
                },
            },
            { status: 200 }
        );

    } catch (error) {
        console.error(
            "complete-registration error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Unable to create account. Please try again.",
            },
            { status: 500 }
        );
    }
}