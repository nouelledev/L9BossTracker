import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { BOSSES } from "@/app/bosses";
import { BossRecords, isBossRecords } from "@/app/timers";

export const dynamic = "force-dynamic";

const TIMERS_KEY = "biodata:l9:boss-timers";
const ALERTS_KEY = "biodata:l9:boss-alerts";
const ALERT_WINDOW_MS = 5 * 60 * 1000;
const CHECK_DRIFT_MS = 60 * 1000;
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;
const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

type AlertCandidate = {
  bossName: string;
  location: string;
  spawnAt: Date;
  alertKey: string;
};

function getRedis() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;
  return new Redis({ url, token });
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const url = new URL(request.url);
  const bearer = request.headers.get("authorization");
  return bearer === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

function manilaPartsToUtcDate(year: number, month: number, day: number, hours: number, minutes: number) {
  return new Date(Date.UTC(year, month, day, hours, minutes, 0, 0) - MANILA_OFFSET_MS);
}

function nextFixedSpawnUtc(spawnTime: string, now: Date) {
  const manilaNow = new Date(now.getTime() + MANILA_OFFSET_MS);
  const candidates = spawnTime.split("&").flatMap((part) => {
    const match = part.trim().match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2}):(\d{2})$/);
    if (!match) return [];

    const [, weekday, hourText, minuteText] = match;
    const daysUntil = (WEEKDAYS[weekday] - manilaNow.getUTCDay() + 7) % 7;
    const candidateManila = new Date(manilaNow);
    candidateManila.setUTCDate(manilaNow.getUTCDate() + daysUntil);

    let candidate = manilaPartsToUtcDate(
      candidateManila.getUTCFullYear(),
      candidateManila.getUTCMonth(),
      candidateManila.getUTCDate(),
      Number(hourText),
      Number(minuteText),
    );

    if (candidate.getTime() <= now.getTime()) {
      const nextWeekManila = new Date(candidateManila);
      nextWeekManila.setUTCDate(candidateManila.getUTCDate() + 7);
      candidate = manilaPartsToUtcDate(
        nextWeekManila.getUTCFullYear(),
        nextWeekManila.getUTCMonth(),
        nextWeekManila.getUTCDate(),
        Number(hourText),
        Number(minuteText),
      );
    }

    return [candidate];
  });

  return candidates.sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
}

function getAlertCandidates(records: BossRecords, now: Date) {
  const nowMs = now.getTime();

  return BOSSES.flatMap((boss): AlertCandidate[] => {
    let spawnAt: Date | null = null;

    if (boss.isFixedSpawn) {
      spawnAt = nextFixedSpawnUtc(boss.spawnTime, now);
    } else {
      const record = records[boss.id];
      if (record) spawnAt = new Date(record.nextSpawnAt);
    }

    if (!spawnAt || Number.isNaN(spawnAt.getTime())) return [];

    const msUntilSpawn = spawnAt.getTime() - nowMs;
    const isInsideAlertMoment = msUntilSpawn <= ALERT_WINDOW_MS && msUntilSpawn > ALERT_WINDOW_MS - CHECK_DRIFT_MS;
    if (!isInsideAlertMoment) return [];

    return [
      {
        bossName: boss.name,
        location: boss.location,
        spawnAt,
        alertKey: `${boss.id}:${spawnAt.toISOString()}:5m`,
      },
    ];
  });
}

function formatManilaTime(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "short",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

async function sendDiscordAlert(candidate: AlertCandidate) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) throw new Error("Missing DISCORD_WEBHOOK_URL.");

  const mention = process.env.DISCORD_ALERT_MENTION?.trim();
  const contentPrefix = mention ? `${mention} ` : "";
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "BIODATA Boss Alerts",
      content: `${contentPrefix}**${candidate.bossName}** will spawn in 5 minutes.`,
      embeds: [
        {
          title: "Field Boss Alert",
          color: 0xff3f63,
          fields: [
            { name: "Boss", value: candidate.bossName, inline: true },
            { name: "Location", value: candidate.location, inline: true },
            { name: "Spawn Time", value: formatManilaTime(candidate.spawnAt), inline: false },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed with ${response.status}.`);
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "Redis storage is required for scheduled alerts." }, { status: 503 });
  }

  const records = await redis.get<unknown>(TIMERS_KEY);
  const bossRecords = isBossRecords(records) ? records : {};
  const candidates = getAlertCandidates(bossRecords, new Date());
  const sent: string[] = [];
  const skipped: string[] = [];

  for (const candidate of candidates) {
    const alreadySent = await redis.sismember(ALERTS_KEY, candidate.alertKey);
    if (alreadySent) {
      skipped.push(candidate.bossName);
      continue;
    }

    await sendDiscordAlert(candidate);
    await redis.sadd(ALERTS_KEY, candidate.alertKey);
    await redis.expire(ALERTS_KEY, 60 * 60 * 24 * 14);
    sent.push(candidate.bossName);
  }

  return NextResponse.json({ checked: candidates.length, sent, skipped });
}
