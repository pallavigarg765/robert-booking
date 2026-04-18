"use client";
import { useState, useEffect, useRef } from "react";
import SearchSection from "./SearchSection";
import ProvidersSection from "./ProvidersSection";
import ProvidersMap from "./ProvidersMap";
import ScheduleServices from "./ScheduleServices"
import NoProvidersSection from "./NoProvidersSection";
import SuccessNotification from "./SuccessNotification";
import { useBooking } from "./useBooking";
import ServiceCategorySection from "./ServiceCategorySection";
import ServiceSelectionSection from "./ServiceSelectionSection";
import AvailabilitySection from "./AvailabilitySection";
import { Calendar, Clock, CheckCircle, ChevronRight, User, Scissors, CalendarDays, Clock4, FileText } from "lucide-react";

const dayMap = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};


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

export default function FindBooking({ providers, events, locations, clients, categories }) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [userFlow, setUserFlow] = useState("entry");
  const [calendarMonth, setCalendarMonth] = useState(new Date()); // 👈 Parent controls month
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [currentView, setCurrentView] = useState('providers');
  const [blacklistedProviders, setBlacklistedProviders] = useState([]);
  const [loadingBlacklist, setLoadingBlacklist] = useState(false);
  const [unblacklisting, setUnblacklisting] = useState(null);
  const [resetForm, setResetForm] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [currentEmail, setCurrentEmail] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const availabilityScrollRef = useRef(null);
  const [searchCategory, setSearchCategory] = useState("ALL");
  const [providerCategories, setProviderCategories] = useState([]);
  const [hoveredProvider, setHoveredProvider] = useState(null);

  const [loginData, setLoginData] = useState({
    email: "",
    phonenumber: ""
  });
  const cleanName = (name = "") =>
    name
      .replace(/^\d+[a-z]\),?\s*/i, "")
      .replace(/\s*,?\s*(DTD|Salon)(\s*Schedule)?/gi, "")
      .trim();

  const [activeStep, setActiveStep] = useState(1); // 1: Providers, 2: Services, 3: Date, 4: Time, 5: Booking

  const saveBookingState = () => {
    const bookingState = {
      clientLocation,
      searchWithin,
      selectedProvider,
      selectedEvent,
      selectedDate,
      selectedTime,
      address,
      userEmail,
      formData,
      isSearchedAddress,
      timestamp: Date.now()
    };

    sessionStorage.setItem('bookingState', JSON.stringify(bookingState));
    console.log('💾 Saved booking state for navigation');
  };

  // Get all hook functions FIRST
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
    handleBlacklist,
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
  } = useBooking({ providers, events, locations, clients, categories, searchCategory });

  // Custom handler for provider selection that automatically moves to next step
  const handleProviderSelect = (providerId) => {
    setSelectedProvider(providerId);
    setSelectedServices([]); // Reset selected services

    Object.keys(services).forEach((key) => {
      if (services[key]) {
        handleCheckboxChange({
          target: {
            name: key,
            checked: false,
          },
        });
      }
    });
    // reset downstream steps
    setSelectedDate(null);
    setSelectedTime("");
    setActiveStep(2); // Move to Services step
  };

  const selectedProviderObj = providers.find(
    (p) => p.id === selectedProvider
  );
  const hoverProviderObj = hoveredProvider;
  const activeProvider = hoveredProvider || selectedProviderObj;
  // Custom handler for service selection - THIS IS THE KEY FIX
  const handleServiceSelection = (serviceId) => {
    setSelectedServices(prev => {
      let newSelectedServices;
      if (prev.includes(serviceId)) {
        // Remove service if already selected
        newSelectedServices = prev.filter(id => id !== serviceId);
      } else {
        // Add service if not selected
        newSelectedServices = [...prev, serviceId];
      }
      return newSelectedServices;
    });
  };

  // Effect to automatically move to date step when services are selected
  useEffect(() => {
    if (selectedServices.length > 0 && activeStep === 2) {
      // If services are selected and we're still on step 2, move to step 3
      console.log('Services selected, moving to date step');
      setActiveStep(3);
    }
  }, [selectedServices, activeStep]);

  // Custom handler for date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(""); // Reset time when date changes
    setActiveStep(4); // Move to Time step
  };

  // Custom handler for time selection
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setActiveStep(5); // Move to Booking step
  };

  // Go back to previous step - SIMPLIFIED VERSION
  const handleBackStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  // Go to specific step - UPDATED VERSION
  const handleGoToStep = (step) => {
    // Always allow going back to previous steps
    if (step < activeStep) {
      // Going back - always allowed
      setActiveStep(step);
    } else if (step > activeStep) {
      // Going forward - check conditions
      if (step === 2 && selectedProvider) {
        setActiveStep(step);
      } else if (step === 3 && selectedServices.length > 0) {
        setActiveStep(step);
      } else if (step === 4 && selectedDate) {
        setActiveStep(step);
      } else if (step === 5 && selectedTime) {
        setActiveStep(step);
      }
    }
  };

  // Load auth state from session storage
  useEffect(() => {
    const loadAuthState = () => {
      if (typeof window !== 'undefined') {
        const savedAuth = sessionStorage.getItem('userAuth');
        if (savedAuth) {
          try {
            const parsed = JSON.parse(savedAuth);
            if (parsed.isAuthenticated) {
              setUserEmail(parsed.userEmail);
              setFormData(prev => ({ ...prev, email: parsed.userEmail }));

              if (parsed.userData?.lastAddress) {
                const addr = parsed.userData.lastAddress;
                if (addr.fullAddress) {
                  handleFieldChange({
                    target: { name: "fullAddress", value: addr.fullAddress }
                  });
                }
                if (addr.city) {
                  handleFieldChange({
                    target: { name: "city", value: addr.city }
                  });
                }
                if (addr.state) {
                  handleFieldChange({
                    target: { name: "state", value: addr.state }
                  });
                }
              }
            }
          } catch (error) {
            console.error('❌ Error loading auth state:', error);
            sessionStorage.removeItem('userAuth');
          }
        }
      }
    };

    loadAuthState();
  }, []);

  // Listen for reset events from Header and NoProvidersSection
  useEffect(() => {
    const handleResetBookingForm = () => {
      console.log('🔄 Received reset request from header/no-thanks');
      handleFullReset();
    };

    window.addEventListener('reset-booking-form', handleResetBookingForm);
    return () => {
      window.removeEventListener('reset-booking-form', handleResetBookingForm);
    };
  }, []);

  // Phone utility functions
  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/\D/g, '');
    let processedNumber = phoneNumber;
    if (phoneNumber.length > 0 && phoneNumber[0] === '1') {
      processedNumber = phoneNumber.substring(1);
    }
    const limitedNumber = processedNumber.substring(0, 10);
    if (limitedNumber.length === 0) return '';
    if (limitedNumber.length <= 3) return `(${limitedNumber}`;
    if (limitedNumber.length <= 6) return `(${limitedNumber.substring(0, 3)}) ${limitedNumber.substring(3)}`;
    return `(${limitedNumber.substring(0, 3)}) ${limitedNumber.substring(3, 6)}-${limitedNumber.substring(6)}`;
  };

  const normalizePhoneNumber = (formattedNumber) => {
    return formattedNumber.replace(/\D/g, '').substring(0, 10);
  };

  const currentStep = selectedTime
    ? 5
    : selectedDate
      ? 4
      : selectedServices.length > 0
        ? 3
        : selectedProvider
          ? 2
          : 1;

  // Enhanced handleSubmit that shows success notification
  const handleSubmitWithNotification = async (e) => {
    const result = await handleSubmit(e);
    if (result && result.success) {
      setBookingDetails({
        provider: selectedProvider,
        date: selectedDate,
        time: selectedTime,
        services: getSelectedServiceNames(),
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setBookingDetails(null);
      }, 5000);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setBookingDetails(null);
  };

  // Enhanced reset that clears everything
  const handleFullReset = () => {
    resetBooking();
    setShowSuccess(false);
    setBookingDetails(null);
    setResetForm(true);
    setSelectedServices([]);
    setActiveStep(1);
    setTimeout(() => setResetForm(false), 100);
    sessionStorage.removeItem('userAuth');
    sessionStorage.removeItem('bookingState');
    console.log('🗑️ Cleared auth state from session storage');
  };

  // Handler for "No Thanks" that goes back to ENTRY point
  const handleNoThanks = () => {
    resetBooking();
    setSelectedServices([]);
    setActiveStep(1);
    sessionStorage.clear();
    window.dispatchEvent(new CustomEvent('reset-booking-form'));
    console.log('🔙 Resetting booking form');
  };





  // loadBlacklistedProviders management
  const loadBlacklistedProviders = async (email) => {
    if (!email) return;
    setLoadingBlacklist(true);
    try {
      console.log("Fetching blacklist for email:", email);
      const response = await fetch(`/api/blacklist?email=${email}`);
      const data = await response.json();
      console.log("Blacklist API response:", data);
      if (data.success) {
        setBlacklistedProviders(data.blockedProviderIds || []);
      } else {
        console.error("Blacklist API error:", data.message);
      }
    } catch (error) {
      console.error('Error fetching blacklist:', error);
    } finally {
      setLoadingBlacklist(false);
    }
  };

  // Function to show blacklisted providers
  const showBlacklistedProviders = () => {
    setCurrentView('blacklisted');
    loadBlacklistedProviders(userEmail);
  };

  // Function to show normal providers
  const showProviders = () => {
    setCurrentView('providers');
  };

  // Function to unblacklist a provider
  const handleUnblacklist = async (providerId) => {
    if (!userEmail) return;
    setUnblacklisting(providerId);
    try {
      console.log("Unblacklisting provider:", providerId);
      const res = await fetch(`/api/blacklist?email=${userEmail}&providerId=${providerId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      console.log("Unblacklist response:", result);
      if (result.success) {
        setBlacklistedProviders(prev => prev.filter(id => id !== providerId));
        if (clientLocation && searchWithin) {
          console.log("Refreshing providers after unblacklist...");
          getLatLngFromAddress();
        }
        alert("Provider has been unblacklisted successfully!");
      } else {
        alert(result.message || "Failed to unblacklist provider.");
      }
    } catch (error) {
      console.error("Unblacklist error:", error);
      alert("Something went wrong while unblacklisting the provider.");
    } finally {
      setUnblacklisting(null);
    }
  };

  const handleSearchWithReset = async () => {
    setSelectedProvider("");
    setSelectedServices([]);
    setActiveStep(1);
    await getLatLngFromAddress();
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
  // Function to unblacklist all providers
  const handleUnblacklistAll = async () => {
    if (!userEmail) return;
    if (!confirm("Are you sure you want to unblacklist all providers?")) {
      return;
    }
    setLoadingBlacklist(true);
    try {
      for (const providerId of blacklistedProviders) {
        console.log("Unblacklisting provider:", providerId);
        const res = await fetch(`/api/blacklist?email=${userEmail}&providerId=${providerId}`, {
          method: "DELETE",
        });
        const result = await res.json();
        console.log(`Unblacklist result for ${providerId}:`, result);
      }
      setBlacklistedProviders([]);
      alert("All providers have been unblacklisted successfully!");
    } catch (error) {
      console.error("Unblacklist all error:", error);
      alert("Something went wrong while unblacklisting providers.");
    } finally {
      setLoadingBlacklist(false);
    }
  };


  const availableCategories = categories.filter((category) => {
    if (!category.events || category.events.length === 0) return false;

    return providers.some((provider) =>
      category.events.some((eventId) =>
        provider.services?.includes(Number(eventId))
      )
    );
  });



  useEffect(() => {
    // ⭐ When provider is deselected → reset downstream
    if (!selectedProvider) {
      // clear services
      Object.keys(services).forEach((key) => {
        if (services[key]) {
          handleCheckboxChange({
            target: { name: key, checked: false },
          });
        }
      });

      setSelectedDate(null);
      setSelectedTime("");
    }
  }, [selectedProvider]);


  useEffect(() => {
    const hasService = Object.values(services).some(Boolean);

    if (!hasService) {
      setSelectedDate(null);
      setSelectedTime("");
    }
  }, [services]);


  useEffect(() => {
    if (!selectedDate) {
      setSelectedTime("");
    }
  }, [selectedDate]);



  useEffect(() => {
    if (!otpVerified) {
      setSelectedDate(null);
      setSelectedTime("");
    }
  }, [otpVerified]);

  const totalDuration = events?.reduce((total, event) => {
    const serviceKey = event.name
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/(^_+|_+$)/g, "");

    if (services?.[serviceKey]) {
      return total + Number(event.duration || 0);
    }

    return total;
  }, 0) || 0;

  const BlacklistedProvidersView = () => {
    // Get provider details from the providers prop
    const getProviderDetails = (providerId) => {
      const provider = providers.find(p => p.id.toString() === providerId.toString());
      return provider || {
        id: providerId,
        name: `Provider ${providerId}`,
        picture_path: null
      };
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-3xl shadow-lg mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Hidden Providers
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Manage providers You&apos;ve hidden from your search results
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Header with actions */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Hidden Providers ({blacklistedProviders.length})
                </h2>
                <p className="text-gray-600 mt-1">
                  For: {userEmail}
                </p>
                <p className="text-gray-500 text-sm">
                  These providers are currently hidden from your search results
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Back to Providers Button */}
                <button
                  onClick={showProviders}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Booking
                </button>

                {blacklistedProviders.length > 0 && (
                  <button
                    onClick={handleUnblacklistAll}
                    disabled={loadingBlacklist}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Show All Again
                  </button>
                )}
              </div>
            </div>

            {/* Loading State */}
            {loadingBlacklist && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600">Loading hidden providers...</p>
              </div>
            )}

            {/* Empty State */}
            {!loadingBlacklist && blacklistedProviders.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Hidden Providers</h3>
                <p className="text-gray-600 mb-6">You haven&apos;t hidden any providers yet.</p>
                <button
                  onClick={showProviders}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Booking
                </button>
              </div>
            )}

            {/* Providers List */}
            {!loadingBlacklist && blacklistedProviders.length > 0 && (
              <div className="space-y-4">
                {blacklistedProviders.map((providerId) => {
                  const provider = getProviderDetails(providerId);
                  return (
                    <div
                      key={providerId}
                      className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <img
                            src={
                              provider.picture_path
                                ? process.env.NEXT_PUBLIC_BASE_URL_IMAGE + provider.picture_path
                                : "/images/placeholder.jpg"
                            }
                            alt={provider.name}
                            className="w-12 h-12 object-cover rounded-2xl shadow-md"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {provider.name}
                          </h3>
                          <p className="text-gray-600 text-sm">Provider ID: {providerId}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleUnblacklist(providerId)}
                        disabled={unblacklisting === providerId}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                      >
                        {unblacklisting === providerId ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Showing...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Show Again
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Main horizontal flow content - FIXED VERSION
  // const renderHorizontalFlow = () => {
  //   return (
  //     <div className="space-y-8">
  //       {/* MAP */}
  //       <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl p-6 border relative z-0">
  //         <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-3xl" />

  //         <button
  //           onClick={() => {
  //             sessionStorage.clear();
  //             window.location.reload();
  //           }}
  //           className="absolute top-4 right-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl shadow-lg"
  //         >
  //           Home
  //         </button>

  //         <h3 className="text-lg font-semibold mb-2">Provider Locations</h3>
  //         <p className="mb-4">View all available providers in your area</p>

  //         <ProvidersMap
  //           providers={filteredProviders.filter(p =>
  //             categories.some(cat =>
  //               cat.events?.some(e =>
  //                 p.services?.includes(Number(e))
  //               )
  //             )
  //           )}
  //           locations={locations}
  //           userLocation={clientLocation}
  //           searchWithin={searchWithin}
  //         />
  //       </div>

  //       {/* STEPS GRID */}
  //       <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

  //         {/* STEP 1 – CLIENT LOGIN */}
  //         <div className="bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col h-[650px]">

  //           {/* Header */}
  //           <div className="px-4 py-3 bg-indigo-50 flex items-center justify-between">
  //             <h3 className="text-lg font-bold">Client Login</h3>

  //             {otpVerified && (
  //               <button
  //                 onClick={handleLogout}
  //                 className="text-sm text-red-600 hover:text-red-700 font-medium"
  //               >
  //                 Logout
  //               </button>
  //             )}
  //           </div>
  //           <div className="flex-1 overflow-y-auto p-6">

  //             {!otpVerified ? (
  //               <form onSubmit={handleLoginCheck} className="space-y-5">

  //                 {/* Email */}
  //                 <div>
  //                   <label className="text-sm font-medium text-gray-600">
  //                     Email Address
  //                   </label>

  //                   <input
  //                     type="email"
  //                     placeholder="example@email.com"
  //                     value={loginData.email}
  //                     onChange={(e) => {
  //                       setLoginData(prev => ({
  //                         ...prev,
  //                         email: e.target.value
  //                       }));
  //                       setEmailError("");
  //                     }}
  //                     onBlur={() => {
  //                       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //                       if (!emailRegex.test(loginData.email)) {
  //                         setEmailError("Please enter a valid email (must include @ and .)");
  //                       }
  //                     }}
  //                     className={`mt-2 w-full px-4 py-3 border rounded-xl outline-none transition
  //     ${emailError
  //                         ? "border-red-500 focus:ring-red-500"
  //                         : "border-gray-300 focus:ring-2 focus:ring-indigo-500"
  //                       }`}
  //                   />

  //                   {emailError && (
  //                     <p className="text-red-500 text-sm mt-1">{emailError}</p>
  //                   )}
  //                 </div>




  //                 <div>
  //                   <label className="text-sm font-medium text-gray-600">
  //                     10-Digit Phone Number
  //                   </label>

  //                   <input
  //                     type="tel"
  //                     placeholder="(904) 112-0199"
  //                     value={formatPhoneDisplay(loginData.phonenumber)} // 👈 formatted display only
  //                     onChange={(e) => {
  //                       const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);

  //                       setLoginData(prev => ({
  //                         ...prev,
  //                         phonenumber: digitsOnly // 👈 store raw digits only
  //                       }));

  //                       if (otpError) setOtpError("");
  //                     }}
  //                     className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
  //                   />
  //                 </div>                  {otpError && (
  //                   <p className="text-red-500 text-sm">
  //                     {otpError}
  //                   </p>
  //                 )}

  //                 {/* Continue Button */}
  //                 {userFlow === "entry" && (
  //                   <button
  //                     type="submit"
  //                     disabled={otpLoading}
  //                     className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
  //                   >
  //                     {otpLoading ? "Checking..." : "Continue"}
  //                   </button>
  //                 )}

  //                 {/* OTP Section */}
  //                 {userFlow === "otp-verification" && (
  //                   <div className="space-y-4 pt-4 border-t">

  //                     <div>
  //                       <label className="text-sm font-medium text-gray-600">
  //                         Enter 6 Digit OTP
  //                       </label>
  //                       <input
  //                         type="text"
  //                         maxLength={6}
  //                         value={otp}
  //                         onChange={(e) => {
  //                           const value = e.target.value.replace(/\D/g, ""); // allow only digits
  //                           setOtp(value);
  //                           if (otpError) {
  //                             setOtpError("");
  //                           }

  //                         }}
  //                         className="mt-2 w-full text-center tracking-widest text-lg px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
  //                       />
  //                       {otpError && (
  //                         <p className="text-red-500 text-sm mt-2">
  //                           {otpError}
  //                         </p>
  //                       )}

  //                     </div>



  //                     <button
  //                       type="button"
  //                       onClick={handleVerifyOTP}
  //                       disabled={otp.length !== 6}
  //                       className={`w-full py-3 rounded-xl font-medium transition
  //   ${otp.length === 6
  //                           ? "bg-green-600 hover:bg-green-700 text-white"
  //                           : "bg-gray-300 text-gray-500 cursor-not-allowed"
  //                         }`}
  //                     >
  //                       Verify OTP
  //                     </button>
  //                   </div>
  //                 )}

  //                 {/* Register Section */}
  //                 {userFlow === "register-user" && (
  //                   <div className="space-y-4 pt-4 border-t">

  //                     <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl text-sm">
  //                       No account found. Please sign up to continue booking.
  //                     </div>

  //                     <div>
  //                       <label className="text-sm font-medium text-gray-600">
  //                         Full Name
  //                       </label>
  //                       <input
  //                         type="text"
  //                         placeholder="Enter your full name"
  //                         onChange={(e) =>
  //                           setFormData(prev => ({
  //                             ...prev,
  //                             name: e.target.value
  //                           }))
  //                         }
  //                         className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
  //                       />
  //                     </div>

  //                     <button
  //                       type="button"
  //                       onClick={handleRegisterUser}
  //                       className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition"
  //                     >
  //                       Register & Continue
  //                     </button>
  //                   </div>
  //                 )}

  //               </form>
  //             ) : (
  //               <div className="text-center mt-10">
  //                 <div className="text-green-600 text-2xl font-bold mb-2">
  //                   ✓ Logged In Successfully
  //                 </div>
  //                 <p className="text-gray-500">
  //                   You can now continue booking.
  //                 </p>
  //               </div>
  //             )}

  //           </div>
  //         </div>

  //         {/* STEP 1 – PROVIDER */}
  //         {/* STEP – PROVIDER */}
  //         <div className="bg-white rounded-2xl shadow-lg flex flex-col h-[650px]">
  //           <div className="px-4 py-3 bg-indigo-50">
  //             <h3 className="text-lg font-bold">Service Provider</h3>
  //           </div>

  //           <div className="flex-1 overflow-y-auto p-4">
  //             {otpVerified ? (
  //               <ProvidersSection
  //                 providers={filteredProviders}
  //                 locations={locations}
  //                 clientLocation={clientLocation}
  //                 searchWithin={searchWithin}
  //                 selectedProvider={selectedProvider}
  //                 userEmail={userEmail}
  //                 onProviderSelect={handleProviderSelect}
  //                 onBlacklist={handleBlacklist}
  //                 events={events}
  //                 categories={categories}
  //                 compactMode
  //                 setHoveredProvider={setHoveredProvider}
  //               />
  //             )
  //               : (
  //                 <StepLocked
  //                   title="Login Required"
  //                   message="Please login to select a provider"
  //                 />
  //               )
  //             }
  //           </div>
  //         </div>

  //         {/* STEP 2 – CATEGORY */}
  //         {/* <div className="bg-white rounded-2xl shadow-lg flex flex-col h-[650px]">
  //           <div className="px-4 py-3 bg-purple-50">
  //             <h3 className="text-lg font-bold">Services</h3>
  //           </div>
  //           <div className="flex-1 overflow-y-auto p-4">
  //             {selectedProvider ? (
  //               <ServiceCategorySection
  //                 selectedProvider={selectedProvider}
  //                 providers={providers}
  //                 events={events}
  //                 categories={categories}
  //                 selectedCategory={selectedCategory}
  //                 onCategorySelect={setSelectedCategory}
  //                 loading={loadingServices}
  //                 onCategoriesReady={setProviderCategories}
  //               />
  //             ) : (
  //               <StepLocked
  //                 title="Select a Provider"
  //                 message="Please choose a provider to view service categories"
  //               />
  //             )}
  //           </div>
  //         </div> */}

  //         {/* STEP 2 – SERVICES */}
  //         <div className="bg-white rounded-2xl shadow-lg flex flex-col h-[650px]">
  //           <div className="px-4 py-3 bg-purple-50">
  //             <h3 className="text-lg font-bold">
  //               {activeProvider
  //                 ? `${cleanName(activeProvider.name)}'s Services`
  //                 : "Services"}
  //             </h3>
  //           </div>

  //           <div className="flex-1 overflow-y-auto p-4">
  //             {otpVerified && activeProvider ? (<>
  //               {/* ⭐ Hidden data loader */}
  //               <ServiceCategorySection
  //                 selectedProvider={hoverProviderObj?.id || selectedProvider}
  //                 providers={providers}

  //                 events={events}
  //                 categories={categories}
  //                 loading={loadingServices}
  //                 onCategoriesReady={setProviderCategories}
  //               />

  //               {/* ⭐ Actual UI */}
  //               <ServiceSelectionSection
  //                 hoveredProvider={hoveredProvider}
  //                 categories={providerCategories}
  //                 services={services}
  //                 onCheckboxChange={handleCheckboxChange}
  //                 selectedProvider={selectedProvider}
  //                 providers={providers}
  //                 selectedCategory={searchCategory}
  //               />
  //             </>
  //             ) : (
  //               <StepLocked
  //                 title="Select a Provider"
  //                 message="Please choose a provider to view service categories"
  //               />
  //             )}
  //           </div>
  //         </div>


  //         {/* STEP 3 – SERVICE */}
  //         {/* <div className="bg-white rounded-2xl shadow-lg flex flex-col h-[650px]">
  //           <div className="px-4 py-3 bg-pink-50">
  //             <h3 className="text-lg font-bold">Selected Service</h3>
  //           </div>
  //           <div className="flex-1 overflow-y-auto p-4">
  //             {selectedCategory ? (
  //               <ServiceSelectionSection
  //                 categories={providerCategories}
  //                 selectedCategory={selectedCategory}
  //                 services={services}
  //                 onCheckboxChange={(e) => {
  //                   handleCheckboxChange(e);
  //                   handleServiceSelection(e.target.name);
  //                 }}
  //                 selectedProvider={selectedProvider}
  //                 providers={providers}
  //               />
  //             ) : (
  //               <StepLocked
  //                 title="Select Services"
  //                 message="Choose a service category to see available services"
  //               />
  //             )}
  //           </div>
  //         </div> */}

  //         {/* STEP 4 – AVAILABILITY */}
  //         <div className="bg-white rounded-2xl shadow-lg flex flex-col h-[650px]">
  //           <div className="px-4 py-3 bg-green-50">
  //             <h3 className="text-lg font-bold">Availability</h3>
  //           </div>
  //           <div ref={availabilityScrollRef} className="flex-1 overflow-y-auto p-4">
  //             {Object.values(services).some(Boolean) ? (
  //               <AvailabilitySection
  //                 key={otpVerified ? "logged-in" : "logged-out"}
  //                 scrollContainerRef={availabilityScrollRef}
  //                 workCalandar={workCalandar}
  //                 selectedDate={selectedDate}
  //                 selectedTime={selectedTime}
  //                 slots={slots}
  //                 onDateSelect={(date) => {
  //                   setSelectedDate(date);
  //                   setSelectedTime("");
  //                 }}
  //                 onTimeSelect={setSelectedTime}
  //                 loadingCalendar={loadingCalendar}
  //                 loadingTimeSlots={loadingTimeSlots}
  //                 totalDuration={totalDuration}
  //               />
  //             ) : (
  //               <StepLocked
  //                 title="Select Time Slot"
  //                 message="Choose a date and time to complete booking"
  //               />
  //             )}
  //           </div>
  //         </div>

  //         {/* STEP 5 – SUMMARY */}
  //         {/* <div className="bg-white rounded-2xl shadow-lg flex flex-col h-[650px]">
  //           <div className="px-4 py-3 bg-blue-50">
  //             <h3 className="text-lg font-bold">Complete Booking</h3>
  //           </div>
  //           <div className="flex-1 overflow-y-auto p-4">
  //             {selectedTime ? (
  //               <BookingSummary
  //                 selectedEvent={selectedEvent}
  //                 selectedProvider={selectedProvider}
  //                 selectedDate={selectedDate}
  //                 selectedTime={selectedTime}
  //                 events={events}
  //                 providers={providers}
  //                 dayMap={dayMap}
  //                 formData={formData}
  //                 onSubmit={handleSubmitWithNotification}
  //                 onChange={handleChange}
  //                 getSelectedServiceNames={getSelectedServiceNames}
  //                 submittingBooking={submittingBooking}
  //                 selectedTreatment={selectedTreatment}
  //                 currentEmail={currentEmail}
  //               />
  //             ) : (
  //               <StepLocked
  //                 title="Select Time Slot"
  //                 message="Choose a date and time to complete booking"
  //               />
  //             )}
  //           </div>
  //         </div> */}
  //       </div>
  //     </div>
  //   );
  // };

  return (
    <div className="w-full mx-auto mt-6 mb-16 p-6 space-y-10 bg-gradient-to-br from-white via-blue-50 to-indigo-100 shadow-2xl rounded-3xl border border-gray-100 relative">
      {/* Success Notification */}
      {showSuccess && bookingDetails && (
        <SuccessNotification
          bookingDetails={bookingDetails}
          onClose={handleCloseSuccess}
        />
      )}

      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20 blur-3xl"></div>
      {/* <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200 rounded-full translate-x-1/3 translate-y-1/3 opacity-20 blur-3xl"></div> */}

      {/* Header Section */}
      <div className="relative text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Find Door-To-Door Services
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Find the perfect service provider near you and schedule your appointment in just a few clicks
        </p>
      </div>

      {/* Show booking form only if not in success state */}
      {!showSuccess ? (
        <>
          {/* Search Section */}
          <div className="relative z-50">
            <SearchSection
              address={address}
              searchWithin={searchWithin}
              userEmail={userEmail}
              onFieldChange={handleFieldChange}
              onSearchWithinChange={setSearchWithin}
              onUserEmailChange={setUserEmail}
              onSearchClick={async () => {
                setSelectedProvider("");
                setSelectedServices([]);
                setActiveStep(1);
                await getLatLngFromAddress();
              }}
              loadingAddress={loadingAddress}
              onBackToHome={handleFullReset}
              resetForm={resetForm}
              searchCategory={searchCategory}
              onSearchCategoryChange={setSearchCategory}
              categories={availableCategories}
            />
          </div>

          {/* Loading State for Address Search */}
          {loadingAddress && (
            <div className="my-12 max-w-4xl mx-auto">
              <div className="relative bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-12 shadow-lg border border-indigo-100">
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Finding Your Location</h3>
                    <p className="text-gray-600">Searching for service providers in your area...</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isSearchedAddress && !loadingAddress && !loadingProviders && filteredProviders.length === 0 && (
            <div className="relative z-10">
              <NoProvidersSection
                address={address}
                userEmail={userEmail}
                onFieldChange={handleFieldChange}
                onSubmit={handleNotFoundSubmit}
                onNoThanks={handleNoThanks}
              />
            </div>
          )}

            //       {/* MAP */}
          <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl p-6 border relative z-0">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-3xl" />

            <button
              onClick={() => {
                sessionStorage.clear();
                window.location.reload();
              }}
              className="absolute top-4 right-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl shadow-lg"
            >
              Home
            </button>

            <h3 className="text-lg font-semibold mb-2">Provider Locations</h3>
            <p className="mb-4">View all available providers in your area</p>

            <ProvidersMap
              providers={filteredProviders.filter(p =>
                categories.some(cat =>
                  cat.events?.some(e =>
                    p.services?.includes(Number(e))
                  )
                )
              )}
              locations={locations}
              userLocation={clientLocation}
              searchWithin={searchWithin}
            />
          </div>


          {/* {isSearchedAddress && clientLocation && !loadingAddress && filteredProviders.length > 0 && (
  <ScheduleServices
    filteredProviders={filteredProviders}
    locations={locations}
    clientLocation={clientLocation}
    searchWithin={searchWithin}
    categories={categories}
    providers={providers}
    otpVerified={otpVerified}
    selectedProvider={selectedProvider}
    selectedDate={selectedDate}
    selectedTime={selectedTime}
    services={services}
    slots={slots}
    workCalandar={workCalandar}
    loadingCalendar={loadingCalendar}
    loadingTimeSlots={loadingTimeSlots}
    totalDuration={totalDuration}
    userEmail={userEmail}
    handleProviderSelect={handleProviderSelect}
    handleBlacklist={handleBlacklist}
    setHoveredProvider={setHoveredProvider}
    hoveredProvider={hoveredProvider}
    selectedServices={selectedServices}
    setSelectedDate={setSelectedDate}
    setSelectedTime={setSelectedTime}
    availabilityScrollRef={availabilityScrollRef}
    providerCategories={providerCategories}
    loadingServices={loadingServices}
    handleCheckboxChange={handleCheckboxChange}
    activeProvider={activeProvider}
    searchCategory={searchCategory}
  />
)} */}
        </>
      ) : (
        /* Success State - Option to book another appointment */
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleFullReset}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Book Another Appointment
            </button>
            <p className="text-gray-600 mt-4">
              Want to schedule another service? Start a new booking.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}