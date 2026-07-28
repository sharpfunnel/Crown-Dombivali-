# Session Replay — Implementation Reference

Reverse-engineered from a working Next.js (App Router) + Prisma implementation. This
document contains **every file, every line of logic, and every non-obvious design
decision** needed to reproduce the exact same "watch a visitor's session like a video"
feature in a different project. Hand this whole file to your coding agent / use it as a
spec and follow it top to bottom.

## What this actually is

It is **not** screen recording / video. It's DOM-diff replay:

1. A library called **rrweb** runs in the visitor's browser and serializes the initial
   DOM once (a "full snapshot"), then records every subsequent mutation, mouse move,
   scroll, click, and input event as a small timestamped JSON object.
2. Those JSON objects are batched and POSTed to your server periodically.
3. The server gzip-compresses each batch and stores it as a row in a database table,
   tagged with which visit it belongs to and an incrementing sequence number.
4. When an admin wants to "watch" a session, the server fetches all the stored chunks
   for that session **in order**, gunzips them, and concatenates them back into one
   long ordered array of rrweb events.
5. That array is handed to **rrweb-player**, a widget that redraws the DOM step by step
   in a hidden iframe with a play/pause/scrub timeline — visually indistinguishable
   from watching a screen recording, but it's actually replaying a diff log.

## Dependencies

```json
{
  "rrweb": "^2.1.1",
  "rrweb-player": "^2.1.1"
}
```

Install both — `rrweb` is the recorder + replay engine, `rrweb-player` is a Svelte-based
UI wrapper around rrweb's replayer (adds the play/pause/scrub controller chrome).

```
npm install rrweb rrweb-player
```

Reference stack this was built on (adapt as needed, none of it is load-bearing except
where noted): Next.js 16 App Router, React 19, Prisma 7 ORM on Postgres. The feature
itself has no hard dependency on any of those beyond "a server framework with an API
route and a database" — swap the API route and Prisma calls for your own stack's
equivalents and the rrweb-facing code is unchanged.

---

## 1. Database schema

You need one table to store the gzip-compressed event chunks, keyed to whatever you
use to identify a single visit ("session"). Minimal Prisma model:

```prisma
model Session {
  id        String   @id @default(cuid())
  clientId  String   @unique   // the id the *browser* generated for this visit
  startedAt DateTime @default(now())
  // ...whatever other session/analytics fields your project already has...

  replayChunks SessionReplay[]
}

model SessionReplay {
  id         String   @id @default(cuid())
  session    Session  @relation(fields: [sessionId], references: [id])
  sessionId  String
  seq        Int      @default(autoincrement())
  data       Bytes
  eventCount Int
  createdAt  DateTime @default(now())

  @@index([sessionId, seq])
}
```

**Why chunks instead of one blob per session:** the recording is flushed to the server
repeatedly throughout the visit (see §3), not once at the end — the visitor might close
the tab mid-session, so you can't wait for "the end" to persist anything. Storing many
small rows and re-assembling them at read time is what makes that safe.

**If your project has no session/analytics system at all**, you don't need the full
`Session` model above — the *only* hard requirement is: something in your DB, addressable
by a stable per-visit id that the *browser* also knows, that `SessionReplay` rows can
point to. See §8 for a bare-minimum standalone version.

**Why `Bytes` + gzip and not just a JSON column:** rrweb's `FullSnapshot` event (the
initial DOM serialization) is routinely several hundred KB of JSON. Gzipping it before
storage is a large, free win (JSON/HTML compresses very well) and keeps DB row sizes and
network payloads down both ways.

---

## 2. Consent (recommended, adapt or drop per your legal requirements)

A tiny localStorage-backed consent flag, broadcast as a `CustomEvent` so any part of the
app can react without prop-drilling.

```ts
// lib/tracking/consent.ts
"use client";

const CONSENT_STORAGE_KEY = "replay_consent";
export const REPLAY_CONSENT_EVENT = "replay-consent-changed";

export type ReplayConsent = "granted" | "denied";

export function getReplayConsent(): ReplayConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function setReplayConsent(value: ReplayConsent) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // ignore — consent just won't persist across reloads
  }
  window.dispatchEvent(new CustomEvent(REPLAY_CONSENT_EVENT, { detail: value }));
}
```

A minimal banner (rebuild the markup/styling to match your own design system — this is
just the wiring):

