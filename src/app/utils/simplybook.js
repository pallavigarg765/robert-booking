const API_URL = "https://user-api.simplybook.me";
const LOGIN_URL = `${API_URL}/login`;
const ADMIN_URL = `${API_URL}/admin`;
import { createHash } from "node:crypto";

/**
 * Find a SimplyBook client by email and return the
 * authorization details required for client login.
 *
 * IMPORTANT:
 * This requires SimplyBook's admin API to expose the
 * client's hash in getClientList or getClientInfo.
 */
export async function getSimplyBookClientByEmail(email) {
  if (!email || typeof email !== "string") {
    throw new Error("A valid client email is required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Search through the admin client list.
  const pageSize = 100;
  let start = 0;

  while (true) {
    const clients = await getClients(pageSize, start);

    // Accommodate common list response shapes.
    const list = Array.isArray(clients)
      ? clients
      : Array.isArray(clients?.data)
        ? clients.data
        : Array.isArray(clients?.clients)
          ? clients.clients
          : [];

    const matchingClient = list.find((client) => {
      const clientEmail =
        client?.email ??
        client?.client_email ??
        client?.email_address;

      return (
        typeof clientEmail === "string" &&
        clientEmail.trim().toLowerCase() === normalizedEmail
      );
    });

    if (matchingClient) {
      const clientId =
        matchingClient.client_id ??
        matchingClient.id;

      if (!clientId) {
        throw new Error(
          "The SimplyBook client was found, but their client ID is missing"
        );
      }

      // Fetch full client details in case the list omits the hash.
      const clientDetails = await getClient(clientId);

      const clientHash =
        clientDetails?.client_hash ??
        clientDetails?.hash ??
        matchingClient?.client_hash ??
        matchingClient?.hash;

      if (!clientHash) {
        throw new Error(
          "The SimplyBook client was found, but the client hash " +
            "was not returned by the admin API. Retrieve it from " +
            "your server-side client storage."
        );
      }

      return {
        clientId,
        clientHash,
      };
    }

    // A short page means there are no more clients.
    if (list.length < pageSize) {
      break;
    }

    start += pageSize;
  }

  return null;
}

function createClientSign(clientId, clientHash) {
  const secretKey = process.env.BOOKING_API_SECRET;

  if (!secretKey) {
    throw new Error(
      "BOOKING_API_SECRET is not configured"
    );
  }

  if (!clientId || !clientHash) {
    throw new Error(
      "SimplyBook client ID and hash are required"
    );
  }

  return createHash("md5")
    .update(
      `${clientId}${clientHash}${secretKey}`,
      "utf8"
    )
    .digest("hex");
}

/* -------------------------------------------------------
   PUBLIC API AUTHENTICATION
------------------------------------------------------- */

export async function getToken() {
  const res = await fetch(LOGIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "getToken",
      params: [
        process.env.SIMPLYBOOK_COMPANY,
        process.env.SIMPLYBOOK_API_KEY,
      ],
      id: 1,
    }),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(
      data.error?.message || "Failed to fetch SimplyBook token"
    );
  }

  if (!data.result) {
    throw new Error("SimplyBook did not return an API token");
  }

  return data.result;
}

/* -------------------------------------------------------
   ADMIN API AUTHENTICATION
------------------------------------------------------- */

export async function getAdminToken() {
  const res = await fetch(LOGIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "getUserToken",
      params: [
        process.env.SIMPLYBOOK_COMPANY,
        process.env.SIMPLYBOOK_ADMIN_USER,
        process.env.SIMPLYBOOK_ADMIN_PASS,
      ],
      id: 1,
    }),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(
      data.error?.message || "Failed to fetch SimplyBook admin token"
    );
  }

  if (!data.result) {
    throw new Error("SimplyBook did not return an admin token");
  }

  return data.result;
}

/* -------------------------------------------------------
   GENERIC JSON-RPC HELPERS
------------------------------------------------------- */

