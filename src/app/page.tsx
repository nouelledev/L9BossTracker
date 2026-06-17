"use client";

import { CalendarDays, Clock3, MapPin, RotateCcw, Search, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { BOSSES, Boss } from "./bosses";
import { BossRecord, BossRecords, isBossRecords } from "./timers";

type Meridiem = "AM" | "PM";
type FilterType = "all" | "fixed" | "variable" | "spawning";

const STORAGE_KEY = "l9-field-boss-records-v2";
const ALERT_WINDOW_MS = 5 * 60 * 1000;
const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatDuration(ms: number) {
  const absolute = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(absolute / 3600);
  const minutes = Math.floor((absolute % 3600) / 60);
  const seconds = absolute % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(" : ");
}

function nextFixedSpawn(spawnTime: string, now: Date) {
  const candidates = spawnTime.split("&").flatMap((part) => {
    const match = part.trim().match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(\d{1,2}):(\d{2})$/);
    if (!match) return [];

    const [, weekday, hourText, minuteText] = match;
    const candidate = new Date(now);
    const daysUntil = (WEEKDAYS[weekday] - now.getDay() + 7) % 7;
    candidate.setDate(now.getDate() + daysUntil);
    candidate.setHours(Number(hourText), Number(minuteText), 0, 0);
    if (candidate.getTime() <= now.getTime()) candidate.setDate(candidate.getDate() + 7);
    return [candidate];
  });

  return candidates.sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
}

function getSpawnDate(boss: Boss, record: BossRecord | undefined, now: Date) {
  if (boss.isFixedSpawn) return nextFixedSpawn(boss.spawnTime, now);
  if (!record) return null;
  return new Date(record.nextSpawnAt);
}

function getStatus(spawnDate: Date | null, now: number, isFixedSpawn: boolean) {
  if (!spawnDate) return { label: "Unknown", tone: "idle" };
  const remaining = spawnDate.getTime() - now;
  if (remaining <= 0) return { label: "Spawned", tone: "danger" };
  if (!isFixedSpawn && remaining <= ALERT_WINDOW_MS) return { label: "Alert", tone: "warning" };
  return { label: isFixedSpawn ? "Fixed" : "Scheduled", tone: isFixedSpawn ? "fixed" : "ready" };
}

