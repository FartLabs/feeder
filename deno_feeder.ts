import type { Feeder } from "./feeder.ts";
import type { FeedEntry } from "./shared.ts";
import { fetchFeed } from "./shared.ts";

export class DenoFeeder implements Feeder {
  public constructor(
    private readonly kv: Deno.Kv,
    private readonly kvKeyPrefix: Deno.KvKey = [],
  ) {}

  public async cron(
    url: string,
    name: string,
    schedule: string | Deno.CronSchedule,
    handler: (entries: FeedEntry[]) => void | Promise<void>,
  ) {
    await Deno.cron(
      name,
      schedule,
      async () => {
        const feed = await fetchFeed(url);
        const entries = await this.ingest(feed.entries, name);
        await handler(entries);
      },
    );
  }

  public async ingest(
    entries: FeedEntry[],
    name?: string,
  ): Promise<FeedEntry[]> {
    if (entries.length === 0) {
      return [];
    }

    // Prevent conflicts by adding cron job name to the key.
    const previousPublishedDateKey = [];
    previousPublishedDateKey.push(...this.kvKeyPrefix);
    if (name !== undefined) {
      previousPublishedDateKey.push(name);
    }
    previousPublishedDateKey.push("publishedDate");

    // Find the latest published date.
    const previousPublishedDateResult = await this.kv.get<number>(
      previousPublishedDateKey,
    );
    const previousPublishedDate = previousPublishedDateResult?.value ?? 0;
    let latestPublishedDate = previousPublishedDate;
    const newEntries = entries.filter((entry) => {
      const publishedDate = entry.published?.getTime() ?? 0;
      if (publishedDate > previousPublishedDate) {
        if (publishedDate > latestPublishedDate) {
          latestPublishedDate = publishedDate;
        }

        return true;
      }

      return false;
    });

    // Update the latest published date.
    await this.kv.atomic()
      .check(previousPublishedDateResult)
      .set(previousPublishedDateKey, latestPublishedDate)
      .commit();

    // Return new entries sorted by published date in ascending order.
    return newEntries.toSorted((a, b) =>
      (a.published?.getTime() ?? 0) - (b.published?.getTime() ?? 0)
    );
  }
}
