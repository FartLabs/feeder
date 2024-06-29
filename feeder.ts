import type { FeedEntry } from "./shared.ts";

export interface Feeder {
  /**
   * ingest ingests a feed into the storage and returns the feed entries that
   * were added.
   */
  ingest(entries: FeedEntry[]): Promise<FeedEntry[]>;
}
