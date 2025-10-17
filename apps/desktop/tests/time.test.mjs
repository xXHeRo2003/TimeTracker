import test from 'node:test';
import assert from 'node:assert/strict';

const timeModule = await import('../src/renderer/scripts/utils/time.js');

test('formatDuration formats milliseconds into hh:mm:ss', () => {
  assert.equal(timeModule.formatDuration(0), '00:00:00');
  assert.equal(timeModule.formatDuration(65_000), '00:01:05');
  assert.equal(timeModule.formatDuration(3_726_000), '01:02:06');
});

test('clampDuration keeps values within min and max bounds', () => {
  const clamp = (value) => timeModule.clampDuration(value, { min: 1_000, max: 10_000 });

  assert.equal(clamp(5_000), 5_000);
  assert.equal(clamp(500), 1_000);
  assert.equal(clamp(20_000), 10_000);
  assert.equal(clamp(Number.NaN), 1_000);
});

test('parseTimerInput parses minutes and hh:mm:ss notations', () => {
  assert.equal(timeModule.parseTimerInput('25'), 25 * 60 * 1000);
  assert.equal(timeModule.parseTimerInput('1,5'), 90 * 1000);
  assert.equal(timeModule.parseTimerInput('00:01:30'), 90 * 1000);
  assert.equal(timeModule.parseTimerInput('1:02:03'), (1 * 60 * 60 + 2 * 60 + 3) * 1000);
});

test('parseTimerInput rejects invalid input', () => {
  assert.equal(timeModule.parseTimerInput(''), null);
  assert.equal(timeModule.parseTimerInput('-5'), null);
  assert.equal(timeModule.parseTimerInput('15:60'), null);
  assert.equal(timeModule.parseTimerInput('abc'), null);
  assert.equal(timeModule.parseTimerInput('1:2:3:4'), null);
});
