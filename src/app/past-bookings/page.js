"use client";
import { useEffect, useState } from "react";
import { useAppData } from "../context/AppDataContext";

export default function PastBooking() {
  const { providers, fetchAllData } = useAppData();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // ✅ If providers are empty, automatically fetch them
  useEffect(() => {
    if (!providers || providers.length === 0) {
      console.log("Providers empty → fetching...");
      fetchAllData();
    } else {
      console.log("Providers loaded:", providers.length);
    }
  }, [providers, fetchAllData]);

  // ✅ Fetch bookings based on stored user email
  useEffect(() => {
    const authData = JSON.parse(sessionStorage.getItem("userAuth"));
    const email = authData?.userEmail;
    setUserEmail(email);
    if (email) fetchBookings(email);
  }, []);

  const fetchBookings = async (email) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bookings?email=${email}`, { cache: "no-store" });
      const data = await res.json();
      if (data?.success) setBookings(data.data);
      else setBookings([]);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Helper to get provider details
  const getProvider = (id) => {
    if (!providers || providers.length === 0) return null;
    return providers.find(
      (p) => p.id === id || p.id === String(id)
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-6 text-center">Past Bookings</h1>

      {loading && <p className="text-center text-gray-500">Loading bookings...</p>}

      {!loading && bookings.length === 0 && (
        <p className="text-center text-gray-400">
          {userEmail ? "No bookings found." : "Please log in to view past bookings."}
        </p>
      )}

      {!loading && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((b) => {
            const provider = getProvider(b.provider);

            return (
              <div
                key={b._id}
                className="border border-gray-200 rounded-xl shadow-sm p-5 hover:shadow-md transition bg-white"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  {/* 🧾 Provider Info */}
                  <div className="flex items-center gap-4">
                    {provider?.picture_path && (
                      <img
                        src={
                          process.env.NEXT_PUBLIC_BASE_URL_IMAGE +
                          provider.picture_path
                        }
                        alt={provider.name}
                        className="w-14 h-14 rounded-full object-cover border"
                      />
                    )}
                    <div>
                      <h2 className="text-lg font-medium text-gray-800">
                        {provider ? provider.name : `Provider #${b.provider}`}
                      </h2>
                      {provider?.phone && (
                        <p className="text-gray-500 text-sm">{provider.phone}</p>
                      )}
                      <p className="text-gray-600 text-sm">
                        {b.clientaddress?.fullAddress || "Unknown location"}
                      </p>
                    </div>
                  </div>

                  {/* ⏰ Date & Time */}
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(b.date).toLocaleDateString()} at {b.time}
                    </p>
                  </div>
                </div>

                {/* 🧴 Services List */}
                <div className="mt-3">
                  <p className="text-sm font-semibold text-gray-700">Services:</p>
                  <ul className="text-sm text-gray-600 mt-1 grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {Object.entries(b.services)
                      .filter(([_, val]) => val)
                      .map(([service]) => (
                        <li key={service} className="capitalize">
                          • {service.replace(/([A-Z])/g, " $1")}
                        </li>
                      ))}
                    {Object.values(b.services).every((v) => !v) && (
                      <li className="text-gray-400">No specific services listed</li>
                    )}
                  </ul>
                </div>

                {/* 🕓 Booking Timestamp */}
                <div className="text-xs text-gray-400 mt-3">
                  Booked on {new Date(b.createdAt).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
