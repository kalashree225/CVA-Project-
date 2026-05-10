import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const token = request.cookies.get("access_token")?.value || "demo-token";


  const upstreamUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/stream/metrics/${params.projectId}`;

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }

  if (!upstreamResponse.ok) {
    return new Response(null, { status: upstreamResponse.status });
  }

  return new Response(upstreamResponse.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "X-Accel-Buffering": "no",
      "Cache-Control": "no-cache",
    },
  });
}
