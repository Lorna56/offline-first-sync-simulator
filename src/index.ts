import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { OfflineQueue } from "./queue.js";
import { SyncEngine } from "./sync.js";
import { Submission } from "./validator.js";

async function main(): Promise<void> {
  const payloadPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../data/payload.json"
  );

  const payload = await readFile(payloadPath, "utf-8");
  const submissions: Submission[] = JSON.parse(payload);

  const queue = new OfflineQueue();

  for (const submission of submissions) {
    queue.enqueue(submission);
  }

  console.log(`Queued records: ${queue.size()}`);

  const syncEngine = new SyncEngine(queue);
  const result = syncEngine.synchronize();

  console.log(`Committed records: ${result.committed.length}`);
  console.log(`Duplicate records dropped: ${result.duplicates.length}`);
  console.log(`Invalid records rejected: ${result.invalid.length}`);

  console.log("\nCommitted records:");
  console.table(result.committed);

  if (result.duplicates.length > 0) {
    console.log("\nDuplicates dropped:");
    console.table(result.duplicates);
  }

  if (result.invalid.length > 0) {
    console.log("\nInvalid records:");
    console.dir(result.invalid, { depth: null });
  }
}

main().catch((error) => {
  console.error("Synchronization failed:", error);
  process.exit(1);
});