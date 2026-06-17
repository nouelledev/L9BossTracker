export type BossRecord = {
  deathAt: string;
  nextSpawnAt: string;
};

export type BossRecords = Record<string, BossRecord>;

export function isBossRecords(value: unknown): value is BossRecords {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  return Object.values(value).every((record) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) return false;
    const candidate = record as Partial<BossRecord>;
    return typeof candidate.deathAt === "string" && typeof candidate.nextSpawnAt === "string";
  });
}
