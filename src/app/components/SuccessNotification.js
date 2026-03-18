// components/SuccessNotification.jsx
"use client";
import { CheckCircle, X, Calendar, Clock, User, MapPin } from "lucide-react";
import { useState, useEffect } from "react";

export default function SuccessNotification({ bookingDetails, onClose }) {
  const { provider, date, time, services } = bookingDetails;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 5000; // 5 seconds
    const interval = 50; // update every 50ms
    const steps = duration / interval;
    const decrement = 100 / steps;

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - decrement;
        if (newProgress <= 0) {
          clearInterval(timer);
          return 0;
        }
        return newProgress;
      });
    }, interval);

    const autoClose = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearInterval(timer);
      clearTimeout(autoClose);
    };
  }, [onClose]);

  return (
    <div className="fixed top-14 right-4 left-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-top duration-500">
      <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl border border-emerald-200 p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Booking Confirmed!</h3>
            <p className="text-emerald-600 text-sm">Your appointment has been scheduled</p>
          </div>
        </div>

        {/* Booking Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span className="text-gray-700">
              {date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span className="text-gray-700">{time}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <User className="w-4 h-4 text-emerald-500" />
            <span className="text-gray-700">Service Provider</span>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="w-4 h-4 text-emerald-500 mt-0.5" />
            <span className="text-gray-700">{services}</span>
          </div>
        </div>

        {/* Confirmation Message */}
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
          <p className="text-sm text-emerald-700 text-center">
            You&apos;ll receive a confirmation email shortly with all the details.
          </p>
        </div>

        {/* Auto-close indicator */}
        <div className="mt-3 w-full bg-emerald-200 rounded-full h-1">
          <div 
            className="bg-emerald-500 h-1 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}