import { getWorkCalendar, getYearlyWorkCalendar } from "../../utils/simplybook";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const performerId = searchParams.get("performerId");

    if (!year || !month || !performerId) {
      return new Response(
        JSON.stringify({ success: false, data: [] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // const workCalendar = await getWorkCalendar(year, month, performerId);
    const workCalendar = await getYearlyWorkCalendar(performerId);

    return new Response(JSON.stringify(workCalendar), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
     return new Response(
      JSON.stringify({ success: false, data: [] }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
