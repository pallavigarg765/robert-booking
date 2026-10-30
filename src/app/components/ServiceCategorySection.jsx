
"use client";

import { useEffect, useState } from "react";

function getCategoryIcon(name = "") {
    const icons = {
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

    const lower = String(name).toLowerCase();
    const key = Object.keys(icons).find((item) => lower.includes(item));

    return key ? icons[key] : "🔧";
}

export default function ServiceCategorySection({
    selectedProvider,
    providers = [],
    events = [],
    categories = [],
    // loading = false,
    onCategoriesReady,
}) {
    const [serviceCategories, setServiceCategories] = useState([]);

    useEffect(() => {
        // Clear categories belonging to the previously selected provider.
        setServiceCategories([]);
        onCategoriesReady?.([]);

        if (
    !selectedProvider ||
    !Array.isArray(providers) ||
    !Array.isArray(events) ||
    !Array.isArray(categories)
) {
    onCategoriesReady?.([]);
    return;
}

        // selectedProvider can be either a provider object or an ID.
        const provider =
            typeof selectedProvider === "object"
                ? selectedProvider
                : providers.find(
                    (item) =>
                        String(item.id) === String(selectedProvider)
                );

        if (!provider || !Array.isArray(provider.services)) {
            return;
        }

        // Normalize provider service IDs to strings.
        const providerServiceIds = new Set(
            provider.services.map((service) =>
                String(
                    typeof service === "object"
                        ? service.id
                        : service
                )
            )
        );

        // Resolve the provider's service IDs against the events list.
        const providerServices = events
            .filter((event) => providerServiceIds.has(String(event.id)))
            .map((service) => ({
                ...service,
                key: String(service.name || "")
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "_")
                    .replace(/^_+|_+$/g, ""),
                duration: Number(service.duration) || 60,
                price: service.price ?? "0.00",
            }));

        if (providerServices.length === 0) {
            return;
        }

        const grouped = categories
            .filter((category) => Array.isArray(category.events))
            .map((category) => {
                const categoryEventIds = new Set(
                    category.events.map((id) =>
                        String(
                            typeof id === "object" ? id.id : id
                        )
                    )
                );

                const categoryServices = providerServices.filter(
                    (service) =>
                        categoryEventIds.has(String(service.id))
                );

                if (categoryServices.length === 0) {
                    return null;
                }

                return {
                    ...category,
                    services: categoryServices,
                    icon: getCategoryIcon(category.name),
                };
            })
            .filter(Boolean)
            .sort((a, b) =>
                String(a.name || "").localeCompare(
                    String(b.name || "")
                )
            );

        setServiceCategories(grouped);
        onCategoriesReady?.(grouped);
    }, [
        selectedProvider,
        providers,
        events,
        categories,
        // loading,
        onCategoriesReady,
    ]);

    return null;
}