```tsx
// components/ReplayConsentBanner.tsx
"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { getReplayConsent, setReplayConsent, REPLAY_CONSENT_EVENT, type ReplayConsent } from "@/lib/tracking/consent";

function subscribe(callback: () => void) {
  window.addEventListener(REPLAY_CONSENT_EVENT, callback);
  return () => window.removeEventListener(REPLAY_CONSENT_EVENT, callback);
}

function getServerSnapshot(): ReplayConsent {
  // No decision is knowable during SSR — default to "denied" so the banner never
  // flashes on first paint. useSyncExternalStore reconciles with the real
  // localStorage value right after hydration.
  return "denied";
}

export function ReplayConsentBanner() {
  const pathname = usePathname();
  const consent = useSyncExternalStore(subscribe, getReplayConsent, getServerSnapshot);

  // Don't show the banner on your own admin/dashboard routes, and don't show it
  // again once a decision has already been made (consent !== null covers both
  // "granted" and "denied").
  if (pathname.startsWith("/admin") || consent !== null) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 rounded-lg border p-4 shadow-xl">
        <p className="text-sm">
          We use anonymized browsing data to improve this page. Form fields are always masked.
        </p>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => setReplayConsent("denied")}>No thanks</button>
          <button onClick={() => setReplayConsent("granted")}>Allow</button>
        </div>
      </div>
    </div>
  );
}
```

If you don't need consent-gating (internal tool, already covered by a blanket ToS,
etc.), skip this section entirely and just call the recorder's start function
unconditionally in §3.

---

## 3. The recorder (client-side capture) — the core of the feature

```ts
// lib/tracking/replay.ts
"use client";

import type { eventWithTime } from "rrweb";
import { getOrCreateVisitorId, getSession } from "./client"; // your own visitor/session id helpers — see §8 if you don't have these
import { getReplayConsent, REPLAY_CONSENT_EVENT, type ReplayConsent } from "./consent";

const REPLAY_ENDPOINT = "/api/replay";
const FLUSH_INTERVAL_MS = 15000;
const MAX_BUFFER_SIZE = 300;
const RETRY_DELAY_MS = 1000;

let stopRecordingFn: (() => void) | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let buffer: eventWithTime[] = [];
let initialized = false;

function send(useBeacon: boolean) {
  if (buffer.length === 0) return;
  const events = buffer.splice(0, buffer.length);
  const visitor = getOrCreateVisitorId();
  const session = getSession();
  const body = JSON.stringify({ visitorId: visitor.id, sessionId: session.meta.id, events });

  if (useBeacon && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon(REPLAY_ENDPOINT, blob)) return;
  }
  fetch(REPLAY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    // `keepalive` caps the request body at ~64 KiB in most browsers — the same limit
    // sendBeacon has. The very first chunk of a session carries the rrweb FullSnapshot,
    // which is routinely several hundred KB — forcing keepalive on every flush would
    // silently drop that chunk every time. Only the actual page-unload path (useBeacon)
    // needs keepalive to survive navigation; the periodic/normal flush must NOT set it.
    keepalive: useBeacon,
  })
    .then(async (res) => {
      // The session row (created by your normal analytics/session endpoint, or lazily
      // by this same endpoint — see §5) may not exist in the DB yet if this replay
      // chunk raced ahead of it. Put the chunk back and retry soon rather than waiting
      // for the next natural trigger (the 15s tick, or worse, the unload path) to come
      // around — you cannot afford to lose the FullSnapshot chunk.
      const data = res.ok ? await res.json().catch(() => null) : null;
      if (data?.retry) {
        buffer.unshift(...events);
        if (!retryTimer) {
          retryTimer = setTimeout(() => {
            retryTimer = null;
            send(false);
          }, RETRY_DELAY_MS);
        }
      }
    })
    .catch(() => {});
}

async function startRecording() {
  if (stopRecordingFn) return; // already running
  const { record, EventType } = await import("rrweb"); // dynamic import: keep rrweb out of the initial bundle

  stopRecordingFn =
    record({
      emit: (event) => {
        buffer.push(event as eventWithTime);
        // The FullSnapshot is the big one (often several hundred KB) — much bigger
        // than the sendBeacon/keepalive-fetch ~64 KiB cap used on unload. If it sat in
        // the buffer for the normal 15s tick, a quick bounce (very common for
        // ad-driven traffic, e.g. an in-app browser) would force it through that
        // capped path and it would get silently dropped. So: flush it immediately over
        // a plain, uncapped fetch the moment it's captured, while the page is still
        // fully active.
        if (event.type === EventType.FullSnapshot) send(false);
        else if (buffer.length >= MAX_BUFFER_SIZE) send(false);
      },
      // Blanks every form field's recorded value. This is the privacy-critical line —
      // any input could be PII (name, phone, email, password) and replay fidelity does
      // not need real form contents, only that the user interacted with the field.
      maskAllInputs: true,
      // Throttle high-frequency events so the event stream doesn't balloon — you don't
      // need every single pixel of mouse movement or every scroll tick to reconstruct
      // believable playback.
      sampling: { scroll: 200, mousemoveCallback: 400 },
    }) ?? null;

  if (!flushTimer) flushTimer = setInterval(() => send(false), FLUSH_INTERVAL_MS);
}

function stopRecording() {
  stopRecordingFn?.();
  stopRecordingFn = null;
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  buffer = [];
}

export function initSessionReplay() {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;

  if (getReplayConsent() === "granted") startRecording();

  window.addEventListener(REPLAY_CONSENT_EVENT, (e) => {
    const consent = (e as CustomEvent<ReplayConsent>).detail;
    if (consent === "granted") startRecording();
    else stopRecording();
  });

  // Flush on both signals — visibilitychange fires reliably on mobile (where pagehide
  // is inconsistent across browsers), pagehide covers desktop back/forward-cache cases.
  // Both use the beacon path since the page may be gone by the time a normal fetch
  // would resolve.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") send(true);
  });
  window.addEventListener("pagehide", () => send(true));
}
```

