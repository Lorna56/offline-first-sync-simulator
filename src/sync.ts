import { OfflineQueue } from "./queue.js";
import {
  Submission,
  validateSubmission,
} from "./validator.js";

export interface SyncResult {
  committed: Submission[];
  duplicates: Submission[];
  invalid: {
    submission: Submission;
    errors: string[];
  }[];
}

export class SyncEngine {
  private readonly queue: OfflineQueue;

  constructor(queue: OfflineQueue) {
    this.queue = queue;
  }

  synchronize(): SyncResult {
    const committed: Submission[] = [];
    const duplicates: Submission[] = [];
    const invalid: {
      submission: Submission;
      errors: string[];
    }[] = [];

    const seenSubmissionIds = new Set<string>();

    for (const submission of this.queue.getAll()) {
      const validation = validateSubmission(submission);

      if (!validation.valid) {
        invalid.push({
          submission,
          errors: validation.errors,
        });

        continue;
      }

      if (seenSubmissionIds.has(submission.submission_uuid)) {
        duplicates.push(submission);

        continue;
      }

      seenSubmissionIds.add(submission.submission_uuid);
      committed.push(submission);
    }

    this.queue.clear();

    return {
      committed,
      duplicates,
      invalid,
    };
  }
}
