import { getClients } from "../../utils/simplybook";

export async function GET() {
  try {
    const providers = await getClients();
    // console.log("providers: ", providers);

    return new Response(JSON.stringify(providers), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // console.log("err: ", err)
    return new Response(
      JSON.stringify({
        success: false,
        data: [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
