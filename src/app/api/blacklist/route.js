import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blacklist from "@/models/Blacklist";

// 🟩 POST — Add a provider to the user's blacklist
export async function POST(req) {
  try {
    const { email, providerId } = await req.json();

    if (!email || !providerId) {
      return NextResponse.json(
        { success: false, data: [] },
        { status: 200 }
      );
    }

    await connectDB();

    let userBlacklist = await Blacklist.findOne({ email });

    if (!userBlacklist) {
      userBlacklist = await Blacklist.create({
        email,
        providerIds: [providerId],
      });
    } else {
      // Ensure array exists
      if (!Array.isArray(userBlacklist.providerIds)) {
        userBlacklist.providerIds = [];
      }

      // Add only if not already present
      if (!userBlacklist.providerIds.includes(providerId)) {
        userBlacklist.providerIds.push(providerId);
        await userBlacklist.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: "Provider blacklisted successfully",
      data: userBlacklist,
    });
  } catch (error) {
    console.error("POST /blacklist Error:", error);
    return NextResponse.json(
      { success: false, data: [] },
      { status: 200 }
    );
  }
}

// 🟦 GET — Fetch user's blacklist
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, data: [] },
        { status: 200 }
      );
    }

    await connectDB();

    const userBlacklist = await Blacklist.findOne({ email });

    return NextResponse.json({
      success: true,
      blockedProviderIds: userBlacklist?.providerIds || [],
    });
  } catch (error) {
    console.error("GET /blacklist Error:", error);
     return NextResponse.json(
      { success: false, data: [] },
      { status: 200 }
    );
  }
}

// 🟥 DELETE — Remove a provider from user's blacklist (unblock)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const providerId = searchParams.get("providerId");

   if (!email || !providerId) {
      return NextResponse.json(
        { success: false, data: [] },
        { status: 200 }
      );
    }

    await connectDB();

    const userBlacklist = await Blacklist.findOne({ email });

    if (!userBlacklist) {
      return NextResponse.json(
        { success: false, data: [] },
        { status: 200 }
      );
    }

    // Remove the providerId from the array
    userBlacklist.providerIds = userBlacklist.providerIds.filter(
      id => id !== providerId
    );

    await userBlacklist.save();

    return NextResponse.json({
      success: true,
      message: "Provider unblocked successfully",
      data: userBlacklist,
    });
  } catch (error) {
    console.error("DELETE /blacklist Error:", error);
   return NextResponse.json(
      { success: false, data: [] },
      { status: 200 }
    );
  }
}