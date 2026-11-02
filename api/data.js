// Shared team data, stored in Upstash Redis (Vercel Marketplace → Storage → Upstash for Redis).
//   GET  /api/data          → { tasks, updates, milestones }
//   POST /api/data { op, … } → applies one change, returns the new data
// Set TEAM_PASSCODE in Vercel env vars to require a passcode for changes.
// Set CEO_PASSCODE to lock the CEO profile; CEO-only changes then need it.
// Each POST names the acting profile (actor). Members can only change their own
// tasks and check-ins; the CEO can change everything.
const { members, milestoneNames, priorities, statuses, starterTasks } = require("../shared.js");

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const PASSCODE = process.env.TEAM_PASSCODE || "";
const CEO_PASSCODE = process.env.CEO_PASSCODE || "";
const K = { tasks: "ecoflow:tasks", updates: "ecoflow:updates", milestones: "ecoflow:milestones", seeded: "ecoflow:seeded" };
const MAX_UPDATES = 300;

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function redis(commands) {
  const r = await fetch(`${REDIS_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands)
  });
  if (!r.ok) throw new Error(`Storage error (HTTP ${r.status})`);
  return (await r.json()).map(x => { if (x.error) throw new Error(x.error); return x.result; });
}

const pairs = flat => { const out = []; for (let i = 0; i < (flat || []).length; i += 2) out.push([flat[i], flat[i + 1]]); return out; };
const str = (v, max) => String(v ?? "").trim().slice(0, max);
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const memberNames = members.map(m => m.name);
const ceoName = members.find(m => m.ceo).name;

async function seedOnce() {
  const [first] = await redis([["SET", K.seeded, "1", "NX"]]);
  if (first !== "OK") return;
  await redis([["HSET", K.tasks, ...starterTasks.flatMap(t => [t.id, JSON.stringify(t)])]]);
}

async function readAll() {
  const [taskFlat, updates, msFlat] = await redis([["HGETALL", K.tasks], ["LRANGE", K.updates, "0", "-1"], ["HGETALL", K.milestones]]);
  const ms = Object.fromEntries(pairs(msFlat));
  return {
    tasks: pairs(taskFlat).map(([, v]) => JSON.parse(v)).sort((a, b) => a.created - b.created),
    updates: (updates || []).map(u => JSON.parse(u)),
    milestones: milestoneNames.map((_, i) => ms[i] === "1")
  };
}

const snapshot = async () => ({ ...(await readAll()), ceoLocked: !!CEO_PASSCODE });

function cleanTask(t = {}) {
  const title = str(t.title, 160);
  if (!title) throw new HttpError(400, "Task title is required");
  if (!memberNames.includes(t.owner)) throw new HttpError(400, "Unknown task owner");
  const milestone = Number(t.milestone);
  return {
    id: /^[a-z0-9]{6,32}$/.test(t.id) ? t.id : newId(),
    title,
    owner: t.owner,
    due: /^\d{4}-\d{2}-\d{2}$/.test(t.due) ? t.due : "",
    milestone: Number.isInteger(milestone) && milestone >= -1 && milestone < milestoneNames.length ? milestone : -1,
    priority: priorities.includes(t.priority) ? t.priority : "Normal",
    definition: str(t.definition, 500),
    done: false,
    created: Date.now()
  };
}

function cleanUpdate(u = {}) {
  if (!memberNames.includes(u.member)) throw new HttpError(400, "Unknown team member");
  const completed = str(u.completed, 1000), next = str(u.next, 300);
  if (!completed || !next) throw new HttpError(400, "Check-in needs what you completed and a next step");
  return { member: u.member, status: statuses.includes(u.status) ? u.status : statuses[0], completed, next, date: new Date().toISOString() };
}

async function getTask(id) {
  const [raw] = await redis([["HGET", K.tasks, String(id)]]);
  if (!raw) throw new HttpError(404, "That task no longer exists");
  return JSON.parse(raw);
}

async function applyOp(body = {}, isCeo) {
  const requireCeo = () => { if (!isCeo) throw new HttpError(403, "Only the CEO can do that"); };
  const requireSelf = name => { if (!isCeo && name !== body.actor) throw new HttpError(403, "You can only change your own work"); };
  switch (body.op) {
    case "checkCeo":
      return requireCeo();
    case "addTask": {
      const task = cleanTask(body.task);
      requireSelf(task.owner);
      return redis([["HSET", K.tasks, task.id, JSON.stringify(task)]]);
    }
    case "setTaskDone": {
      const task = await getTask(body.id);
      requireSelf(task.owner);
      task.done = !!body.done;
      return redis([["HSET", K.tasks, task.id, JSON.stringify(task)]]);
    }
    case "deleteTask": {
      const task = await getTask(body.id);
      requireSelf(task.owner);
      return redis([["HDEL", K.tasks, task.id]]);
    }
    case "setMilestone": {
      requireCeo();
      const i = Number(body.index);
      if (!Number.isInteger(i) || i < 0 || i >= milestoneNames.length) throw new HttpError(400, "Unknown milestone");
      return redis([["HSET", K.milestones, String(i), body.done ? "1" : "0"]]);
    }
    case "addUpdate": {
      const update = cleanUpdate(body.update);
      requireSelf(update.member);
      return redis([["RPUSH", K.updates, JSON.stringify(update)], ["LTRIM", K.updates, String(-MAX_UPDATES), "-1"]]);
    }
    case "deleteUpdate": {
      requireCeo();
      const [list] = await redis([["LRANGE", K.updates, "0", "-1"]]);
      const raw = (list || []).find(s => { const u = JSON.parse(s); return u.date === body.date && u.member === body.member; });
      if (!raw) throw new HttpError(404, "That check-in no longer exists");
      return redis([["LREM", K.updates, "1", raw]]);
    }
    case "clearUpdates":
      requireCeo();
      return redis([["DEL", K.updates]]);
    default:
      throw new HttpError(400, "Unknown operation");
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(503).json({ error: "storage-not-configured" });
  try {
    if (req.method === "GET") {
      await seedOnce();
      return res.status(200).json(await snapshot());
    }
    if (req.method === "POST") {
      if (PASSCODE && req.headers["x-team-passcode"] !== PASSCODE) throw new HttpError(401, "Incorrect team passcode");
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
      const isCeo = CEO_PASSCODE ? req.headers["x-ceo-passcode"] === CEO_PASSCODE : body.actor === ceoName;
      await applyOp(body, isCeo);
      return res.status(200).json(await snapshot());
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.status ? e.message : "Server error: " + e.message });
  }
};
