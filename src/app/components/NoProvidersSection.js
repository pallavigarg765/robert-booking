import { useEffect, useState, useRef, useCallback } from "react";
import { useAppData } from "../context/AppDataContext";
import { useRouter } from "next/navigation";

export default function NoProvidersSection({ address, userEmail, onNoThanks }) {
  const { categories } = useAppData();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [localName, setLocalName] = useState("");
  const [localEmail, setLocalEmail] = useState(userEmail || "");
  const [localPhone, setLocalPhone] = useState(address?.phone || "");
  const [localCategory, setLocalCategory] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(-1);

  // Refs for input fields
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const categoryInputRef = useRef(null);
  const submitButtonRef = useRef(null);
  const notifyMeButtonRef = useRef(null);
  const noThanksButtonRef = useRef(null);
  const homeButtonRef = useRef(null);

  // Ref for the container to trap focus
  const containerRef = useRef(null);

  // Ref for dropdown container
  const dropdownRef = useRef(null);

  // Store all focusable elements refs
  const focusableElementsRef = useRef([]);

  // Validation states - only for showing errors after submit attempt
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    category: ""
  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return;
      
      if (!containerRef.current) return;
      
      // Get all focusable elements within the container
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ].join(', ');
      
      const focusableElements = containerRef.current.querySelectorAll(focusableSelectors);
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      // If Shift+Tab is pressed on first element, move to last element
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // If Tab is pressed on last element, move to first element
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.category-dropdown-container')) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  useEffect(() => {
  if (showCategoryDropdown && selectedCategoryIndex >= 0) {
    // Scroll the selected item into view
    setTimeout(() => {
      const selectedElement = document.querySelector(`[data-category-index="${selectedCategoryIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }, 0);
  }
}, [selectedCategoryIndex, showCategoryDropdown]);

  // --- 📞 Auto-format phone input ---
  const handlePhoneChange = (e) => {
    let input = e.target.value.replace(/\D/g, ""); // keep only digits
    if (input.length > 10) input = input.slice(0, 10); // limit 10 digits

    // Format as (123) 456-7890
    if (input.length > 6) {
      input = `(${input.slice(0, 3)}) ${input.slice(3, 6)}-${input.slice(6)}`;
    } else if (input.length > 3) {
      input = `(${input.slice(0, 3)}) ${input.slice(3)}`;
    } else if (input.length > 0) {
      input = `(${input}`;
    }
    setLocalPhone(input);

    // Clear phone error when user starts typing
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: "" }));
    }
  };

  // Capitalize first letter of each word
  const capitalizeWords = (text) => {
    return text.replace(/\b\w/g, char => char.toUpperCase());
  };

  // Handle category input change - UPDATED TO SHOW DROPDOWN WHEN TYPING
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    // Capitalize first letter of each word
    const capitalizedValue = capitalizeWords(value);
    setLocalCategory(capitalizedValue);

    // Filter categories based on input
    if (capitalizedValue.trim() !== "") {
      // Sort categories alphabetically
      const sortedCategories = [...categories].sort((a, b) =>
        a.name?.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );

      // Filter categories that start with the input text (case insensitive)
      const filtered = sortedCategories.filter(category =>
        category.name?.toLowerCase().startsWith(capitalizedValue.toLowerCase())
      );

      setFilteredCategories(filtered);
      
      // SHOW DROPDOWN WHEN USER TYPES AND THERE ARE MATCHES
      if (filtered.length > 0) {
        setShowCategoryDropdown(true);
      } else {
        setShowCategoryDropdown(false);
      }
    } else {
      // When input is cleared, hide dropdown
      setFilteredCategories([]);
      setShowCategoryDropdown(false);
    }

    // Clear category error when user starts typing
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: "" }));
    }
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    setLocalCategory(category.name);
    setShowCategoryDropdown(false);
    setSelectedCategoryIndex(-1);
    // Clear category error when a category is selected
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: "" }));
    }

    // Focus submit button after category selection
    setTimeout(() => {
      submitButtonRef.current?.focus();
    }, 100);
  };

  function getCaretIndexFromClick(input, clickX) {
    const style = window.getComputedStyle(input);
    const font = `${style.fontSize} ${style.fontFamily}`;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.font = font;

    const paddingLeft = parseFloat(style.paddingLeft);
    const x = clickX - paddingLeft;

    let width = 0;

    for (let i = 0; i < input.value.length; i++) {
      const charWidth = ctx.measureText(input.value[i]).width;

      if (width + charWidth / 2 > x) {
        return i;
      }

      width += charWidth;
    }

    return input.value.length;
  }

  // --- ✉️ Email validation ---
  const isValidEmail = (email) => {
    // Basic regex for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return false;
    }

    const atIndex = email.indexOf('@');
    const dotIndex = email.lastIndexOf('.');

    // Ensure proper structure:
    const hasUsername = atIndex > 0;
    const hasDomainName = dotIndex > atIndex + 1;
    const hasTLD = dotIndex < email.length - 1;

    return hasUsername && hasDomainName && hasTLD;
  };

  // --- ✅ Validation functions ---
  const validateField = (name, value) => {
    switch (name) {
      case "name":
        return value.trim() === "" ? "Name is required" : "";
      case "email":
        if (value.trim() === "") return "Email is required";
        if (!isValidEmail(value)) return "Please enter a valid email address (e.g., name@example.com)";
        return "";
      case "phone":
        if (value.trim() === "") return "Phone number is required";
        const cleanedPhone = value.replace(/\D/g, "");
        if (cleanedPhone.length !== 10) return "Phone number must be exactly 10 digits";
        return "";
      case "category":
        // Only validate if the field is completely empty
        return value.trim() === "" ? "Service category is required" : "";
      default:
        return "";
    }
  };

  // --- 🔤 Handle key navigation (Tab and Enter) within form ---
  const handleKeyDown = (fieldName) => (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      // If Enter is pressed on category dropdown and it's open, don't navigate
      if (fieldName === 'category' && showCategoryDropdown && filteredCategories.length > 0) {
        return; // Let the user select from dropdown with Enter
      }

      // Navigate to next field
      switch (fieldName) {
        case 'name':
          emailInputRef.current?.focus();
          emailInputRef.current?.select();
          break;
        case 'email':
          phoneInputRef.current?.focus();
          phoneInputRef.current?.select();
          break;
        case 'phone':
          categoryInputRef.current?.focus();
          categoryInputRef.current?.select();
          break;
        case 'category':
          submitButtonRef.current?.focus();
          break;
        default:
          break;
      }
    }
  };

  // Handle Enter and Tab key on submit button
  const handleSubmitButtonKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Handle key navigation for initial buttons
  const handleInitialButtonsKeyDown = (e, buttonName) => {
    if (e.key === 'Tab') {
      // Tab navigation is now handled by the focus trap
      // This function is kept for compatibility
    } else if (e.key === 'Enter') {
      if (buttonName === 'notifyMe') {
        e.preventDefault();
        setShowForm(true);
      }
    }
  };

  // --- 📤 Handle form submission ---
  const handleSubmit = async () => {
    // Validate all fields only when submit button is clicked
    const newErrors = {
      name: validateField("name", localName),
      email: validateField("email", localEmail),
      phone: validateField("phone", localPhone),
      category: validateField("category", localCategory)
    };

    setErrors(newErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some(error => error !== "");
    if (hasErrors) {
      // Scroll to first error
      const firstErrorField = Object.keys(newErrors).find(key => newErrors[key] !== "");
      if (firstErrorField) {
        const element = document.querySelector(`[data-field="${firstErrorField}"]`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });

        // Focus the first error field
        switch (firstErrorField) {
          case 'name':
            nameInputRef.current?.focus();
            break;
          case 'email':
            emailInputRef.current?.focus();
            break;
          case 'phone':
            phoneInputRef.current?.focus();
            break;
          case 'category':
            categoryInputRef.current?.focus();
            break;
          default:
            break;
        }
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanedPhone = localPhone.replace(/\D/g, ""); // remove formatting

      const payload = {
        fullAddress: address?.fullAddress || "",
        city: address?.city || "",
        state: address?.state || "",
        pincode: address?.zip || "",
        lat: address?.lat || "",
        lon: address?.lon || "",
        enquiredBy: localName,
        email: localEmail,
        phoneNumber: cleanedPhone,
        category: localCategory,
        isCustomCategory: isCustomCategory,
      };

      console.log("📤 Sending enquiry payload:", payload);

      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        alert("We Will Notify you soon");
        handleGoToHome();
      } else {
        alert(data.error || "Something went wrong.");
      }
    } catch (err) {
      console.error("❌ Error submitting enquiry:", err);
      alert("Failed to send enquiry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle "No Thanks" button click
  const handleNoThanks = () => {
    console.log("User declined notification");
    // Clear session storage and trigger form reset
    sessionStorage.clear();

    // Dispatch custom event to reset search form
    window.dispatchEvent(new CustomEvent('reset-search-form'));

    if (onNoThanks) {
      onNoThanks();
    }
    window.dispatchEvent(new CustomEvent('reset-booking-form'));
  };

  // Handle Go To Home
  const handleGoToHome = () => {
    console.log("Redirecting to home screen");
    sessionStorage.clear();
    window.location.href = "/";
  };

  // Helper function to get input border color based on validation
  const getInputBorderColor = (fieldName) => {
    // Only show validation styling after errors are set (i.e., after submit attempt)
    return errors[fieldName] ? "border-red-400" : "border-gray-200";
  };

  return (
    <div
      ref={containerRef}
      className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl p-8 space-y-8 border border-amber-100 relative focus-trap"
      // Add tabindex to make the container focusable for screen readers
      tabIndex="-1"
    >
      {/* Top Gradient Bar */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>

      {/* Header */}
      <div className="text-center space-y-4">
        <button
          ref={homeButtonRef}
          onClick={handleGoToHome}
          onKeyDown={(e) => handleInitialButtonsKeyDown(e, 'home')}
          className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-black px-4 py-2 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl z-10 flex items-center gap-2 font-bold"
        >
          Home
        </button>

        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 
              2.502-1.667 1.732-2.5L13.732 4c-.77-.833-
              1.964-.833-2.732 0L4.35 16.5c-.77.833.192 
              2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Service Not Available Yet
          </h3>
          <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
            We&apos;re expanding! Provide your contact info and we&apos;ll notify you when
services become available in your area.

          </p>
        </div>
      </div>

      {/* Conditional Rendering: Buttons or Form */}
      {!showForm ? (
        // Initial Buttons View
        <div className="space-y-4">
          <div className="flex gap-4">
            {/* Notify Me Button */}
            <button
              ref={notifyMeButtonRef}
              onClick={() => setShowForm(true)}
              onKeyDown={(e) => handleInitialButtonsKeyDown(e, 'notifyMe')}
              className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-lg 
              font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 
              hover:scale-[1.02] flex items-center justify-center gap-3 group"
            >
              <svg
                className="w-5 h-5 text-white transition-transform group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-5 5v-5zM4.93 4.93l14.14 14.14M14.83 14.83a4 4 0 01-5.66-5.66l5.66 5.66z"
                />
              </svg>
              Notify Me
            </button>

            {/* No Thanks Button */}
            <button
              ref={noThanksButtonRef}
              onClick={handleNoThanks}
              onKeyDown={(e) => handleInitialButtonsKeyDown(e, 'noThanks')}
              className="flex-1 py-4 bg-gray-200 text-gray-700 text-lg 
              font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 
              hover:scale-[1.02] flex items-center justify-center gap-3 group"
            >
              <svg
                className="w-5 h-5 text-gray-600 transition-transform group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              No Thanks
            </button>
          </div>

          {/* Info Text */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 
                  12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              We&apos;ll contact you as soon as we have providers in your area

            </p>
          </div>
        </div>
      ) : (
        // Form View (shown when user clicks "Notify Me")
        <div className="space-y-6">
          {/* 🧍 Name Field */}
          <div className="space-y-2" data-field="name">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.121 17.804A10.97 10.97 0 0112 15c2.5 0 4.847.815 6.879 2.196M15 
      11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Name
                <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full">
                  Required
                </span>
              </label>
            </div>

            <input
              ref={nameInputRef}
              type="text"
              value={localName}
              maxLength={50}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue.length <= 50) {
                  const capitalizedValue = inputValue.replace(/\b\w/g, char => char.toUpperCase());
                  setLocalName(capitalizedValue);
                  if (errors.name && inputValue.trim() !== "") {
                    setErrors(prev => ({ ...prev, name: "" }));
                  }
                }
              }}
              onClick={(e) => {
                if (e.detail === 1) {
                  e.target.select();
                }
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                const input = e.target;
                const clickX = e.nativeEvent.offsetX;
                const caretIndex = getCaretIndexFromClick(input, clickX);
                input.setSelectionRange(caretIndex, caretIndex);
              }}
              onMouseDown={(e) => {
                if (e.detail > 1) {
                  e.preventDefault();
                }
              }}
              onKeyDown={handleKeyDown("name")}
              disabled={isSubmitting}
              className={`w-full border ${getInputBorderColor("name")} ${localName.length >= 50 ? 'border-red-300' : ''} rounded-xl px-4 py-3.5 
      bg-white/50 text-black focus:ring-2 focus:ring-amber-400 focus:border-amber-400 
      focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
            />

            {errors.name && (
              <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.name}
              </div>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2" data-field="email">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 
        8M5 19h14a2 2 0 002-2V7a2 2 0 
        00-2-2H5a2 2 0 00-2 2v10a2 
        2 0 002 2z"
                />
              </svg>
              Email Address
              <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full">
                Required
              </span>
            </label>
            <input
              ref={emailInputRef}
              type="text"
              value={localEmail}
              onChange={(e) => {
                setLocalEmail(e.target.value);
                // Clear email error when user starts typing
                if (errors.email && e.target.value.trim() !== "") {
                  setErrors(prev => ({ ...prev, email: "" }));
                }
              }}
              onClick={(e) => {
                if (e.detail === 1) {
                  e.target.select();
                }
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                const input = e.target;
                const clickX = e.nativeEvent.offsetX;
                const caretIndex = getCaretIndexFromClick(input, clickX);
                input.setSelectionRange(caretIndex, caretIndex);
              }}
              onMouseDown={(e) => {
                if (e.detail > 1) {
                  e.preventDefault();
                }
              }}
              onKeyDown={handleKeyDown("email")}
              disabled={isSubmitting}
              className={`w-full border ${getInputBorderColor("email")} rounded-xl px-4 py-3.5 
      bg-white/50 text-black focus:ring-2 focus:ring-amber-400 focus:border-amber-400 
      focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              inputMode="email"
              autoComplete="email"
            />
            {errors.email && (
              <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.email}
              </div>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-2" data-field="phone">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 
                  0 01.948.684l1.498 4.493a1 1 
                  0 01-.502 1.21l-2.257 1.13a11.042 
                  11.042 0 005.516 5.516l1.13-2.257a1 
                  1 0 011.21-.502l4.493 1.498a1 1 
                  0 01.684.949V19a2 2 0 01-2 2h-1C9.716 
                  21 3 14.284 3 6V5z"
                />
              </svg>
              Phone Number
              <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full">
                Required
              </span>
            </label>
            <input
              ref={phoneInputRef}
              type="text"
              value={localPhone}
              onChange={handlePhoneChange}
              onClick={(e) => {
                if (e.detail === 1) {
                  e.target.select();
                }
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                const input = e.target;
                const clickX = e.nativeEvent.offsetX;
                const caretIndex = getCaretIndexFromClick(input, clickX);
                input.setSelectionRange(caretIndex, caretIndex);
              }}
              onMouseDown={(e) => {
                if (e.detail > 1) {
                  e.preventDefault();
                }
              }}
              onKeyDown={handleKeyDown("phone")}
              disabled={isSubmitting}
              className={`w-full border ${getInputBorderColor("phone")} rounded-xl px-4 py-3.5 
                bg-white/50 text-black focus:ring-2 focus:ring-amber-400 focus:border-amber-400 
                focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              inputMode="tel"
              autoComplete="tel"
            />
            {errors.phone && (
              <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.phone}
              </div>
            )}
          </div>

          {/* Category Field */}
          <div className="space-y-2 category-dropdown-container" data-field="category">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Service Category
              <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full">
                Required
              </span>
            </label>

            <div className="relative">
              <input
                ref={categoryInputRef}
                type="text"
                value={localCategory}
                onChange={handleCategoryChange}
                onClick={(e) => {
                  if (e.detail === 1) {
                    e.target.select();
                  }
                  // Show dropdown if we have content and matches
                  if (localCategory.trim() !== "" && filteredCategories.length > 0) {
                    setShowCategoryDropdown(true);
                  }
                }}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  const input = e.target;
                  const clickX = e.nativeEvent.offsetX;
                  const caretIndex = getCaretIndexFromClick(input, clickX);
                  input.setSelectionRange(caretIndex, caretIndex);
                }}
                onMouseDown={(e) => {
                  if (e.detail > 1) {
                    e.preventDefault();
                  }
                }}
                onFocus={() => {
                  // Only show dropdown on focus if we have content and matches
                  // This prevents empty dropdown from opening on focus/tab
                  if (localCategory.trim() !== "" && filteredCategories.length > 0) {
                    setShowCategoryDropdown(true);
                  }
                }}
                onKeyDown={(e) => {
  if (e.key === 'Enter') {
    e.preventDefault();

    // If Enter is pressed and we have a selected category
    if (showCategoryDropdown && selectedCategoryIndex >= 0 && filteredCategories[selectedCategoryIndex]) {
      handleCategorySelect(filteredCategories[selectedCategoryIndex]);
      setShowCategoryDropdown(false);
    } else if (showCategoryDropdown && filteredCategories.length > 0) {
      // Select first item if dropdown is open but no specific item selected
      handleCategorySelect(filteredCategories[0]);
      setShowCategoryDropdown(false);
    } else {
      // Otherwise navigate to submit button
      submitButtonRef.current?.focus();
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (showCategoryDropdown && filteredCategories.length > 0) {
      // Move selection down
      const newIndex = selectedCategoryIndex < filteredCategories.length - 1
        ? selectedCategoryIndex + 1
        : 0;
      setSelectedCategoryIndex(newIndex);
      
      // Smooth scroll without jump
      setTimeout(() => {
        const selectedElement = document.querySelector(`[data-category-index="${newIndex}"]`);
        if (selectedElement) {
          const dropdownContainer = document.getElementById('category-dropdown');
          if (dropdownContainer) {
            const elementTop = selectedElement.offsetTop;
            const elementHeight = selectedElement.offsetHeight;
            const containerTop = dropdownContainer.scrollTop;
            const containerHeight = dropdownContainer.clientHeight;
            
            // Scroll only if element is not visible
            if (elementTop < containerTop || elementTop + elementHeight > containerTop + containerHeight) {
              selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }
        }
      }, 10); // Small delay to ensure DOM is updated
    } else if (categories.length > 0 && !showCategoryDropdown) {
      // If dropdown is closed, open it with all categories
      const sortedCategories = [...categories].sort((a, b) =>
        a.name?.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      setFilteredCategories(sortedCategories);
      setShowCategoryDropdown(true);
      setSelectedCategoryIndex(0);
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (showCategoryDropdown && filteredCategories.length > 0) {
      // Move selection up
      const newIndex = selectedCategoryIndex > 0
        ? selectedCategoryIndex - 1
        : filteredCategories.length - 1;
      setSelectedCategoryIndex(newIndex);
      
      // Smooth scroll without jump
      setTimeout(() => {
        const selectedElement = document.querySelector(`[data-category-index="${newIndex}"]`);
        if (selectedElement) {
          const dropdownContainer = document.getElementById('category-dropdown');
          if (dropdownContainer) {
            const elementTop = selectedElement.offsetTop;
            const elementHeight = selectedElement.offsetHeight;
            const containerTop = dropdownContainer.scrollTop;
            const containerHeight = dropdownContainer.clientHeight;
            
            // Scroll only if element is not visible
            if (elementTop < containerTop || elementTop + elementHeight > containerTop + containerHeight) {
              selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }
        }
      }, 10);
    } else if (categories.length > 0 && !showCategoryDropdown) {
      // If dropdown is closed, open it with all categories
      const sortedCategories = [...categories].sort((a, b) =>
        a.name?.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      setFilteredCategories(sortedCategories);
      setShowCategoryDropdown(true);
      setSelectedCategoryIndex(sortedCategories.length - 1);
    }
  } else if (e.key === 'Escape') {
    if (showCategoryDropdown) {
      e.preventDefault();
      setShowCategoryDropdown(false);
      setSelectedCategoryIndex(-1);
    }
  } else if (e.key === 'Tab') {
    // Close dropdown on tab
    if (showCategoryDropdown) {
      setShowCategoryDropdown(false);
      setSelectedCategoryIndex(-1);
    }
  } else {
    // For typing keys, the onChange handler will handle filtering
    // Reset selection when user types
    setSelectedCategoryIndex(-1);
  }
}}
                disabled={isSubmitting}
                className={`w-full border ${getInputBorderColor("category")} rounded-xl px-4 py-3.5 pr-12
        bg-white/50 text-black focus:ring-2 focus:ring-amber-400 focus:border-amber-400 
        focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              />

              {/* Dropdown arrow - always show when there are categories available */}
              {categories.length > 0 && (
  <div
    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer hover:bg-amber-50 p-1 rounded-lg transition-colors"
    onClick={() => {
      // Toggle dropdown when icon is clicked
      if (!showCategoryDropdown) {
        // ALWAYS load ALL categories when dropdown arrow is clicked
        // regardless of what's in the input field
        const sortedCategories = [...categories].sort((a, b) =>
          a.name?.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );
        
        // Set filteredCategories to ALL sorted categories
        setFilteredCategories(sortedCategories);
        
        // ALWAYS show the dropdown when arrow is clicked
        setShowCategoryDropdown(true);
        setSelectedCategoryIndex(sortedCategories.length > 0 ? 0 : -1);
        
        // Focus back to input after opening dropdown
        setTimeout(() => {
          categoryInputRef.current?.focus();
        }, 0);
      } else {
        setShowCategoryDropdown(false);
        setSelectedCategoryIndex(-1);
      }
    }}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!showCategoryDropdown) {
          // ALWAYS load ALL categories when dropdown arrow is activated via keyboard
          const sortedCategories = [...categories].sort((a, b) =>
            a.name?.localeCompare(b.name, undefined, { sensitivity: 'base' })
          );
          
          setFilteredCategories(sortedCategories);
          setShowCategoryDropdown(true);
          setSelectedCategoryIndex(sortedCategories.length > 0 ? 0 : -1);
        } else {
          setShowCategoryDropdown(false);
          setSelectedCategoryIndex(-1);
        }
      }
    }}
    tabIndex={0}
    role="button"
    aria-label="Toggle category dropdown"
    aria-expanded={showCategoryDropdown}
    aria-controls="category-dropdown"
  >
    <svg
      className={`w-5 h-5 text-gray-600 transition-transform ${
        showCategoryDropdown ? 'rotate-180' : ''
      }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </div>
)}

              {/* Dropdown menu - show when dropdown is open and there are categories */}
              {showCategoryDropdown && filteredCategories.length > 0 && (
                <div 
                  id="category-dropdown"
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto scroll-smooth"
                  ref={dropdownRef}
                >
                  {filteredCategories
                    .filter(category => category.name.toLowerCase() !== localCategory.toLowerCase())
                    .map((category, index) => (
                      <div
                        key={category.id}
                        className={`px-4 py-3 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0
                ${selectedCategoryIndex === index ? 'bg-gray-300' : 'hover:bg-amber-50'}`}
                        onClick={() => {
                          handleCategorySelect(category);
                          setShowCategoryDropdown(false);
                        }}
                        onMouseEnter={() => setSelectedCategoryIndex(index)}
                        onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleCategorySelect(category);
    setShowCategoryDropdown(false);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    const newIndex = index < filteredCategories.length - 1 ? index + 1 : 0;
    setSelectedCategoryIndex(newIndex);
    
    // Smooth scroll for dropdown items
    setTimeout(() => {
      const nextElement = document.querySelector(`[data-category-index="${newIndex}"]`);
      if (nextElement) {
        nextElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 10);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const newIndex = index > 0 ? index - 1 : filteredCategories.length - 1;
    setSelectedCategoryIndex(newIndex);
    
    // Smooth scroll for dropdown items
    setTimeout(() => {
      const prevElement = document.querySelector(`[data-category-index="${newIndex}"]`);
      if (prevElement) {
        prevElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 10);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    setShowCategoryDropdown(false);
    setSelectedCategoryIndex(-1);
    categoryInputRef.current?.focus();
  } else if (e.key === 'Tab') {
    // Close dropdown on tab
    setShowCategoryDropdown(false);
    setSelectedCategoryIndex(-1);
  }
}}
                        tabIndex={0}
                        role="option"
                        aria-selected={selectedCategoryIndex === index}
                        data-category-index={index}
                      >
                        <div className="font-medium text-gray-800">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-gray-500 mt-1">{category.description}</div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {errors.category && (
              <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.category}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Start typing to see matching categories, or click the dropdown icon (↓) to see all categories.
            </p>
          </div>

          {/* Submit Button */}
          <button
            ref={submitButtonRef}
            onClick={handleSubmit}
            onKeyDown={handleSubmitButtonKeyDown}
            disabled={isSubmitting}
            className={`w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-lg 
            font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 
            flex items-center justify-center gap-3 group relative overflow-hidden ${isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]"
              }`}
          >
            {isSubmitting && (
              <div className="absolute inset-0 bg-amber-500 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <svg
              className={`w-5 h-5 text-white transition-transform ${isSubmitting ? "opacity-0" : "group-hover:scale-110"
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 
                0L21 8M5 19h14a2 2 0 002-2V7a2 
                2 0 00-2-2H5a2 2 0 00-2 2v10a2 
                2 0 002 2z"
              />
            </svg>
            <span className={isSubmitting ? "opacity-0" : ""}>
              {isSubmitting ? "Submitting..." : "Notify Me When Available"}
            </span>
          </button>

          {/* Info Text */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 
                  12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {isSubmitting
                ? "Submitting your request..."
                : "We&apos;ll contact you as soon as we have providers in your area"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}