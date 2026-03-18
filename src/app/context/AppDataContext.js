"use client";
import { createContext, useContext, useState, useCallback, useEffect } from "react";

const AppDataContext = createContext();

export const AppDataProvider = ({ children }) => {
  const [providers, setProviders] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAllData = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_BASE_URL;

      const [providersRes, eventsRes, locationsRes, clientsRes, categoriesRes] = await Promise.all([
        fetch(`/api/providers`),
        fetch(`/api/events`),
        fetch(`/api/locations`),
        fetch(`/api/clients`),
        fetch(`/api/categories`),
      ]);

      const [providersJson, eventsJson, locationsJson, clientsJson, categoriesJson] = await Promise.all([
        providersRes.ok ? providersRes.json() : [],
        eventsRes.ok ? eventsRes.json() : [],
        locationsRes.ok ? locationsRes.json() : [],
        clientsRes.ok ? clientsRes.json() : [],
        categoriesRes.ok ? categoriesRes.json() : [],
      ]);

      // 🧠 Convert object to array safely
      const normalize = (data) =>
        Array.isArray(data)
          ? data
          : typeof data === "object" && data !== null
          ? Object.values(data)
          : [];

      const filteredProviders = normalize(providersJson).filter(
        (p) =>
          p.is_active === "1" &&
          p.is_visible === "1" &&
          (p.good_standing === true ||
            p.good_standing === "1" ||
            p.good_standing === "yes" ||
            p.good_standing === "true" ||
            !("good_standing" in p))
      );

      setProviders(filteredProviders);
      setEvents(normalize(eventsJson));
      setLocations(normalize(locationsJson));
      setClients(normalize(clientsJson));
      setCategories(normalize(categoriesJson))
    } catch (err) {
      console.error("Error fetching in app data:", err);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // useEffect(() => {   
  //   console.log("Provider updated :", providers);
  // }, [providers]);

  // useEffect(()=>{
  //   console.log("events updated:", events);
  // },[events]);

  // useEffect(()=>{
  //   console.log("categories updated:", categories);
  // },[categories]);

  // useEffect(()=>{
  //   console.log("location updated:", locations);
  // },[locations]);

  // useEffect(()=>{
  //   console.log("clients updated:", clients);
  // },[clients]);

  return (
    <AppDataContext.Provider
      value={{
        providers,
        events,
        categories,
        locations,
        clients,
        loading,
        fetchAllData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);