import { useMemo } from "react";

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

    const key = Object.keys(ICONS).find(k =>
        lower.includes(k)
    );

    return key ? ICONS[key] : "✨";
}

export default function SearchCategorySection({
    providers = [],
    categories = [],
    value,
    onChange,
}) {

    const availableCategories = useMemo(() => {

        return categories
            .filter(category => {

                if (!Array.isArray(category.events))
                    return false;

                return providers.some(provider => {

                    if (!Array.isArray(provider.services))
                        return false;

                    return provider.services.some(serviceId =>
                        category.events
                            .map(Number)
                            .includes(Number(serviceId))
                    );
                });

            })
            .sort((a,b)=>a.name.localeCompare(b.name));

    },[providers,categories]);

    return (
        <div className="space-y-2">

            <label className="block text-sm font-medium text-gray-700">
                Service Category
            </label>

            <select
                value={value}
                onChange={(e)=>onChange(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 focus:border-indigo-500 focus:outline-none"
            >

                <option value="ALL">
                    All Categories
                </option>

                {availableCategories.map(category=>(
                    <option
                        key={category.id}
                        value={category.id}
                    >
                        {getIcon(category.name)} {category.name}
                    </option>
                ))}

            </select>

        </div>
    );
}