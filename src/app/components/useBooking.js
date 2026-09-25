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

function getLocationCoordinates(location) {
  if (!location) {
    return {
      lat: null,
      lng: null,
    };
  }

  const lat = Number(
    location.lat ??
    location.latitude ??
    location.latitude_deg
  );

  const lng = Number(
    location.lng ??
    location.lon ??
    location.long ??
    location.longitude ??
    location.longitude_deg
  );

  return {
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };
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

function getLocationProviderType(location) {
  const address2 = String(location?.address2 || "").trim();

  const studioMatch = address2.match(
    /^studio(?:[\s,]+(\d+(?:\.\d+)?))?$/i
  );

  if (studioMatch) {
    return {
      mode: "studio",
      isStudio: true,
      isMobile: false,
      distanceLimit: null,
    };
  }

  const mobileMatch = address2.match(
    /^mobile\s+(\d+(?:\.\d+)?)$/i
  );

  if (mobileMatch) {
    return {
      mode: "mobile",
      isStudio: false,
      isMobile: true,
      distanceLimit: Number(mobileMatch[1]),
    };
  }

  const numericMatch = address2.match(
    /^(\d+(?:\.\d+)?)$/
  );

  if (numericMatch) {
    return {
      mode: "mobile",
      isStudio: false,
      isMobile: true,
      distanceLimit: Number(numericMatch[1]),
    };
  }

  return {
    mode: null,
    isStudio: false,
    isMobile: false,
    distanceLimit: null,
  };
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
  const [providerSelectedDate, setProviderSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [workCalandar, setWorkCalandar] = useState(null);
  const [firstDay, setFirstDay] = useState(null);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [slots, setSlots] = useState([]);
  const [clientLocation, setClientLocation] = useState(null);
  const [searchWithin, setSearchWithin] = useState(50);
  const [selectedClient, setSelectedClient] = useState("");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchedAddress, setIsSearchedAddress] = useState(false);
  const [limitedLocations, setLimitedLocations] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [visibleProviders, setVisibleProviders] = useState([]);

  const [mobileProviders, setMobileProviders] = useState([]);
const [studioProviders, setStudioProviders] = useState([]);

const [mobileProvidersWithDistance, setMobileProvidersWithDistance] = useState([]);
const [studioProvidersWithDistance, setStudioProvidersWithDistance] = useState([]);


  const [userEmail, setUserEmail] = useState("");
  const [providerLimit, setProviderLimit] = useState(4);
  // New loading states
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [providersWithDistanceState, setProvidersWithDistanceState] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    privacy: false,
  });
  const [tempFormData, setTempFormData] = useState({
    fullAddress: "",
    city: "",
    state: "",
    zip: "",
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

    if (
      !searchCategory ||
      searchCategory === "ALL"
    ) {
      return true;
    }

    const category = categories.find(
      c => String(c.id) === String(searchCategory)
    );

    if (!category)
      return true;

    return provider.services?.some(serviceId =>
      category.events
        .map(Number)
        .includes(Number(serviceId))
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
    setProviderSelectedDate(null);
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

  async function handleBlacklist(providerId, locationData) {
    if (!userEmail) {
      alert("Please enter your email before Hiding a provider.");
      return;
    }

    try {
      const res = await fetch("/api/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, providerId, location: locationData, }),
      });

      const result = await res.json();

      if (result.success) {
        // instantly remove blacklisted provider
        // setFilteredProviders((prev) => prev.filter((p) => p.id !== providerId));
        // alert("Provider has been Hidden successfully!");
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
    // console.log("Selected place:", place);
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
    console.log("address inside get lat lon: ", address);
    try {
      const fullAddress = [
        address.fullAddress,
        address.city,
        address.state,
        address.zip,
      ]
        .filter(Boolean)
        .join(", ");

      const res = await fetch(
        `${LOCATIONIQ_API}?key=pk.6e77c85892d2eafd57fef22405d53630&q=${encodeURIComponent(fullAddress)}&format=json&limit=1`
      );

      const data = await res.json();
      // console.log("📍 Location data:", data);

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

  const providerHasServices = (provider) => {
    if (
        !Array.isArray(provider?.services) ||
        provider.services.length === 0
    ) {
        return false;
    }

    return provider.services.some((serviceId) =>
        eventArray.some(
            (event) => String(event.id) === String(serviceId)
        )
    );
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
        if (!selectedDate && calData) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let initialDate = null;

  // Check today first, then the next 6 days.
  for (let i = 0; i < 7; i++) {
    const candidateDate = new Date(today);
    candidateDate.setDate(today.getDate() + i);
    candidateDate.setHours(0, 0, 0, 0);

    const year = candidateDate.getFullYear();
    const month = String(candidateDate.getMonth() + 1).padStart(2, "0");
    const day = String(candidateDate.getDate()).padStart(2, "0");

    const key = `${year}-${month}-${day}`;
    const dayInfo = calData[key];

    const isDayOff =
      !dayInfo ||
      dayInfo.is_day_off === 1 ||
      dayInfo.is_day_off === "1" ||
      dayInfo.is_day_off === true;

    if (!isDayOff) {
      initialDate = candidateDate;
      break;
    }
  }

  if (initialDate) {
    setSelectedDate(initialDate);
    setProviderSelectedDate(initialDate);
  }
}
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
    console.log("🔎 Triggered provider filtering");

    // Clear results while required data is missing.
    if (!providerArray || providerArray.length === 0) {
      setFilteredProviders([]);
      setVisibleProviders([]);
      setProvidersWithDistanceState([]);
      setMobileProviders([]);
      setStudioProviders([]);
      setMobileProvidersWithDistance([]);
      setStudioProvidersWithDistance([]);
      setLoadingProviders(false);
      return;
    }

    if (
      !clientLocation ||
      !Number.isFinite(Number(clientLocation[0])) ||
      !Number.isFinite(Number(clientLocation[1]))
    ) {
      setFilteredProviders([]);
      setVisibleProviders([]);
      setProvidersWithDistanceState([]);
      setMobileProviders([]);
      setStudioProviders([]);
      setMobileProvidersWithDistance([]);
      setStudioProvidersWithDistance([]);
      setLoadingProviders(false);
      return;
    }

    setLoadingProviders(true);

    const userLat = Number(clientLocation[0]);
    const userLng = Number(clientLocation[1]);
    const customerSearchRadius = Number(searchWithin);

    /*
     * ---------------------------------------------------------
     * STEP 1: STATE-BASED FILTERING
     * ---------------------------------------------------------
     *
     * Keep a provider if at least one of its locations belongs
     * to the customer's selected state.
     */
    let stateFilteredProviders = providerArray
      .map((provider) => {
        const providerLocations = (provider.locations || [])
  .map((providerLocation) => {
    /*
     * Case 1:
     * provider.locations contains a location ID
     */
    if (
      typeof providerLocation === "string" ||
      typeof providerLocation === "number"
    ) {
      return locationArray.find(
        (location) =>
          String(location.id) === String(providerLocation)
      );
    }

    /*
     * Case 2:
     * provider.locations already contains
     * a location object.
     */
    if (
      providerLocation &&
      typeof providerLocation === "object"
    ) {
      const locationId =
        providerLocation.id ??
        providerLocation.locationId;

      if (locationId != null) {
        return (
          locationArray.find(
            (location) =>
              String(location.id) === String(locationId)
          ) || providerLocation
        );
      }

      return providerLocation;
    }

    return null;
  })
  .filter(Boolean);

  console.log("🏢 PROVIDER LOCATION MAPPING", {
  providerId: provider.id,
  providerName: provider.name,

  providerLocationIds: provider.locations,

  resolvedLocations: providerLocations.map((location) => ({
    id: location.id,
    title: location.title,
    address2: location.address2,
    lat: location.lat,
    lng: location.lng,
    lon: location.lon,
    latitude: location.latitude,
    longitude: location.longitude,
  })),
});

        if (providerLocations.length === 0) {
          return null;
        }

        // If there is no valid state, keep all providers
        // that have valid locations.
        if (!address.state || address.state.length !== 2) {
          return {
            ...provider,
            providerLocations,
          };
        }

        const hasMatchingState = providerLocations.some(
          (location) => {
            const { state } = getStateFromLocation(
              location,
              address.state
            );

            return state === address.state;
          }
        );

        if (!hasMatchingState) {
          console.log(
            `❌ Provider ${provider.id} filtered - state mismatch`
          );

          return null;
        }

        return {
          ...provider,
          providerLocations,
        };
      })
      .filter(Boolean);

    console.log(
      "📍 Providers after state filtering:",
      stateFilteredProviders.length
    );

    /*
     * ---------------------------------------------------------
     * STEP 2: LOCATION-BASED TYPE + DISTANCE FILTERING
     * ---------------------------------------------------------
     *
     * address2 determines the type of EACH LOCATION:
     *
     * Studio:
     *   "Studio"
     *   "Studio 0"
     *   "Studio, 0"
     *
     * Mobile:
     *   numeric value such as "26"
     *
     * Unknown address2:
     *   ignored
     *
     * IMPORTANT:
     *
     * We evaluate every provider location independently.
     *
     * We DO NOT first decide:
     *
     *     "provider has a Studio location"
     *
     * and then ignore its Mobile locations.
     *
     * Instead, every location must pass its own rules.
     */
    const eligibleProviderRecords = [];

    stateFilteredProviders.forEach((provider) => {
      const configuredLocations = [];

      (provider.providerLocations || []).forEach((location) => {
        const config = getLocationProviderType(location);

        /*
         * Ignore unknown/invalid address2 values.
         *
         * This prevents an unknown location from accidentally
         * becoming a Mobile provider.
         */
        if (!config.mode) {
          console.log(
            "⚠️ Ignoring invalid provider location configuration:",
            {
              providerId: provider.id,
              locationId: location.id,
              address2: location.address2,
              title: location.title,
            }
          );

          return;
        }

        const { lat, lng } = getLocationCoordinates(location);

/*
 * Ignore locations without valid coordinates.
 */
if (
  !Number.isFinite(lat) ||
  !Number.isFinite(lng)
) {
  console.log(
    "⚠️ Ignoring provider location with invalid coordinates:",
    {
      providerId: provider.id,
      providerName: provider.name,
      locationId: location.id,
      locationTitle: location.title,
      address2: location.address2,

      rawLat: location.lat,
      rawLng: location.lng,
      rawLon: location.lon,
      rawLatitude: location.latitude,
      rawLongitude: location.longitude,
    }
  );

  return;
}

/*
 * Calculate distance from THIS CUSTOMER
 * to THIS PROVIDER LOCATION.
 */
const distance = getDistance(
  userLat,
  userLng,
  lat,
  lng
);

console.log("📍 DISTANCE CALCULATION", {
  providerId: provider.id,
  providerName: provider.name,

  locationId: location.id,
  locationTitle: location.title,
  address2: location.address2,

  customer: {
    lat: userLat,
    lng: userLng,
  },

  providerLocation: {
    lat,
    lng,
  },

  distance,
});

        /*
         * Customer search radius applies to BOTH Mobile
         * and Studio.
         */
        const withinCustomerRadius =
          distance <= customerSearchRadius;

        console.log("location: ", location);
        console.log("distance: ", distance);
        console.log("customerSearchRadius: ", customerSearchRadius);
        console.log("withinCustomerRadius: ", withinCustomerRadius);

        /*
         * Studio:
         * No provider travel limit.
         *
         * Mobile:
         * address2 contains the provider's maximum travel
         * distance.
         */
        const withinProviderTravelLimit =
          config.isStudio
            ? true
            : distance <= Number(config.distanceLimit);

        /*
         * A location is eligible only if BOTH conditions
         * are satisfied.
         */
        const eligible =
          withinCustomerRadius &&
          withinProviderTravelLimit;

        configuredLocations.push({
          location,
          config,
          distance,
          withinCustomerRadius,
          withinProviderTravelLimit,
          eligible,
        });
      });

      /*
       * Only use locations that actually passed all rules.
       */
      const eligibleLocations =
        configuredLocations.filter(
          (record) => record.eligible
        );

      /*
       * If no location is eligible, this provider must NOT
       * appear in either Mobile or Studio.
       */
      if (eligibleLocations.length === 0) {
        console.log(
          `❌ Provider ${provider.id} filtered - no eligible location`,
          {
            providerId: provider.id,
            searchWithin: customerSearchRadius,
            locations: configuredLocations.map(
              (record) => ({
                locationId: record.location?.id,
                address2: record.location?.address2,
                type: record.config.mode,
                distance: Number(
                  record.distance.toFixed(2)
                ),
                providerLimit:
                  record.config.distanceLimit,
                withinCustomerRadius:
                  record.withinCustomerRadius,
                withinProviderTravelLimit:
                  record.withinProviderTravelLimit,
              })
            ),
          }
        );

        return;
      }

      /*
       * -------------------------------------------------------
       * FIND ELIGIBLE LOCATIONS BY TYPE
       * -------------------------------------------------------
       */
      const eligibleStudioLocations =
        eligibleLocations.filter(
          (record) => record.config.isStudio
        );

      const eligibleMobileLocations =
        eligibleLocations.filter(
          (record) => record.config.isMobile
        );

      /*
       * Find the nearest ELIGIBLE Studio location.
       */
      const nearestStudio =
        eligibleStudioLocations.length > 0
          ? eligibleStudioLocations.reduce(
              (nearest, current) =>
                current.distance < nearest.distance
                  ? current
                  : nearest
            )
          : null;

      /*
       * Find the nearest ELIGIBLE Mobile location.
       */
      const nearestMobile =
        eligibleMobileLocations.length > 0
          ? eligibleMobileLocations.reduce(
              (nearest, current) =>
                current.distance < nearest.distance
                  ? current
                  : nearest
            )
          : null;

      /*
       * -------------------------------------------------------
       * DETERMINE FINAL PROVIDER TYPE
       * -------------------------------------------------------
       *
       * Existing application behavior is preserved:
       *
       *   eligible Studio location → Studio
       *
       *   otherwise eligible Mobile location → Mobile
       *
       * The critical difference is that the location MUST
       * first pass the distance rules.
       */
      let selectedRecord = null;
      let providerMode = null;

      if (nearestStudio) {
        selectedRecord = nearestStudio;
        providerMode = "studio";
      } else if (nearestMobile) {
        selectedRecord = nearestMobile;
        providerMode = "mobile";
      }

      /*
       * Safety check.
       */
      if (!selectedRecord) {
        return;
      }

      /*
       * -------------------------------------------------------
       * CREATE FINAL PROVIDER OBJECT
       * -------------------------------------------------------
       *
       * distance, nearestLocation, providerMode and
       * distanceLimit ALL come from the SAME location.
       */
      const finalProvider = {
  ...provider,

  // Keep the provider's existing services when available.
  // Studio providers may not have a top-level `services`
  // array, so use the selected location's events as the
  // service list in that case.
  services: Array.isArray(provider.services)
        ? provider.services
            .map(Number)
            .filter(Number.isFinite)
        : [],

  distance: selectedRecord.distance,

  nearestLocation:
    selectedRecord.location,

  providerMode,

  isStudio:
    providerMode === "studio",

  isMobile:
    providerMode === "mobile",

  distanceLimit:
    providerMode === "mobile"
      ? selectedRecord.config.distanceLimit
      : null,
};

      eligibleProviderRecords.push(
        finalProvider
      );
    });

    /*
     * Sort all eligible providers by their actual eligible
     * location distance.
     */
    const providersWithDistance =
      eligibleProviderRecords.sort(
        (a, b) =>
          a.distance - b.distance
      );

    console.log(
      "✅ Providers after location-based distance filtering:",
      providersWithDistance.map((provider) => ({
        id: provider.id,
        name: provider.name,
        type: provider.providerMode,
        distance: Number(
          provider.distance.toFixed(2)
        ),
        providerLimit:
          provider.distanceLimit,
        locationId:
          provider.nearestLocation?.id,
        location:
          provider.nearestLocation?.title,
        address2:
          provider.nearestLocation?.address2,
      }))
    );

    setProvidersWithDistanceState(
      providersWithDistance
    );

    const limitedProviders =
      providersWithDistance;

    /*
     * ---------------------------------------------------------
     * STEP 3: BLACKLIST + BOOKING PRIORITY
     * ---------------------------------------------------------
     */
    async function filterProviders() {
      try {
        let finalList = limitedProviders;

        /*
         * If the user has an email, apply blacklist and
         * booking priority.
         */
        if (userEmail) {
          const blacklistRes = await fetch(
            `/api/blacklist?email=${encodeURIComponent(
              userEmail
            )}`
          );

          const blacklistData =
            await blacklistRes.json();

          const blockedIds =
            blacklistData?.blockedProviderIds || [];

          const bookingRes = await fetch(
            `/api/bookings?email=${encodeURIComponent(
              userEmail
            )}`
          );

          const bookingData =
            await bookingRes.json();

          const providerLastBookingMap =
            new Map();

          bookingData?.data?.forEach(
            (booking) => {
              const providerId =
                booking.provider?.toString();

              const bookingDate = new Date(
                booking.createdAt ||
                  booking.date
              );

              if (!providerId) return;

              if (
                !providerLastBookingMap.has(
                  providerId
                )
              ) {
                providerLastBookingMap.set(
                  providerId,
                  bookingDate
                );
              } else if (
                bookingDate >
                providerLastBookingMap.get(
                  providerId
                )
              ) {
                providerLastBookingMap.set(
                  providerId,
                  bookingDate
                );
              }
            }
          );

          /*
           * Remove blacklisted providers.
           */
          finalList = limitedProviders.filter(
            (provider) =>
              !blockedIds.includes(
                provider.id.toString()
              )
          );

          /*
           * Existing booking priority.
           */
          finalList.sort((a, b) => {
            const aLast =
              providerLastBookingMap.get(
                a.id.toString()
              );

            const bLast =
              providerLastBookingMap.get(
                b.id.toString()
              );

            if (aLast && bLast) {
              return bLast - aLast;
            }

            if (aLast) return -1;

            if (bLast) return 1;

            return a.distance - b.distance;
          });
        }

        /*
 * FINAL ELIGIBLE PROVIDERS
 *
 * Filter out providers without valid services BEFORE
 * setting the main provider lists and applying the limit.
 */
const providersWithServices = finalList.filter(
    providerHasServices
);

setVisibleProviders(providersWithServices);

/*
 * Apply the selected category filter after the service filter.
 */
const categoryFilteredProviders =
    providersWithServices.filter(
        providerMatchesSearchCategory
    );

setFilteredProviders(categoryFilteredProviders);

/*
 * Split the same filtered list into Mobile and Studio.
 */
const mobileProvidersList =
    categoryFilteredProviders.filter(
        (provider) => provider.providerMode === "mobile"
    );

const studioProvidersList =
    categoryFilteredProviders.filter(
        (provider) => provider.providerMode === "studio"
    );

setMobileProviders(mobileProvidersList);
setStudioProviders(studioProvidersList);

setMobileProvidersWithDistance(mobileProvidersList);
setStudioProvidersWithDistance(studioProvidersList);
        
      } catch (err) {
        console.error(
          "❌ Provider filtering error:",
          err
        );
const providersWithServices = limitedProviders.filter(
    providerHasServices
);

setVisibleProviders(providersWithServices);

const categoryFilteredProviders =
    providersWithServices.filter(
        providerMatchesSearchCategory
    );

setFilteredProviders(categoryFilteredProviders);

const mobileProvidersList =
    categoryFilteredProviders.filter(
        (provider) => provider.providerMode === "mobile"
    );

const studioProvidersList =
    categoryFilteredProviders.filter(
        (provider) => provider.providerMode === "studio"
    );

setMobileProviders(mobileProvidersList);
setStudioProviders(studioProvidersList);

setMobileProvidersWithDistance(mobileProvidersList);
setStudioProvidersWithDistance(studioProvidersList);
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
    categories,
    providerLimit,
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
    visibleProviders,
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
    tempFormData,
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
    providerSelectedDate,
    setSelectedTime,
    getLatLngFromAddress,
    handleNotFoundSubmit,
    handleMonthChange,
    resetBooking,
    getSelectedServiceNames,
    setFormData,
    setFilteredProviders,
    setTempFormData,
    providerLimit,
    setProviderLimit,
    providersWithDistance: providersWithDistanceState,
    mobileProviders,
studioProviders,
mobileProvidersWithDistance,
studioProvidersWithDistance,

  };
}