async function callSimplyBook(method, params = [], token) {
  if (!token) {
    throw new Error("SimplyBook API token is required");
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Company-Login": process.env.SIMPLYBOOK_COMPANY,
      "X-Token": token,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: 1,
    }),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    const message =
      data.error?.message ||
      data.error?.data?.message ||
      JSON.stringify(data);

    throw new Error(`SimplyBook ${method} failed: ${message}`);
  }

  return data.result;
}

async function callAdmin(method, params = [], token) {
  if (!token) {
    throw new Error("SimplyBook admin token is required");
  }

  const res = await fetch(ADMIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Company-Login": process.env.SIMPLYBOOK_COMPANY,
      "X-User-Token": token,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: 1,
    }),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    const message =
      data.error?.message ||
      data.error?.data?.message ||
      JSON.stringify(data);

    throw new Error(`SimplyBook admin ${method} failed: ${message}`);
  }

  return data.result;
}

/* -------------------------------------------------------
   PROVIDERS, LOCATIONS, CATEGORIES AND SERVICES
------------------------------------------------------- */

export async function getProviders() {
  const token = await getToken();
  return callSimplyBook("getUnitList", [], token);
}

export async function getLocations() {
  const token = await getToken();
  return callSimplyBook("getLocationsList", [], token);
}

export async function getCategories() {
  const token = await getToken();
  return callSimplyBook("getCategoriesList", [], token);
}

export async function getEvents() {
  const token = await getToken();
  return callSimplyBook("getEventList", [], token);
}

/* -------------------------------------------------------
   WORK CALENDAR
------------------------------------------------------- */

export async function getWorkCalendar(year, month, performerId) {
  const token = await getToken();

  return callSimplyBook(
    "getWorkCalendar",
    [year, month, performerId],
    token
  );
}

export async function getYearlyWorkCalendar(performerId) {
  const token = await getToken();

  const now = new Date();
  const startYear = now.getFullYear();
  const startMonth = now.getMonth() + 1;

  const requests = [];

  for (let i = 0; i < 12; i++) {
    const date = new Date(startYear, startMonth - 1 + i, 1);

    requests.push(
      callSimplyBook(
        "getWorkCalendar",
        [date.getFullYear(), date.getMonth() + 1, performerId],
        token
      )
    );
  }

  const calendars = await Promise.all(requests);

  return calendars.reduce(
    (acc, monthData) => ({ ...acc, ...monthData }),
    {}
  );
}

export async function getFirstWorkingDay(performerId) {
  const token = await getToken();

  return callSimplyBook(
    "getFirstWorkingDay",
    [performerId],
    token
  );
}

/* -------------------------------------------------------
   AVAILABLE TIME SLOTS
------------------------------------------------------- */

/**
 * Get available slots for one service and provider.
 *
 * fromDate and toDate use YYYY-MM-DD.
 * eventId is the SimplyBook service ID.
 * performerId is the SimplyBook provider/unit ID.
 */
export async function getAvailableTimeSlots({
  eventId,
  performerId,
  fromDate,
  toDate = fromDate,
  count = 1,
}) {
  if (!eventId || !performerId || !fromDate) {
    throw new Error(
      "eventId, performerId and fromDate are required"
    );
  }

  const token = await getToken();

  return callSimplyBook(
    "getStartTimeMatrix",
    [
      fromDate,
      toDate,
      Number(eventId),
      Number(performerId),
      Number(count),
    ],
    token
  );
}

/* -------------------------------------------------------
   CREATE A SINGLE BOOKING
------------------------------------------------------- */

/**
 * Creates one booking in SimplyBook.
 *
 * date: YYYY-MM-DD
 * time: HH:mm:ss (e.g. 17:30:00)
 *
 * Returns the raw SimplyBook booking result.
 */
