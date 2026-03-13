# Changelog

All notable changes to this project will be documented in this file.

The format is inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-03-13

Initial release as `typesafe-route` (npm) / `@bastianplsfix/typesafe-route` (JSR).

### Added
- `route(pattern, options?)` — type-safe URL builder with compile-time param extraction.
- `matchRoute(pattern, url)` — URL matching via URLPattern with typed params.
- `tryMatchRoute(pattern, url)` — non-throwing variant of `matchRoute()`.
- `routePattern(pattern)` / `createRoute(pattern)` — bind a pattern for reuse.
- `configureRoute(config)` — one-time setup for base URL, env key, trailing slash, verbose logging.
- `resetRouteConfig()` — clear config and cached state.
- `getBaseURL()` — get the current resolved base URL.
- `getBaseInfo()` — get base URL + resolution source diagnostics.
- `getConfig()` — read current configuration (read-only copy).
- `isURLPatternSupported()` — runtime check for URLPattern availability.
- Explicit `{ path: {...} }` options for path params (top-level shorthand rejected).
- Per-call `base` override option in `route()`.
- Auto-detected verbose logging in development environments.
- Granular verbose config (`{ base, build, match }`).
- Environment-aware base URL resolution: Vite, Deno, Bun, Node, browser.
- Dual publishing: npm (via Vite+ / tsdown) and JSR (raw TypeScript).
