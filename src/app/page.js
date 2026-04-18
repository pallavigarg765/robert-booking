"use client";

import Banner from "./components/HomeBanner";
import FindBooking from "./components/FindBooking";
import ScheduleServices from "./components/ScheduleServices"; // 👈 import this
import Header from "./components/Header"; // 👈 import header
import { useAppData } from "./context/AppDataContext";
import { useEffect, useState } from "react";

export default function Home() {
  const {
    providers,
    events,
    locations,
    clients,
    fetchAllData,
    categories
  } = useAppData();

  const [activeSection, setActiveSection] = useState("find"); // ✅ default open

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <>
      <Header setActiveSection={setActiveSection} activeSection={activeSection} />

      <Banner />

      {activeSection === "find" && (
        <FindBooking
          providers={providers}
          events={events}
          locations={locations}
          clients={clients}
          categories={categories}
        />
      )}

      {activeSection === "schedule" && (
        <ScheduleServices
        providers={providers}
          events={events}
          locations={locations}
          clients={clients}
          categories={categories}
        />
      )}
    </>
  );
}