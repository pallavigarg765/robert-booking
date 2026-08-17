import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const { email, phonenumber, clientType } = body;

    if (!email || !phonenumber || !clientType) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, phone number and client type are required",
        },
        { status: 400 }
      );
    }

    const lowerEmail = email.toLowerCase().trim();
    const normalizedPhone = phonenumber.replace(/\D/g, "");

    // ============================================================
    // FIND USER BY EMAIL
    // ============================================================

    const emailUser = await User.findOne({
      email: lowerEmail,
    });

    // ============================================================
    // RETURNING CLIENT
    // ============================================================

    if (clientType === "returning") {

      // ----------------------------------------------------------
      // 1. Email does NOT exist
      // ----------------------------------------------------------

      if (!emailUser) {
        return NextResponse.json({
          success: false,
          scenario: "email-not-found",
          canRegister: false,
          loginAllowed: false,
          message: "Account does not exist",
        });
      }

      // ----------------------------------------------------------
      // 2. Email exists but phone is incorrect
      // ----------------------------------------------------------

      if (emailUser.phonenumber !== normalizedPhone) {
        return NextResponse.json({
          success: false,
          scenario: "wrong-phone",
          canRegister: false,
          loginAllowed: false,
          message: "Incorrect Phone Number",
        });
      }

      // ----------------------------------------------------------
      // 3. Email + phone are correct
      // ----------------------------------------------------------

      return NextResponse.json({
        success: true,
        scenario: "login",
        canRegister: false,
        loginAllowed: true,
      });
    }

    // ============================================================
    // NEW CLIENT
    // ============================================================

    if (clientType === "new") {

      // ----------------------------------------------------------
      // Existing email = cannot create another account
      //
      // IMPORTANT:
      // We intentionally DO NOT check whether the phone exists.
      //
      // Client requirement:
      // "New email / any phone number"
      // ----------------------------------------------------------

      if (emailUser) {
        return NextResponse.json({
          success: false,
          scenario: "email-exists",
          canRegister: false,
          loginAllowed: false,
          message:
            "Account exists: Choose another email to create your account.",
        });
      }

      // ----------------------------------------------------------
      // New email = valid new client
      //
      // Phone can be existing OR new according to client's
      // "any phone number" requirement.
      // ----------------------------------------------------------

      return NextResponse.json({
        success: true,
        scenario: "new-user",
        canRegister: true,
        loginAllowed: false,
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
    console.error("check-user error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      { status: 500 }
    );
  }
}