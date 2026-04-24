"use client";

import Banner from "../components/HomeBanner";
import ScheduleServices from "../components/ScheduleServices";
import { useAppData } from "../context/AppDataContext";
import { useEffect } from "react";

export default function ScheduleServicesPage() {
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
      <ScheduleServices
        providers={providers}
        events={events}
        locations={locations}
        clients={clients}
        categories={categories}
      />
    </>
  );
}