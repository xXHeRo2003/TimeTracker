const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('node:assert/strict');
const test = require('node:test');
const request = require('supertest');

const databaseFile = path.join(
  os.tmpdir(),
  `flowtime-test-${process.pid}-${Date.now()}.db`
);

process.env.FLOWTIME_DB_PATH = databaseFile;

const { createApp } = require('../src/index.js');
const {
  createEntry,
  deleteEntry,
  listEntries,
  stopEntry,
  closeDatabase
} = require('../src/db');

const app = createApp();

const clearDatabase = () => {
  const { entries } = listEntries({ limit: 500, offset: 0 });
  entries.forEach((entry) => deleteEntry(entry.id));
};

test.beforeEach(() => {
  clearDatabase();
});

test.after(() => {
  clearDatabase();
  closeDatabase();
  fs.rmSync(databaseFile, { force: true });
});

test('POST /api/time-entries persists a new entry', async () => {
  const response = await request(app)
    .post('/api/time-entries')
    .send({ title: 'Testing API', note: 'optional' })
    .expect(201);

  assert.ok(response.body.id, 'response contains an id');
  assert.equal(response.body.title, 'Testing API');
  assert.equal(response.body.note, 'optional');

  const { total } = listEntries();
  assert.equal(total, 1);
});

test('POST /api/time-entries/:id/stop stores duration in seconds', async () => {
  const startedAt = Date.now() - 5 * 60 * 1000;

  const created = await request(app)
    .post('/api/time-entries')
    .send({ title: 'Stop me', startedAt })
    .expect(201);

  const stoppedAt = startedAt + 2 * 60 * 1000;

  const response = await request(app)
    .post(`/api/time-entries/${created.body.id}/stop`)
    .send({ stoppedAt })
    .expect(200);

  assert.equal(response.body.durationSeconds, 120);
  assert.equal(response.body.stoppedAt, stoppedAt);
});

test('GET /api/stats/daily aggregates durations per day', async () => {
  const dayOneStart = Date.UTC(2023, 0, 1, 10, 0, 0);
  const dayTwoStart = Date.UTC(2023, 0, 2, 9, 0, 0);

  const firstDay = createEntry({ title: 'Deep work', startedAt: dayOneStart });
  stopEntry(firstDay.id, dayOneStart + 30 * 60 * 1000);

  const secondSameDay = createEntry({
    title: 'Planning',
    startedAt: dayOneStart + 60 * 60 * 1000
  });
  stopEntry(secondSameDay.id, dayOneStart + 90 * 60 * 1000);

  const otherDay = createEntry({ title: 'Review', startedAt: dayTwoStart });
  stopEntry(otherDay.id, dayTwoStart + 45 * 60 * 1000);

  const response = await request(app).get('/api/stats/daily').expect(200);

  assert.ok(Array.isArray(response.body));
  const summary = Object.fromEntries(response.body.map((row) => [row.day, row]));

  assert.equal(summary['2023-01-01'].totalDurationSeconds, 3600);
  assert.equal(summary['2023-01-01'].entryCount, 2);

  assert.equal(summary['2023-01-02'].totalDurationSeconds, 2700);
  assert.equal(summary['2023-01-02'].entryCount, 1);
});
