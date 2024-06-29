import type { FeedEntry } from "@mikaelporttila/rss";
import type { Feeder } from "./feeder.ts";
import { fetchFeed } from "./shared.ts";

export class DenoFeeder implements Feeder {
    public constructor(
        private readonly kv: Deno.Kv,
        private readonly kvKeyPrefix: Deno.KvKey = [],
    ) {
    }

    public async ingest(entries: FeedEntry[]): Promise<FeedEntry[]> {
        if (entries.length === 0) {
            return [];
        }

        const previousPublishedDateKey = [...this.kvKeyPrefix, "publishedDate"];
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

        await this.kv.atomic()
            .check(previousPublishedDateResult)
            .set(previousPublishedDateKey, latestPublishedDate)
            .commit();
        return newEntries;
    }

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
                const entries = await this.ingest(feed.entries);
                await handler(entries);
            },
        );
    }
}
