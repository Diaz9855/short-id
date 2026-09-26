# Short ID

Short ID generates compact, sortable, collision-resistant IDs using a monotonic clock.

## Usage

```js
import { ShortId } from 'short-id';

const shortId = new ShortId();
const id = shortId.nextId();
console.log(id); // e.g. "0000000a0000k3f2"
```

## Why this library exists

Distributed systems often need IDs that can be generated without coordination and still
sort by creation time. UUIDs are random and do not sort chronologically. ULIDs and similar
schemes solve this, but can be long. Short ID provides a compact alternative using a
base36 encoding of milliseconds since a fixed epoch, a per-millisecond counter, and a
random suffix for uniqueness across processes.

The trade-off: IDs are only guaranteed unique within a single process unless the random
suffix happens to differ across processes. For most use cases (e.g. client-side IDs,
logging, non-critical database keys), this is an acceptable balance of length and
collision resistance.

## Edge case

The clock may move backwards (e.g. due to NTP adjustments). Short ID handles this by
continuing to increment the previous timestamp, preserving the sort order and uniqueness
within the instance.

## Exports

- `ShortId` (class) — constructor accepts optional `now` and `randomBytes` functions for
  deterministic testing; method `nextId()` returns a new ID string.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

