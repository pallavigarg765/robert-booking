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
    X,
} from "lucide-react";

function formatDate(date) {
    if (!date) return "";

    const value =
        date instanceof Date
            ? date
            : new Date(`${String(date).slice(0, 10)}T12:00:00`);

    if (Number.isNaN(value.getTime())) {
        return String(date);
    }

    return value.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

function formatTime(time) {
    if (!time) return "";

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

function formatPhoneNumber(value) {
    if (!value) return "";

    const digits = String(value)
        .replace(/\D/g, "")
        .slice(0, 10);

    if (digits.length !== 10) {
        return value;
    }

    return `${digits.slice(0, 3)}-${digits.slice(
        3,
        6
    )}-${digits.slice(6)}`;
}

const cleanName = (name = "") =>
    name
        // Remove everything from the first comma onward
        .split(",")[0]
        .replace(/^\d+[a-z]\),?\s*/i, "")
        .trim();

function getProviderName(provider) {
    return cleanName(
        provider?.name ||
        provider?.title ||
        provider?.fullName ||
        "Selected provider"
    );
}

function getProviderImage(provider) {
    return (
        provider?.image ||
        provider?.imageUrl ||
        provider?.photo ||
        provider?.photoUrl ||
        provider?.avatar ||
        provider?.avatarUrl ||
        provider?.profileImage ||
        provider?.profileImageUrl ||
        null
    );
}

function getServicePrice(service) {
    const price =
        service?.price ??
        service?.price_amount ??
        service?.priceAmount ??
        service?.cost ??
        service?.amount;

    if (
        price === undefined ||
        price === null ||
        price === ""
    ) {
        return null;
    }

    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice)) {
        return String(price);
    }

    return `$${numericPrice.toFixed(2).replace(/\.00$/, "")}`;
}

function getLocationType(provider, appointmentLocation) {
    if (appointmentLocation?.type) {
        const type = String(
            appointmentLocation.type
        ).toLowerCase();


        if (
            type === "studio" ||
            type === "home"
        ) {
            return (
                type.charAt(0).toUpperCase() +
                type.slice(1)
            );
        }


    }

    const providerMode = String(
        provider?.providerMode ||
        provider?.mode ||
        provider?.type ||
        ""
    ).toLowerCase();

    if (
        providerMode === "studio" ||
        providerMode.includes("studio")
    ) {
        return "Studio";
    }

    return "Home";
}

function getAppointmentAddress(
    appointmentLocation,
    client
) {
    if (appointmentLocation?.address) {
        return appointmentLocation.address;
    }

    if (appointmentLocation?.fullAddress) {
        return appointmentLocation.fullAddress;
    }

    const parts = [
        appointmentLocation?.address1,
        appointmentLocation?.address2,
        appointmentLocation?.city,
        appointmentLocation?.state,
        appointmentLocation?.zip,
    ].filter(Boolean);

    if (parts.length > 0) {
        return parts.join(", ");
    }

    if (client?.fullAddress) {
        return [
            client.fullAddress,
            client.city,
            client.state
                ? `${client.state}${client.zip ? ` ${client.zip}` : ""}`
                : client.zip,
        ]
            .filter(Boolean)
            .join(", ");
    }

    if (client?.address) {
        return client.address;
    }

    return "";
}

