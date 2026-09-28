import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { OfflineQueue } from "../src/queue.js";
import { SyncEngine } from "../src/sync.js";
import { Submission } from "../src/validator.js";

const validSubmissions: Submission[] = [
  {
    submission_uuid: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    urban_council: "Mukono Municipality",
    pdp_status: "Active",
    expiry_year: 2032,
    field_officer_timestamp: "2026-06-03T09:15:00Z",
  },
  {
    submission_uuid: "6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b",
    urban_council: "Entebbe Municipal Council",
    pdp_status: "Expiring",
    expiry_year: 2026,
    field_officer_timestamp: "2026-06-03T10:22:11Z",
  },
  {
    submission_uuid: "bc29e1a8-89c0-4fb1-b12e-1b32d20912ab",
    urban_council: "Gulu City Council",
    pdp_status: "Missing",
    expiry_year: null,
    field_officer_timestamp: "2026-06-03T11:05:45Z",
  },
];

describe("SyncEngine", () => {
  it("commits valid unique submissions", () => {
    const queue = new OfflineQueue();

    for (const submission of validSubmissions) {
      queue.enqueue(submission);
    }

    const engine = new SyncEngine(queue);
    const result = engine.synchronize();

    expect(result.committed).toHaveLength(3);
    expect(result.duplicates).toHaveLength(0);
    expect(result.invalid).toHaveLength(0);
  });

  it("drops duplicate submissions using submission_uuid", () => {
    const queue = new OfflineQueue();

    queue.enqueue(validSubmissions[0]);
    queue.enqueue(validSubmissions[0]);

    const engine = new SyncEngine(queue);
    const result = engine.synchronize();

    expect(result.committed).toHaveLength(1);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].submission_uuid).toBe(
      validSubmissions[0].submission_uuid
    );
  });

  it("rejects invalid submissions", () => {
    const queue = new OfflineQueue();

    const invalidSubmission: Submission = {
      ...validSubmissions[0],
      submission_uuid: "not-a-valid-uuid",
    };

    queue.enqueue(invalidSubmission);

    const engine = new SyncEngine(queue);
    const result = engine.synchronize();

    expect(result.committed).toHaveLength(0);
    expect(result.duplicates).toHaveLength(0);
    expect(result.invalid).toHaveLength(1);
  });

  it("clears the queue after synchronization", () => {
    const queue = new OfflineQueue();

    for (const submission of validSubmissions) {
      queue.enqueue(submission);
    }

    expect(queue.size()).toBe(3);

    const engine = new SyncEngine(queue);
    engine.synchronize();

    expect(queue.size()).toBe(0);
  });

    it("rejects a submission with an empty urban council", () => {
    const queue = new OfflineQueue();

    const invalidSubmission: Submission = {
      ...validSubmissions[0],
      urban_council: "",
    };

    queue.enqueue(invalidSubmission);

    const engine = new SyncEngine(queue);
    const result = engine.synchronize();

    expect(result.committed).toHaveLength(0);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].errors).toContain(
      "urban_council is required"
    );
  });

    it("rejects an unsupported PDP status", () => {
    const queue = new OfflineQueue();

    const invalidSubmission = {
      ...validSubmissions[0],
      pdp_status: "Unknown",
    };

    queue.enqueue(invalidSubmission as unknown as Submission);

    const engine = new SyncEngine(queue);
    const result = engine.synchronize();

    expect(result.committed).toHaveLength(0);
    expect(result.invalid).toHaveLength(1);
  });

  it("rejects an invalid expiry year", () => {
    const queue = new OfflineQueue();

    const invalidSubmission: Submission = {
      ...validSubmissions[0],
      expiry_year: 1899,
    };

    queue.enqueue(invalidSubmission);

    const engine = new SyncEngine(queue);
    const result = engine.synchronize();

    expect(result.committed).toHaveLength(0);
    expect(result.invalid).toHaveLength(1);
  });

  it("rejects an invalid field officer timestamp", () => {
    const queue = new OfflineQueue();

    const invalidSubmission: Submission = {
      ...validSubmissions[0],
      field_officer_timestamp: "not-a-date",
    };

    queue.enqueue(invalidSubmission);

    const engine = new SyncEngine(queue);
    const result = engine.synchronize();

    expect(result.committed).toHaveLength(0);
    expect(result.invalid).toHaveLength(1);
  });

  it("accepts a null expiry year", () => {
    const queue = new OfflineQueue();

    const missingPdpSubmission: Submission = {
      ...validSubmissions[2],
      expiry_year: null,
    };

    queue.enqueue(missingPdpSubmission);

    const engine = new SyncEngine(queue);
    const result = engine.synchronize();

    expect(result.committed).toHaveLength(1);
    expect(result.invalid).toHaveLength(0);
  });

    it("processes the exact challenge payload correctly", () => {
    const payload = readFileSync(
      new URL("../data/payload.json", import.meta.url),
      "utf-8"
    );

    const submissions = JSON.parse(payload) as Submission[];

    const queue = new OfflineQueue();

    for (const submission of submissions) {
      queue.enqueue(submission);
    }

    expect(queue.size()).toBe(4);

    const engine = new SyncEngine(queue);
    const result = engine.synchronize();

    expect(result.committed).toHaveLength(3);
    expect(result.duplicates).toHaveLength(1);
    expect(result.invalid).toHaveLength(0);

    expect(result.duplicates[0].submission_uuid).toBe(
      "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"
    );

    expect(
      result.committed.map((submission) => submission.urban_council)
    ).toEqual([
      "Mukono Municipality",
      "Entebbe Municipal Council",
      "Gulu City Council",
    ]);
  });
});