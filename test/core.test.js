import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ShortId } from '../src/core.js';

function fixedClock(start) {
  let current = start;
  return () => current++;
}

function fixedRandom(bytes) {
  return () => new Uint8Array(bytes);
}

test('generates an ID with the expected length', () => {
  const shortId = new ShortId({
    now: fixedClock(1704067200000),
    randomBytes: fixedRandom([1, 2, 3, 4]),
  });
  const id = shortId.nextId();
  assert.equal(typeof id, 'string');
  assert.equal(id.length, 18); // 8 + 4 + 6
});

test('IDs sort lexicographically by time', () => {
  const shortId = new ShortId({
    now: fixedClock(1704067200000),
    randomBytes: fixedRandom([0, 0, 0, 0]),
  });
  const id1 = shortId.nextId();
  const id2 = shortId.nextId();
  const id3 = shortId.nextId();

  assert.ok(id1 < id2, 'id1 should sort before id2');
  assert.ok(id2 < id3, 'id2 should sort before id3');
});

test('counter distinguishes IDs in the same millisecond', () => {
  const shortId = new ShortId({
    now: fixedClock(1704067200000),
    randomBytes: fixedRandom([0, 0, 0, 0]),
  });
  const id1 = shortId.nextId();
  const id2 = shortId.nextId();
  assert.notEqual(id1, id2);
  assert.ok(id1 < id2);
});

test('random component differentiates IDs across instances', () => {
  const shortId1 = new ShortId({
    now: fixedClock(1704067200000),
    randomBytes: fixedRandom([1, 2, 3, 4]),
  });
  const shortId2 = new ShortId({
    now: fixedClock(1704067200000),
    randomBytes: fixedRandom([5, 6, 7, 8]),
  });
  const id1 = shortId1.nextId();
  const id2 = shortId2.nextId();
  assert.notEqual(id1, id2);
});

test('handles clock going backwards by maintaining monotonicity', () => {
  let time = 1704067200000;
  const clock = () => {
    // Simulate clock going backwards after first call.
    if (time === 1704067200000) {
      time = 1704067199999;
      return 1704067200000;
    }
    return time;
  };
  const shortId = new ShortId({
    now: clock,
    randomBytes: fixedRandom([0, 0, 0, 0]),
  });
  const id1 = shortId.nextId();
  const id2 = shortId.nextId();
  assert.ok(id1 < id2, 'id2 should still sort after id1 despite backward clock');
});

test('IDs are URL-safe (only alphanumeric characters)', () => {
  const shortId = new ShortId({
    now: fixedClock(1704067200000),
    randomBytes: fixedRandom([255, 255, 255, 255]),
  });
  const id = shortId.nextId();
  assert.match(id, /^[a-z0-9]+$/);
});

test('large number of IDs in same millisecond are unique', () => {
  const shortId = new ShortId({
    now: fixedClock(1704067200000),
    randomBytes: fixedRandom([0, 0, 0, 0]),
  });
  const ids = new Set();
  for (let i = 0; i < 100; i++) {
    ids.add(shortId.nextId());
  }
  assert.equal(ids.size, 100);
});