**Every flush trigger, and why there are this many:**

| Trigger | Why |
|---|---|
| Every 15s (`flushTimer`) | Baseline — don't let events sit in memory indefinitely for a long session |
| Immediately on `FullSnapshot` | It's huge; must go out over the uncapped path before a quick bounce forces it through the 64 KiB-capped beacon path |
| Buffer hits 300 events | Backpressure valve for very active sessions between timer ticks |
| `visibilitychange` → hidden | Covers tab-switch / mobile app-backgrounding, sent via `sendBeacon` |
| `pagehide` | Covers navigation/close, sent via `sendBeacon` |

---

## 4. Recording the session/visitor id (what `getOrCreateVisitorId` / `getSession` are)

The recorder needs *some* stable id to tag each batch with so the server can associate
it with the right visit. If your project already has an analytics/session system, reuse
its ids. If not, here's the minimum:

```ts
// lib/tracking/client.ts (relevant excerpt)
"use client";

const VISITOR_STORAGE_KEY = "vid";
const SESSION_STORAGE_KEY = "sid";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min of inactivity = new session

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getOrCreateVisitorId(): { id: string; isNew: boolean } {
  try {
    const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    if (existing) return { id: existing, isNew: false };
    const id = uuid();
    window.localStorage.setItem(VISITOR_STORAGE_KEY, id);
    return { id, isNew: true };
  } catch {
    return { id: uuid(), isNew: true };
  }
}

export function getSession(): { meta: { id: string; startedAt: number; lastActivity: number }; isNew: boolean } {
  const now = Date.now();
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const meta = JSON.parse(raw);
      if (now - meta.lastActivity < SESSION_TIMEOUT_MS) {
        meta.lastActivity = now;
        window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(meta));
        return { meta, isNew: false };
      }
    }
  } catch {
    // storage unavailable — fall through to a fresh in-memory session
  }
  const meta = { id: uuid(), startedAt: now, lastActivity: now };
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // ignore
  }
  return { meta, isNew: true };
}
```

Key points: visitor id lives in `localStorage` (persists across visits), session id
lives in `sessionStorage` with a 30-minute inactivity timeout (matches the industry-
standard GA-style session definition — reuse if you already have one, don't invent a
different timeout for replay specifically, or a single visit will get split into
multiple "sessions" between analytics and replay).

---

## 5. The API route that receives and stores chunks

