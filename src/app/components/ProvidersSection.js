"use client";

import ProvidersMap from "./ProvidersMap";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Info, X } from "lucide-react";

export default function ProvidersSection({
  providers = [],
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
  compactMode = false, // 👈 New prop for column display
  hoveredProvider,
  setHoveredProvider
}) {
  const [blacklistingProvider, setBlacklistingProvider] = useState(null);
  const [activeProvider, setActiveProvider] = useState(null);

  const cleanName = (name = "") =>
    name
      // remove leading 03a) or 03a), with optional comma/space
      .replace(/^\d+[a-z]\),?\s*/i, "")
      // remove DTD or Salon or DTD Schedule / Salon Schedule
      .replace(/\s*,?\s*(DTD|Salon)(\s*Schedule)?/gi, "")
      .trim();

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

  const visibleProviders = filteredProviders;
  const handleBlacklist = async (providerId) => {
    setBlacklistingProvider(providerId);
    try {
      await onBlacklist(providerId);
    } finally {
      setBlacklistingProvider(null);
    }
  };

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
        <div className="space-y-2">
          {loadingProviders && (
            <div className="text-center py-4 text-xs text-gray-500">
              Loading…
            </div>
          )}

          {!loadingProviders &&
            visibleProviders.map((provider) => (
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
                }} />
            ))}

          {!loadingProviders && visibleProviders.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500">
              No providers found
            </div>
          )}
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

          {/* PROVIDER GRID */}
          {!loadingProviders && visibleProviders.length > 0 && (
            <div className="grid gap-4">
              {visibleProviders.map((provider) => (
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
                  onInfoClick={setActiveProvider}
                  onHover={setHoveredProvider}
                />
              ))}
            </div>
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
  onHover
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const hasAnySelection = Boolean(selectedProvider);

  const isExpanded =
    isSelected || (!hasAnySelection && isHovered);
  // ---- GET PROVIDER CATEGORIES ----
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

  // Compact mode for column display
  if (compact) {
    return (
      <div
        className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-300
  ${isSelected ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"}
${isExpanded
            ? "flex flex-col items-center text-center"
            : "flex items-start gap-3"}`}
        onMouseEnter={() => {
          setIsHovered(true);
          onHover(provider);
        }}

        onMouseLeave={() => {
          setIsHovered(false);
          onHover(null);
        }}
        onClick={() => {
          if (isBlacklisting) return;
          if (isSelected) onSelect(null);
          else onSelect(provider.id);
        }}
      >
        <div
          className={`w-full ${isExpanded
            ? "flex flex-col items-center text-center"
            : "flex items-start gap-3"}`}
        >
          {(!selectedProvider || isSelected) && (
            <img
              src={
                provider.picture_path
                  ? process.env.NEXT_PUBLIC_BASE_URL_IMAGE + provider.picture_path
                  : "/images/placeholder.jpg"
              }
              className={`object-cover rounded-xl transition-all duration-300
${isExpanded ? "w-full h-40 mb-3" : "w-16 h-16"}
`}
            />
          )}

          <div className={`${isExpanded  ? "w-full text-center" : "flex-1 min-w-0"}`}>

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
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDescription((prev) => !prev);
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
              {provider.distance != null && (!selectedProvider || isSelected) && (
                <p className={`text-xs text-green-600 mt-0.5 ${isHovered ? "text-center" : ""}`}>
                  {provider.distance.toFixed(1)} mi away
                </p>
              )}

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
        {(!selectedProvider || isSelected) && (
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

          {provider.nearestLocation && (!selectedProvider || isSelected) && (
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
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDescription((prev) => !prev);
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
              // onClick={(e) => {
              //   e.stopPropagation();
              //   onBlacklist(provider.id);
              // }}
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
