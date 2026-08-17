import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import PendingRegistration from "@/models/PendingRegistration";
import { addSimplyBookClient } from "../../../utils/simplybook";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

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
      !otp
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
      // VERIFY OTP
      // ========================================================

      let isVerified = false;

      // DEVELOPMENT OTP
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
            phonenumber: user.phonenumber,
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
              user.simplyBookClientId || null,
          },
        },
        { status: 200 }
      );
    }

    // ============================================================
    // NEW CLIENT
    // ============================================================

    if (clientType === "new") {

      // ========================================================
      // FIND PENDING REGISTRATION
      // ========================================================

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
      // VERIFY OTP
      // ========================================================

      let isVerified = false;

      // DEVELOPMENT OTP
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
      // OTP IS CORRECT
      //
      // ONLY NOW CREATE THE USER.
      // ========================================================

      let simplyBookClientId = null;

      try {

        const clientData = {
          name: pending.name,

          email: pending.email,

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

      // ========================================================
      // CREATE ACTUAL USER
      // ========================================================

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

      // ========================================================
      // DELETE PENDING REGISTRATION
      // ========================================================

      await PendingRegistration.deleteOne({
        _id: pending._id,
      });

      // ========================================================
      // RETURN NEW USER
      // ========================================================

      return NextResponse.json(
        {
          success: true,

          message:
            "Account created and OTP verified successfully",

          user: {
            id: newUser._id,

            name:
              newUser.name,

            email:
              newUser.email,

            phonenumber:
              newUser.phonenumber,

            isVerified: true,

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
    }

    // ============================================================
    // INVALID CLIENT TYPE
    // ============================================================

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