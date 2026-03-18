import { getCategories } from "../../utils/simplybook";

export async function GET() {
  try {
    const categories = await getCategories(); 
    // console.log("providers: ", providers);

    return new Response(JSON.stringify(categories), {
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
