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

    const key = Object.keys(ICONS).find((k) => lower.includes(k));

    return key ? ICONS[key] : "✨";
}

export default function SearchCategorySection({
    providers = [],
    blacklistedProviders = [],
    categories = [],
    value = "ALL",
    onChange,
}) {
    // console.log("blacklistedProviders: ", blacklistedProviders);
    const availableCategories = useMemo(() => {
        // Remove hidden providers first
        const visibleProviders = providers.filter((provider) => {
            return !blacklistedProviders.some((item) => {
                // Supports both:
                // ["12", "15"]
                // and
                // [{ providerId: "12" }, { providerId: "15" }]
                const hiddenId =
                    typeof item === "object"
                        ? item.providerId
                        : item;

                return String(hiddenId) === String(provider.id);
            });
        });

        return categories
            .filter((category) => {
                if (!Array.isArray(category.events)) return false;

                return visibleProviders.some((provider) => {
                    if (!Array.isArray(provider.services)) return false;

                    return provider.services.some((serviceId) =>
                        category.events
                            .map(Number)
                            .includes(Number(serviceId))
                    );
                });
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [providers, blacklistedProviders, categories]);

    useEffect(() => {
        if (value === "ALL") return;

        const exists = availableCategories.some(
            (category) => String(category.id) === String(value)
        );

        if (!exists) {
            onChange("ALL");
        }
    }, [availableCategories, value, onChange]);

    return (
        <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-800">
                Service Category
            </label>

            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={() => onChange("ALL")}
                    className={`group flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${value === "ALL"
                        ? "border-indigo-600 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                        : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                >
                    <span className="text-base">✨</span>
                    <span>All Categories</span>
                </button>

                {availableCategories.map((category) => {
                    const selected =
                        String(value) === String(category.id);

                    return (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => onChange(category.id)}
                            className={`group flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${selected
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