import { DenoFeeder } from "./deno_feeder.ts";

if (import.meta.main) {
  const kv = await Deno.openKv();
  const feeder = new DenoFeeder(kv);
  await feeder.cron(
    "https://fart.tools/feed.xml",
    "FartLabs Blog",
    "* * * * *",
    (entries) => {
      console.log({ entries });
    },
  );
}
