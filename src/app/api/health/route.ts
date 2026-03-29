import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    runtime: typeof EdgeRuntime !== "undefined" ? "edge" : "node",
  });
}

declare const EdgeRuntime: string | undefined;