export default function Home() {
  const [records, setRecords] = useState<BossRecords>({});
  const [activeBoss, setActiveBoss] = useState<Boss | null>(null);
  const [dateValue, setDateValue] = useState("");
  const [hourValue, setHourValue] = useState("12");
  const [minuteValue, setMinuteValue] = useState("00");
  const [meridiem, setMeridiem] = useState<Meridiem>("AM");
  const [now, setNow] = useState(() => Date.now());
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [message, setMessage] = useState("");
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [serverStorageAvailable, setServerStorageAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRecords() {
      const savedRecords = window.localStorage.getItem(STORAGE_KEY);
      if (savedRecords) {
        const parsed = JSON.parse(savedRecords) as unknown;
        if (isBossRecords(parsed)) setRecords(parsed);
      }

      try {
        const response = await fetch("/api/timers", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load shared timers.");
        const data = (await response.json()) as { records?: unknown; storage?: string };
        if (!cancelled && data.storage === "redis" && isBossRecords(data.records)) {
          setRecords(data.records);
          setServerStorageAvailable(true);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.records));
        } else if (!cancelled) {
          setServerStorageAvailable(false);
        }
      } catch {
        if (!cancelled) setServerStorageAvailable(false);
      } finally {
        if (!cancelled) setHasLoadedStorage(true);
      }
    }

    loadRecords();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));

    async function saveRecords() {
      try {
        const response = await fetch("/api/timers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records }),
        });
        if (!response.ok) throw new Error("Could not save shared timers.");
        const data = (await response.json()) as { storage?: string };
        setServerStorageAvailable(data.storage === "redis");
      } catch {
        setServerStorageAvailable(false);
      }
    }

    saveRecords();
  }, [hasLoadedStorage, records]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const nowDate = useMemo(() => new Date(now), [now]);

  const filteredBosses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return BOSSES.filter((boss) => {
      const spawnDate = getSpawnDate(boss, records[boss.id], nowDate);
      const remaining = spawnDate ? spawnDate.getTime() - now : null;
      const matchesSearch =
        !normalized ||
        [boss.name, boss.location, String(boss.level)].some((value) => value.toLowerCase().includes(normalized));

      if (!matchesSearch) return false;
      if (filterType === "fixed") return boss.isFixedSpawn;
      if (filterType === "variable") return !boss.isFixedSpawn;
      if (filterType === "spawning") return remaining !== null && remaining <= 24 * 60 * 60 * 1000;
      return true;
    });
  }, [filterType, now, nowDate, query, records]);

  const alertBoss = useMemo(() => {
    return BOSSES.map((boss) => {
      const spawnDate = getSpawnDate(boss, records[boss.id], nowDate);
      if (!spawnDate || boss.isFixedSpawn) return null;
      const remaining = spawnDate.getTime() - now;
      if (remaining > 0 && remaining <= ALERT_WINDOW_MS) return { boss, spawnDate, remaining };
      return null;
    }).find(Boolean);
  }, [now, nowDate, records]);

  function openTimeModal(boss: Boss) {
    const current = new Date();
    setActiveBoss(boss);
    setDateValue(toDateInputValue(current));
    setHourValue(String(current.getHours() % 12 || 12));
    setMinuteValue(String(current.getMinutes()).padStart(2, "0"));
    setMeridiem(current.getHours() >= 12 ? "PM" : "AM");
    setMessage("");
  }

  function closeModal() {
    setActiveBoss(null);
  }

  function saveDeathTime(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeBoss || activeBoss.respawnCooldown === null) return;

    let hours = Number(hourValue);
    const minutes = Number(minuteValue);
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;

    const [year, month, day] = dateValue.split("-").map(Number);
    const deathAt = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const nextSpawnAt = addHours(deathAt, activeBoss.respawnCooldown);

    setRecords((current) => ({
      ...current,
      [activeBoss.id]: {
        deathAt: deathAt.toISOString(),
        nextSpawnAt: nextSpawnAt.toISOString(),
      },
    }));
    setMessage(`${activeBoss.name} next spawn saved for ${formatDateTime(nextSpawnAt)}.`);
    closeModal();
  }

  function resetTimer(boss: Boss) {
    if (boss.isFixedSpawn) return;
    setRecords((current) => {
      const next = { ...current };
      delete next[boss.id];
      return next;
    });
    setMessage(`${boss.name} timer reset.`);
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">BIODATA Guild</p>
          <h1>Field Boss Tracker</h1>
        </div>
        <div className="search-box">
          <Search aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search boss, location, level" />
        </div>
        <div className="filter-tabs" role="tablist" aria-label="Boss spawn type">
          {[
            ["all", "All"],
            ["fixed", "Fixed"],
            ["variable", "Variable"],
            ["spawning", "Spawning"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filterType === value}
              className={filterType === value ? "active" : ""}
              onClick={() => setFilterType(value as FilterType)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {alertBoss && (
        <section className="alert-band" aria-live="polite">
          <Clock3 aria-hidden="true" />
          <div>
            <strong>{alertBoss.boss.name} spawns in {formatDuration(alertBoss.remaining)}</strong>
            <span>{formatDateTime(alertBoss.spawnDate)}</span>
          </div>
        </section>
      )}

      {message && <p className="message" aria-live="polite">{message}</p>}
      {!serverStorageAvailable && (
        <p className="storage-note">
          Timers are saved on this browser. Add Vercel KV or Upstash Redis env vars to share timers across the guild.
        </p>
      )}

      <section className="boss-table" aria-label="Boss list">
        <header className="table-header">
          <span>Boss ({filteredBosses.length})</span>
          <span>Location</span>
          <span>Spawn Time</span>
          <span>Actions</span>
        </header>

        {filteredBosses.map((boss) => {
          const record = records[boss.id];
          const spawnDate = getSpawnDate(boss, record, nowDate);
          const deathDate = record ? new Date(record.deathAt) : null;
          const remaining = spawnDate ? spawnDate.getTime() - now : null;
          const status = getStatus(spawnDate, now, boss.isFixedSpawn);

          return (
            <article className="boss-row" key={boss.id}>
              <div className="boss-cell boss-identity">
                <div className="portrait-wrap">
                  <img className="portrait-frame" src="/l9rs/bhframe.png" alt="" />
                  <img className="portrait" src={boss.image} alt={boss.name} onError={(event) => { event.currentTarget.src = "/l9rs/avatar.png"; }} />
                </div>
                <div>
                  <p className="level">Lvl {boss.level}</p>
                  <h2>{boss.name}</h2>
                </div>
              </div>

              <div className="boss-cell location-cell">{boss.location}</div>

              <div className="boss-cell spawn-cell">
                {spawnDate ? (
                  <>
                    <strong className={status.tone === "warning" ? "countdown warning" : "countdown"}>
                      {remaining !== null && remaining > 0 ? formatDuration(remaining) : "Active"}
                    </strong>
                    <span>{formatDateTime(spawnDate)}</span>
                  </>
                ) : (
                  <>
                    <strong>Unknown</strong>
                    <span>{boss.respawnCooldown ? `(${boss.respawnCooldown} hrs)` : boss.spawnTime}</span>
                  </>
                )}
                {deathDate && <small>Death: {formatDateTime(deathDate)}</small>}
              </div>

              <div className="boss-cell actions-cell">
                <button className="action-btn" type="button" aria-label={`${boss.name} location`}>
                  <MapPin aria-hidden="true" />
                </button>
                <button
                  className="action-btn"
                  type="button"
                  onClick={() => openTimeModal(boss)}
                  disabled={boss.isFixedSpawn}
                  aria-label={`Set ${boss.name} time of death`}
                  title={boss.isFixedSpawn ? "Fixed spawn boss" : "Set Time of Death"}
                >
                  <Clock3 aria-hidden="true" />
                </button>
                <button
                  className="action-btn"
                  type="button"
                  onClick={() => resetTimer(boss)}
                  disabled={boss.isFixedSpawn || !record}
                  aria-label={`Reset ${boss.name} timer`}
                  title={boss.isFixedSpawn ? "Fixed spawn boss" : record ? "Reset Timer" : "No timer to reset"}
                >
                  <RotateCcw aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {activeBoss && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="time-modal-title">
          <form className="time-modal" onSubmit={saveDeathTime}>
            <button className="modal-close" type="button" onClick={closeModal} aria-label="Close modal">
              <X aria-hidden="true" />
            </button>
            <h2 id="time-modal-title">Set Time of Death for {activeBoss.name}</h2>
            <p>Enter the date and time the boss was defeated.</p>

            <label className="date-field">
              <span>Date</span>
              <div>
                <CalendarDays aria-hidden="true" />
                <input type="date" value={dateValue} onChange={(event) => setDateValue(event.target.value)} required />
              </div>
            </label>

            <div className="time-grid">
              <label>
                <span>Hour</span>
                <select value={hourValue} onChange={(event) => setHourValue(event.target.value)}>
                  {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((hour) => (
                    <option value={hour} key={hour}>{hour}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Minute</span>
                <select value={minuteValue} onChange={(event) => setMinuteValue(event.target.value)}>
                  {Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0")).map((minute) => (
                    <option value={minute} key={minute}>{minute}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>AM/PM</span>
                <select value={meridiem} onChange={(event) => setMeridiem(event.target.value as Meridiem)}>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </label>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" type="button" onClick={closeModal}>Cancel</button>
              <button className="set-btn" type="submit">Set Time</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
