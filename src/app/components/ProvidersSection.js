"use client";

import ProvidersMap from "./ProvidersMap";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Info, X } from "lucide-react";
import SearchCategorySection from "./SearchCategorySection";

export default function ProvidersSection({
  providers = [],
  allEligibleProviders = [],
  providerLimit,

  locations,
  clientLocation,
  searchWithin,
  selectedProvider,
  userEmail,
  onProviderSelect,
  onBlacklist,
  loadingProviders = false,
  events = [],
  categories = [],
  onManageHidden,
  onClose,
  compactMode = false,
  hoveredProvider,
  setHoveredProvider,
  allProviders = [],
  onProviderUnhide,
  userAddress,
  provider,
  showHiddenProviders = false,
  providersWithDistance = [],
  setBlacklistedProviders,
  blacklistedProviders = [],
  searchCategory,
  setSearchCategory,
}) {
  const [blacklistingProvider, setBlacklistingProvider] = useState(null);
  const [activeProvider, setActiveProvider] = useState(null);
  const [hiddenProviders, setHiddenProviders] = useState([]);
  const providerRefs = useRef([]);
  const [expandedProvider, setExpandedProvider] = useState(null);

  const serviceLocationKey = userAddress?.zip
    ? `${userAddress.zip}`
    : userAddress?.state
      ? `${userAddress.state}`
      : "default";

  const hiddenStorageKey = `hiddenProviders_${userEmail}_${serviceLocationKey}`;

  const handleUnhide = async (providerId) => {
    if (!userEmail) return;

    try {
      const res = await fetch(
        `/api/blacklist?email=${encodeURIComponent(
          userEmail
        )}&providerId=${providerId}&zip=${userAddress?.zip || ""}`,
        {
          method: "DELETE",
        }
      );

      const result = await res.json();

      if (result.success) {
        const updatedHidden = hiddenProviders.filter(
          (item) =>
            !(
              String(item.providerId) === String(providerId) &&
              item.zip === userAddress?.zip
            )
        );

        setHiddenProviders(updatedHidden);
        setBlacklistedProviders(updatedHidden);

        localStorage.setItem(
          hiddenStorageKey,
          JSON.stringify(updatedHidden)
        );

        // Clear selected provider
        onProviderSelect?.(null);
        setHoveredProvider?.(null);

        if (onProviderUnhide) {
          onProviderUnhide(providerId);
        }

        // setShowHiddenProviders(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const cleanName = (name = "") =>
    name
      // remove leading 03a) or 03a), with optional comma/space
      .replace(/^\d+[a-z]\),?\s*/i, "")
      // remove DTD or Salon or DTD Schedule / Salon Schedule
      .replace(/\s*,?\s*(DTD|Salon)(\s*Schedule)?/gi, "")
      .trim();


  const getLocationDisplay = (provider) => {
    if (!provider?.nearestLocation) return "";

    if (provider.nearestLocation.title) {
      const parts = provider.nearestLocation.title.split(",");
      return parts.slice(-2).join(",").trim();
    }

    return provider.nearestLocation.city || "";
  };


  const getProviderCategories = (provider) => {
    if (!categories?.length || !provider?.services?.length) return [];

    const providerServiceIds = provider.services
      .map((id) => Number(id))
      .filter((id) => !isNaN(id));

    return categories.filter((category) => {
      if (!Array.isArray(category.events)) return false;

      const categoryEventIds = category.events
        .map((id) => Number(id))
        .filter((id) => !isNaN(id));

      return providerServiceIds.some((sid) =>
        categoryEventIds.includes(sid)
      );
    });
  };

  useEffect(() => {
    if (!userEmail) return;

    const stored = localStorage.getItem(hiddenStorageKey);

    if (stored) {
      const parsed = JSON.parse(stored);

      // migrate old array format
      const normalized = parsed.map((item) => {
        if (
          typeof item === "string" ||
          typeof item === "number"
        ) {
          return {
            providerId: String(item),
            zip: userAddress?.zip || "",
          };
        }

        return item;
      });

      setHiddenProviders(normalized);
    } else {
      setHiddenProviders([]);
    }
  }, [userEmail, hiddenStorageKey]);

  const filteredProviders = useMemo(() => {
    return providers.filter((provider) => {
      const providerCategories = getProviderCategories(provider);
      return providerCategories.length > 0;
    });
  }, [providers, categories]);

  const memoizedMap = useMemo(() => {
    return (
      <ProvidersMap
        providers={filteredProviders}
        locations={locations}
        userLocation={clientLocation}
        searchWithin={searchWithin}
      />
    );
  }, [filteredProviders, locations, clientLocation, searchWithin]);

  const visibleProviders = filteredProviders.filter((provider) => {
    if (!userEmail) return true;

    return !hiddenProviders.some(
      (item) =>
        String(item.providerId) === String(provider.id) &&
        item.zip === userAddress?.zip
    );
  });

  const limitedVisibleProviders = visibleProviders.slice(0, providerLimit);

  // const displayedProviders = showHiddenProviders
  // ? hiddenProviderList
  // : limitedVisibleProviders;

  const hiddenProviderList = providersWithDistance.filter((provider) => {
    if (!userEmail) return true;

    return hiddenProviders.some(
      (item) =>
        String(item.providerId) === String(provider.id) &&
        item.zip === userAddress?.zip
    );
  });


  const handleBlacklist = async (providerId) => {
    if (!userEmail) return;

    setBlacklistingProvider(providerId);

    try {
      const hiddenItem = {
        providerId: String(providerId),
        zip: userAddress?.zip || "",
        state: userAddress?.state || "",
        city: userAddress?.city || "",
      };

      const updatedHidden = [...hiddenProviders, hiddenItem];
      setHiddenProviders(updatedHidden);
      setBlacklistedProviders(updatedHidden);

      localStorage.setItem(
        hiddenStorageKey,
        JSON.stringify(updatedHidden)
      );

      // Clear selected provider
      onProviderSelect?.(null);
      setHoveredProvider?.(null);

      await onBlacklist(providerId, {
        zip: userAddress?.zip,
        state: userAddress?.state,
        city: userAddress?.city,
      });
    } finally {
      setBlacklistingProvider(null);
    }
  };

  const displayedProviders = showHiddenProviders
    ? hiddenProviderList
    : visibleProviders.slice(0, providerLimit);

    // console.log("displayedProviders: ", displayedProviders);

  useEffect(() => {
    providerRefs.current = [];
  }, [showHiddenProviders]);


  // Compact mode - just show provider cards without map
  if (compactMode) {
    return (
      <>
        {activeProvider && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] pointer-events-auto">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative">

              {/* CLOSE */}
              <button
                onClick={() => setActiveProvider(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>

              {/* TITLE */}
              {/* <h2 className="text-lg font-bold mb-4 text-indigo-700">
                {cleanName(activeProvider.name)}
              </h2> */}

              {/* IMAGE */}
              {/* <div className="flex justify-center mb-4">
                <img
                  src={
                    activeProvider.picture_path
                      ? process.env.NEXT_PUBLIC_BASE_URL_IMAGE + activeProvider.picture_path
                      : "/images/placeholder.jpg"
                  }
                  className="w-24 h-24 rounded-2xl object-cover"
                />
              </div> */}

              {/* INFO GRID */}
              {/* <div className="space-y-3 text-sm">

                {activeProvider.nearestLocation && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location</span>
                    <span>
                      {cleanName(activeProvider.nearestLocation.title)}
                    </span>
                  </div>
                )}

                {activeProvider.distance != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Distance</span>
                    <span>{activeProvider.distance.toFixed(1)} miles</span>
                  </div>
                )}

                {activeProvider.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span>{activeProvider.phone}</span>
                  </div>
                )}

                {activeProvider.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span>{activeProvider.email}</span>
                  </div>
                )}

                {activeProvider.services && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Services Offered</span>
                    <span>{activeProvider.services.length}</span>
                  </div>
                )}

              </div> */}

              {/* DESCRIPTION */}
              {activeProvider.description && (
                <div className="mt-4">
                  <div className="text-gray-500 mb-2 text-sm">
                    About
                  </div>
                  <div
                    className="bg-gray-50 p-3 rounded-lg text-xs text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: activeProvider.description,
                    }}
                  />
                </div>
              )}

            </div>
          </div>
        )}
        <div className="space-y-3">

          {/* {userEmail && hiddenProviders.length > 0 && (
            <button
              onClick={() =>
                setShowHiddenProviders(!showHiddenProviders)
              }
              className="
        w-full
        bg-white
        border
        border-gray-200
        rounded-xl
        px-4
        py-3
        flex
        justify-between
        items-center
      "
            >
              <span>Hidden Providers</span>

              <span className="
        bg-indigo-100
        text-indigo-700
        text-xs
        px-2
        py-1
        rounded-full
      ">
                {hiddenProviderList.length}
              </span>
            </button>
          )} */}

          {loadingProviders && (
            <div className="text-center py-4 text-xs text-gray-500">
              Loading...
            </div>
          )}

          {!showHiddenProviders && (
            <SearchCategorySection
                providers={allEligibleProviders}
                blacklistedProviders={blacklistedProviders}
                categories={categories}
                value={searchCategory}
                onChange={setSearchCategory}
            />
          )}


          <div className="space-y-3">

            {!loadingProviders &&
              (showHiddenProviders
                && displayedProviders.length) > 0 && (
                <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                  This provider is hidden. Unhide/reactivate the provider to enable
                  service selection and scheduling.
                </div>
              )}

            {!loadingProviders &&
              displayedProviders
                .filter(
                  (provider) =>
                    provider.distance != null &&
                    Number(provider.distance) <= Number(searchWithin)
                )
                .map((provider, index) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    isSelected={selectedProvider === provider.id}
                    selectedProvider={selectedProvider}
                    onSelect={onProviderSelect}
                    onBlacklist={handleBlacklist}
                    isBlacklisting={blacklistingProvider === provider.id}
                    userEmail={userEmail}
                    categories={categories}
                    compact
                    onInfoClick={setActiveProvider}
                    onHover={(provider) => {
                      setHoveredProvider(provider || null);
                    }}
                    isHiddenView={showHiddenProviders}
                    onUnhide={handleUnhide}
                    providerIndex={index}
                    totalProviders={displayedProviders.filter(
                      (provider) =>
                        provider.distance != null &&
                        Number(provider.distance) <= Number(searchWithin)
                    ).length}
                    providerRefs={providerRefs}
                    expandedProvider={expandedProvider}
                    setExpandedProvider={setExpandedProvider}

                  />
                ))}

            {!loadingProviders &&
              (showHiddenProviders
                ? hiddenProviderList.length
                : visibleProviders.length) === 0 && (
                <div className="text-center py-6 text-sm text-gray-500">
                  {showHiddenProviders
                    ? "No hidden providers"
                    : "No providers found"}
                </div>
              )}
          </div>

        </div>
      </>
    );
  }


  // Full mode - show map and provider list
  return (
    <>
      {activeProvider && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] pointer-events-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative">

            {/* CLOSE */}
            <button
              onClick={() => setActiveProvider(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            {/* TITLE */}
            {/* <h2 className="text-lg font-bold mb-4 text-indigo-700">
              {cleanName(activeProvider.name)}
            </h2> */}

            {/* IMAGE */}
            {/* <div className="flex justify-center mb-4">
              <img
                src={
                  activeProvider.picture_path
                    ? process.env.NEXT_PUBLIC_BASE_URL_IMAGE + activeProvider.picture_path
                    : "/images/placeholder.jpg"
                }
                className="w-24 h-24 rounded-2xl object-cover"
              />
            </div> */}

            {/* INFO GRID */}
            {/* <div className="space-y-3 text-sm">

              {activeProvider.nearestLocation && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Location</span>
                  <span>
                    {cleanName(activeProvider.nearestLocation.title)}
                  </span>
                </div>
              )}

              {activeProvider.distance != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Distance</span>
                  <span>{activeProvider.distance.toFixed(1)} miles</span>
                </div>
              )}

              {activeProvider.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span>{activeProvider.phone}</span>
                </div>
              )}

              {activeProvider.email && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span>{activeProvider.email}</span>
                </div>
              )}

              {activeProvider.services && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Services Offered</span>
                  <span>{activeProvider.services.length}</span>
                </div>
              )}

            </div> */}

            {/* DESCRIPTION */}
            {activeProvider.description && (
              <div className="mt-4">
                <div className="text-gray-500 mb-2 text-sm">
                  About
                </div>
                <div
                  className="bg-gray-50 p-3 rounded-lg text-xs text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: activeProvider.description,
                  }}
                />
              </div>
            )}

          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* MAP CONTAINER */}
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl p-6 border relative">

          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl"></div>

          {/* Home Button - top right */}
          <button
            onClick={() => {
              sessionStorage.clear();
              window.location.reload();
            }}
            className="absolute top-4 right-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl z-10 flex items-center gap-2"
          >
            Home
          </button>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 left-4 w-8 h-8 bg-gray-100 rounded-full"
            >
              ✕
            </button>
          )}

          <h3 className="text-lg font-semibold mb-4 text-black">Provider Locations</h3>
          <p className=" mb-4 text-black">View all available provider in your currently area</p>

          {memoizedMap}
        </div>

        {/* PROVIDER LIST */}
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl p-8 border relative">

          {/* HEADER */}
          <div className="flex items-center justify-between mb-8">

            {/* LEFT SIDE */}
            <div>
              <h2 className="text-2xl font-bold text-black">Select Your Provider</h2>
              <p className="text-gray-600">
                {loadingProviders
                  ? "Loading providers..."
                  : `Choose from ${filteredProviders.length} available professional${filteredProviders.length !== 1 ? "s" : ""
                  }`}
              </p>
            </div>

            {/* RIGHT SIDE → Home button + Search Radius */}
            <div className="flex items-center gap-4">

              {userEmail && (
                <button
                  onClick={onManageHidden}
                  className="
                    inline-flex items-center gap-2
                    px-4 py-2
                    bg-white
                    border border-gray-200
                    rounded-xl
                    text-gray-700
                    text-sm font-medium
                    hover:bg-gray-50
                    hover:border-indigo-300
                    transition-all
                  "
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>

                  Hidden Providers
                </button>
              )}


              {/* HOME BUTTON (now left of search radius) */}
              <button
                onClick={() => {
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Home
              </button>

              {/* SEARCH RADIUS */}
              <div className="text-right">
                <div className="text-sm text-gray-500">Search radius</div>
                <div className="text-lg font-semibold text-indigo-600">
                  {searchWithin} miles
                </div>
              </div>

            </div>
          </div>

          {/* LOADING */}
          {loadingProviders && (
            <div className="text-center py-12">Finding providers…</div>
          )}

          {!loadingProviders &&
            (showHiddenProviders
              && displayedProviders.length) > 0 && (
              <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                This provider is hidden. Unhide/reactivate the provider to enable
                service selection and scheduling.
              </div>
            )}

          {/* PROVIDER GRID */}
          {!loadingProviders && displayedProviders.length > 0 && (
            <>
              <div className="grid gap-4">
                {displayedProviders.map((provider, index) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    providerIndex={index}
                    totalProviders={displayedProviders.length}
                    providerRefs={providerRefs}
                    isSelected={selectedProvider === provider.id}
                    selectedProvider={selectedProvider}
                    onSelect={onProviderSelect}
                    onBlacklist={handleBlacklist}
                    isBlacklisting={blacklistingProvider === provider.id}
                    userEmail={userEmail}
                    categories={categories}
                    compact
                    onInfoClick={setActiveProvider}
                    onHover={(provider) => {
                      setHoveredProvider(provider || null);
                    }}
                    isHiddenView={showHiddenProviders}
                    onUnhide={handleUnhide}
                  />

                ))}
              </div>
            </>
          )}

          {/* NO PROVIDERS */}
          {!loadingProviders && visibleProviders.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No Available Providers</h3>
              <p className="text-gray-600 mb-4">
                Try increasing your search radius or choosing another location.
              </p>

              {userEmail && (
                <button
                  onClick={onManageHidden}
                  className="px-6 py-3 bg-gray-100 rounded-xl"
                >
                  Manage Hidden Providers
                </button>
              )}
            </div>
          )}
        </div>
      </div>

    </>

  );
}

