import { parseFeed } from "@mikaelporttila/rss";
import { DenoFeeder } from "./feeder.ts";

if (import.meta.main) {
  // const kv = await Deno.openKv(":memory:");
  const kv = await Deno.openKv("./db.kv");
  const feeder = new DenoFeeder(kv);
  const feed = await fetchFeed("https://fart.tools/feed.xml");
  const entries = await feeder.ingest(feed.entries);
  console.log({ entries });
}

export async function fetchFeed(url: string) {
  const response = await fetch(url);
  const text = await response.text();
  return parseFeed(text);
}
