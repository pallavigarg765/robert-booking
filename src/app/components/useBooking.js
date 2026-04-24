import { useState, useEffect } from "react";

const LOCATIONIQ_AUTOCOMPLETE = "https://us1.locationiq.com/v1/autocomplete.php";
const LOCATIONIQ_API = "https://us1.locationiq.com/v1/search";

// Add the distance calculation function at the top level of the hook
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper function to convert state names to codes
function stateNameToCode(stateName) {
  const stateMap = {
    'pennsylvania': 'PA',
    'new jersey': 'NJ',
    'new york': 'NY',
    'california': 'CA',
    'texas': 'TX',
    'florida': 'FL',
    'illinois': 'IL',
    'ohio': 'OH',
    'georgia': 'GA',
    'michigan': 'MI',
    'north carolina': 'NC',
    'virginia': 'VA',
    'washington': 'WA',
    'arizona': 'AZ',
    'massachusetts': 'MA',
    'tennessee': 'TN',
    'indiana': 'IN',
    'missouri': 'MO',
    'maryland': 'MD',
    'wisconsin': 'WI',
    'colorado': 'CO',
    'minnesota': 'MN',
    'south carolina': 'SC',
    'alabama': 'AL',
    'louisiana': 'LA',
    'kentucky': 'KY',
    'oregon': 'OR',
    'oklahoma': 'OK',
    'connecticut': 'CT',
    'iowa': 'IA',
    'utah': 'UT',
    'nevada': 'NV',
    'arkansas': 'AR',
    'mississippi': 'MS',
    'kansas': 'KS',
    'new mexico': 'NM',
    'nebraska': 'NE',
    'west virginia': 'WV',
    'idaho': 'ID',
    'hawaii': 'HI',
    'new hampshire': 'NH',
    'maine': 'ME',
    'rhode island': 'RI',
    'montana': 'MT',
    'delaware': 'DE',
    'south dakota': 'SD',
    'north dakota': 'ND',
    'alaska': 'AK',
    'vermont': 'VT',
    'wyoming': 'WY'
  };

  const normalizedName = stateName.toLowerCase().trim();
  return stateMap[normalizedName] || '';
}

// Helper function to normalize state (convert names to codes, ensure uppercase)
function normalizeState(state) {
  if (!state) return '';

  // If it's already a 2-letter code, return uppercase
  if (state.length === 2 && /^[A-Za-z]{2}$/.test(state)) {
    return state.toUpperCase();
  }

  // If it's a state name, convert to code
  return stateNameToCode(state);
}


// Helper function to extract state and address2 from location
function getStateFromLocation(location, userState = '') {
  if (!location) return { state: '', address2: '' };

  const extractedAddress2 = location.address2 || '';

  const normalizedUserState = normalizeState(userState);

  if (location.state) {
    
    const normalizedState = normalizeState(location.state);
   

    if (normalizedUserState && normalizedState === normalizedUserState) {
      return { state: normalizedState, address2: extractedAddress2 };
    }

    if (!normalizedUserState) {
      return { state: normalizedState, address2: extractedAddress2 };
    }
  }

  if (location.address2) {
    
    const normalizedState = normalizeState(location.address2);
    

    if (normalizedUserState && normalizedState === normalizedUserState) {
      return { state: normalizedState, address2: extractedAddress2 };
    }
    if (!normalizedUserState) {
      return { state: normalizedState, address2: extractedAddress2 };
    }
  }

  if (location.title) {
    

    // e.g. "729 Stryker Avenue, Doylestown, PA" → "PA"
    const parts = location.title.split(',');
    if (parts.length >= 3) {
      const statePart = parts[parts.length - 1].trim();
      

      const normalizedState = normalizeState(statePart);
     

      // If user provided a state, check if it matches
      if (normalizedUserState && normalizedState === normalizedUserState) {
        return { state: normalizedState, address2: extractedAddress2 };
      }
      // If no user state provided, return the location state
      if (!normalizedUserState) {
        return { state: normalizedState, address2: extractedAddress2 };
      }
    }
  }

  
  return { state: '', address2: extractedAddress2 };
}
// Improved function to extract state from LocationIQ place object
function extractStateFromPlace(place) {


  // First try to get state from address object (LocationIQ usually has this)
  if (place.address) {
    // Try different possible state fields in LocationIQ response
    if (place.address.state) {
      
      return normalizeState(place.address.state);
    }
    if (place.address.state_code) {
      
      return normalizeState(place.address.state_code);
    }
  }

  // Try to extract from display_name as fallback
  if (place.display_name) {
    
    const parts = place.display_name.split(',');

    // Look for state in the last few parts
    for (let i = Math.max(0, parts.length - 3); i < parts.length; i++) {
      const part = parts[i].trim();

      // If it's a 2-letter uppercase code, it's likely a state
      if (part.length === 2 && /^[A-Z]{2}$/.test(part)) {
       
        return part;
      }

      // If it's a state name, convert to code
      const stateCode = stateNameToCode(part);
      if (stateCode) {
       
        return stateCode;
      }
    }
  }

  return '';
}

