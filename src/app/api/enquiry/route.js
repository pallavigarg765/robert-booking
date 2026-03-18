import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Enquiry from "@/models/Enquiry";

// 🟢 GET — Fetch Enquiries
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const state = searchParams.get("state");
    const city = searchParams.get("city");
    const pincode = searchParams.get("pincode");
    const enquiredBy = searchParams.get("enquiredBy");
    const category = searchParams.get("category"); // ✅ Added category filter

    const filter = {};
    if (email) filter.email = email;
    if (state) filter.state = state;
    if (city) filter.city = city;
    if (pincode) filter.pincode = pincode;
    if (enquiredBy) filter.enquiredBy = enquiredBy;
    if (category) filter.category = category; // ✅ Apply category filter

    const enquiries = await Enquiry.find(filter).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        count: enquiries.length,
        data: enquiries,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching enquiries:", error);
    return NextResponse.json(
      { success: false, data: [] },
      { status: 200 }
    );
  }
}

// 🟢 POST — Create a New Enquiry
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      enquiredBy,
      city,
      state,
      pincode,
      email,
      phoneNumber,
      fullAddress,
      lat,
      lon,
      category, // ✅ Added category
    } = body;

    if (!email && !phoneNumber && !city && !state && !pincode) {
      return NextResponse.json(
        { success: false, data: [] },
        { status: 200 }
      );
    }

    const newEnquiry = await Enquiry.create({
      enquiredBy,
      city: city || "",
      state: state || "",
      pincode: pincode || "",
      email: email || "",
      phoneNumber: phoneNumber || "",
      fullAddress: fullAddress || "",
      lat: lat || "",
      lon: lon || "",
      category: category || "", // ✅ Save category
    });

    return NextResponse.json(
      {
        success: true,
        message: "Enquiry submitted successfully",
        data: newEnquiry,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating enquiry:", error);
    return NextResponse.json(
      { success: false, data: [] },
      { status: 200 }
    );
  }
}

// 🔴 DELETE — delete single or multiple enquiries
export async function DELETE(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    let body = {};

    try {
      body = await request.json();
    } catch {
      // No JSON body provided, ignore error
    }

    const ids = body?.ids;

    if (ids && Array.isArray(ids) && ids.length > 0) {
      // 🧹 Delete multiple enquiries
      const result = await Enquiry.deleteMany({ _id: { $in: ids } });

      return NextResponse.json(
        {
          success: true,
          message: `${result.deletedCount} enquiry(s) deleted successfully`,
        },
        { status: 200 }
      );
    } else if (id) {
      // 🧩 Delete a single enquiry by ID
      const deletedEnquiry = await Enquiry.findByIdAndDelete(id);

      if (!deletedEnquiry) {
         return NextResponse.json(
          { success: false, data: [] },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { success: true, message: "Enquiry deleted successfully" },
        { status: 200 }
      );
    } else {
       return NextResponse.json(
          { success: false, data: [] },
          { status: 200 }
        );
    }
  } catch (error) {
    console.error("❌ Error deleting enquiry:", error);
     return NextResponse.json(
      { success: false, data: [] },
      { status: 200 }
    );
  }
}
