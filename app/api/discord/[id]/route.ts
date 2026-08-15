import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = _req.nextUrl.searchParams.get("token") || process.env.DISCORD_BOT_TOKEN || "";

  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }
  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }
  if (!/^\d{17,20}$/.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/users/${id}`, {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    }
    if (res.status === 404) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: "discord_error" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({
      id: data.id,
      username: data.username,
      global_name: data.global_name || data.username,
      avatar: data.avatar,
    });
  } catch {
    return NextResponse.json({ error: "network_error" }, { status: 502 });
  }
}
