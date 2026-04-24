"use client";

import Banner from "../components/HomeBanner";
import FindBooking from "../components/FindBooking";
import { useAppData } from "../context/AppDataContext";
import { useEffect } from "react";

export default function FindServicesPage() {
  const {
    providers,
    events,
    locations,
    clients,
    fetchAllData,
    categories
  } = useAppData();

  useEffect(() => {
    fetchAllData();
  }, []);

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