export async function bookSimplyBook({
  eventId,
  performerId,
  date,
  time,
  clientData,
  clientAuth,
  additional = {},
  count = 1,
  batchId,
}) {
  if (!eventId) {
    throw new Error("A SimplyBook service/event ID is required");
  }

  if (!performerId) {
    throw new Error("A SimplyBook provider/unit ID is required");
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("date must be in YYYY-MM-DD format");
  }

  if (!time || !/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
    throw new Error("time must be in HH:mm or HH:mm:ss format");
  }

  if (
    !clientData?.name ||
    !clientData?.email ||
    !clientData?.phone
  ) {
    throw new Error(
      "Client name, email and phone are required"
    );
  }

  if (!Number.isInteger(Number(count)) || Number(count) < 1) {
    throw new Error("count must be an integer of at least 1");
  }

    if (!clientAuth?.clientId || !clientAuth?.clientHash) {
    throw new Error(
      "Authorized SimplyBook client details are required"
    );
  }

  const normalizedTime =
    time.length === 5 ? `${time}:00` : time;

  const token = await getToken();

  const clientSign = createClientSign(
    clientAuth.clientId,
    clientAuth.clientHash
  );

  const authorizedClientData = {
    client_id: Number(clientAuth.clientId),
    client_sign: clientSign,
  };

  const params = [
    Number(eventId),
    Number(performerId),
    date,
    normalizedTime,
    authorizedClientData,
    additional,
  ];

  if (batchId !== undefined && batchId !== null) {
    params.push(undefined, Number(batchId));
  } else {
    params.push(Number(count));
  }

  return callSimplyBook("book", params, token);
}

/* -------------------------------------------------------
   MULTIPLE SERVICES — CONSECUTIVE BOOKINGS
------------------------------------------------------- */

/**
 * Books services consecutively, using each service's duration.
 *
 * IMPORTANT:
 * - Each service creates a separate SimplyBook booking.
 * - Services are booked sequentially.
 * - The caller must ensure the resulting time slots are available.
 * - If a later booking fails, earlier bookings may already exist.
 *
 * services example:
 * [
 *   { eventId: 10, duration: 60 },
 *   { eventId: 13, duration: 60 }
 * ]
 */
export async function bookMultipleSimplyBookServices({
  services,
  performerId,
  date,
  startTime,
  clientData,
  clientAuth,
  additional = {},
}) {
  if (!Array.isArray(services) || services.length === 0) {
    throw new Error("At least one service is required");
  }

  if (!clientAuth?.clientId || !clientAuth?.clientHash) {
    throw new Error(
      "Authorized SimplyBook client details are required"
    );
  }

  if (!startTime || !/^\d{2}:\d{2}(:\d{2})?$/.test(startTime)) {
    throw new Error("startTime must be HH:mm or HH:mm:ss");
  }

  const results = [];
  let currentMinutes = timeToMinutes(startTime);

  for (const service of services) {
    if (!service.eventId || !Number(service.duration)) {
      throw new Error(
        "Each service must include eventId and duration"
      );
    }

    const time = minutesToTime(currentMinutes);

    const result = await bookSimplyBook({
      eventId: service.eventId,
      performerId,
      date,
      time,
      clientData,
      clientAuth,
      additional: service.additional || additional,
    });

    results.push({
      eventId: Number(service.eventId),
      time,
      result,
    });

    currentMinutes += Number(service.duration);
  }

  return results;
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 23) {
    throw new Error("Booking would extend beyond midnight");
  }

  return `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}:00`;
}

/* -------------------------------------------------------
   ADMIN API — CLIENTS
------------------------------------------------------- */

export async function getClients(limit = 50, start = 0) {
  const token = await getAdminToken();

  return callAdmin(
    "getClientList",
    ["", limit, start],
    token
  );
}

export async function getClient(clientId) {
  const token = await getAdminToken();

  return callAdmin("getClientInfo", [clientId], token);
}

export async function addSimplyBookClient(
  clientData,
  sendEmail = false
) {
  const token = await getAdminToken();

  return callAdmin(
    "addClient",
    [clientData, sendEmail],
    token
  );
}