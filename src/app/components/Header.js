"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUser, setHasUser] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = () => {
      const user = sessionStorage.getItem("userAuth");
      setHasUser(!!user);
    };

    checkUser();

    window.addEventListener("storage", checkUser);
    window.addEventListener("session-changed", checkUser);

    return () => {
      window.removeEventListener("storage", checkUser);
      window.removeEventListener("session-changed", checkUser);
    };
  }, []);

  // ✅ Real routes now
  const navItems = [
    { label: "Find Services", href: "/find-services" },
    { label: "Schedule Services", href: "/schedule-services" },
  ];

  const updatedNavItems = hasUser
    ? [...navItems, { label: "Past Bookings", href: "/past-bookings" }]
    : navItems;

  const handleNavigation = (href) => {
    router.push(href);
    setIsOpen(false);
  };

  const handleBackToHome = () => {
    sessionStorage.clear();
    window.dispatchEvent(new CustomEvent("reset-booking-form"));
    router.push("/");
  };

  const isActive = (href) => pathname === href;

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
            <button
              key={idx}
              onClick={() => handleNavigation(item.href)}
              className={`transition ${
                isActive(item.href)
                  ? "text-blue-600 font-semibold"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:block">
          <button
            onClick={handleBackToHome}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
          >
            Back to Home
          </button>
        </div>

        {/* Mobile Button */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-md px-6 py-4 space-y-4">
          {updatedNavItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleNavigation(item.href)}
              className="block w-full text-left text-gray-700 hover:text-blue-600 transition"
            >
              {item.label}
            </button>
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