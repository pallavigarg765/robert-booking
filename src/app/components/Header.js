"use client";
 
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
 
export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUser, setHasUser] = useState(false);
  const router = useRouter();

 
  useEffect(() => {
    const checkUser = () => {
      const user = sessionStorage.getItem("userAuth");
      setHasUser(!!user);
    };
 
    checkUser();
 
    // Listen for changes to sessionStorage (from other parts of app)
    window.addEventListener("storage", checkUser);
    window.addEventListener("session-changed", checkUser); // custom event trigger
    return () => {
      window.removeEventListener("storage", checkUser);
      window.removeEventListener("session-changed", checkUser);
    };
  }, []);
 
 
 
  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Services", href: "/services" },
    { label: "Contact", href: "/contact" },
    { label: "Notify-Users", href: "/notify" },
  ];
 
  // Add "Past Bookings" if user is logged in
  const updatedNavItems = hasUser
    ? [...navItems, { label: "Past Bookings", href: "/past-bookings" }]
    : navItems;
 
  const handleBackToHome = () => {
  // Clear all session storage
  sessionStorage.clear();
  
  // Dispatch a custom event that the FindBooking component can listen to
  window.dispatchEvent(new CustomEvent('reset-booking-form'));
  
  // If we're already on the home page, just reload to reset state
  if (window.location.pathname === '/') {
    window.location.reload();
  } else {
    // Otherwise navigate to home
    window.location.href = '/';
  }
};
 
  return (
    <header className="bg-white shadow-md fixed top-0 left-0 w-full z-[999999]">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <button
          onClick={handleBackToHome}
          className="text-2xl font-bold text-blue-600"
        >
          BellyCast
        </button>
 
 
        {/* Desktop Menu */}
        <nav className="hidden md:flex gap-6">
          {updatedNavItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="text-gray-700 hover:text-blue-600 transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
 
        {/* CTA Button */}
        <div className="hidden md:block">
          <button
            onClick={handleBackToHome}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
          >
            Back to Home
          </button>
        </div>
 
        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
 
      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-md px-6 py-4 space-y-4">
          {updatedNavItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="block text-gray-700 hover:text-blue-600 transition"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleBackToHome}
            className="block w-full bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition text-center"
          >
            Back To Home
          </button>
        </div>
      )}
    </header>
  );
}