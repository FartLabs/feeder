import type { RESTPostAPIWebhookWithTokenJSONBody } from "discord_api_types/rest/v10/webhook.ts";
import { DenoFeeder } from "./deno_feeder.ts";
import type { FeedEntry } from "./shared.ts";

if (import.meta.main) {
  const url = Deno.env.get("DISCORD_WEBHOOK_URL");
  if (!url) {
    throw new Error("DISCORD_WEBHOOK_URL is not set");
  }

  const kv = await Deno.openKv(":memory:");
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
  console.log("Executing webhook", { entry });
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(renderEmbed(entry)),
  });
}

function renderEmbed(entry: FeedEntry): RESTPostAPIWebhookWithTokenJSONBody {
  return {
    embeds: [
      {
        title: entry.title?.value,
        description: entry.description?.value,
        url: entry.links?.[0].href,
        footer: {
          text: renderFooter(entry),
        },
      },
    ],
  };
}

function renderFooter(entry: FeedEntry) {
  const author = entry.author?.name ?? "FartLabs";
  const published = entry.published !== undefined
    ? `, published ${
      Intl.DateTimeFormat("en-US", {
        dateStyle: "full",
        timeStyle: "short",
      }).format(entry.published)
    }`
    : "";

  return `${author}${published}`;
}
