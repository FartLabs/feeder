import type {
  // Feed,
  FeedEntry,
} from "@mikaelporttila/rss";

export class DenoFeeder implements Feeder {
  public constructor(
    private readonly kv: Deno.Kv,
    private readonly kvKeyPrefix: Deno.KvKey = [],
  ) {
  }

  public async ingest(entries: FeedEntry[]): Promise<FeedEntry[]> {
    const existingEntries = await Array.fromAsync(this.kv.list<FeedEntry>({
      prefix: [...this.kvKeyPrefix, "entries"],
    }));
    const newEntries = entries.filter((entry) =>
      !existingEntries.some((existingEntry) =>
        existingEntry.value.id === entry.id
      )
    );
    if (newEntries.length === 0) {
      return [];
    }

    const result = await this.kv.atomic()
      .mutate(
        ...newEntries.map((entry) => ({
          key: [...this.kvKeyPrefix, "entries", entry.id],
          type: "set" as const,
          value: entry,
        })),
      )
      .commit();
    console.log({ result });
    return newEntries;
  }

  // public cron(
  //     name: string,
  //     schedule: string | Deno.CronSchedule,
  //     handler: () => void | Promise<void>,
  // ) {
  //     return await Deno.cron();
  // }
}

interface Feeder {
  /**
   * ingest ingests a feed into the storage and returns the feed entries that
   * were added.
   */
  ingest(entries: FeedEntry[]): Promise<FeedEntry[]>;
}
