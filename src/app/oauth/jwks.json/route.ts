export const dynamic = "force-static";

export function GET() {
  return Response.json(
    { keys: [] },
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    }
  );
}
