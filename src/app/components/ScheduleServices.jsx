"use client";

import ProvidersSection from "./ProvidersSection";
import ServiceCategorySection from "./ServiceCategorySection";
import ServiceSelectionSection from "./ServiceSelectionSection";
import AvailabilitySection from "./AvailabilitySection";
import { useState } from "react";

import { useBooking } from "./useBooking";

function StepLocked({ title, message }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 px-6">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                🔒
            </div>
            <h4 className="font-semibold text-gray-700 mb-1">{title}</h4>
            <p className="text-sm">{message}</p>
        </div>
    );
}

export default function ScheduleServices({
    locations,
    categories,
    providers,
    totalDuration,
    handleProviderSelect,
    setHoveredProvider,
    hoveredProvider,
    selectedServices,
    availabilityScrollRef,
    providerCategories,
    activeProvider,
    searchCategory,
    events, clients,
}) {

    const {
        selectedEvent,
        selectedProvider,
        selectedDate,
        selectedTime,
        workCalandar,
        firstDay,
        loadingCalendar,
        slots,
        clientLocation,
        searchWithin,
        selectedClient,
        query,
        suggestions,
        isSearchedAddress,
        limitedLocations,
        filteredProviders,
        userEmail,
        formData,
        address,
        services,
        providerArray,
        loadingProviders,
        loadingServices,
        loadingTimeSlots,
        submittingBooking,
        loadingAddress,
        handleChange,
        handleCheckboxChange,
        handleSubmit,
        handleFieldChange,
        handleSearchChange,
        handleSearchSelect,
        setSearchWithin,
        setUserEmail,
        setSelectedProvider,
        setSelectedDate,
        setSelectedTime,
        getLatLngFromAddress,
        handleNotFoundSubmit,
        handleMonthChange,
        getSelectedServiceNames,
        resetBooking,
        setFormData
    } = useBooking({ providers, locations, categories, searchCategory });


    const [loginData, setLoginData] = useState({
        email: "",
        phonenumber: ""
    });
    const [emailError, setEmailError] = useState("");
    const [otpError, setOtpError] = useState("");
    const [userFlow, setUserFlow] = useState("entry");
    const [otpLoading, setOtpLoading] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpVerified, setOtpVerified] = useState(false);
    const [showAddressConfirmation, setShowAddressConfirmation] = useState(false);
    const [useStoredAddress, setUseStoredAddress] = useState(null);
    const [temporaryAddress, setTemporaryAddress] = useState({
        fullAddress: "",
        city: "",
        state: "",
        zip: ""
    });

    const handleLogout = () => {
        // Clear session storage
        sessionStorage.removeItem("userAuth");
        resetBooking();

        // Reset states
        setOtpVerified(false);
        setUserFlow("entry");
        setOtp("");
        setOtpError("");
        setLoginData({
            email: "",
            phonenumber: ""
        });
        setUser(null);

        // 🧹 Clear booking state
        setSelectedDate(null);
        setSelectedTime("");
        // setSlots([]);
        setWorkCalandar({});
        setServices({}); // VERY IMPORTANT

        // 🔥 Reset booking related states
        setTotalDuration(0);

        // Optional: notify other components
        window.dispatchEvent(new Event("session-changed"));
    };


    async function handleBlacklist(providerId) {
        if (!userEmail) {
            alert("Please enter your email before Hiding a provider.");
            return;
        }

        try {
            const res = await fetch("/api/blacklist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userEmail, providerId }),
            });

            const result = await res.json();

            if (result.success) {
                // instantly remove blacklisted provider
                setFilteredProviders((prev) => prev.filter((p) => p.id !== providerId));
                alert("Provider has been Hidden successfully!");
            } else {
                alert(result.message || "Failed to Hiding provider.");
            }
        } catch (error) {
            console.error("Blacklist error:", error);
            alert("Something went wrong while Hiding the provider.");
        }
    }

    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        setOtpLoading(true);
        setOtpError("");

        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(loginData.phonenumber)) {
            setOtpError("Invalid phone number format");
            setOtpLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: loginData.email,
                    phonenumber: loginData.phonenumber,
                    otp: otp
                }),
            });

            const result = await response.json();
            console.log("OTP verification result:", result);

            if (result.success) {

                // ✅ Mark verified
                setOtpVerified(true);
                setUserFlow("authenticated");
                setShowAddressConfirmation(true);

                // 🔥 CALL GET USER API TO FETCH FULL DATA
                const userRes = await fetch("/api/auth/get-user", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: loginData.email,
                        phonenumber: loginData.phonenumber,
                    }),
                });

                const userData = await userRes.json();

                if (userData.success) {
                    const user = userData.user;

                    // const latestAddress =
                    //     user.address && user.address.length > 0
                    //         ? user.address[user.address.length - 1]
                    //         : null;
                    console.log("user", user)
                    setFormData(prev => ({
                        ...prev,
                        name: user.name,
                        email: user.email,
                        fullAddress: user?.fullAddress || "",
                        city: user?.city || "",
                        state: user?.state || "",
                        zip: user?.zip || "",
                    }));
                }

                // ✅ Store session
                const authData = {
                    isAuthenticated: true,
                    userEmail: result.user.email,
                    userData: result.user,
                    loginData: {
                        email: loginData.email,
                        phonenumber: loginData.phonenumber
                    },
                    timestamp: new Date().toISOString()
                };

                sessionStorage.setItem('userAuth', JSON.stringify(authData));
                window.dispatchEvent(new Event("session-changed"));

                setUserEmail(result.user.email);

                if (!currentEmail) {
                    setCurrentEmail(true);
                }

            } else {
                setOtpError(result.message || "Invalid or expired OTP");
            }

        } catch (error) {
            console.error(error);
            setOtpError("Network error. Please try again.");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleLoginCheck = async (e) => {
        e.preventDefault();
        setOtpError("");

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{10}$/;

        // ✅ Validate Email
        if (!emailRegex.test(loginData.email)) {
            setOtpError("Please enter valid email");
            return;
        }

        // ✅ Validate Phone
        if (!phoneRegex.test(loginData.phonenumber)) {
            setOtpError("Enter valid 10 digit phone number");
            return;
        }

        setOtpLoading(true);

        try {
            const checkRes = await fetch("/api/auth/check-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: loginData.email,
                    phonenumber: loginData.phonenumber,
                }),
            });

            const checkData = await checkRes.json();

            // ❌ API returned error (like wrong phone)
            if (!checkData.success) {
                setOtpError(checkData.message || "Something went wrong");
                return;
            }

            // ✅ Email + Phone correct → Send OTP
            if (checkData.loginAllowed) {
                const otpRes = await fetch("/api/auth/send-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: loginData.email,
                        phonenumber: loginData.phonenumber,
                    }),
                });

                const otpData = await otpRes.json();

                if (!otpRes.ok || !otpData.success) {
                    setOtpError(otpData.message || "Failed to send OTP");
                    return;
                }

                setUserFlow("otp-verification");
            }

            // ❌ Email does not exist → Register
            else {
                setUserFlow("register-user");
            }

        } catch (error) {
            console.error(error);
            setOtpError("Network error. Please try again.");
        } finally {
            setOtpLoading(false);
        }
    };


    const handleRegisterUser = async () => {
        try {
            setOtpLoading(true);
            setOtpError("");

            // 1️⃣ Register User
            const response = await fetch("/api/auth/register-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullname: formData.name,
                    email: loginData.email,
                    phonenumber: loginData.phonenumber,
                    fullAddress: formData.fullAddress,
                    city: formData.city,
                    state: formData.state,
                    zip: formData.zip,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                setOtpError(result.message || "Registration failed");
                return;
            }

            // 2️⃣ Send OTP after successful registration
            const otpRes = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: loginData.email,
                    phonenumber: loginData.phonenumber,
                }),
            });

            const otpData = await otpRes.json();

            if (!otpRes.ok || !otpData.success) {
                setOtpError(otpData.message || "Failed to send OTP");
                return;
            }

            // 3️⃣ Move to OTP verification screen
            setUserFlow("otp-verification");

        } catch (error) {
            console.error(error);
            setOtpError("Registration failed");
        } finally {
            setOtpLoading(false);
        }
    };

    const formatPhoneDisplay = (value) => {
        const digits = value.replace(/\D/g, "").slice(0, 10);

        const part1 = digits.slice(0, 3);
        const part2 = digits.slice(3, 6);
        const part3 = digits.slice(6, 10);

        if (digits.length > 6) {
            return `(${part1}) ${part2}-${part3}`;
        } else if (digits.length > 3) {
            return `(${part1}) ${part2}`;
        } else if (digits.length > 0) {
            return `(${part1}`;
        }

        return "";
    };

    return (
        <div className="space-y-8">

            {/* GRID */}
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                {/* STEP 1 – CLIENT LOGIN */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col h-[650px]">

                    {/* Header */}
                    <div className="px-4 py-3 bg-indigo-50 flex items-center justify-between">
                        <h3 className="text-lg font-bold">Client Login</h3>

                        {otpVerified && (
                            <button
                                onClick={handleLogout}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                                Logout
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">

                        {!otpVerified ? (
                            <form onSubmit={handleLoginCheck} className="space-y-5">

                                {/* Email */}
                                <div>
                                    <label className="text-sm font-medium text-gray-600">
                                        Email Address
                                    </label>

                                    <input
                                        type="email"
                                        placeholder="example@email.com"
                                        value={loginData.email}
                                        onChange={(e) => {
                                            setLoginData(prev => ({
                                                ...prev,
                                                email: e.target.value
                                            }));
                                            setEmailError("");
                                        }}
                                        onBlur={() => {
                                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                            if (!emailRegex.test(loginData.email)) {
                                                setEmailError("Please enter a valid email (must include @ and .)");
                                            }
                                        }}
                                        className={`mt-2 w-full px-4 py-3 border rounded-xl outline-none transition
      ${emailError
                                                ? "border-red-500 focus:ring-red-500"
                                                : "border-gray-300 focus:ring-2 focus:ring-indigo-500"
                                            }`}
                                    />

                                    {emailError && (
                                        <p className="text-red-500 text-sm mt-1">{emailError}</p>
                                    )}
                                </div>




                                <div>
                                    <label className="text-sm font-medium text-gray-600">
                                        10-Digit Phone Number
                                    </label>

                                    <input
                                        type="tel"
                                        placeholder="(904) 112-0199"
                                        value={formatPhoneDisplay(loginData.phonenumber)} // 👈 formatted display only
                                        onChange={(e) => {
                                            const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);

                                            setLoginData(prev => ({
                                                ...prev,
                                                phonenumber: digitsOnly // 👈 store raw digits only
                                            }));

                                            if (otpError) setOtpError("");
                                        }}
                                        className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                    />
                                </div>                  {otpError && (
                                    <p className="text-red-500 text-sm">
                                        {otpError}
                                    </p>
                                )}

                                {/* Continue Button */}
                                {userFlow === "entry" && (
                                    <button
                                        type="submit"
                                        disabled={otpLoading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                                    >
                                        {otpLoading ? "Checking..." : "Continue"}
                                    </button>
                                )}

                                {/* OTP Section */}
                                {userFlow === "otp-verification" && (
                                    <div className="space-y-4 pt-4 border-t">

                                        <div>
                                            <label className="text-sm font-medium text-gray-600">
                                                Enter 6 Digit OTP
                                            </label>
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={otp}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, ""); // allow only digits
                                                    setOtp(value);
                                                    if (otpError) {
                                                        setOtpError("");
                                                    }

                                                }}
                                                className="mt-2 w-full text-center tracking-widest text-lg px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                            />
                                            {otpError && (
                                                <p className="text-red-500 text-sm mt-2">
                                                    {otpError}
                                                </p>
                                            )}

                                        </div>



                                        <button
                                            type="button"
                                            onClick={handleVerifyOTP}
                                            disabled={otp.length !== 6}
                                            className={`w-full py-3 rounded-xl font-medium transition
    ${otp.length === 6
                                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                }`}
                                        >
                                            Verify OTP
                                        </button>
                                    </div>
                                )}

                                {/* Register Section */}
                                {userFlow === "register-user" && (
                                    <div className="space-y-5 pt-4 border-t">

                                        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-4 rounded-xl text-sm">
                                            <p className="font-semibold mb-1">
                                                Looks like this is your first time scheduling.
                                            </p>
                                            <p>
                                                Let's get you set up! Please provide your full name and home address
                                                where services will be performed.
                                            </p>
                                        </div>

                                        {/* Full Name */}
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter your full name"
                                                value={formData.name || ""}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        name: e.target.value,
                                                    }))
                                                }
                                                className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
                                            />
                                        </div>

                                        {/* Address */}
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">
                                                Address
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Street address"
                                                value={formData.fullAddress || ""}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        fullAddress: e.target.value,
                                                    }))
                                                }
                                                className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
                                            />
                                        </div>

                                        {/* City */}
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="City"
                                                value={formData.city || ""}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        city: e.target.value,
                                                    }))
                                                }
                                                className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
                                            />
                                        </div>

                                        {/* State */}
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">
                                                State
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="State"
                                                value={formData.state || ""}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        state: e.target.value,
                                                    }))
                                                }
                                                className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
                                            />
                                        </div>

                                        {/* Zip */}
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">
                                                Zip Code
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Zip Code"
                                                value={formData.zip || ""}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        zip: e.target.value,
                                                    }))
                                                }
                                                className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
                                            />
                                        </div>

                                        {/* Save Button */}
                                        <button
                                            type="button"
                                            onClick={handleRegisterUser}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition"
                                        >
                                            Save & Continue
                                        </button>
                                    </div>
                                )}

                            </form>
                        ) : showAddressConfirmation ? (
                            <div className="space-y-6">

                                <h3 className="text-lg font-semibold text-gray-800">
                                    Welcome Back {formData.name || "Client"}!
                                </h3>

                                <div className="bg-gray-50 p-4 rounded-xl border">
                                    <p className="font-medium text-gray-700 mb-2">
                                        Service Location:
                                    </p>

                                    <p><strong>Address:</strong> {formData.fullAddress}</p>
                                    <p><strong>City:</strong> {formData.city}</p>
                                    <p><strong>State:</strong> {formData.state}</p>
                                    <p><strong>Zip:</strong> {formData.zip}</p>
                                </div>

                                <p className="font-medium text-gray-700">
                                    Will your appointment be at this address?
                                </p>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            setUseStoredAddress(true);
                                            setTemporaryAddress({
                                                fullAddress: formData.fullAddress,
                                                city: formData.city,
                                                state: formData.state,
                                                zip: formData.zip
                                            });
                                            setSearchWithin(40);

                                            setShowAddressConfirmation(false);
                                        }}
                                        className="flex-1 bg-green-600 text-white py-3 rounded-xl"
                                    >
                                        Yes
                                    </button>
                                    <button
                                        onClick={() => {
                                            setUseStoredAddress(false);
                                        }}
                                        className="flex-1 bg-gray-300 py-3 rounded-xl"
                                    >
                                        No
                                    </button>
                                </div>

                                {!useStoredAddress && (
                                    <div className="space-y-3 pt-4 border-t">
                                        <p className="font-medium">
                                            Where would you like services performed?
                                        </p>

                                        <input
                                            type="text"
                                            placeholder="Address"
                                            className="w-full border p-2 rounded-lg"
                                            onChange={(e) =>
                                                setTemporaryAddress(prev => ({
                                                    ...prev,
                                                    fullAddress: e.target.value
                                                }))
                                            }
                                        />

                                        <input
                                            type="text"
                                            placeholder="City"
                                            className="w-full border p-2 rounded-lg"
                                            onChange={(e) =>
                                                setTemporaryAddress(prev => ({
                                                    ...prev,
                                                    city: e.target.value
                                                }))
                                            }
                                        />

                                        <input
                                            type="text"
                                            placeholder="State"
                                            className="w-full border p-2 rounded-lg"
                                            onChange={(e) =>
                                                setTemporaryAddress(prev => ({
                                                    ...prev,
                                                    state: e.target.value
                                                }))
                                            }
                                        />

                                        <input
                                            type="text"
                                            placeholder="Zip"
                                            className="w-full border p-2 rounded-lg"
                                            onChange={(e) =>
                                                setTemporaryAddress(prev => ({
                                                    ...prev,
                                                    zip: e.target.value
                                                }))
                                            }
                                        />

                                        <button
                                            onClick={() => {
                                                setSearchWithin(40);

                                                setShowAddressConfirmation(false)
                                            }}
                                            className="w-full bg-indigo-600 text-white py-3 rounded-xl"
                                        >
                                            Continue
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center mt-10">
                                <div className="text-green-600 text-2xl font-bold mb-2">
                                    ✓ Logged In Successfully
                                </div>
                                <p className="text-gray-500">
                                    You can now continue booking.
                                </p>
                            </div>
                        )}
                    </div>
                // </div>

                {/* PROVIDER */}
                <div className="bg-white rounded-2xl shadow-lg flex flex-col h-[650px]">
                    <div className="px-4 py-3 bg-indigo-50">
                        <h3 className="text-lg font-bold">Service Provider</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {otpVerified ? (
                            <ProvidersSection
                                providers={filteredProviders}
                                locations={locations}
                                clientLocation={temporaryAddress}
                                searchWithin={searchWithin}
                                selectedProvider={selectedProvider}
                                userEmail={userEmail}
                                onProviderSelect={handleProviderSelect}
                                onBlacklist={handleBlacklist}
                                categories={categories}
                                compactMode
                                setHoveredProvider={setHoveredProvider}
                            />
                        ) : (
                            <StepLocked
                                title="Login Required"
                                message="Please login to select a provider"
                            />
                        )}
                    </div>
                </div>

                {/* SERVICES */}
                <div className="bg-white rounded-2xl shadow-lg flex flex-col h-[650px]">
                    <div className="px-4 py-3 bg-purple-50">
                        <h3 className="text-lg font-bold">Services</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {otpVerified && activeProvider ? (
                            <>
                                <ServiceCategorySection
                                    selectedProvider={selectedProvider}
                                    providers={providers}
                                    categories={categories}
                                    loading={loadingServices}
                                />

                                <ServiceSelectionSection
                                    hoveredProvider={hoveredProvider}
                                    categories={providerCategories}
                                    services={services}
                                    onCheckboxChange={handleCheckboxChange}
                                    selectedProvider={selectedProvider}
                                    providers={providers}
                                    selectedCategory={searchCategory}
                                />
                            </>
                        ) : (
                            <StepLocked
                                title="Select a Provider"
                                message="Please choose a provider"
                            />
                        )}
                    </div>
                </div>

                {/* AVAILABILITY */}
                <div className="bg-white rounded-2xl shadow-lg flex flex-col h-[650px]">
                    <div className="px-4 py-3 bg-green-50">
                        <h3 className="text-lg font-bold">Availability</h3>
                    </div>

                    <div ref={availabilityScrollRef} className="flex-1 overflow-y-auto p-4">
                        {services && Object.values(services).some(Boolean) ? (
                            <AvailabilitySection
                                scrollContainerRef={availabilityScrollRef}
                                workCalandar={workCalandar}
                                selectedDate={selectedDate}
                                selectedTime={selectedTime}
                                slots={slots}
                                onDateSelect={(date) => {
                                    setSelectedDate(date);
                                    setSelectedTime("");
                                }}
                                onTimeSelect={setSelectedTime}
                                loadingCalendar={loadingCalendar}
                                loadingTimeSlots={loadingTimeSlots}
                                totalDuration={totalDuration}
                            />
                        ) : (
                            <StepLocked
                                title="Select Time Slot"
                                message="Choose date and time"
                            />
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}