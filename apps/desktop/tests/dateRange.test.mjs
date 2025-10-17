import test from 'node:test';
import assert from 'node:assert/strict';

const dateRangeModule = await import('../src/renderer/scripts/utils/dateRange.js');

test('resolveFirstDayOfWeekIndex respects locale defaults', () => {
  dateRangeModule.resetDateRangeCache();
  assert.equal(dateRangeModule.resolveFirstDayOfWeekIndex('en-US'), 0);
  assert.equal(dateRangeModule.resolveFirstDayOfWeekIndex('de-DE'), 1);
});

test('getStartOfWeek returns the start day respecting locale', () => {
  dateRangeModule.resetDateRangeCache();
  const reference = new Date('2024-05-08T12:00:00Z'); // Wednesday

  const usStart = dateRangeModule.getStartOfWeek(reference, 'en-US');
  assert.equal(usStart.getDay(), 0, 'US week should start on Sunday');

  const deStart = dateRangeModule.getStartOfWeek(reference, 'de-DE');
  assert.equal(deStart.getDay(), 1, 'DE week should start on Monday');

  const usEnd = dateRangeModule.getEndOfWeek(reference, 'en-US');
  assert.equal(usEnd.getTime() - usStart.getTime(), 7 * 24 * 60 * 60 * 1000);
});
