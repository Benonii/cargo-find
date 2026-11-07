# cargo-find

Find the right [Cargo](https://getcargo.ai) action for a GTM job, in plain English.

Cargo has about 150 integrations and more than 800 things an agent can call: connector actions, extractors that sync data into models, native workflow steps and preset tools. Its own action search needs every word to match, so a coding agent that asks for "sync accounts to hubspot" gets zero results, even though `hubspot.upsertRecords` does exactly that. The agent then writes its own HubSpot sync.

cargo-find indexes the whole catalog and answers that question. It runs as an MCP server, an HTTP API, a CLI and a web page, all from the same index.

```
$ cargo-find "sync accounts to hubspot"

1. Upsert records  hubspot.upsertRecords
   Hubspot, connector, no credits
   matched on name: Names Hubspot; action name matches "sync account"
   $ cargo-ai orchestration action execute --action '{"kind":"connector","integrationSlug":"hubspot","actionSlug":"upsertRecords"}' --data '{"objectType":"<Object type>","matchingValue":"<Matching Value>","matchingPropertyName":"<Hubspot Matching Property Name>"}' --dry-run
```

Every result says why it matched, what it costs in Cargo credits, and the exact `cargo-ai` command to run it. The command ends in `--dry-run`, which is free.

## Benchmark

50 GTM jobs, written the way people and agents ask for them, each with a list of acceptable answers ([bench/queries.json](bench/queries.json)). "Cargo search" is `cargo-ai orchestration action list <query>` from CLI 1.0.142.

| Search | Right at rank 1 | Right in top 5 | No results |
| - | - | - | - |
| Cargo action search | 6 / 50 | 6 / 50 | 44 / 50 |
| cargo-find | 38 / 50 | 45 / 50 | 0 / 50 |

Run it yourself with `bun run bench`. The synonym list was written while building, with these queries in view, so treat the numbers as a demonstration and not an independent evaluation.

## How ranking works

Results are sorted by tier first. A result in a stronger tier always beats a weaker one, whatever their scores.

1. **Exact.** The query is an action's name, slug or id: `Find email`, `upsertRecords`, `hubspot.upsertRecords`. If you type the exact name, you get that action first.
2. **Named integration.** The query names an integration ("hubspot", "apollo", "google sheets"), so that integration's actions are matched by name, with GTM synonyms ("sync" means upsert, "account" means company). A name used as an input, such as "linkedin url", does not count.
3. **Keywords.** Weighted text match: name 3x, integration 2x, description 1x, input fields 0.5x, rare words count more.
4. **Meaning.** Similar meaning from a small static embedding model ([potion-base-8M](https://huggingface.co/minishlab/potion-base-8M)) that runs in plain TypeScript, no API key. It only fills what tiers 1 to 3 did not find.

Within a tier, Cargo's preset tools (waterfalls that try several providers) rank first, the same rule Cargo's own search uses.

## Use it from an agent

MCP (streamable HTTP, no sign-in):

```
claude mcp add --transport http cargo-find https://cargo-find.vercel.app/mcp
```

Tools: `find_action(query, limit?, kind?, integration?)` and `get_action(id)`.

HTTP:

```
curl "https://cargo-find.vercel.app/api/search?q=sync+accounts+to+hubspot"
curl "https://cargo-find.vercel.app/api/actions/hubspot.upsertRecords"
```

CLI, offline (the index ships in the package):

```
npx cargo-find "who starred my github repo"
npx cargo-find get github.fetchStargazers
npx cargo-find mcp
```

## How it is built on Cargo

- **Catalog:** `scripts/snapshot.ts` reads the live catalog with the `cargo-ai` CLI (`connection integration list` and `orchestration action list`). Both work without an account.
- **Hosting:** the API, the MCP server and the web page run as one [Cargo Hosting](https://docs.getcargo.ai) worker on `*.worker.getcargo.run`.
- **Execution:** results point back at `cargo-ai orchestration action execute ... --dry-run`, so the agent checks inputs and price on Cargo before it spends credits.

## Layout

```
packages/core   catalog types, tiered ranker, static embeddings, MCP handler
packages/cli    npx cargo-find (search, get, mcp over stdio)
worker/         Cargo Hosting worker: /, /api/search, /api/actions/:id, /api/status, /mcp
web/            the page (Vite, React, Tailwind, coss ui), built into one HTML file the worker serves
bench/          50 queries and the runner
scripts/        catalog snapshot and embedding export
```

## Develop

```
bun install
bun run snapshot          # needs the cargo-ai CLI on PATH
pip install model2vec && bun run embed
bun test
bun run bench
cd web && npm install && npm run build      # writes worker/src/page.ts
cd worker && npm install && npm run dev     # http://localhost:8787
```

Deploy the worker with `cargo-ai hosting deployment create --worker-uuid <uuid> --source worker` and promote it.

Not affiliated with Cargo. MIT licensed.
