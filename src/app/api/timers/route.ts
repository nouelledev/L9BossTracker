import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { BossRecords, isBossRecords } from "@/app/timers";

export const dynamic = "force-dynamic";

const REDIS_KEY = "biodata:l9:boss-timers";

function getRedis() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function GET() {
  const redis = getRedis();

  if (!redis) {
    return NextResponse.json({ records: {}, storage: "local" });
  }

  const records = await redis.get<BossRecords>(REDIS_KEY);
  return NextResponse.json({ records: records ?? {}, storage: "redis" });
}

export async function PUT(request: Request) {
  const redis = getRedis();
  const body = (await request.json()) as { records?: unknown };

  if (!isBossRecords(body.records)) {
    return NextResponse.json({ error: "Invalid boss timer payload." }, { status: 400 });
  }

  if (!redis) {
    return NextResponse.json({ records: body.records, storage: "local" });
  }

  await redis.set(REDIS_KEY, body.records);
  return NextResponse.json({ records: body.records, storage: "redis" });
}
