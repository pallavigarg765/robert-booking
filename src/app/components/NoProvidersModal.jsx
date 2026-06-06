"use client";

import {
    MapPin,
    Search,
    X,
    CalendarDays,
} from "lucide-react";

export default function NoProvidersModal({
    open,
    onClose,
    onChangeAddress,
    onIncreaseRadius,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">

            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}

                <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-5 relative">

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white transition"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>

                    <div className="flex items-center gap-4">

                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">
                            <CalendarDays className="w-7 h-7 text-white" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                No Providers Available
                            </h2>

                            <p className="text-gray-600 mt-1">
                                We couldn't find any providers servicing this location.
                            </p>
                        </div>

                    </div>
                </div>

                {/* Body */}

                <div className="p-6">

                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">

                        <div className="flex gap-4">

                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                <MapPin className="w-5 h-5 text-indigo-600" />
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900">
                                    Service Area Not Yet Covered
                                </h4>

                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                    We currently don't have providers operating
                                    within your selected search radius.
                                    You can try another address or expand the
                                    search area.
                                </p>
                            </div>

                        </div>

                    </div>

                    <div className="mt-6 space-y-3">

                        <button
                            onClick={onChangeAddress}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-semibold transition flex items-center justify-center gap-3"
                        >
                            <MapPin className="w-5 h-5" />
                            Change Address
                        </button>

                        <button
                            onClick={onIncreaseRadius}
                            className="w-full border border-gray-300 bg-white hover:bg-gray-50 py-4 rounded-2xl font-semibold text-gray-700 transition flex items-center justify-center gap-3"
                        >
                            <Search className="w-5 h-5" />
                            Increase Search Radius
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
}