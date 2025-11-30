const os = require('os');
const path = require('path');
const { Worker } = require('node:worker_threads');

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
const workerScript = path.join(__dirname, 'historyWorker.js');

const pending = new Map();
let nextMessageId = 0;
let worker = null;
let isClosing = false;
let isClosed = false;

const rejectAllPending = (error) => {
  if (pending.size === 0) {
    return;
  }
  pending.forEach(({ reject }) => {
    try {
      reject(error);
    } catch (rejectionError) {
      console.warn('[historyStore] Failed to reject pending request', rejectionError);
    }
  });
  pending.clear();
};

const toError = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return new Error('History worker failed with an unknown error');
  }
  const error = new Error(payload.message || 'History worker failed');
  if (payload.stack) {
    error.stack = payload.stack;
  }
  if (payload.code) {
    error.code = payload.code;
  }
  if (payload.name) {
    error.name = payload.name;
  }
  return error;
};

const handleWorkerMessage = (message) => {
  if (!message || typeof message !== 'object') {
    return;
  }
  const { id, result, error } = message;
  if (!Number.isInteger(id)) {
    return;
  }

  const entry = pending.get(id);
  if (!entry) {
    return;
  }

  pending.delete(id);

  if (error) {
    entry.reject(toError(error));
    return;
  }

  entry.resolve(result);
};

const handleWorkerError = (error) => {
  const normalized = error instanceof Error ? error : new Error(String(error));
  rejectAllPending(normalized);
  worker = null;

  if (!isClosing && !isClosed) {
    worker = spawnWorker();
  }
};

const handleWorkerExit = (code) => {
  const exitError =
    code === 0 ? null : new Error(`History worker exited unexpectedly with code ${code}`);

  const wasClosing = isClosing;
  worker = null;

  if (exitError) {
    rejectAllPending(exitError);
  }

  if (wasClosing || isClosed) {
    isClosing = false;
    return;
  }

  worker = spawnWorker();
};

function spawnWorker() {
  const instance = new Worker(workerScript, {
    workerData: { databaseFile }
  });
  instance.on('message', handleWorkerMessage);
  instance.on('error', handleWorkerError);
  instance.on('exit', handleWorkerExit);
  return instance;
}

const ensureWorker = () => {
  if (isClosed) {
    throw new Error('History store is closed');
  }
  if (!worker) {
    worker = spawnWorker();
  }
  return worker;
};

const callWorker = (type, payload) => {
  if (isClosed && type !== 'closeDatabase') {
    return Promise.reject(new Error('History store is closed'));
  }

  if (isClosing && type !== 'closeDatabase') {
    return Promise.reject(new Error('History store is closing'));
  }

  const target = ensureWorker();

  return new Promise((resolve, reject) => {
    const id = ++nextMessageId;
    pending.set(id, { resolve, reject });
    target.postMessage({ id, type, payload });
  });
};

const insertEntry = (entry) => callWorker('insertEntry', entry);

const listEntries = () => callWorker('listEntries');

const deleteEntry = (id) => callWorker('deleteEntry', id);

const clearEntries = () => callWorker('clearEntries').then(() => undefined);

const closeDatabase = async () => {
  if (isClosed || isClosing) {
    return;
  }

  if (!worker) {
    isClosed = true;
    return;
  }

  isClosing = true;

  try {
    await callWorker('closeDatabase');
  } catch (error) {
    console.warn('[historyStore] Failed to close database cleanly', error);
  } finally {
    isClosed = true;
    rejectAllPending(new Error('History store closed'));
    if (worker) {
      try {
        await worker.terminate();
      } catch (terminationError) {
        console.warn('[historyStore] Worker termination failed', terminationError);
      }
      worker = null;
    }
    isClosing = false;
  }
};

module.exports = {
  insertEntry,
  listEntries,
  deleteEntry,
  clearEntries,
  closeDatabase,
  databaseFile
};