export function useBooking({ providers, events, locations, clients, categories, searchCategory }) {
  // Convert props to arrays
  const providerArray = Array.isArray(providers) ? providers : Object.values(providers || {});
  const eventArray = Array.isArray(events) ? events : Object.values(events || {});
  const clientsArray = Array.isArray(clients) ? clients : Object.values(clients || {});
  const locationArray = Array.isArray(locations) ? locations : Object.values(locations || {});

  // State declarations
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [workCalandar, setWorkCalandar] = useState(null);
  const [firstDay, setFirstDay] = useState(null);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [slots, setSlots] = useState([]);
  const [clientLocation, setClientLocation] = useState(null);
  const [searchWithin, setSearchWithin] = useState(20);
  const [selectedClient, setSelectedClient] = useState("");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchedAddress, setIsSearchedAddress] = useState(false);
  const [limitedLocations, setLimitedLocations] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [userEmail, setUserEmail] = useState("");

  // New loading states
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    privacy: false,
  });

  const [address, setAddress] = useState({
    fullAddress: "",
    lat: "",
    lon: "",
    city: "",
    state: "",
    zip: ""
  });

  // Make services state dynamic based on events
  const [services, setServices] = useState({});

  const providerMatchesSearchCategory = (provider) => {
    if (!searchCategory || searchCategory === "ALL") return true;

    const category = categories?.find(
      c => c.id.toString() === searchCategory.toString()
    );

    if (!category) return true;

    const categoryEvents = category.events.map(Number);

    return provider.services?.some(serviceId =>
      categoryEvents.includes(Number(serviceId))
    );
  };

  // Initialize dynamic services state based on events
  useEffect(() => {
    if (events && Array.isArray(events)) {
      const initialServices = {};

      events.forEach(event => {
        if (event.id && event.name) {
          // Create consistent key from service name
          const key = event.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/(^_+|_+$)/g, '');

          initialServices[key] = false;
        }
      });

      setServices(initialServices);
     
    }
  }, [events]);

  // Handler functions
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setServices((prev) => ({
      ...prev,
      [name]: checked
    }));
  };

  const resetBooking = () => {
    setSelectedEvent("");
    setSelectedProvider("");
    setSelectedDate(null);
    setSelectedTime("");
    setWorkCalandar(null);
    setFirstDay(null);
    setSlots([]);
    setSelectedClient("");
    setQuery("");
    setSuggestions([]);
    setIsSearchedAddress(false);
    setLimitedLocations([]);
    setFilteredProviders([]);
    setFormData({
      name: "",
      email: "",
      phone: "",
      privacy: false,
    });

    // Reset services to all false but keep the structure
    if (events && Array.isArray(events)) {
      const resetServices = {};
      events.forEach(event => {
        if (event.id && event.name) {
          const key = event.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/(^_+|_+$)/g, '');
          resetServices[key] = false;
        }
      });
      setServices(resetServices);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmittingBooking(true);

    if (!formData.privacy) {
      alert("You must agree to the Privacy Policy before booking.");
      setSubmittingBooking(false);
      return;
    }

    if (!address.fullAddress || !address.lat || !address.lon) {
      alert("Please provide a valid address with latitude and longitude.");
      setSubmittingBooking(false);
      return;
    }

    const bookingData = {
      provider: selectedProvider,
      date: selectedDate,
      time: selectedTime,
      fullname: formData.name,
      email: formData.email,
      phonenumber: formData.phone,
      clientaddress: {
        fullAddress: address.fullAddress,
        lat: address.lat,
        lon: address.lon,
        city: address.city,
        state: address.state,
      },
      services, // This now contains the dynamic service keys
    };

   

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (!res.ok) {
        throw new Error("Failed to create booking");
      }

      const data = await res.json();
      console.log("✅ Booking created:", data);

      // Reset everything after successful booking
      resetBooking();

      // Return success for notification
      return { success: true, data };
    } catch (err) {
      console.error("❌ Error creating booking:", err);
      return { success: false, error: err.message };
    } finally {
      setSubmittingBooking(false);
    }
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

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    switch (name) {
      case "city":
        // Capitalize first letter of each word, remove numbers/symbols
        formattedValue = value
          .toLowerCase()
          .replace(/[^a-zA-Z\s]/g, "") // keep only letters and spaces
          .replace(/\b\w/g, (char) => char.toUpperCase());
        break;

      case "state":
        // Allow only 2 uppercase letters
        formattedValue = value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
        break;

      case "zip":
        // Allow only 5 numeric digits
        formattedValue = value.replace(/\D/g, "").slice(0, 5);
        break;

      default:
        formattedValue = value;
        break;
    }

    setAddress((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `${LOCATIONIQ_AUTOCOMPLETE}?key=pk.6e77c85892d2eafd57fef22405d53630&q=${encodeURIComponent(
          value
        )}&limit=5&format=json`
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Autocomplete error:", err);
    }
  };

  const handleSearchSelect = (place) => {
    setQuery(place.display_name);
    setSuggestions([]);
    console.log("Selected place:", place);
    setClientLocation([place.lat, place.lon]);

    // Extract state from the selected place
    const state = extractStateFromPlace(place);
    console.log("Extracted state from place:", state);
    setAddress(prev => ({
      ...prev,
      state: state
    }));
  };

  const getLatLngFromAddress = async () => {
    setLoadingAddress(true);
    try {
      const fullAddress = [
        address.address1,
        address.address2,
        address.city,
        address.zip,
        address.state,
        address.country,
      ]
        .filter(Boolean)
        .join(", ");

      const res = await fetch(
        `${LOCATIONIQ_API}?key=pk.6e77c85892d2eafd57fef22405d53630&q=${encodeURIComponent(fullAddress)}&format=json&limit=1`
      );

      const data = await res.json();
      console.log("📍 Location data:", data);

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No location found");
      }

      const location = data[0];
      const extractedState = extractStateFromPlace(location);

      setAddress((prev) => ({
        ...prev,
        fullAddress: location.display_name,
        lat: location.lat,
        lon: location.lon,
        state: extractedState || prev.state,
      }));

      setIsSearchedAddress(true);
      setClientLocation([parseFloat(location.lat), parseFloat(location.lon)]);
    } catch (error) {
      console.error("❌ Error fetching location:", error);
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleNotFoundSubmit = async () => {
    if (address.email === "" || address.phone === "") {
      alert("Email and Phone is required...");
      return;
    }

    setAddress({
      email: "",
      phone: "",
      street1: "",
      city: "",
      zip: "",
      state: "",
      country: "US",
    });
    setIsSearchedAddress(false);
    setFilteredProviders([]);
    alert("We have received your request. We will contact you once we are available in your area.");
    return;
  }

  // ADD THE MONTH CHANGE HANDLER
  const handleMonthChange = async (date) => {
    setLoadingCalendar(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const performerId = selectedProvider;

      const res = await fetch(
        `/api/work-calendar?year=${year}&month=${month}&performerId=${performerId}`
      );
      const data = await res.json();
      setWorkCalandar(data);
    } catch (err) {
      console.error("Error fetching calendar for month change:", err);
    } finally {
      setLoadingCalendar(false);
    }
  };

  // Update getSelectedServiceNames to work with dynamic services
  const getSelectedServiceNames = () => {
    const selectedServices = Object.entries(services)
      .filter(([_, isSelected]) => isSelected)
      .map(([key]) => {
        // Find the service name from events data
        if (events && Array.isArray(events)) {
          const service = events.find(event => {
            const eventKey = event.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '_')
              .replace(/(^_+|_+$)/g, '');
            return eventKey === key;
          });
          return service ? service.name : key;
        }
        return key;
      });

    return selectedServices.length > 0 ? selectedServices.join(", ") : "No services selected";
  };

  useEffect(() => {
    if (!selectedProvider) return;

    setLoadingServices(true);
    const fetchData = async () => {
      try {
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        const performerId = selectedProvider;

        const [calRes, dayRes] = await Promise.all([
          fetch(
            `/api/work-calendar?year=${year}&month=${month}&performerId=${performerId}`
          ),
          fetch(
            `/api/first-day?year=${year}&month=${month}&performerId=${performerId}`
          ),
        ]);

        const calData = await calRes.json();
        const dayData = await dayRes.json();

        setWorkCalandar(calData);
        setFirstDay(dayData);
      } catch (err) {
        console.error("Error fetching calendar:", err);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchData();
  }, [selectedProvider]);

  useEffect(() => {
    if (!selectedDate || !workCalandar) {
      setSlots([]);
      return;
    }

    setLoadingTimeSlots(true);

    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;

    const dayInfo = workCalandar[key];
    if (!dayInfo || parseInt(dayInfo.is_day_off) === 1) {
      setSlots([]);
      setLoadingTimeSlots(false);
      return;
    }

    let [startHour, startMin] = dayInfo.from.split(":").map(Number);
    let [endHour, endMin] = dayInfo.to.split(":").map(Number);

    const slotsArr = [];
    const start = new Date(selectedDate);
    start.setHours(startHour, startMin, 0, 0);

    const end = new Date(selectedDate);
    end.setHours(endHour, endMin, 0, 0);

    let current = new Date(start);
    while (current < end) {
      const hh = String(current.getHours()).padStart(2, "0");
      const mm = String(current.getMinutes()).padStart(2, "0");
      slotsArr.push(`${hh}:${mm}`);
      current.setMinutes(current.getMinutes() + 30);
    }

    setSlots(slotsArr);
    setLoadingTimeSlots(false);
  }, [selectedDate, workCalandar]);

useEffect(() => {
  console.log("🔍 Filtering providers...");
  console.log("Client location:", clientLocation);
  console.log("Client state:", address.state);

  if (!providerArray || providerArray.length === 0) {
    setFilteredProviders([]);
    return;
  }

  if (!clientLocation) {
    setFilteredProviders([]);
    return;
  }

  setLoadingProviders(true);

  const [userLat, userLng] = clientLocation;

  /* ---------------------------------------------
     STEP 1: STATE-BASED FILTERING (STRICT)
  ---------------------------------------------- */

  let stateFilteredProviders = providerArray;

  if (address.state && address.state.length === 2) {
    stateFilteredProviders = providerArray
      .map((p) => {
        const providerLocations = p.locations
          ?.map((locId) => locationArray.find((l) => l.id === locId))
          .filter(Boolean);

        if (!providerLocations?.length) return null;

        let matchesState = false;

        for (const loc of providerLocations) {
          const { state } = getStateFromLocation(loc, address.state);
          if (state === address.state) {
            matchesState = true;
            break;
          }
        }

        if (!matchesState) {
          console.log(`❌ Provider ${p.id} filtered - state mismatch`);
          return null;
        }

        return {
          ...p,
          providerLocations,
        };
      })
      .filter(Boolean);

    console.log(
      "Providers after state filtering:",
      stateFilteredProviders.length
    );
  } else {
    // If no valid state, keep providers with valid locations
    stateFilteredProviders = providerArray
      .map((p) => ({
        ...p,
        providerLocations: p.locations
          ?.map((locId) => locationArray.find((l) => l.id === locId))
          .filter(Boolean),
      }))
      .filter((p) => p.providerLocations?.length);
  }

  /* ---------------------------------------------
     STEP 2: DISTANCE FILTERING
     address2 = service distance limit
     address2 = "0" → NO travel allowed
  ---------------------------------------------- */

  const providersWithDistance = stateFilteredProviders
    .map((p) => {
      let minDistance = Infinity;
      let nearestLocation = null;
      let distanceLimit = 0; // default: no travel allowed

      p.providerLocations.forEach((loc) => {
        const dist = getDistance(
          userLat,
          userLng,
          parseFloat(loc.lat),
          parseFloat(loc.lng)
        );

        let locLimit = Number(loc.address2);
        if (isNaN(locLimit) || locLimit < 0) locLimit = 0;

        // choose nearest location
        if (dist < minDistance) {
          minDistance = dist;
          nearestLocation = loc;
          distanceLimit = locLimit;
        }
      });

      return {
        ...p,
        distance: minDistance,
        nearestLocation,
        distanceLimit,
      };
    })
    .filter((p) => {
      const withinUserRadius = p.distance <= searchWithin;
      const withinProviderLimit = p.distance <= p.distanceLimit;

      if (!withinProviderLimit) {
        console.log(
          `❌ Provider ${p.id} filtered - exceeds provider limit (${p.distance} > ${p.distanceLimit})`
        );
      }

      return withinUserRadius && withinProviderLimit;
    })
    .sort((a, b) => a.distance - b.distance);

  console.log(
    "Providers after distance filtering:",
    providersWithDistance.length
  );

  const categoryFilteredProviders = providersWithDistance.filter(providerMatchesSearchCategory);

  console.log(
    "Providers after category filtering:",
    categoryFilteredProviders.length
  );

  /* ---------------------------------------------
     STEP 3: LIMIT TO NEAREST 4
  ---------------------------------------------- */

  const limitedProviders = categoryFilteredProviders.slice(0, 4);

  /* ---------------------------------------------
     STEP 4 + 5: BLACKLIST + BOOKING PRIORITY
  ---------------------------------------------- */

  async function filterProviders() {
    if (!userEmail) {
      setFilteredProviders(limitedProviders);
      setLoadingProviders(false);
      return;
    }

    try {
      const blacklistRes = await fetch(`/api/blacklist?email=${userEmail}`);
      const blacklistData = await blacklistRes.json();
      const blockedIds = blacklistData?.blockedProviderIds || [];

      const bookingRes = await fetch(`/api/bookings?email=${userEmail}`);
      const bookingData = await bookingRes.json();

      const providerLastBookingMap = new Map();

      bookingData?.data?.forEach((booking) => {
        const providerId = booking.provider?.toString();
        const bookingDate = new Date(booking.createdAt || booking.date);

        if (!providerId) return;

        if (!providerLastBookingMap.has(providerId)) {
          providerLastBookingMap.set(providerId, bookingDate);
        } else if (bookingDate > providerLastBookingMap.get(providerId)) {
          providerLastBookingMap.set(providerId, bookingDate);
        }
      });

      let finalList = limitedProviders.filter(
        (p) => !blockedIds.includes(p.id.toString())
      );

      finalList.sort((a, b) => {
        const aLast = providerLastBookingMap.get(a.id.toString());
        const bLast = providerLastBookingMap.get(b.id.toString());

        if (aLast && bLast) return bLast - aLast;
        if (aLast) return -1;
        if (bLast) return 1;
        return a.distance - b.distance;
      });

      setFilteredProviders(finalList);
    } catch (err) {
      console.error("Provider filtering error:", err);
      setFilteredProviders(limitedProviders);
    } finally {
      setLoadingProviders(false);
    }
  }

  filterProviders();
}, [
  clientLocation,
  searchWithin,
  providerArray,
  locationArray,
  userEmail,
  address.state,
  searchCategory,
  categories
]);

  return {
    // State
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

    // Loading States
    loadingProviders,
    loadingServices,
    loadingTimeSlots,
    submittingBooking,
    loadingAddress,

    // Handlers
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
    resetBooking,
    getSelectedServiceNames,
    setFormData
  };
}