# Offline-First Sync Simulator

A lightweight TypeScript simulator for processing field submissions in low-connectivity environments.

The simulator demonstrates an offline-first synchronization workflow that:

* Queues records while offline.
* Validates submissions before synchronization.
* Detects duplicate submissions using `submission_uuid`.
* Commits only unique, validated records.
* Reports duplicate and invalid records separately.

## Challenge Scenario

The provided payload contains 4 records:

* 3 unique submissions.
* 1 duplicate submission for Mukono Municipality with the same `submission_uuid`.

The synchronization result is:

```text
Queued records: 4
Committed records: 3
Duplicate records dropped: 1
Invalid records rejected: 0
```

## Architecture

The implementation is divided into three main responsibilities:

```text
Payload
   ↓
OfflineQueue
   ↓
SyncEngine
   ├── Validate submission
   ├── Detect duplicate submission_uuid
   └── Commit valid unique records
```

### Components

**`src/validator.ts`**

Defines the `Submission` model and validates:

* UUID format.
* Urban council presence.
* Supported PDP status (`Active`, `Expiring`, `Missing`).
* Expiry year.
* Field officer timestamp.

**`src/queue.ts`**

Provides an in-memory offline queue with operations to:

* Enqueue submissions.
* Read queued submissions.
* Check queue size.
* Clear the queue after synchronization.

**`src/sync.ts`**

Contains the synchronization logic. It validates each queued submission and uses a `Set` of `submission_uuid` values to prevent duplicate submissions from being committed.

**`src/index.ts`**

Loads the challenge payload, queues the records, runs synchronization, and displays the results.

## Why `submission_uuid`?

`submission_uuid` is used as the idempotency key for submissions within a synchronization batch.

If the same field submission is received more than once during synchronization, only the first valid occurrence is committed and subsequent occurrences are treated as duplicates.

In a production system, this should also be enforced at the persistence layer with a unique database constraint to protect against duplicates across retries or concurrent requests.

## Validation and Synchronization Flow

For every queued record:

1. Validate the submission.
2. Reject invalid records.
3. Check whether the `submission_uuid` has already been processed in the current synchronization batch.
4. Drop duplicates.
5. Commit valid unique submissions.
6. Clear the processed queue.

## Running the Project

### Requirements

* Node.js 18+
* npm

### Install dependencies

```bash
npm install
```

### Run the simulator

```bash
npm run dev
```

### Run tests

```bash
npm test
```

### Run TypeScript type checking

```bash
npm run typecheck
```

## Testing

The test suite covers:

* Valid unique submissions.
* Duplicate detection.
* Invalid UUIDs.
* Missing urban council.
* Unsupported PDP status.
* Invalid expiry years.
* Invalid timestamps.
* Nullable expiry years.
* Queue clearing.
* The complete challenge payload.

Current result:

```text
10 tests passed
```

## Production Considerations

This simulator intentionally uses an in-memory queue and simulated commits to keep the challenge lightweight.

A production implementation could extend this design with:

* Persistent local storage such as IndexedDB or SQLite.
* Retry handling for failed synchronization attempts.
* A dead-letter queue for invalid records.
* Transactional database writes.
* A unique database constraint on `submission_uuid`.
* Network-aware background synchronization.
* Structured logging and synchronization metrics.
