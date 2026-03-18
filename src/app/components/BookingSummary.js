import { CheckCircle, User, Calendar, Clock, MapPin, Loader2, Mail, Phone } from "lucide-react";
import { useState, useEffect } from "react";

export default function BookingSummary({
  selectedEvent,
  selectedProvider,
  selectedDate,
  selectedTime,
  events,
  providers,
  dayMap,
  formData,
  onSubmit,
  onChange,
  getSelectedServiceNames,
  submittingBooking = false,
  currentEmail,
  selectedTreatment = null
}) {
  const providerArray = Array.isArray(providers) ? providers : Object.values(providers || {});
  const [formValid, setFormValid] = useState(false);

    useEffect(() => {
    const isValid = formData.name && formData.email && formData.phone && formData.privacy;
    setFormValid(isValid);
  }, [formData]);

  // Safety check - don't render if critical data is missing
  if (!selectedDate || !selectedTime || !selectedProvider) {
    return null;
  }

  const cleanName = (name = "") =>
  name
    // remove leading "03a) ", "10b) ", etc.
    .replace(/^\d+[a-z]\)\s*/i, "")
    // remove schedule suffixes
    .replace(/\s*,?\s*(DTD|Salon)\s*Schedule/i, "");

  const provider = providerArray.find((p) => selectedProvider == p.id);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formValid && !submittingBooking) {
      onSubmit(e);
    }
  };

  const handlePhoneChange = (e) => {
    let input = e.target.value.replace(/\D/g, '');
    if (input.length > 0 && input[0] === '1') {
      input = input.substring(1);
    }
    if (input.length > 10) {
      input = input.substring(0, 10);
    }
    
    const syntheticEvent = {
      ...e,
      target: { ...e.target, name: 'phone', value: input }
    };
    onChange(syntheticEvent);
  };

  const displayPhone = formData.phone ? (() => {
    const digits = formData.phone.replace(/\D/g, '');
    if (digits.length > 6) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
    } else if (digits.length > 3) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3)}`;
    } else if (digits.length > 0) {
      return `(${digits}`;
    }
    return formData.phone;
  })() : '';

  return (
    <div className="space-y-3 relative">
      {submittingBooking && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-2" />
            <p className="text-xs text-gray-600">Processing...</p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="space-y-2">
        <div className="p-2 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-3 h-3 text-purple-600" />
            <div className="text-xs text-gray-600">Services</div>
          </div>
          <div className="text-xs font-semibold text-gray-800">{getSelectedServiceNames()}</div>
        </div>

        <div className="p-2 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-3 h-3 text-blue-600" />
            <div className="text-xs text-gray-600">Provider</div>
          </div>
          <div className="text-xs font-semibold text-gray-800">{cleanName(provider?.name) || "N/A"}</div>
        </div>

        <div className="p-2 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-3 h-3 text-green-600" />
            <div className="text-xs text-gray-600">Date</div>
          </div>
          <div className="text-xs font-semibold text-gray-800">
            {selectedDate
              ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : "Select a date"}
          </div>
        </div>

        <div className="p-2 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3 h-3 text-orange-600" />
            <div className="text-xs text-gray-600">Time</div>
          </div>
          <div className="text-xs font-semibold text-gray-800">{selectedTime}</div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            placeholder="Your name"
            disabled={submittingBooking}
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            placeholder="your@email.com"
            disabled={submittingBooking || currentEmail}
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Phone *</label>
          <input
            type="tel"
            name="phone"
            value={displayPhone}
            onChange={handlePhoneChange}
            placeholder="(555) 123-4567"
            disabled={submittingBooking}
            maxLength={14}
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
            required
          />
        </div>

        <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <input
            id="privacy"
            name="privacy"
            type="checkbox"
            checked={formData.privacy}
            onChange={onChange}
            disabled={submittingBooking}
            className="mt-0.5 h-3 w-3 rounded text-emerald-600"
            required
          />
          <label htmlFor="privacy" className="text-xs text-gray-700">
            I agree to the{" "}
            <a href="/privacy-policy" className="text-emerald-600 font-semibold hover:underline">
              Privacy Policy
            </a>
          </label>
        </div>

        <button
          type="submit"
          disabled={!formValid || submittingBooking}
          className={`w-full py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            formValid && !submittingBooking
              ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-md"
              : "bg-gray-400 text-white cursor-not-allowed"
          }`}
        >
          <CheckCircle className="w-3 h-3" />
          {submittingBooking ? "Processing..." : "Confirm Booking"}
        </button>

        {!formValid && (
          <p className="text-xs text-amber-600 text-center">Complete all fields</p>
        )}
      </form>
    </div>
  );
}
