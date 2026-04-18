import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

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

    // 🔹 Find user by email only
    const user = await User.findOne({ email: lowerEmail });

    // ❌ Case 1: Email does NOT exist → allow registration
    if (!user) {
      return NextResponse.json({
        success: true,
        exists: false,
        loginAllowed: false,
        message: "Email not found. Please register.",
      });
    }

    // 🔎 Case 2: Email exists → check phone number
    const storedPhone = user.phonenumber
      ? user.phonenumber.replace(/\D/g, "")
      : "";

    if (storedPhone !== normalizedPhone) {
      return NextResponse.json({
        success: false,
        exists: true,
        loginAllowed: false,
        message: "Phone number is incorrect",
      });
    }

    // ✅ Case 3: Email + Phone both correct → allow login
    return NextResponse.json({
      success: true,
      exists: true,
      loginAllowed: true,
      message: "Login allowed",
    });

  } catch (error) {
    console.error("Check user error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}