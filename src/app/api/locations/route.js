import { getLocations } from "../../utils/simplybook";

export async function GET() {
  try {
    const locations = await getLocations();

    return new Response(JSON.stringify(locations), {
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
