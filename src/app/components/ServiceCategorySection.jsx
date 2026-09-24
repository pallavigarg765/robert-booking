import { useEffect, useState } from "react";

export default function ServiceCategorySection({
    selectedProvider,
    providers,
    events,
    categories = [],
    selectedCategory,
    onCategorySelect,
    loading = false,
    onCategoriesReady
}) {
    const [serviceCategories, setServiceCategories] = useState([]);

    useEffect(() => {
        // Always clear previous provider categories first.
        setServiceCategories([]);
        onCategoriesReady?.([]);

        console.log("selectedProvider is here: ", selectedProvider);

        if (!selectedProvider || !providers || !events || !categories) {
            return;
        }

        // selectedProvider can be either an ID or a provider object.
        const provider =
    typeof selectedProvider === "object"
        ? selectedProvider
        : providers.find(
            p => String(p.id) === String(selectedProvider)
        );

if (
    !provider ||
    !Array.isArray(provider.services) ||
    provider.services.length === 0
) {
    return;
}

console.log("🔍 ServiceCategorySection selectedProvider:", selectedProvider);
console.log("🔍 ServiceCategorySection resolved provider:", provider);
console.log("🔍 Provider services:", provider?.services);
console.log("🔍 Events count:", events?.length);
console.log(
    "🔍 Matching services:",
    provider?.services?.filter(serviceId =>
        events.some(
            event => String(event.id) === String(serviceId)
        )
    )
);

        const providerServices = provider.services
            .map(serviceId => {
                const service = events.find(
                    event => String(event.id) === String(serviceId)
                );

                if (!service) return null;

                const serviceKey = service.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "_")
                    .replace(/(^_+|_+$)/g, "");

                return {
                    ...service,
                    key: serviceKey,
                    duration: service.duration || 60,
                    price: service.price || "0.00",
                };
            })
            .filter(Boolean);

        // Provider has service IDs, but none matched the events API.
        if (providerServices.length === 0) {
            return;
        }

        const grouped = {};

        categories.forEach(category => {
            if (!Array.isArray(category.events)) return;

            const categoryServices = providerServices.filter(service =>
                category.events
                    .map(Number)
                    .includes(Number(service.id))
            );

            if (categoryServices.length) {
                grouped[category.id] = {
                    ...category,
                    services: categoryServices,
                    icon: getCategoryIcon(category.name),
                };
            }
        });

        const result = Object.values(grouped).sort((a, b) =>
            a.name.localeCompare(b.name)
        );

        setServiceCategories(result);
        onCategoriesReady?.(result);
    }, [
        selectedProvider,
        providers,
        events,
        categories,
        onCategoriesReady
    ]);

    const getCategoryIcon = (name = "") => {
        const map = {
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

        const lower = name.toLowerCase();

        const key = Object.keys(map).find(k =>
            lower.includes(k)
        );

        return key ? map[key] : "🔧";
    };

    return null;
}