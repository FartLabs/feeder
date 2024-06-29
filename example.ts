import { chunk } from "@std/collections/chunk";
import type { RESTPostAPIWebhookWithTokenJSONBody } from "discord_api_types/rest/v10/webhook.ts";
import type { APIEmbed } from "discord_api_types/payloads/v10/channel.ts";
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
      for (const entriesChunk of chunk(entries, 10)) {
        await executeWebhook(url, entriesChunk);
      }
    },
  );
}

async function executeWebhook(url: string, entries: FeedEntry[]) {
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(renderEmbeds(entries)),
  });
}

function renderEmbeds(
  entries: FeedEntry[],
): RESTPostAPIWebhookWithTokenJSONBody {
  return {
    content: "✨**NEW**✨",
    embeds: entries.map((entry) => renderEmbed(entry)),
  };
}

function renderEmbed(entry: FeedEntry): APIEmbed {
  return {
    title: entry.title?.value,
    description: entry.description?.value,
    color: 0xc3ef3c,
    url: entry.links?.[0].href,
    footer: { text: renderFooter(entry) },
  };
}

function renderFooter(entry: FeedEntry) {
  return Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(
    entry.published,
  );
}
