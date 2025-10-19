const express = require('express');
const { getDailySummary } = require('../db');

const router = express.Router();

const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

router.get('/daily', (req, res, next) => {
  try {
    const from = parseNumber(req.query.from);
    const to = parseNumber(req.query.to);

    const summary = getDailySummary({ from, to });
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