export default function SimplyBookCheckout({
    provider,
    services = [],
    selectedDate,
    selectedTime,
    client,
    appointmentLocation,
    onBack,
    onSuccess,
}) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(null);

    const providerName = getProviderName(provider);
    const providerImage = getProviderImage(provider);

    const locationType = getLocationType(
        provider,
        appointmentLocation
    );

    const appointmentAddress =
        getAppointmentAddress(
            appointmentLocation,
            client
        );

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
                        String(
                            selectedDate.getMonth() + 1
                        ).padStart(2, "0"),
                        String(
                            selectedDate.getDate()
                        ).padStart(2, "0"),
                    ].join("-")
                    : String(selectedDate).slice(0, 10);

            const time =
                String(selectedTime).length === 5
                    ? `${selectedTime}:00`
                    : selectedTime;

            const payload = {
                action:
                    services.length > 1
                        ? "bookMultiple"
                        : "book",

                performerId: Number(provider.id),

                date,

                time,

                clientData: {
                    name: client.name.trim(),
                    email: client.email.trim(),
                    phone: client.phone.trim(),
                },

                services: services.map(
                    (service) => ({
                        eventId: Number(
                            service.eventId
                        ),
                        name: service.name,
                        duration: Number(
                            service.duration || 60
                        ),
                        price:
                            service.price ??
                            service.price_amount ??
                            service.priceAmount ??
                            service.cost ??
                            service.amount ??
                            null,
                    })
                ),
            };

            if (services.length === 1) {
                payload.eventId = Number(
                    services[0].eventId
                );
            }

            const response = await fetch(
                "/api/bookings/simplybook",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                throw new Error(
                    result.message ||
                    "Unable to create your booking."
                );
            }

            setSuccess(result);

            onSuccess?.(result);
        } catch (err) {
            console.error(
                "SimplyBook frontend booking error:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong. Please try again."
            );
        } finally {
            setSubmitting(false);
        }


    };

    const handleCloseConfirmation = () => {
        setSuccess(null);
    };

    /*
    
    * ============================================================
    * CONFIRMATION
    * ============================================================
    *
    * IMPORTANT:
    * There is intentionally NO setTimeout here.
    * The confirmation remains visible until the user closes it.
      */
    if (success) {
        return (

            <div className="mx-auto w-full max-w-2xl rounded-2xl border border-green-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleCloseConfirmation}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Close confirmation"
                        title="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>

                <h2 className="text-center text-2xl font-bold text-gray-900">
                    Booking created!
                </h2>

                <p className="mt-2 text-center text-gray-600">
                    Your appointment has been successfully
                    booked.
                </p>

                <div className="mt-6 rounded-xl bg-gray-50 p-5">
                    {/* Provider */}
                    <div className="flex items-center gap-3">
                        {providerImage ? (
                            <img
                                src={providerImage}
                                alt={providerName}
                                className="h-14 w-14 rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                <UserRound className="h-7 w-7" />
                            </div>
                        )}


                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Service Provider
                            </p>

                            <p className="font-semibold text-gray-900">
                                {providerName}
                            </p>
                        </div>
                    </div>

                    {/* Date / Time */}
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Date
                            </p>

                            <p className="mt-1 text-sm font-medium text-gray-900">
                                {formatDate(selectedDate)}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Time
                            </p>

                            <p className="mt-1 text-sm font-medium text-gray-900">
                                {formatTime(selectedTime)}
                            </p>
                        </div>
                    </div>

                    {/* Appointment Location */}
                    <div className="mt-5 border-t border-gray-200 pt-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Appt. Location
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-900">
                            {locationType}
                        </p>

                        {appointmentAddress && (
                            <p className="mt-1 whitespace-pre-line text-sm leading-5 text-gray-600">
                                {appointmentAddress}
                            </p>
                        )}
                    </div>

                    {/* Client */}
                    <div className="mt-5 border-t border-gray-200 pt-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Client Details
                        </p>

                        <p className="mt-2 text-sm font-semibold text-gray-900">
                            {client?.name}
                        </p>

                        <p className="mt-1 text-sm text-gray-600">
                            {formatPhoneNumber(
                                client?.phone
                            )}
                        </p>
                    </div>

                    {/* Services */}
                    <div className="mt-5 border-t border-gray-200 pt-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Services
                        </p>

                        <div className="mt-2 space-y-2">
                            {services.map(
                                (service, index) => {
                                    const price =
                                        getServicePrice(
                                            service
                                        );

                                    return (
                                        <div
                                            key={
                                                service.eventId ??
                                                index
                                            }
                                            className="flex items-center justify-between gap-4 text-sm"
                                        >
                                            <div className="min-w-0">
                                                <span className="mr-2 font-medium text-gray-500">
                                                    {index + 1}.
                                                </span>

                                                <span className="font-medium text-gray-900">
                                                    {service.name}
                                                </span>

                                                <span className="ml-2 text-gray-500">
                                                    (
                                                    {service.duration ||
                                                        60}{" "}
                                                    min)
                                                </span>
                                            </div>

                                            {price && (
                                                <span className="shrink-0 font-semibold text-gray-900">
                                                    {price}
                                                </span>
                                            )}
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>


                </div>

                <button
                    type="button"
                    onClick={handleCloseConfirmation}
                    className="mt-6 w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"

                >


                    Close


                </button>
            </div>


        );


    }

    /*
    
    * ============================================================
    * REVIEW
    * ============================================================
      */

    return (<div className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"> <div className="border-b border-gray-100 p-6"> <p className="text-sm font-medium text-blue-600">
        Final step </p>


        <h2 className="mt-1 text-2xl font-bold text-gray-900">
            Review your booking
        </h2>

        <p className="mt-2 text-sm text-gray-500">
            Please confirm the details before booking.
        </p>
    </div>

        <div className="space-y-5 p-6">

            {/* Provider */}
            <div className="rounded-xl bg-gray-50 p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                    Service Provider
                </p>

                <div className="flex items-center gap-3">
                    {providerImage ? (
                        <img
                            src={providerImage}
                            alt={providerName}
                            className="h-14 w-14 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <UserRound className="h-7 w-7" />
                        </div>
                    )}

                    <p className="text-lg font-semibold text-gray-900">
                        {providerName}
                    </p>
                </div>
            </div>

            <SummaryRow
                icon={
                    <CalendarDays className="h-5 w-5" />
                }
                label="Date"
                value={formatDate(selectedDate)}
            />

            <SummaryRow
                icon={<Clock className="h-5 w-5" />}
                label="Time"
                value={formatTime(selectedTime)}
            />

            {/* Appointment location */}
            <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600">
                    <MapPin className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Appt. Location
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                        {locationType}
                    </p>

                    {appointmentAddress && (
                        <p className="mt-1 whitespace-pre-line text-sm leading-5 text-gray-600">
                            {appointmentAddress}
                        </p>
                    )}
                </div>
            </div>

            {/* Services */}
            <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600">
                    <Scissors className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Services
                    </p>

                    <div className="mt-2 space-y-2">
                        {services.map(
                            (service, index) => {
                                const price =
                                    getServicePrice(
                                        service
                                    );

                                return (
                                    <div
                                        key={
                                            service.eventId ??
                                            index
                                        }
                                        className="flex items-center justify-between gap-4"
                                    >
                                        <div className="min-w-0">
                                            <span className="mr-2 font-medium text-gray-500">
                                                {index + 1}.
                                            </span>

                                            <span className="font-medium text-gray-900">
                                                {service.name}
                                            </span>

                                            <span className="ml-2 text-sm text-gray-500">
                                                (
                                                {service.duration ||
                                                    60}{" "}
                                                min)
                                            </span>
                                        </div>

                                        {price && (
                                            <span className="shrink-0 font-semibold text-gray-900">
                                                {price}
                                            </span>
                                        )}
                                    </div>
                                );
                            }
                        )}
                    </div>
                </div>
            </div>

            {/* Client Details */}
            <div className="rounded-xl bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">
                    Client Details
                </p>

                <div className="mt-3 space-y-2 text-sm">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Client Name
                        </p>

                        <p className="mt-1 text-gray-900">
                            {client?.name}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Appt. Location Type
                        </p>

                        <p className="mt-1 font-medium text-gray-900">
                            {locationType}
                        </p>
                    </div>

                    {appointmentAddress && (
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                Appointment Address
                            </p>

                            <p className="mt-1 whitespace-pre-line leading-5 text-gray-700">
                                {appointmentAddress}
                            </p>
                        </div>
                    )}

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Client Phone
                        </p>

                        <p className="mt-1 text-gray-700">
                            {formatPhoneNumber(
                                client?.phone
                            )}
                        </p>
                    </div>
                </div>
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
                    disabled={
                        !canSubmit || submitting
                    }
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
                    Complete the provider, service, date,
                    time, and client details before
                    confirming.
                </p>
            )}
        </div>
    </div>


    );
}

function SummaryRow({
    icon,
    label,
    value,
}) {
    return (<div className="flex items-start gap-3"> <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600">
        {icon} </div>


        <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {label}
            </p>

            <div className="mt-1 font-medium text-gray-900">
                {value}
            </div>
        </div>
    </div>

    );
}
