import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blacklist from "@/models/Blacklist";

// 🟩 POST — Add a provider to the user's blacklist
// 🟩 POST — Hide provider for specific location
export async function POST(req) {
  try {
    const {
      email,
      providerId,
      location,
    } = await req.json();

    if (!email || !providerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 200 }
      );
    }

    await connectDB();

    let userBlacklist = await Blacklist.findOne({ email });

    if (!userBlacklist) {
      userBlacklist = await Blacklist.create({
        email,
        hiddenProviders: [],
      });
    }

    if (!Array.isArray(userBlacklist.hiddenProviders)) {
      userBlacklist.hiddenProviders = [];
    }

    const alreadyHidden =
      userBlacklist.hiddenProviders.some(
        (item) =>
          String(item.providerId) ===
            String(providerId) &&
          item.zip === location?.zip
      );

    if (!alreadyHidden) {
      userBlacklist.hiddenProviders.push({
        providerId: String(providerId),
        zip: location?.zip || "",
        state: location?.state || "",
        city: location?.city || "",
      });

      await userBlacklist.save();
    }

    return NextResponse.json({
      success: true,
      message: "Provider hidden successfully",
      data: userBlacklist,
    });
  } catch (error) {
    console.error("POST /blacklist Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 200 }
    );
  }
}

// 🟦 GET — Fetch hidden providers
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          hiddenProviders: [],
        },
        { status: 200 }
      );
    }

    await connectDB();

    const userBlacklist =
      await Blacklist.findOne({ email });

    return NextResponse.json({
      success: true,
      hiddenProviders:
        userBlacklist?.hiddenProviders || [],
    });
  } catch (error) {
    console.error("GET /blacklist Error:", error);

    return NextResponse.json(
      {
        success: false,
        hiddenProviders: [],
      },
      { status: 200 }
    );
  }
}

// 🟥 DELETE — Unhide provider
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);

    const email =
      searchParams.get("email");

    const providerId =
      searchParams.get("providerId");

    const zip =
      searchParams.get("zip");

    if (!email || !providerId) {
      return NextResponse.json(
        {
          success: false,
        },
        { status: 200 }
      );
    }

    await connectDB();

    const userBlacklist =
      await Blacklist.findOne({ email });

    if (!userBlacklist) {
      return NextResponse.json(
        {
          success: false,
        },
        { status: 200 }
      );
    }

    userBlacklist.hiddenProviders =
      userBlacklist.hiddenProviders.filter(
        (item) =>
          !(
            String(item.providerId) ===
              String(providerId) &&
            item.zip === zip
          )
      );

    await userBlacklist.save();

    return NextResponse.json({
      success: true,
      message:
        "Provider unhidden successfully",
      data: userBlacklist,
    });
  } catch (error) {
    console.error(
      "DELETE /blacklist Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
      },
      { status: 200 }
    );
  }
}