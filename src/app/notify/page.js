"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

export default function NotifyPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedIds, setSelectedIds] = useState([]);

  // Email Modal States
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Details Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // 🟢 Fetch enquiries
  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const res = await fetch("/api/enquiry");
        const data = await res.json();

        if (data.success) {
          setEnquiries(data.data || []);
        } else {
          console.error("❌ Failed to fetch enquiries:", data.error);
        }
      } catch (err) {
        console.error("❌ Error fetching enquiries:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnquiries();
  }, []);

  // 🔄 Sorting logic
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return "↕️";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  // 🧩 Filter + sort
  const filteredAndSortedEnquiries = enquiries
    .filter((enquiry) => {
      return (
        enquiry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.enquiredBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.category?.toLowerCase().includes(searchTerm.toLowerCase()) // Added category to search
      );
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  // 🧮 Checkbox logic
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedEnquiries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedEnquiries.map((e) => e._id));
    }
  };

  // 👁️ View Details
  const handleViewDetails = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedEnquiry(null);
  };

  // 🗑️ Delete Function
  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one enquiry to delete.");
      return;
    }

    const confirmMsg =
      selectedIds.length === 1
        ? "Are you sure you want to delete this enquiry?"
        : "Are you sure you want to delete selected enquiries?";

    if (!confirm(confirmMsg)) return;

    try {
      let res;
      if (selectedIds.length === 1) {
        const id = selectedIds[0];
        res = await fetch(`/api/enquiry?id=${id}`, {
          method: "DELETE",
        });
      } else {
        res = await fetch("/api/enquiry", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedIds }),
        });
      }

      const data = await res.json();

      if (data.success) {
        alert(data.message || "Deleted successfully!");
        setEnquiries((prev) =>
          prev.filter((enquiry) => !selectedIds.includes(enquiry._id))
        );
        setSelectedIds([]);
      } else {
        alert(data.error || "Failed to delete.");
      }
    } catch (err) {
      console.error("❌ Delete error:", err);
      alert("An error occurred while deleting.");
    }
  };

  // 📤 Export selected as CSV
  const handleExport = () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one enquiry to export.");
      return;
    }

    const selectedData = enquiries.filter((e) => selectedIds.includes(e._id));
    const csvRows = [
      ["Date", "State", "City", "Name", "Email", "Phone", "Category"], // Changed Services to Category
      ...selectedData.map((e) => [
        new Date(e.createdAt).toLocaleString(),
        e.state || "",
        e.city || "",
        e.enquiredBy || "",
        e.email || "",
        e.phoneNumber || "",
        e.category || "N/A", // Changed from Services to category
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "enquiries_export.csv";
    link.click();
  };

  // 📧 Email modal logic
  const handleEmail = () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one enquiry to email.");
      return;
    }
    setShowEmailModal(true);
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    setRecipientEmail("");
    setEmailMessage("");
  };

  // ✅ Send Email using backend API
  const handleSendEmail = async () => {
    if (!recipientEmail) {
      alert("Please enter recipient email.");
      return;
    }

    const selectedData = enquiries
      .filter((e) => selectedIds.includes(e._id))
      .map((e) => ({
        name: e.enquiredBy,
        email: e.email,
        phone: e.phoneNumber,
        city: e.city,
        state: e.state,
        category: e.category, // Added category to email data
      }));

    if (selectedData.length === 0) {
      alert("No valid enquiries selected to send.");
      return;
    }

    try {
      setSending(true);

      const res = await fetch("/api/enquirymailer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: recipientEmail,
          enquiries: selectedData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Email sent successfully!");
        closeEmailModal();
      } else {
        alert("❌ Failed to send email: " + data.message);
      }
    } catch (err) {
      console.error("Email error:", err);
      alert("❌ Error sending email.");
    } finally {
      setSending(false);
    }
  };

  // Function to get category badge styling
  const getCategoryBadge = (category) => {
    const categoryColors = {
      wax: "bg-amber-100 text-amber-700",
      cleaning: "bg-blue-100 text-blue-700",
      repair: "bg-red-100 text-red-700",
      maintenance: "bg-green-100 text-green-700",
      installation: "bg-purple-100 text-purple-700",
      consultation: "bg-indigo-100 text-indigo-700",
      default: "bg-gray-100 text-gray-700"
    };

    const colorClass = categoryColors[category?.toLowerCase()] || categoryColors.default;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
        {category || "N/A"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh] text-gray-600 text-lg">
        Loading enquiries...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
          Enquiry Management
        </h1>
        <p className="text-white text-base">
          Seamlessly manage and track all your enquiries in one elegant view.
        </p>
        <div className="w-20 h-[2px] bg-gradient-to-r from-amber-500 to-orange-400 mx-auto mt-3 rounded-full"></div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <input
          type="text"
          placeholder="🔍 Search by name, city, state, email, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 bg-gray-50 focus:bg-white focus:border-amber-500 transition-all duration-200 rounded-xl px-4 py-2 w-full sm:w-1/3 shadow-sm placeholder-gray-400 text-sm text-black"
        />

        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="bg-white text-black px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            Export
          </button>
          <button
            onClick={handleDelete}
            className="bg-white text-black px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            Delete
          </button>
          <button
            onClick={handleEmail}
            className="bg-white text-black px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            Email
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl shadow-lg border border-gray-200 bg-white backdrop-blur-sm">
        <table className="min-w-full border-collapse text-sm text-gray-700">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200">
            <tr>
              {[
                { key: "createdAt", label: "Date" },
                { key: "state", label: "State" },
                { key: "city", label: "City" },
                { key: "enquiredBy", label: "Name" },
                { key: "email", label: "Email" },
                { key: "phoneNumber", label: "Phone" },
                { key: "category", label: "Category" }, // Changed from Services to Category
                { key: "details", label: "Details" },
              ].map((header) => (
                <th
                  key={header.key}
                  onClick={() =>
                    header.key && header.key !== "details" && handleSort(header.key)
                  }
                  className={`p-4 text-left font-semibold text-gray-700 uppercase tracking-wide text-xs border-r last:border-none ${
                    header.key && header.key !== "details"
                      ? "cursor-pointer hover:bg-gray-200 transition-colors"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {header.label}
                    {header.key && header.key !== "details" && (
                      <span className="text-xs">
                        {getSortIndicator(header.key)}
                      </span>
                    )}
                  </div>
                </th>
              ))}

              {/* Checkbox column */}
              <th className="p-4 text-center font-semibold text-gray-700 uppercase tracking-wide text-xs">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === filteredAndSortedEnquiries.length &&
                    filteredAndSortedEnquiries.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredAndSortedEnquiries.length > 0 ? (
              filteredAndSortedEnquiries.map((enquiry, index) => (
                <tr
                  key={enquiry._id}
                  className={`border-b border-gray-100 hover:bg-amber-50/50 transition ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="p-4 border-r text-gray-600">
                    {new Date(enquiry.createdAt).toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-4 border-r font-medium text-gray-800">
                    {enquiry.state || "N/A"}
                  </td>
                  <td className="p-4 border-r">{enquiry.city || "N/A"}</td>
                  <td className="p-4 border-r font-medium text-gray-800 capitalize">
                    {enquiry.enquiredBy || "N/A"}
                  </td>
                  <td className="p-4 border-r text-blue-600 truncate max-w-[200px]">
                    {enquiry.email}
                  </td>
                  <td className="p-4 border-r text-gray-700">
                    {enquiry.phoneNumber || "—"}
                  </td>
                  <td className="p-4 border-r">
                    {getCategoryBadge(enquiry.category)}
                  </td>
                  <td className="p-4 border-r text-center">
                    <button
                      onClick={() => handleViewDetails(enquiry)}
                      className="bg-black text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                    >
                      View
                    </button>
                  </td>

                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(enquiry._id)}
                      onChange={() => toggleSelect(enquiry._id)}
                      className="w-4 h-4 accent-amber-500 cursor-pointer"
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="9"
                  className="p-8 text-center text-gray-500 font-medium"
                >
                  No enquiries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-center text-gray-400 text-xs mt-6">
        © {new Date().getFullYear()} Enquiry Management Dashboard
      </p>

      {/* 🔵 Details Modal */}
      {showDetailsModal && selectedEnquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded-xl p-6 w-96 max-h-[80vh] overflow-y-auto shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-center">Enquiry Details</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">Name:</span>
                <span className="text-gray-700 capitalize">{selectedEnquiry.enquiredBy || "N/A"}</span>
              </div>
              
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">Email:</span>
                <span className="text-blue-600">{selectedEnquiry.email || "N/A"}</span>
              </div>
              
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">Phone:</span>
                <span className="text-gray-700">{selectedEnquiry.phoneNumber || "N/A"}</span>
              </div>
              
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">State:</span>
                <span className="text-gray-700">{selectedEnquiry.state || "N/A"}</span>
              </div>
              
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">City:</span>
                <span className="text-gray-700">{selectedEnquiry.city || "N/A"}</span>
              </div>
              
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">Category:</span>
                {getCategoryBadge(selectedEnquiry.category)}
              </div>
              
              {selectedEnquiry.pincode && (
                <div className="flex justify-between border-b pb-2">
                  <span className="font-semibold">Pincode:</span>
                  <span className="text-gray-700">{selectedEnquiry.pincode}</span>
                </div>
              )}
              
              {selectedEnquiry.fullAddress && (
                <div className="flex justify-between border-b pb-2">
                  <span className="font-semibold">Address:</span>
                  <span className="text-gray-700 text-right">{selectedEnquiry.fullAddress}</span>
                </div>
              )}
              
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold">Date:</span>
                <span className="text-gray-700">
                  {new Date(selectedEnquiry.createdAt).toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
              
              {selectedEnquiry._id && (
                <div className="flex justify-between border-b pb-2">
                  <span className="font-semibold">ID:</span>
                  <span className="text-gray-700 font-mono text-xs">{selectedEnquiry._id}</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-center mt-6">
              <button
                onClick={closeDetailsModal}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟣 Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded-xl p-6 w-96 shadow-lg">
            <h2 className="text-xl font-bold mb-3 text-center">Send Email</h2>
            <p className="text-sm text-gray-600 text-center mb-4">
              Selected enquiries:{" "}
              <strong>{selectedIds.length}</strong>
            </p>
            <input
              type="email"
              placeholder="Enter recipient email..."
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-3"
            />
            <textarea
              placeholder="Enter your message..."
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-2 mb-4 resize-none"
            />
            <div className="flex justify-between">
              <button
                onClick={closeEmailModal}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sending}
                className={`px-4 py-2 rounded-lg text-white ${
                  sending ? "bg-blue-300" : "bg-blue-600"
                }`}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}