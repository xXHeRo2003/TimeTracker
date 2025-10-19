const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const getStorageDirectory = () => {
  if (process.env.FLOWTIME_DB_DIR) {
    return process.env.FLOWTIME_DB_DIR;
  }

  const home = os.homedir();

  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'Flowtime');
  }

  if (process.platform === 'win32') {
    const roaming = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    return path.join(roaming, 'Flowtime');
  }

  return path.join(home, '.config', 'flowtime');
};

const resolveDatabasePath = () => {
  if (process.env.FLOWTIME_DB_PATH) {
    return process.env.FLOWTIME_DB_PATH;
  }

  return path.join(getStorageDirectory(), 'time-tracker.db');
};

const databaseFile = resolveDatabasePath();
fs.mkdirSync(path.dirname(databaseFile), { recursive: true });

const db = new Database(databaseFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS time_entries (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    note TEXT,
    started_at INTEGER NOT NULL,
    stopped_at INTEGER,
    duration_seconds INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_time_entries_started_at ON time_entries (started_at);
`);

const mapEntry = (row) =>
  row && {
    id: row.id,
    title: row.title,
    note: row.note,
    startedAt: row.started_at,
    stoppedAt: row.stopped_at,
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

const getEntryById = (id) => {
  const stmt = db.prepare('SELECT * FROM time_entries WHERE id = ?');
  return mapEntry(stmt.get(id));
};

const createEntry = ({ title, note = null, startedAt = Date.now() }) => {
  const now = Date.now();
  const id = crypto.randomUUID();

  const stmt = db.prepare(`
    INSERT INTO time_entries (id, title, note, started_at, created_at, updated_at)
    VALUES (@id, @title, @note, @started_at, @created_at, @updated_at)
  `);

  stmt.run({
    id,
    title,
    note,
    started_at: startedAt,
    created_at: now,
    updated_at: now
  });

  return getEntryById(id);
};

const updateEntry = (id, { title, note, startedAt }) => {
  const entry = getEntryById(id);
  if (!entry) {
    return null;
  }

  const nextTitle = typeof title === 'string' ? title : entry.title;
  const nextNote = typeof note === 'string' || note === null ? note : entry.note;
  const nextStartedAt =
    typeof startedAt === 'number' && Number.isFinite(startedAt) ? startedAt : entry.startedAt;
  const now = Date.now();

  const stmt = db.prepare(`
    UPDATE time_entries
    SET title = @title,
        note = @note,
        started_at = @started_at,
        updated_at = @updated_at
    WHERE id = @id
  `);

  stmt.run({
    id,
    title: nextTitle,
    note: nextNote,
    started_at: nextStartedAt,
    updated_at: now
  });

  return getEntryById(id);
};

const stopEntry = (id, stoppedAt = Date.now()) => {
  const entry = getEntryById(id);
  if (!entry) {
    return null;
  }

  const durationSeconds = Math.max(
    0,
    Math.round((stoppedAt - entry.startedAt) / 1000)
  );

  const stmt = db.prepare(`
    UPDATE time_entries
    SET stopped_at = @stopped_at,
        duration_seconds = @duration_seconds,
        updated_at = @updated_at
    WHERE id = @id
  `);

  stmt.run({
    id,
    stopped_at: stoppedAt,
    duration_seconds: durationSeconds,
    updated_at: Date.now()
  });

  return getEntryById(id);
};

const deleteEntry = (id) => {
  const stmt = db.prepare('DELETE FROM time_entries WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

const listEntries = ({ limit = 50, offset = 0, from, to } = {}) => {
  const filters = [];
  const params = {};

  if (typeof from === 'number') {
    filters.push('started_at >= @from');
    params.from = from;
  }

  if (typeof to === 'number') {
    filters.push('started_at <= @to');
    params.to = to;
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

  const stmt = db.prepare(`
    SELECT * FROM time_entries
    ${whereClause}
    ORDER BY started_at DESC
    LIMIT @limit OFFSET @offset
  `);

  const rows = stmt.all({
    ...params,
    limit,
    offset
  });

  const countStmt = db.prepare(`
    SELECT COUNT(*) as total
    FROM time_entries
    ${whereClause}
  `);

  const { total } = countStmt.get(params);

  return {
    entries: rows.map(mapEntry),
    total
  };
};

const getDailySummary = ({ from, to } = {}) => {
  const filters = [];
  const params = {};

  if (typeof from === 'number') {
    filters.push('started_at >= @from');
    params.from = from;
  }

  if (typeof to === 'number') {
    filters.push('started_at <= @to');
    params.to = to;
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

  const stmt = db.prepare(`
    SELECT
      DATE(started_at / 1000, 'unixepoch') AS day,
      SUM(duration_seconds) AS totalDurationSeconds,
      COUNT(*) AS entryCount
    FROM time_entries
    ${whereClause}
    GROUP BY day
    ORDER BY day DESC
  `);

  return stmt.all(params).map((row) => ({
    day: row.day,
    totalDurationSeconds: row.totalDurationSeconds ?? 0,
    entryCount: row.entryCount
  }));
};

const closeDatabase = () => {
  if (db.open) {
    db.close();
  }
};

module.exports = {
  createEntry,
  deleteEntry,
  getDailySummary,
  getEntryById,
  listEntries,
  stopEntry,
  updateEntry,
  databaseFile,
  closeDatabase
};