/* PROVIDER CARD */
function ProviderCard({
  provider,
  isSelected,
  selectedProvider,
  onSelect,
  onBlacklist,
  isBlacklisting,
  userEmail,
  categories = [],
  compact = false, // 👈 New prop for compact display
  onInfoClick,
  onHover,
  onManageHidden,
  isHiddenView = false,
  onUnhide,
  providerIndex,
  totalProviders,
  providerRefs,
  expandedProvider,
  setExpandedProvider
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const hasAnySelection = Boolean(selectedProvider);

  const isExpanded =
    !isHiddenView &&
    expandedProvider === provider.id;
  const getProviderCategories = () => {

    if (!categories?.length || !provider?.services?.length) return [];

    const providerServiceIds = provider.services
      .map((id) => Number(id))
      .filter((id) => !isNaN(id));

    return categories.filter((category) => {
      if (!Array.isArray(category.events)) return false;

      const categoryEventIds = category.events
        .map((id) => Number(id))
        .filter((id) => !isNaN(id));

      return providerServiceIds.some((sid) =>
        categoryEventIds.includes(sid)
      );
    });
  };

  const providerCategories = getProviderCategories();

  useEffect(() => {
    if (expandedProvider !== provider.id) {
        setShowDescription(false);
    }
}, [expandedProvider, provider.id]);

  const cleanName = (name = "") =>
    name
      // remove leading 03a) or 03a), with optional comma/space
      .replace(/^\d+[a-z]\),?\s*/i, "")
      // remove DTD or Salon or DTD Schedule / Salon Schedule
      .replace(/\s*,?\s*(DTD|Salon)(\s*Schedule)?/gi, "")
      .trim();


  const getLocationDisplay = () => {
    if (!provider.nearestLocation) return "";
    if (provider.nearestLocation.title) {
      const parts = provider.nearestLocation.title.split(",");
      return parts.slice(-2).join(",").trim();
    }
    return provider.nearestLocation.city || "";
  };


  useEffect(() => {
    if (!isSelected) {
      setShowDescription(false);
    }
  }, [isSelected]);
  // Compact mode for column display
  if (compact) {
    return (
      <div
        ref={(el) => {
          providerRefs.current[providerIndex] = el;
        }}
        tabIndex={0}
        role="button"
        aria-pressed={isSelected}
        aria-label={`Provider ${cleanName(provider.name)}`}
        className={`provider-card relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-300
  focus:outline-none
  ${
    isSelected
      ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
      : isHovered
      ? "border-indigo-500 bg-white ring-1 ring-indigo-500"
      : "border-gray-200 bg-white"
  }
`}
        onMouseEnter={() => {
  setIsHovered(true);

  // Highlight categories/services
  onHover?.(provider);

  // Select provider
  if (selectedProvider !== provider.id) {
    onSelect(provider.id);
  }

  // Never auto-expand on hover
  setExpandedProvider(null);
}}
        onMouseLeave={() => {
          setIsHovered(false);
          onHover?.(null);
        }}
        onClick={() => {
    if (isBlacklisting) return;

    onSelect(provider.id);

    // Do NOT expand anymore
    setExpandedProvider(null);
}}


        onDoubleClick={() => {
          if (isBlacklisting) return;

          // Select + Expand
          const isCurrent =
            selectedProvider === provider.id;

          if (isCurrent) {
            onSelect(null);
            setExpandedProvider(null);
          } else {
            onSelect(provider.id);
            setExpandedProvider(provider.id);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault();

            if (e.shiftKey) {
              const prev =
                providerIndex === 0
                  ? totalProviders - 1
                  : providerIndex - 1;

              providerRefs.current[prev]?.focus();
            } else {
              const next =
                providerIndex === totalProviders - 1
                  ? 0
                  : providerIndex + 1;

              providerRefs.current[next]?.focus();
            }

            return;
          }

          if (e.key === "Enter") {
            e.preventDefault();

            if (isBlacklisting) return;

            // Select + Expand
            const isCurrent =
              selectedProvider === provider.id;

            if (isCurrent) {
              onSelect(null);
              setExpandedProvider(null);
            } else {
              onSelect(provider.id);
              setExpandedProvider(provider.id);
            }

            return;
          }

          if (e.key === " ") {
            e.preventDefault();

            if (isBlacklisting) return;

            // Select only
            onSelect(provider.id);
          }
        }}
      >

        {/* {userEmail && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBlacklist(provider.id);
            }}
            className="
      absolute
      top-5
      right-5
      h-8
      px-3
      rounded-lg
      bg-red-50
      border
      border-red-200
      text-red-600
      text-xs
      font-medium
      hover:bg-red-100
      transition
      z-10
    "
          >
            Hide
          </button>
        )} */}
        <div
          className={`w-full ${isExpanded
            ? "flex flex-col items-center text-center"
            : "flex items-start gap-3"
            }`}
        >
          {/* {(!selectedProvider || isSelected) && ( */}
          <img
            src={
              provider.picture_path
                ? process.env.NEXT_PUBLIC_BASE_URL_IMAGE + provider.picture_path
                : "/images/placeholder.jpg"
            }
            className={`object-cover rounded-xl transition-all duration-300
    ${isExpanded
                ? "w-full h-40 mb-3"
                : "w-16 h-16"
              }`}
          />
          {/* )} */}


          <div className={`${isExpanded ? "w-full text-center" : "flex-1 min-w-0"}`}>

            {/* NAME */}
            <div
              className={`${isExpanded
                ? "flex justify-center items-center gap-1"
                : "flex items-center"
                }`}
            >
              <h4 className="text-sm font-bold text-gray-800 truncate">
                {cleanName(provider.name)}

                {provider.nearestLocation && (
                  <p className="text-xs text-gray-500 mt-1">
                    {getLocationDisplay()}
                  </p>
                )}
              </h4>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
    e.stopPropagation();

    // Select this provider
    onSelect(provider.id);

    // Expand/collapse
    setExpandedProvider(prev =>
        prev === provider.id ? null : provider.id
    );

    // Show description
    setShowDescription(prev =>
        expandedProvider === provider.id
            ? !prev
            : true
    );
}}
                className="p-1 text-gray-400 hover:text-indigo-600"
              >
                <Info className="w-4 h-4" />
              </button>

            </div>

            {/* LOCATION */}
            {/* {provider.nearestLocation && (!selectedProvider || isSelected) && (
              <p className="text-xs text-gray-500 mt-1">
                {getLocationDisplay()}
              </p>

            )} */}
            {/* EXTRA DETAILS ONLY WHEN NOT HOVERED */}
            {/* {!isHovered && ( */}
            <>
              <div
                className={`flex items-center gap-3 mt-1 flex-wrap
    ${isExpanded ? "justify-center" : "justify-start"}
  `}
              >

                {provider.distance != null && (
                  <p className="text-xs text-green-600">
                    {provider.distance.toFixed(1)} mi away
                  </p>
                )}

                {userEmail && (
                  isHiddenView ? (
                    <button
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnhide(provider.id);
                      }}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800"
                    >
                      Unhide
                    </button>
                  ) : (
                    <button
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBlacklist(provider.id);
                      }}
                      className="text-[11px] text-gray-400 hover:text-red-500"
                    >
                      Hide
                    </button>
                  )
                )}

              </div>

              {showDescription && provider.description && (
                <div
                  className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: provider.description }}
                />
              )}
            </>
            {/* )} */}

          </div>

          {/* {isSelected && (
            <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )} */}

        </div>
      </div>
    );
  }



  // Full mode for regular display
  return (
    <div
      className={`p-6 rounded-2xl border cursor-pointer transition ${isSelected ? "border-indigo-500" : "border-gray-200"
        }`}
      onClick={() => !isBlacklisting && onSelect(provider.id)}
    >
      <div className="flex gap-4">
        {(
          <img
            src={
              provider.picture_path
                ? process.env.NEXT_PUBLIC_BASE_URL_IMAGE + provider.picture_path
                : "/images/placeholder.jpg"
            }
            className={`object-cover rounded-xl transition-all duration-300
  ${isHovered
                ? "w-full h-40 mb-3"
                : "w-16 h-16"
              }`}
          />
        )}

        <div className="flex-1">
          <h3
            className={`text-xl ${isSelected ? "font-extrabold text-indigo-700" : "font-medium text-black"
              }`}
          >
            {cleanName(provider.name)}
          </h3>



          {provider.nearestLocation && (
            <p className="text-xs text-gray-500 mt-1">
              {getLocationDisplay()}
            </p>
          )}
          {isSelected && provider.description && (
            <div
              className="mt-2 text-xs text-gray-500"
              dangerouslySetInnerHTML={{ __html: provider.description }}
            />
          )}

          {/* ---- CATEGORY TAGS BELOW NAME + ADDRESS ---- */}
          {providerCategories.length > 0 && (
            <div className="mt-3">

              {/* Label on FIRST LINE */}
              <span className="text-xs font-semibold text-gray-600 block mb-1">
                Category
              </span>

              {/* Tags on SECOND LINE */}
              <div className="flex flex-wrap gap-2">
                {providerCategories.map((cat) => (
                  <span
                    key={cat.id}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>

            </div>
          )}




          <div
            className={`${isHovered
              ? "flex justify-center items-center gap-1"
              : "flex items-center"
              }`}
          >
            {/* {provider.distance != null && (
              <p className="text-sm text-green-600 mt-2">
                {provider.distance.toFixed(1)} miles away
              </p>
            )} */}

            <button
              // tabIndex={-1}

              type="button"
              tabIndex={-1}
              onClick={(e) => {
    e.stopPropagation();

    // Select this provider
    onSelect(provider.id);

    // Expand/collapse
    setExpandedProvider(prev =>
        prev === provider.id ? null : provider.id
    );

    // Show description
    setShowDescription(prev =>
        expandedProvider === provider.id
            ? !prev
            : true
    );
}}
              className="p-1 text-gray-400 hover:text-indigo-600"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col gap-2 text-black">
          <button
            className={`px-4 py-2 rounded-xl ${isSelected ? "bg-indigo-500 text-black" : "bg-gray-300"
              }`}
          >
            {isSelected ? "Selected" : "View Services"}
          </button>

          {userEmail && (
            <button
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onBlacklist(provider.id);
              }}
              className="text-red-600 text-sm"
            >
              Hide
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
