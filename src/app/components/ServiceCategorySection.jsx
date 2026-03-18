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
        if (!selectedProvider || !providers || !events || !categories) return;

        const provider = providers.find(p => p.id === selectedProvider);
        if (!provider?.services) return;

        const providerServices = provider.services
            .map(serviceId => {
                const service = events.find(
                    event => event.id === serviceId.toString()
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


        const grouped = {};

        categories.forEach(category => {
            if (!Array.isArray(category.events)) return;

            const categoryServices = providerServices.filter(service =>
                category.events.map(Number).includes(Number(service.id))
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
    }, [selectedProvider, providers, events, categories]);

    const getCategoryIcon = (name) => {
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
        return Object.keys(map).find(k => lower.includes(k))
            ? map[Object.keys(map).find(k => lower.includes(k))]
            : "🔧";
    };

    // if (loading) {
    //     return (
    //         <div className="text-center py-6">
    //             <p className="text-sm text-gray-500">Loading...</p>
    //         </div>
    //     );
    // }

    return null;
    // return (
    //     <div className="space-y-2">
    //         {serviceCategories.map(category => (
    //             <button
    //                 key={category.id}
    //                 onClick={() => onCategorySelect(category)}
    //                 className={`w-full flex items-center gap-3 p-3 rounded-lg border transition ${selectedCategory?.id === category.id
    //                     ? "border-purple-500 bg-purple-50"
    //                     : "border-gray-200 hover:border-purple-300"
    //                     }`}
    //             >
    //                 <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
    //                     {category.icon}
    //                 </div>

    //                 <div className="flex-1 text-left">
    //                     <div className="text-sm font-semibold">{category.name}</div>
    //                     <div className="text-xs text-gray-500">
    //                         {category.services.length} services
    //                     </div>
    //                 </div>
    //             </button>
    //         ))}
    //     </div>
    // );
}
