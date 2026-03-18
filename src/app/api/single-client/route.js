import { getClient } from "../../utils/simplybook";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return new Response(
        JSON.stringify({ success: false, data: [] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const client = await getClient(clientId);
    // console.log("client: ", client);

    return new Response(JSON.stringify(client), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // console.log("err: ", err)
   return new Response(
      JSON.stringify({ success: false, data: [] }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