```ts
// app/api/replay/route.ts
import { gzipSync } from "zlib";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// REQUIRED: zlib is a Node.js API, not available in the Edge runtime. If your
// framework defaults API routes to an edge runtime, you must explicitly opt this
// route into the Node runtime or the import will fail at build/deploy time.
export const runtime = "nodejs";

interface ReplayPayload {
  visitorId: string;
  sessionId: string;
  events: unknown[];
}

function isValidPayload(body: unknown): body is ReplayPayload {
  if (!body || typeof body !== "object") return false;
  const candidate = body as Record<string, unknown>;
  return (
    typeof candidate.visitorId === "string" &&
    typeof candidate.sessionId === "string" &&
    candidate.sessionId.length > 0 &&
    Array.isArray(candidate.events) &&
    candidate.events.length > 0
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isValidPayload(body)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { sessionId, events } = body;

  try {
    // sessionId here is the *client-generated* id (clientId), not your DB's internal
    // primary key — look it up rather than assuming it exists as a row id.
    const session = await prisma.session.findUnique({ where: { clientId: sessionId }, select: { id: true } });

    // A replay chunk can arrive before your session-creation endpoint has run (it's on
    // a separate, possibly slower flush interval). Tell the client to retry rather than
    // dropping the chunk — this may be the FullSnapshot, without which the whole replay
    // is unplayable.
    if (!session) return NextResponse.json({ ok: true, retry: true });

    const compressed = gzipSync(Buffer.from(JSON.stringify(events)));
    await prisma.sessionReplay.create({
      data: { sessionId: session.id, data: compressed, eventCount: events.length },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/replay] failed to store replay chunk", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

If your project has no separate session-creation endpoint at all, either (a) create the
`Session` row lazily right here on first chunk (`upsert` instead of `findUnique`), or
(b) keep the two-endpoint split if you're also recording pageviews/events elsewhere —
the split exists in the reference implementation because session rows are created by a
general `/api/track` analytics endpoint, and replay chunks are logically separate traffic
that can race ahead of it.

---

## 6. Wiring it into the app

Mount the recorder once, globally, and skip it on your own admin/dashboard routes (you
don't want to record yourself watching the dashboard) and inside any admin preview
iframe if you have one:

```tsx
// components/Analytics.tsx (or wherever your global client init lives)
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initSessionReplay } from "@/lib/tracking/replay";

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    initSessionReplay();
    // ...your other tracking inits...
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
```

```tsx
// app/layout.tsx
import { Analytics } from "@/components/Analytics";
import { ReplayConsentBanner } from "@/components/ReplayConsentBanner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <ReplayConsentBanner />
      </body>
    </html>
  );
}
```

---

## 7. Reassembling and playing back a recorded session

**Query — fetch all chunks for a session, in order, decompress, concatenate:**

```ts
// lib/admin/queries.ts
import { gunzipSync } from "zlib";
import { prisma } from "@/lib/prisma";

export async function getSessionReplay(sessionId: string) {
  const [session, chunks] = await Promise.all([
    prisma.session.findUnique({ where: { id: sessionId } }),
    prisma.sessionReplay.findMany({
      where: { sessionId },
      orderBy: { seq: "asc" }, // ORDER MATTERS — rrweb events must replay in original sequence
      select: { data: true },
    }),
  ]);
  if (!session || chunks.length === 0) return null;

  const events: unknown[] = [];
  for (const chunk of chunks) {
    const json = gunzipSync(chunk.data).toString("utf-8");
    events.push(...(JSON.parse(json) as unknown[]));
  }
  return { session, events };
}
```

**Player component — mounts rrweb-player and feeds it the reassembled events:**

```tsx
// components/admin/ReplayPlayer.tsx
"use client";

import { useEffect, useRef } from "react";
import type { eventWithTime } from "rrweb";
import type RRwebPlayer from "rrweb-player";
import "rrweb-player/dist/style.css"; // REQUIRED — the player is unstyled/broken without this

