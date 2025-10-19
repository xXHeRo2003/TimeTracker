const express = require('express');
const cors = require('cors');
const { databaseFile } = require('./db');
const timeEntriesRouter = require('./routes/timeEntries');
const statsRouter = require('./routes/stats');

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      databaseFile
    });
  });

  app.use('/api/time-entries', timeEntriesRouter);
  app.use('/api/stats', statsRouter);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    // NOSONAR: simple server logging
    console.error('[server] Unhandled error', error);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
};

const startServer = ({ port } = {}) =>
  new Promise((resolve, reject) => {
    const app = createApp();
    const listenPort = Number.isFinite(port) ? Number(port) : Number(process.env.PORT || 4000);
    const server = app.listen(listenPort, () => {
      console.log(`Flowtime API listening on http://localhost:${listenPort}`);
      console.log(`Storing data in: ${databaseFile}`);
      resolve({ app, server, port: listenPort });
    });

    server.on('error', (error) => {
      console.error('[server] Failed to start', error);
      reject(error);
    });
  });

module.exports = {
  createApp,
  startServer,
  databaseFile
};

if (require.main === module) {
  startServer().catch(() => {
    process.exitCode = 1;
  });
}
