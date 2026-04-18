import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req) {
    try {
        await connectDB();

        const { email, phonenumber } = await req.json();

        if (!email || !phonenumber) {
            return NextResponse.json(
                { success: false, message: "Missing email or phone" },
                { status: 400 }
            );
        }

        const user = await User.findOne({
            email: email.toLowerCase(),
            phonenumber,
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                name: user.name,
                email: user.email,
                phonenumber: user.phonenumber,
                fullAddress: user.fullAddress, // 🔥 send all addresses
                city: user.city,
                state: user.state,
                zip: user.zip
            },
        });

    } catch (error) {
        console.error("Get user error:", error);
        return NextResponse.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}