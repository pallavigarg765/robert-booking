"use client";

import {
CheckCircle,
X,
Calendar,
Clock,
User,
MapPin,
} from "lucide-react";

function formatTime(time) {
if (!time) return "";

// If time is already formatted, return it.
if (
!/^\d{1,2}:\d{2}(:\d{2})?$/.test(
String(time)
)
) {
return String(time);
}

const [hours, minutes] = String(time)
.split(":")
.map(Number);

if (
Number.isNaN(hours) ||
Number.isNaN(minutes)
) {
return String(time);
}

const date = new Date();
date.setHours(hours, minutes, 0, 0);

return date.toLocaleTimeString("en-US", {
hour: "numeric",
minute: "2-digit",
});
}

function formatDate(date) {
if (!date) return "";

const value =
date instanceof Date
? date
: new Date(
`${String(date).slice(
            0,
            10
          )}T12:00:00`
);

if (Number.isNaN(value.getTime())) {
return String(date);
}

return value.toLocaleDateString("en-US", {
weekday: "long",
year: "numeric",
month: "long",
day: "numeric",
});
}

export default function SuccessNotification({
bookingDetails,
onClose,
}) {
if (!bookingDetails) return null;

const {
provider,
date,
time,
services,
appointmentLocation,
client,
} = bookingDetails;

const providerName =
typeof provider === "object"
? provider?.name ||
provider?.title ||
provider?.fullName ||
"Service Provider"
: provider || "Service Provider";

const locationType =
appointmentLocation?.type ||
"Home";

const appointmentAddress =
appointmentLocation?.fullAddress ||
appointmentLocation?.address ||
"";

const clientName =
client?.name || "";

const clientPhone =
client?.phone || "";

/*

* Services can be:
*
* 1. An array of service objects
* 2. An array of service names
* 3. A single string
     */
     const serviceList = Array.isArray(services)
     ? services
     : services
     ? [services]
     : [];

return ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"> <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-2xl">


    {/* Close Button */}
    <button
      type="button"
      onClick={onClose}
      className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
      aria-label="Close confirmation"
      title="Close"
    >
      <X className="h-5 w-5" />
    </button>

    {/* Success Header */}
    <div className="border-b border-gray-100 p-6 pr-14">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600">
          <CheckCircle className="h-6 w-6 text-white" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-gray-800">
            Booking Confirmed!
          </h3>

          <p className="text-sm text-emerald-600">
            Your appointment has been scheduled
          </p>
        </div>
      </div>
    </div>

    {/* Booking Details */}
    <div className="space-y-4 p-6">

      {/* Date */}
      <div className="flex items-start gap-3 text-sm">
        <div className="mt-0.5 rounded-lg bg-emerald-50 p-2">
          <Calendar className="h-4 w-4 text-emerald-500" />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Date
          </p>

          <p className="mt-1 font-medium text-gray-800">
            {formatDate(date)}
          </p>
        </div>
      </div>

      {/* Time */}
      <div className="flex items-start gap-3 text-sm">
        <div className="mt-0.5 rounded-lg bg-emerald-50 p-2">
          <Clock className="h-4 w-4 text-emerald-500" />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Time
          </p>

          <p className="mt-1 font-medium text-gray-800">
            {formatTime(time)}
          </p>
        </div>
      </div>

      {/* Service Provider */}
      <div className="flex items-start gap-3 text-sm">
        <div className="mt-0.5 rounded-lg bg-emerald-50 p-2">
          <User className="h-4 w-4 text-emerald-500" />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Service Provider
          </p>

          <p className="mt-1 font-medium text-gray-800">
            {providerName}
          </p>
        </div>
      </div>

      {/* Appointment Location */}
      <div className="flex items-start gap-3 text-sm">
        <div className="mt-0.5 rounded-lg bg-emerald-50 p-2">
          <MapPin className="h-4 w-4 text-emerald-500" />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Appt. Location
          </p>

          <p className="mt-1 font-medium text-gray-800">
            {locationType}
          </p>

          {appointmentAddress && (
            <p className="mt-1 whitespace-pre-line leading-5 text-gray-600">
              {appointmentAddress}
            </p>
          )}
        </div>
      </div>

      {/* Client Details */}
      {(clientName || clientPhone) && (
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="font-semibold text-gray-900">
            Client Details
          </p>

          {clientName && (
            <p className="mt-2 text-sm text-gray-700">
              {clientName}
            </p>
          )}

          {clientPhone && (
            <p className="mt-1 text-sm text-gray-600">
              {clientPhone}
            </p>
          )}
        </div>
      )}

      {/* Services */}
      {serviceList.length > 0 && (
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="font-semibold text-gray-900">
            Services
          </p>

          <div className="mt-3 space-y-2">
            {serviceList.map(
              (service, index) => {
                const serviceName =
                  typeof service ===
                  "object"
                    ? service?.name ||
                      service?.title ||
                      "Service"
                    : service;

                const duration =
                  typeof service ===
                  "object"
                    ? service?.duration
                    : null;

                const price =
                  typeof service ===
                  "object"
                    ? service?.price
                    : null;

                return (
                  <div
                    key={
                      service?.eventId ||
                      service?.id ||
                      index
                    }
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="mr-2 font-medium text-gray-500">
                        {index + 1}.
                      </span>

                      <span className="font-medium text-gray-800">
                        {serviceName}
                      </span>

                      {duration && (
                        <span className="ml-2 text-gray-500">
                          ({duration} min)
                        </span>
                      )}
                    </div>

                    {price !==
                      undefined &&
                      price !== null &&
                      price !== "" && (
                        <span className="shrink-0 font-semibold text-gray-800">
                          {typeof price ===
                          "number"
                            ? `$${price}`
                            : price}
                        </span>
                      )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Confirmation Message */}
      <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-center text-sm text-emerald-700">
          You&apos;ll receive a confirmation email
          shortly with all the details.
        </p>
      </div>

      {/* Manual Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
      >
        Close
      </button>
    </div>
  </div>
</div>


);
}
