# AGENTS.md — typesafe-route

## Project summary

A zero-dependency, single-file TypeScript library for building and matching URLs using path patterns (e.g. `/api/bookmarks/:id`). Uses the URLPattern API for matching and resolves base URLs automatically from the runtime environment (Vite, Deno, Bun, Node, browser).

Published to npm as `typesafe-route` and to [JSR](https://jsr.io) as `@bastianplsfix/typesafe-route`. Built with Vite+ (tsdown for library bundling).

## File structure

```
typesafe-route/
├── src/
│   └── index.ts                 ← library source (~840 lines)
├── tests/
│   └── index.test.ts            ← Vitest test suite (100 tests)
├── package.json                 ← npm package config
├── deno.json                    ← JSR metadata & Deno publish config
├── tsconfig.json                ← TypeScript config
├── tsdown.config.ts             ← library bundler config (outputs dist/)
├── vite.config.ts               ← Vite+ config
├── CLAUDE.md                    ← Vite+ agent instructions
├── AGENTS.md                    ← this file
├── CHANGELOG.md                 ← release history
├── README.md                    ← human documentation
└── LICENSE
```

## Public API

| Export | Kind | Purpose |
| --- | --- | --- |
| `route(pattern, options?)` | function | Build a URL from a pattern + params |
| `matchRoute(pattern, url)` | function | Parse a URL against a pattern → extracted params |
| `tryMatchRoute(pattern, url)` | function | Non-throwing variant of `matchRoute()` |
| `routePattern(pattern)` | function | Bind a pattern into a reusable callable |
| `createRoute(pattern)` | function | Alias for `routePattern()` |
| `configureRoute(config)` | function | One-time setup for base URL, env key, trailing slash, verbose |
| `resetRouteConfig()` | function | Reset all config and cached state |
| `getBaseURL()` | function | Get the current resolved base URL |
| `getBaseInfo()` | function | Get base URL + its resolution source |
| `getConfig()` | function | Get current config (read-only copy) |
| `isURLPatternSupported()` | function | Check URLPattern availability |
| `ExtractParams<T>` | type | Template literal type that extracts `:param` names |
| `RouteOptions<K>` | type | Options union for `route()` |
| `RouteBuildExtras` | type | Extra options (search, hash, relative, base) |
| `MatchResult<K>` | type | Return type of `matchRoute()` |
| `BoundRoute<T>` | type | Return type of `routePattern()` |
| `RouteConfig` | interface | Config shape for `configureRoute()` |
| `BaseSource` | type | Source literals for resolved base |
| `BaseInfo` | type | Resolved base debug info |
| `ParamValue` | type | `string \| number` |
| `StripModifier` | type | Strips `?`, `*`, `+` suffixes from param names |

## Key technical decisions

- **No factory, no class** — plain functions for TanStack Query ergonomics
- **Type safety from string literals** — `ExtractParams<T>` uses recursive template literal types; variadic tuple `...[options]` makes the second arg conditionally required
- **Runtime guards** — post-replacement regex catches `:param` segments that survived (bypassed types)
- **Explicit path options** — `route()` requires `{ path: {...} }` for path params; top-level shorthand is rejected with a clear error
- **Environment detection** — `import.meta.env` → `Deno.env` → `Bun.env` → `process.env` → `globalThis.location.origin` → fallback, each in try/catch. Result is cached.
- **URLPattern only for matching** — `route()` uses string replacement + `new URL()`, works everywhere without polyfills
- **Cross-runtime compatibility** — uses `globalThis` instead of `window`, `deno-lint-ignore` for `process` access, `@ts-ignore` for runtime-specific globals

## Development

```sh
# Vite+ (npm)
vp test              # run test suite
vp pack              # build for npm (outputs dist/)
vp check             # format, lint, typecheck
npm run typecheck    # TypeScript only

# Deno / JSR
deno publish         # publish to JSR (requires auth)
deno publish --dry-run --allow-dirty  # validate JSR publish
```

## Dual publishing

- **npm**: `vp pack` builds `dist/index.mjs` + `dist/index.d.mts` via tsdown. Publish with `npm publish`.
- **JSR**: `deno publish` uses `src/index.ts` directly (raw TypeScript). Config in `deno.json`.
- Both `package.json` and `deno.json` must have matching versions.

## Conventions

- **ESM only** — no CommonJS
- **No runtime dependencies** — ever
- **Single file** — if the library grows beyond ~1000 lines, consider splitting
- **All types exported** — consumers should never need to re-derive types
- **JSDoc on all public exports** — JSR generates docs from these
- **Tests for every behavior** — if you add a feature, add a test
- **Imports in tests** — use `vite-plus/test` (not `vitest`)
- **Deno lint** — suppress `no-process-global` and `no-explicit-any` where cross-runtime code requires it; use `globalThis` instead of `window`

## Common tasks

### Add a new feature to route()

1. Read `src/index.ts`, specifically the Types section and the `route()` function
2. If it affects the type signature, update `ExtractParams`, `RouteOptions`, or the variadic tuple
3. Add tests in `tests/index.test.ts`
4. Update `README.md` with usage example

### Fix a bug

1. Write a failing test first in `tests/index.test.ts`
2. Fix in `src/index.ts`
3. Verify `vp test` and `npm run typecheck` pass

### Prepare a release

1. Update version in both `package.json` and `deno.json`
2. Update `CHANGELOG.md`
3. Run `vp test` and `npm run typecheck`
4. Run `vp pack` and `npm publish` (npm)
5. Run `deno publish` (JSR)
