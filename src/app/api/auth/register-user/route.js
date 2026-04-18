import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { addSimplyBookClient } from "../../../utils/simplybook";

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
            selectedDate,
            selectedTime,
            services
        } = body;

        if (!fullname || !email || !phonenumber) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase(),
            phonenumber,
        });

        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "User already exists" },
                { status: 400 }
            );
        }

        // ✅ Combine address ONLY for SimplyBook
        const simplyBookAddress = [
            fullAddress,
            city,
            state,
            zip
        ].filter(Boolean).join(", ");

        // 🔥 STEP 1: Create in SimplyBook
        let simplyBookClientId = null;

        try {
            const clientData = {
                name: fullname,
                email: email.toLowerCase(),
                phone: `+1${phonenumber}`, // adjust country code if needed

                address1: fullAddress || "",
                address2: state || "", // optional
                city: city || "",
                zip: zip || "",
                country_id: "US", // VERY IMPORTANT (use ISO country code)
            };

            simplyBookClientId = await addSimplyBookClient(clientData, false);
        } catch (err) {
            console.error("SimplyBook client creation failed:", err.message);
        }

        // 🔥 STEP 2: Save structured fields in MongoDB
        const newUser = await User.create({
            name: fullname,
            email: email.toLowerCase(),
            phonenumber,
            fullAddress,
            city,
            state,
            zip,
            simplyBookClientId,
        });

        return NextResponse.json(
            {
                success: true,
                message: "User registered successfully",
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    simplyBookClientId,
                },
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Register user error:", error);

        return NextResponse.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}