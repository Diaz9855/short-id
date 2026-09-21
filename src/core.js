/**
 * Generates compact, sortable, collision-resistant IDs using a monotonic clock.
 *
 * Design decisions:
 * - IDs are base36 strings (0-9, a-z) to keep them short while remaining URL-safe.
 * - The high bits encode milliseconds since a fixed epoch, so IDs sort lexicographically
 *   in the same order as their creation time.
 * - A per-process counter is appended to distinguish IDs created in the same millisecond.
 * - A random component reduces predictability and the chance of collisions across processes.
 */
const EPOCH = 1704067200000; // 2024-01-01T00:00:00.000Z
const RANDOM_BYTES = 4;

/**
 * Creates a ShortId generator.
 *
 * @param {Object} [options]
 * @param {() => number} [options.now] - Function returning current time in milliseconds.
 *   Defaults to Date.now. Injectable for deterministic tests.
 * @param {() => Uint8Array} [options.randomBytes] - Function returning random bytes.
 *   Defaults to crypto.getRandomValues. Injectable for deterministic tests.
 */
export class ShortId {
  constructor(options = {}) {
    this.now = options.now ?? (() => Date.now());
    this.randomBytes = options.randomBytes ?? (() => {
      const bytes = new Uint8Array(RANDOM_BYTES);
      (globalThis.crypto ?? require('crypto').webcrypto).getRandomValues(bytes);
      return bytes;
    });
    this.lastTimestamp = -1;
    this.counter = 0;
  }

  /**
   * Returns a new unique ID as a base36 string.
   *
   * Guarantees:
   * - IDs from the same generator instance are unique.
   * - IDs sort lexicographically by creation time (for the same instance).
   */
  nextId() {
    const timestamp = this.now();

    // Ensure monotonicity even if the clock moves backwards.
    if (timestamp < this.lastTimestamp) {
      this.lastTimestamp++;
    } else {
      this.lastTimestamp = timestamp;
    }

    // Reset counter when the timestamp advances; otherwise increment.
    if (timestamp === this.lastTimestamp) {
      this.counter++;
    } else {
      this.counter = 0;
    }

    // Encode timestamp as fixed-width base36 (padded to 8 chars).
    const timePart = (this.lastTimestamp - EPOCH).toString(36).padStart(8, '0');

    // Encode counter as fixed-width base36 (padded to 4 chars).
    const counterPart = this.counter.toString(36).padStart(4, '0');

    // Encode random bytes as fixed-width base36 (padded to 6 chars).
    const randomBytes = this.randomBytes();
    const randomPart = bytesToBase36(randomBytes).padStart(6, '0');

    return `${timePart}${counterPart}${randomPart}`;
  }
}

/**
 * Converts a Uint8Array to a base36 string.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function bytesToBase36(bytes) {
  // Convert bytes to a BigInt, then to base36.
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }
  return value.toString(36);
}
