import { NextRequest, NextResponse } from "next/server";
import { auditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, actionAr, executor, executorName, target, targetName, metadata } = body;

    if (!action || !executor) {
      return NextResponse.json({ error: "action and executor required" }, { status: 400 });
    }

    const result = await auditLog({
      action,
      actionAr,
      executor,
      executorName,
      target,
      targetName,
      metadata,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "audit failed" }, { status: 500 });
  }
}