export function ReplayPlayer({ events }: { events: eventWithTime[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;
    let player: InstanceType<typeof RRwebPlayer> | null = null;

    // Dynamic import: rrweb-player pulls in a Svelte runtime + rrweb's replayer, all of
    // which are only needed on this one admin page — keep it out of every other bundle.
    import("rrweb-player").then(({ default: Player }) => {
      if (destroyed || !containerRef.current) return;
      player = new Player({
        target: containerRef.current,
        props: {
          events,
          width: containerRef.current.clientWidth,
          autoPlay: false,
          showController: true,
        },
      });
    });

    return () => {
      destroyed = true;
      // $destroy is Svelte's standard component teardown method — it's not part of
      // rrweb-player's own TypeScript types, hence the cast.
      (player as unknown as { $destroy?: () => void } | null)?.$destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="overflow-hidden rounded-lg border" />;
}
```

**Page that ties it together:**

```tsx
// app/admin/sessions/[id]/replay/page.tsx
import { notFound } from "next/navigation";
import type { eventWithTime } from "rrweb";
import { ReplayPlayer } from "@/components/admin/ReplayPlayer";
import { getSessionReplay } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function SessionReplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const replay = await getSessionReplay(id);
  if (!replay) notFound();

  const { session, events } = replay;

  return (
    <div>
      <h1>Session replay</h1>
      <p>Started {session.startedAt.toLocaleString()} · form inputs are masked</p>
      <ReplayPlayer events={events as eventWithTime[]} />
    </div>
  );
}
```

**Entry point — only show "Watch" when a session actually has recorded chunks:**

```tsx
// in your sessions list page
const sessions = await prisma.session.findMany({
  include: { _count: { select: { replayChunks: true } } },
  // ...
});

// per row:
{s._count.replayChunks > 0 ? (
  <Link href={`/admin/sessions/${s.id}/replay`}>Watch</Link>
) : (
  "—"
)}
```

---

## 8. Fully standalone version (no existing analytics system required)

If the target project has **nothing** resembling visitors/sessions yet, the entire
feature reduces to this minimum surface:

1. One `SessionReplay` Prisma model (as in §1) with `sessionId` as a plain string column
   (no FK, no relation) — you don't strictly need a `Session` table at all.
2. Client-side: generate one UUID per page-load-with-consent (`sessionStorage`, 30 min
   TTL as in §4) — this *is* your replay session id, nothing else needs to know about it.
3. `lib/tracking/replay.ts` from §3, unchanged, minus the `visitorId` field in the POST
   body if you don't need it.
4. `app/api/replay/route.ts` from §5, but simplified: since there's no separate session
   row to race against, just `create` the chunk directly — no `findUnique`/`retry` dance
   needed. (You lose nothing by removing this — it exists purely to handle the two-
   endpoint race in the reference implementation.)
5. §6 and §7 unchanged — a "session" for replay purposes is just "all `SessionReplay`
   rows sharing a `sessionId` value," which needs no separate table to exist.

This gets you the exact same recording/compression/playback behavior with roughly a
quarter of the moving parts.

---

## 9. Non-negotiable details (skip any of these and something silently breaks)

- **`maskAllInputs: true`** on the `record()` call — without it, every keystroke into
  every form field (passwords, PII) gets captured verbatim into the replay.
- **`export const runtime = "nodejs"`** on the API route — `zlib` throws/fails to import
  under an Edge runtime.
- **`import "rrweb-player/dist/style.css"`** in the player component — the player
  renders but is completely unstyled (no visible controls, broken layout) without it.
- **`orderBy: { seq: "asc" }`** when reading chunks back — rrweb events are strictly
  order-dependent; out-of-order chunks produce a garbled or blank replay.
- **`keepalive` only on the beacon/unload send path, never on the periodic 15s flush**
  — keepalive fetches are capped at ~64 KiB in most browsers, and the FullSnapshot chunk
  is routinely larger than that.
- **Flush immediately on `FullSnapshot`**, don't let it wait for the 15s timer — same
  reasoning, a fast bounce would force it through the capped unload path instead.
- **Dynamic `import("rrweb")` / `import("rrweb-player")`**, never a static top-level
  import — both pull in non-trivial bundle weight (rrweb-player embeds a Svelte
  runtime) that only the recording path / the one admin replay page need.
- **Skip recording on your own admin routes** — otherwise every admin session watching
  replays starts recording itself, and (if using an iframe-based live-preview elsewhere
  in your admin) skip inside that iframe too, or you'll double-record the same page.
- **Retry-on-missing-session** (`{ retry: true }`) if you keep the two-endpoint split —
  otherwise a replay chunk that raced ahead of session creation is silently dropped
  forever, and if that chunk was the FullSnapshot, the entire session becomes
  unplayable even though every later chunk was captured fine.
