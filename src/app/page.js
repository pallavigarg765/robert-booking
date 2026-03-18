"use client";

import Banner from "./components/HomeBanner";
import FindBooking from "./components/FindBooking";
import { useAppData } from "./context/AppDataContext";
import { useEffect } from "react";

export default function Home() {
  const {
    providers,
    events,
    locations,
    clients,
    fetchAllData,
    categories
  } = useAppData();

  // ✅ Fetch all global data when the page loads (only once)
  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // console.log("events: ", events);

  return (
    <>
      <Banner />
      <FindBooking
        providers={providers}
        events={events}
        locations={locations}
        clients={clients}
        categories={categories}
      />
    </>
  );
}
