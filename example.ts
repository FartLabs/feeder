import type { RESTPostAPIWebhookWithTokenJSONBody } from "discord_api_types/rest/v10/webhook.ts";
import { DenoFeeder } from "./deno_feeder.ts";
import type { FeedEntry } from "./shared.ts";

if (import.meta.main) {
  const url = Deno.env.get("DISCORD_WEBHOOK_URL");
  if (!url) {
    throw new Error("DISCORD_WEBHOOK_URL is not set");
  }

  const kv = await Deno.openKv();
  const feeder = new DenoFeeder(kv);
  await feeder.cron(
    "https://fart.tools/feed.xml",
    "FartLabs Blog",
    "* * * * *",
    async (entries) => {
      for (const entry of entries) {
        await executeWebhook(url, entry);
      }
    },
  );
}

async function executeWebhook(url: string, entry: FeedEntry) {
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      {
        content: `# ${entry.title?.value}\n${entry.description?.value}`,
      } satisfies RESTPostAPIWebhookWithTokenJSONBody,
    ),
  });
}
