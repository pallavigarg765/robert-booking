import { useState, useEffect } from "react";

export default function ServicesSection({ 
  services, 
  onCheckboxChange, 
  loadingServices = false,
  selectedProvider,
  providers,
  events,
  onClose,
  categories = []
}) {
  const [selectedCount, setSelectedCount] = useState(0);
  const [availableServices, setAvailableServices] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryView, setShowCategoryView] = useState(true);

  // Get the provider's available services and group by category
  useEffect(() => {
    if (selectedProvider && providers && events && categories) {
      const provider = providers.find(p => p.id === selectedProvider);
      if (provider && provider.services) {
        const providerServices = provider.services
          .map(serviceId => {
            const service = events.find(event => event.id === serviceId.toString());
            if (service) {
              const serviceKey = service.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/(^_+|_+$)/g, '');
              
              return {
                id: service.id,
                name: service.name,
                price: service.price || "0.00",
                currency: service.currency || "USD",
                key: serviceKey,
                duration: service.duration || 60
              };
            }
            return null;
          })
          .filter(service => service !== null);

        setAvailableServices(providerServices);

        const groupedByCategory = {};
        categories.forEach(category => {
          if (Array.isArray(category.events)) {
            const categoryEventIds = category.events.map(id => Number(id)).filter(id => !isNaN(id));
            const categoryServices = providerServices.filter(service => 
              categoryEventIds.includes(Number(service.id))
            );
            
            if (categoryServices.length > 0) {
              groupedByCategory[category.id] = {
                ...category,
                services: categoryServices,
                icon: getCategoryIcon(category.name)
              };
            }
          }
        });

        const categoryArray = Object.values(groupedByCategory)
          .sort((a, b) => a.name.localeCompare(b.name));

        setServiceCategories(categoryArray);
      }
    }
  }, [selectedProvider, providers, events, services, categories]);

  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'nails': '💅', 'hair': '💇', 'massage': '💆', 'spa': '✨',
      'skin': '🌟', 'makeup': '💄', 'eyelash': '👁️', 'eyebrow': '✏️',
      'waxing': '🔥', 'default': '🔧'
    };
    const lowerName = categoryName.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(key)) return icon;
    }
    return iconMap.default;
  };

  useEffect(() => {
    const count = Object.values(services).filter(Boolean).length;
    setSelectedCount(count);
  }, [services]);

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setShowCategoryView(false);
  };

  const handleServiceSelect = (service) => {
    const serviceKey = service.key;
    const newCheckedState = !services[serviceKey];
    
    if (onCheckboxChange) {
      const syntheticEvent = {
        target: { name: serviceKey, checked: newCheckedState }
      };
      onCheckboxChange(syntheticEvent);
    }
  };

  const selectedCategoryData = serviceCategories.find(cat => cat.id === selectedCategory);

  return (
    <div className="space-y-3">
      {loadingServices ? (
        <div className="text-center py-6">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-gray-600 mt-2">Loading...</p>
        </div>
      ) : showCategoryView ? (
        <div className="space-y-2">
          {serviceCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-sm">
                {category.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-gray-800">{category.name}</div>
                <div className="text-xs text-gray-500">{category.services.length} services</div>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={() => setShowCategoryView(true)}
            className="flex items-center gap-2 text-xs text-purple-600 hover:text-purple-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to categories
          </button>

          {selectedCategoryData && (
            <>
              <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                <div className="text-lg">{selectedCategoryData.icon}</div>
                <div className="text-xs font-semibold text-gray-700">{selectedCategoryData.name}</div>
              </div>

              <div className="space-y-2">
                {selectedCategoryData.services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                      services[service.key]
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 bg-white hover:border-purple-300"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      services[service.key]
                        ? "border-purple-500 bg-purple-500"
                        : "border-gray-300"
                    }`}>
                      {services[service.key] && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 truncate">{service.name}</div>
                      <div className="text-xs text-gray-500">{service.duration} min</div>
                    </div>
                    <div className="text-xs font-semibold text-green-600">
                      ${parseFloat(service.price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-600 text-center">
              {selectedCount} selected
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
