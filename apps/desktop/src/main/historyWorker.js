const fs = require('fs');
const path = require('path');
const { parentPort, workerData } = require('node:worker_threads');
const Database = require('better-sqlite3');

if (!parentPort) {
  throw new Error('historyWorker.js must be run as a Worker');
}

const { databaseFile } = workerData || {};

if (typeof databaseFile !== 'string' || databaseFile.trim() === '') {
  throw new Error('historyWorker.js requires a valid databaseFile path');
}

fs.mkdirSync(path.dirname(databaseFile), { recursive: true });

const db = new Database(databaseFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS history_entries (
    id TEXT PRIMARY KEY,
    task_name TEXT NOT NULL,
    mode TEXT CHECK(mode IN ('countdown', 'stopwatch')) NOT NULL,
    tracked_ms INTEGER NOT NULL,
    planned_ms INTEGER,
    completed_at TEXT NOT NULL,
    completed_at_ms INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_history_entries_completed_at_ms
    ON history_entries (completed_at_ms DESC, created_at DESC);
`);

const statements = {
  insertEntry: db.prepare(`
    INSERT INTO history_entries (
      id,
      task_name,
      mode,
      tracked_ms,
      planned_ms,
      completed_at,
      completed_at_ms,
      created_at,
      updated_at
    ) VALUES (
      @id,
      @task_name,
      @mode,
      @tracked_ms,
      @planned_ms,
      @completed_at,
      @completed_at_ms,
      @created_at,
      @updated_at
    )
  `),
  getEntryById: db.prepare(`
    SELECT *
    FROM history_entries
    WHERE id = @id
  `),
  listEntries: db.prepare(`
    SELECT *
    FROM history_entries
    ORDER BY completed_at_ms DESC, created_at DESC
  `),
  deleteEntry: db.prepare(`
    DELETE FROM history_entries
    WHERE id = @id
  `),
  clearEntries: db.prepare(`DELETE FROM history_entries`)
};

const mapRow = (row) =>
  row && {
    id: row.id,
    taskName: row.task_name,
    mode: row.mode,
    trackedMs: row.tracked_ms,
    plannedMs: row.planned_ms ?? null,
    completedAt: row.completed_at,
    completedAtMs: row.completed_at_ms,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

const coerceMode = (mode) => {
  if (mode === 'stopwatch') {
    return 'stopwatch';
  }
  return 'countdown';
};

const coerceNumber = (value, { min = undefined } = {}) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return undefined;
  }
  const rounded = Math.round(numeric);
  if (typeof min === 'number' && rounded < min) {
    return min;
  }
  return rounded;
};

const prepareEntryPayload = (entry) => {
  if (!entry || typeof entry !== 'object') {
    throw new TypeError('entry must be an object');
  }

  if (typeof entry.id !== 'string' || entry.id.trim() === '') {
    throw new TypeError('entry.id must be a non-empty string');
  }

  if (typeof entry.taskName !== 'string' || entry.taskName.trim() === '') {
    throw new TypeError('entry.taskName must be a non-empty string');
  }

  const trackedMs = coerceNumber(entry.trackedMs, { min: 0 });
  if (trackedMs === undefined) {
    throw new TypeError('entry.trackedMs must be a finite number');
  }

  const plannedMs = entry.plannedMs !== null ? coerceNumber(entry.plannedMs, { min: 0 }) : null;
  const completedAtMs =
    entry.completedAtMs !== undefined ? coerceNumber(entry.completedAtMs) : undefined;

  const timestampMs =
    completedAtMs !== undefined
      ? completedAtMs
      : Number.isFinite(Date.parse(entry.completedAt))
      ? Date.parse(entry.completedAt)
      : Date.now();

  const completedAt =
    typeof entry.completedAt === 'string' && entry.completedAt
      ? entry.completedAt
      : new Date(timestampMs).toISOString();

  const now = Date.now();

  return {
    id: entry.id.trim(),
    task_name: entry.taskName.trim(),
    mode: coerceMode(entry.mode),
    tracked_ms: trackedMs,
    planned_ms: plannedMs ?? null,
    completed_at: completedAt,
    completed_at_ms: timestampMs,
    created_at: now,
    updated_at: now
  };
};

const serializeError = (error) => {
  if (!error || typeof error !== 'object') {
    return { message: String(error) };
  }
  return {
    message: error.message ?? String(error),
    stack: error.stack ?? null,
    code: error.code ?? null,
    name: error.name ?? 'Error'
  };
};

let isClosed = false;

const handlers = {
  insertEntry: (entry) => {
    if (isClosed) {
      throw new Error('database is closed');
    }

    const payload = prepareEntryPayload(entry);
    statements.insertEntry.run(payload);
    const row = statements.getEntryById.get({ id: payload.id });
    return mapRow(row);
  },
  listEntries: () => {
    if (isClosed) {
      return [];
    }
    return statements.listEntries.all().map(mapRow);
  },
  deleteEntry: (id) => {
    if (isClosed) {
      return false;
    }
    if (typeof id !== 'string' || id.trim() === '') {
      return false;
    }
    const result = statements.deleteEntry.run({ id: id.trim() });
    return result.changes > 0;
  },
  clearEntries: () => {
    if (isClosed) {
      return false;
    }
    statements.clearEntries.run();
    return true;
  },
  closeDatabase: () => {
    if (isClosed) {
      return true;
    }
    if (db.open) {
      db.close();
    }
    isClosed = true;
    return true;
  }
};

parentPort.on('message', (message) => {
  if (!message || typeof message !== 'object') {
    return;
  }

  const { id, type, payload } = message;

  if (!Number.isInteger(id)) {
    return;
  }

  try {
    const handler = handlers[type];
    if (!handler) {
      throw new Error(`Unknown history worker action "${type}"`);
    }

    const result = handler(payload);
    parentPort.postMessage({ id, result });
  } catch (error) {
    parentPort.postMessage({ id, error: serializeError(error) });
  }
});

process.on('exit', () => {
  if (db.open) {
    db.close();
  }
});
