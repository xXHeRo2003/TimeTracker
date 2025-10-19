const express = require('express');
const {
  createEntry,
  deleteEntry,
  getEntryById,
  listEntries,
  stopEntry,
  updateEntry
} = require('../db');

const router = express.Router();

const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

router.get('/', (req, res, next) => {
  try {
    const limit = Math.min(parseNumber(req.query.limit) ?? 50, 250);
    const offset = parseNumber(req.query.offset) ?? 0;
    const from = parseNumber(req.query.from);
    const to = parseNumber(req.query.to);

    const { entries, total } = listEntries({ limit, offset, from, to });
    res.json({
      entries,
      pagination: {
        limit,
        offset,
        total
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const entry = getEntryById(req.params.id);
    if (!entry) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }

    res.json(entry);
  } catch (error) {
    next(error);
  }
});

router.post('/', (req, res, next) => {
  try {
    const { title, note, startedAt } = req.body;

    if (typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: 'title is required' });
      return;
    }

    const payload = {
      title: title.trim(),
      note: typeof note === 'string' ? note.trim() : null
    };

    if (startedAt !== undefined) {
      const parsedStartedAt = parseNumber(startedAt);
      if (parsedStartedAt === undefined) {
        res.status(400).json({ error: 'startedAt must be a number (milliseconds)' });
        return;
      }
      payload.startedAt = parsedStartedAt;
    }

    const entry = createEntry(payload);
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', (req, res, next) => {
  try {
    const { title, note, startedAt } = req.body;
    if (
      typeof title !== 'string' &&
      typeof note !== 'string' &&
      note !== null &&
      startedAt === undefined
    ) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    const payload = {};

    if (typeof title === 'string') {
      const trimmed = title.trim();
      if (!trimmed) {
        res.status(400).json({ error: 'title cannot be empty' });
        return;
      }
      payload.title = trimmed;
    }

    if (typeof note === 'string' || note === null) {
      payload.note = note === null ? null : note.trim();
    }

    if (startedAt !== undefined) {
      const parsed = parseNumber(startedAt);
      if (parsed === undefined) {
        res.status(400).json({ error: 'startedAt must be a number (milliseconds)' });
        return;
      }
      payload.startedAt = parsed;
    }

    const entry = updateEntry(req.params.id, payload);
    if (!entry) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }

    res.json(entry);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/stop', (req, res, next) => {
  try {
    const stoppedAt =
      req.body && req.body.stoppedAt !== undefined
        ? parseNumber(req.body.stoppedAt)
        : Date.now();

    if (stoppedAt === undefined) {
      res.status(400).json({ error: 'stoppedAt must be a number (milliseconds)' });
      return;
    }

    const entry = stopEntry(req.params.id, stoppedAt);
    if (!entry) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }

    res.json(entry);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const wasDeleted = deleteEntry(req.params.id);
    if (!wasDeleted) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
