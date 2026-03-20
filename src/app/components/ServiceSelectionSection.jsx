import { Info, X } from "lucide-react";
import { useState, useRef } from "react";

export default function ServiceSelectionSection({
  categories = [],
  selectedCategory,
  services,
  onCheckboxChange,
  selectedProvider,
  providers,
}) {
  const [activeService, setActiveService] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [preHoverSelection, setPreHoverSelection] = useState({});
  const hoverTimeoutRef = useRef(null);
  const isClickingRef = useRef(false);

  const provider = providers.filter((item) => {
    return item.id == selectedProvider
  });

  console.log("selectedCategory: ", selectedCategory);

  const toggleCategory = (catId) => {
    setCollapsed(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const providerName = provider?.name || "";
  const cleanName = (name = "") =>
    name
      // remove leading "03a) ", "10b) ", etc.
      .replace(/^\d+[a-z]\)\s*/i, "")
      // remove schedule suffixes
      .replace(/\s*,?\s*(DTD|Salon)\s*Schedule/i, "");

  // const visibleServices = collapsed[category.id]
  //   ? category.services.filter(s => services?.[s.key])
  //   : category.services;


  // if (!selectedCategory) {
  //   return (
  //     <div className="flex items-center justify-center h-full text-sm text-gray-500">
  //       Select a service type first
  //     </div>
  //   );
  // }

  return (
    <>
      {activeService && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-fadeIn">

            {/* Close Button */}
            <button
              onClick={() => setActiveService(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold mb-4 text-purple-700">
              {activeService.name}
            </h2>

            <div className="space-y-3 text-sm">

              <div className="flex justify-between">
                <span className="text-gray-500">Category</span>
                <span>{activeService?.categoryName}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Provider</span>
                <span>{cleanName(providerName)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Duration</span>
                <span>{activeService.duration} minutes</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Price</span>
                <span className="font-semibold text-green-600">
                  ${parseFloat(activeService.price).toFixed(2)}
                </span>
              </div>

              {activeService.description && (
                <div>
                  <div className="text-gray-500 mb-1">Included</div>
                  <div
                    className="bg-gray-50 p-3 rounded-lg text-xs text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: activeService.description,
                    }}
                  />

                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {/* <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
        <span className="text-lg">{selectedCategory.icon}</span>
        <span className="text-sm font-semibold">{selectedCategory.name}</span>
      </div> */}

        <div className="space-y-2">
          <div>

            {[...categories]
              .sort((a, b) => {
                if (a.id === selectedCategory) return -1;
                if (b.id === selectedCategory) return 1;
                return 0;
              })
              .map(category => {

                const isCollapsed = collapsed[category.id];
                const selectedServices = category.services.filter(s => services?.[s.key]);

                const hasSelection = selectedServices.length > 0;

                const visibleServices =
                  hoveredCategory === category.id
                    ? preHoverSelection[category.id]
                      ? (hasSelection ? selectedServices : category.services)
                      : category.services
                    : selectedServices;

                return (
                  <div className="py-1">
                  <div
                    key={category.id}
                    onMouseEnter={() => {
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                      }

                      const selectedServices = category.services.filter(s => services?.[s.key]);

                      setPreHoverSelection(prev => ({
                        ...prev,
                        [category.id]: selectedServices.length > 0
                      }));

                      setHoveredCategory(category.id);
                    }}
                    onMouseLeave={() => {
                      if (isClickingRef.current) return;

                      hoverTimeoutRef.current = setTimeout(() => {
                        setHoveredCategory(null);
                      }, 300); // 👈 key fix (adjust 100–200ms)
                    }}
                    className="relative border border-gray-200 rounded-xl overflow-hidden shadow-sm group"
                  >
                    <div className="absolute left-0 right-0 h-3 bottom-[-12px]" />
                    {/* CATEGORY HEADER */}
                    <div
                      onClick={() => toggleCategory(category.id)}
                      className="flex items-center justify-between px-3 py-2 cursor-pointer bg-gray-50 rounded-t-xl"
                    >
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span className="text-sm font-semibold">{category.name}</span>
                      </div>

                      <svg
                        className={`w-4 h-4 transition-transform ${hoveredCategory === category.id ? "rotate-180" : ""
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* SERVICES */}
                    <div
                      className={`p-2 space-y-2 transition-all ${hoveredCategory === category.id ? "block" : "hidden"
                        }`}
                    >
                      {visibleServices.length === 0 && isCollapsed && (
                        <div className="text-xs text-gray-400">No selected services</div>
                      )}

                      {visibleServices.map(service => {
                        const isSelected = Boolean(services?.[service.key]);

                        return (
                          <div
                            key={service.id}
                            onMouseDown={() => {
                              isClickingRef.current = true;
                            }}

                            onClick={() => {
                              const willSelect = !isSelected;

                              onCheckboxChange({
                                target: {
                                  name: service.key,
                                  checked: willSelect
                                }
                              });

                              // 🟢 IMPORTANT FIX
                              setTimeout(() => {
                                const updatedSelected = category.services.filter(s => {
                                  if (s.key === service.key) return willSelect;
                                  return services?.[s.key];
                                });

                                if (updatedSelected.length === 0) {
                                  // reset state when no selection
                                  setPreHoverSelection(prev => ({
                                    ...prev,
                                    [category.id]: false
                                  }));
                                }

                                isClickingRef.current = false;
                              }, 0);
                            }}
                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition
        ${isSelected
                                ? "border-purple-500 bg-purple-50"
                                : "border-gray-200 hover:border-purple-300"}`}
                          >
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center
                ${isSelected ? "border-purple-500 bg-purple-500" : "border-gray-300"}`}
                            >
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">{service.name}</div>
                              <div className="text-xs text-gray-500">{service.duration} min</div>
                            </div>

                            <div className="text-xs font-semibold text-green-600">
                              ${parseFloat(service.price).toFixed(2)}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveService(service);
                              }}
                              className="p-1 text-gray-400 hover:text-purple-600"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  </div>
                );

              })}

          </div>

        </div>
      </div>
    </>
  );
} 
