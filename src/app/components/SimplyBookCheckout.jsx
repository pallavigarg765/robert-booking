"use client";

import { useState } from "react";
import {
  CalendarDays,
  Clock,
  UserRound,
  Scissors,
  MapPin,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

function formatDate(date) {
  if (!date) return "";

  // Avoid UTC conversion changing the selected calendar day.
  const value =
    date instanceof Date
      ? date
      : new Date(`${String(date).slice(0, 10)}T12:00:00`);

  if (Number.isNaN(value.getTime())) return String(date);

  return value.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(time) {
  if (!time) return "";

  const [hours, minutes] = String(time).split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SimplyBookCheckout({
  provider,
  services = [],
  selectedDate,
  selectedTime,
  client,
  onBack,
  onSuccess,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const canSubmit =
    Boolean(provider?.id) &&
    services.length > 0 &&
    Boolean(selectedDate) &&
    Boolean(selectedTime) &&
    Boolean(client?.name?.trim()) &&
    Boolean(client?.email?.trim()) &&
    Boolean(client?.phone?.trim());

  const handleBooking = async () => {
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError("");
    setSuccess(null);

    try {
      const date =
        selectedDate instanceof Date
          ? [
              selectedDate.getFullYear(),
              String(selectedDate.getMonth() + 1).padStart(2, "0"),
              String(selectedDate.getDate()).padStart(2, "0"),
            ].join("-")
          : String(selectedDate).slice(0, 10);

      const time =
        String(selectedTime).length === 5
          ? `${selectedTime}:00`
          : selectedTime;

      const payload = {
        action: services.length > 1 ? "bookMultiple" : "book",
        performerId: Number(provider.id),
        date,
        time,
        clientData: {
          name: client.name.trim(),
          email: client.email.trim(),
          phone: client.phone.trim(),
        },
        services: services.map((service) => ({
          eventId: Number(service.eventId),
          duration: Number(service.duration || 60),
        })),
      };

      if (services.length === 1) {
        payload.eventId = Number(services[0].eventId);
      }

      const response = await fetch("/api/bookings/simplybook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to create your booking."
        );
      }

      setSuccess(result);
      onSuccess?.(result);
    } catch (err) {
      console.error("SimplyBook frontend booking error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-green-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>

        <h2 className="text-center text-2xl font-bold text-gray-900">
          Booking created!
        </h2>

        <p className="mt-2 text-center text-gray-600">
          Your booking request was successfully processed by SimplyBook.
        </p>

        <div className="mt-6 rounded-xl bg-gray-50 p-4">
          <p className="font-semibold text-gray-900">
            {provider.name || provider.title || "Selected provider"}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {formatDate(selectedDate)} at {formatTime(selectedTime)}
          </p>

          <div className="mt-3 space-y-1">
            {services.map((service) => (
              <p key={service.eventId} className="text-sm text-gray-700">
                {service.name}
              </p>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          Please check the SimplyBook admin dashboard to verify the booking
          and whether any additional confirmation is required.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-6">
        <p className="text-sm font-medium text-blue-600">
          Final step
        </p>
        <h2 className="mt-1 text-2xl font-bold text-gray-900">
          Review your booking
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Please confirm the details before booking.
        </p>
      </div>

      <div className="space-y-5 p-6">
        <SummaryRow
          icon={<UserRound className="h-5 w-5" />}
          label="Provider"
          value={provider?.name || provider?.title || provider?.id}
        />

        <SummaryRow
          icon={<CalendarDays className="h-5 w-5" />}
          label="Date"
          value={formatDate(selectedDate)}
        />

        <SummaryRow
          icon={<Clock className="h-5 w-5" />}
          label="Start time"
          value={formatTime(selectedTime)}
        />

        <SummaryRow
          icon={<Scissors className="h-5 w-5" />}
          label="Services"
          value={
            <div className="space-y-1">
              {services.map((service) => (
                <div key={service.eventId}>
                  {service.name}
                  <span className="ml-2 text-xs text-gray-500">
                    ({service.duration || 60} min)
                  </span>
                </div>
              ))}
            </div>
          }
        />

        <div className="rounded-xl bg-gray-50 p-4">
          <p className="font-semibold text-gray-900">
            Client details
          </p>
          <p className="mt-2 text-sm text-gray-700">
            {client?.name}
          </p>
          <p className="text-sm text-gray-600">{client?.email}</p>
          <p className="text-sm text-gray-600">{client?.phone}</p>
        </div>

        {services.length > 1 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Multiple services will be submitted as separate consecutive
            bookings. If a later service fails, an earlier booking may
            already have been created.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="rounded-xl border border-gray-300 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Back
          </button>

          <button
            type="button"
            onClick={handleBooking}
            disabled={!canSubmit || submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Booking...
              </>
            ) : (
              "Confirm booking"
            )}
          </button>
        </div>

        {!canSubmit && (
          <p className="text-xs text-gray-500">
            Complete the provider, service, date, time, and client details
            before confirming.
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <div className="mt-1 font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
}