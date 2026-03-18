import { getFirstWorkingDay } from "../../utils/simplybook";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const performerId = searchParams.get("performerId");

    if (!performerId) {
      return new Response(
        JSON.stringify({ success: false, data: [] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const firstDay = await getFirstWorkingDay(performerId);

    return new Response(JSON.stringify(firstDay), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
     return new Response(
      JSON.stringify({ success: false, data: [] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
