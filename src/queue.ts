import { Submission } from "./validator.js";

export class OfflineQueue {
  private queue: Submission[] = [];

  /**
   * Add a submission to the offline queue.
   */
  enqueue(submission: Submission): void {
    this.queue.push(submission);
  }

  /**
   * Return all submissions currently waiting to be synchronized.
   */
  getAll(): Submission[] {
    return [...this.queue];
  }

  /**
   * Remove all submissions from the queue.
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Return the number of queued submissions.
   */
  size(): number {
    return this.queue.length;
  }
}