# Feeder

Programmable RSS/Atom feed event listeners.

## Example

```ts
const kv = await Deno.openKv();
const feeder = new DenoFeeder(kv);
await feeder.cron(
  "https://fart.tools/feed.xml",
  "FartLabs Blog",
  "0 * * * *", // https://crontab.guru/#0_*_*_*_*
  (entries) => {
    console.dir(entries, { depth: Infinity });
  },
);
```

## Development

Make sure to install Deno:
<https://deno.land/manual/getting_started/installation>.

Run the example to manually test the project:

```sh
deno task example
```

Format the project:

```sh
deno fmt
```

Check for common errors:

```sh
deno lint
```

## Dependencies

See all of the project dependencies in the `deno.json` file.

- [**jsr.io/@mikaelporttila/rss**](https://jsr.io/@mikaelporttila/rss)

---

Developed with 🧪 [**@FartLabs**](https://github.com/FartLabs)
