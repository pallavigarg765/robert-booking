"use client";

import { useMemo, useEffect } from "react";

const ICONS = {
    nails: "💅",
    hair: "💇",
    massage: "💆",
    spa: "✨",
    skin: "🌟",
    makeup: "💄",
    eyelash: "👁️",
    eyebrow: "✏️",
    waxing: "🔥",
};

function getIcon(name = "") {
    const lower = name.toLowerCase();
    const key = Object.keys(ICONS).find((item) => lower.includes(item));

    return key ? ICONS[key] : "✨";
}

export default function SearchCategorySection({
    providers = [],
    blacklistedProviders = [],
    categories = [],
    value = ["ALL"],
    onChange,
    setSelectedProvider,
}) {
    const selectedCategoryIds = Array.isArray(value)
        ? value.map(String).filter((id) => id !== "ALL")
        : value && value !== "ALL"
            ? [String(value)]
            : [];

    const availableCategories = useMemo(() => {
        return [...categories]
            .filter((category) => Array.isArray(category.events))
            .sort((a, b) =>
                String(a.name || "").localeCompare(String(b.name || ""))
            );
    }, [categories]);

    // Keep selected IDs valid if the available categories change.
    useEffect(() => {
        const validIds = new Set(
            availableCategories.map((category) => String(category.id))
        );

        const validSelectedIds = selectedCategoryIds.filter((id) =>
            validIds.has(id)
        );

        if (validSelectedIds.length !== selectedCategoryIds.length) {
            onChange?.(
                validSelectedIds.length > 0
                    ? validSelectedIds
                    : ["ALL"]
            );
        }
    }, [availableCategories, value, onChange]);

    const handleCategoryChange = (categoryId) => {
        const id = String(categoryId);

        // Selecting All Categories clears every individual selection.
        if (id === "ALL") {
            onChange?.(["ALL"]);
            setSelectedProvider?.(null);
            return;
        }

        const currentSelected = Array.isArray(value)
            ? value.map(String).filter((item) => item !== "ALL")
            : value && value !== "ALL"
                ? [String(value)]
                : [];

        const updatedSelected = currentSelected.includes(id)
            ? currentSelected.filter((item) => item !== id)
            : [...currentSelected, id];

        onChange?.(
            updatedSelected.length > 0
                ? updatedSelected
                : ["ALL"]
        );

        // Clear the selected provider because the provider list will change.
        setSelectedProvider?.(null);
    };

    const isAllSelected = selectedCategoryIds.length === 0;

    return (
        <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-800">
                Service Category
            </label>

            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={() => handleCategoryChange("ALL")}
                    className={`group flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                        isAllSelected
                            ? "border-indigo-600 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                            : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                >
                    <span className="text-base">✨</span>
                    <span>All Categories</span>
                </button>

                {availableCategories.map((category) => {
                    const selected = selectedCategoryIds.includes(
                        String(category.id)
                    );

                    return (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() =>
                                handleCategoryChange(category.id)
                            }
                            aria-pressed={selected}
                            className={`group flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                                selected
                                    ? "border-indigo-600 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                                    : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                            }`}
                        >
                            <span className="text-base">
                                {getIcon(category.name)}
                            </span>

                            <span>{category.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}