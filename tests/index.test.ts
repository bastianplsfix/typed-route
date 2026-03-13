import { expect, test } from "vite-plus/test";
import {
  configureRoute,
  createRoute,
  getBaseInfo,
  getBaseURL,
  getConfig,
  isURLPatternSupported,
  matchRoute,
  resetRouteConfig,
  route,
  routePattern,
  tryMatchRoute,
} from "../src/index.ts";

function setup() {
  configureRoute({ base: "http://localhost:3000" });
}

// ---------------------------------------------------------------------------
// route() — building URLs
// ---------------------------------------------------------------------------

test("route: no params", () => {
  setup();
  expect(route("/api/bookmarks")).toBe("http://localhost:3000/api/bookmarks");
});

test("route: single path param (explicit path)", () => {
  setup();
  expect(
    route("/api/bookmarks/:id", { path: { id: "42" } }),
  ).toBe("http://localhost:3000/api/bookmarks/42");
});

test("route: multiple path params", () => {
  setup();
  expect(
    route("/api/:org/bookmarks/:id", { path: { org: "acme", id: "42" } }),
  ).toBe("http://localhost:3000/api/acme/bookmarks/42");
});

test("route: explicit path + search", () => {
  setup();
  const url = route("/api/bookmarks/:id", {
    path: { id: "42" },
    search: { fields: "title,url" },
  });
  expect(url).toBe("http://localhost:3000/api/bookmarks/42?fields=title%2Curl");
});

test("route: search-only (no path params in pattern)", () => {
  setup();
  const url = route("/api/bookmarks", {
    search: { page: "2", sort: "name" },
  });
  expect(url).toBe("http://localhost:3000/api/bookmarks?page=2&sort=name");
});

test("route: array search params", () => {
  setup();
  const url = route("/api/bookmarks", {
    search: { tag: ["a", "b", "c"] },
  });
  expect(url).toBe("http://localhost:3000/api/bookmarks?tag=a&tag=b&tag=c");
});

test("route: numeric path param", () => {
  setup();
  expect(
    route("/api/bookmarks/:id", { path: { id: 42 } }),
  ).toBe("http://localhost:3000/api/bookmarks/42");
});

test("route: encodes path params", () => {
  setup();
  expect(
    route("/api/search/:query", { path: { query: "hello world" } }),
  ).toBe("http://localhost:3000/api/search/hello%20world");
});

test("route: always encodes params (no pre-encoded pass-through)", () => {
  setup();
  expect(
    route("/api/search/:query", { path: { query: "hello%20world" } }),
  ).toBe("http://localhost:3000/api/search/hello%2520world");
});

test("route: throws on unreplaced params", () => {
  setup();
  const pattern = "/api/bookmarks/:id" as string;
  expect(
    () => (route as any)(pattern, {}),
  ).toThrow('Unreplaced params in "/api/bookmarks/:id": :id');
});

test("route: throws listing all unreplaced params", () => {
  setup();
  const pattern = "/api/:org/bookmarks/:id" as string;
  expect(() => (route as any)(pattern, {})).toThrow(":org, :id");
});

// ---------------------------------------------------------------------------
// Trailing slash
// ---------------------------------------------------------------------------

test("trailing slash: preserves by default", () => {
  setup();
  expect(
    route("/api/bookmarks/"),
  ).toBe("http://localhost:3000/api/bookmarks/");
  expect(
    route("/api/bookmarks"),
  ).toBe("http://localhost:3000/api/bookmarks");
});

test("trailing slash: strips when configured", () => {
  configureRoute({ base: "http://localhost:3000", trailingSlash: "strip" });
  expect(
    route("/api/bookmarks/"),
  ).toBe("http://localhost:3000/api/bookmarks");
});

// ---------------------------------------------------------------------------
// matchRoute()
// ---------------------------------------------------------------------------

test("matchRoute: extracts path params", () => {
  setup();
  const result = matchRoute(
    "/api/bookmarks/:id",
    "http://localhost:3000/api/bookmarks/42",
  );
  expect(result).toEqual({ path: { id: "42" }, search: {} });
});

test("matchRoute: extracts multiple path params", () => {
  setup();
  const result = matchRoute(
    "/api/:org/bookmarks/:id",
    "http://localhost:3000/api/acme/bookmarks/42",
  );
  expect(result).toEqual({ path: { org: "acme", id: "42" }, search: {} });
});

test("matchRoute: extracts search params", () => {
  setup();
  const result = matchRoute(
    "/api/bookmarks",
    "http://localhost:3000/api/bookmarks?page=2&sort=name",
  );
  expect(result).toEqual({ path: {}, search: { page: "2", sort: "name" } });
});

test("matchRoute: preserves array search params", () => {
  setup();
  const result = matchRoute(
    "/api/bookmarks",
    "http://localhost:3000/api/bookmarks?tag=a&tag=b",
  );
  expect(result).toEqual({ path: {}, search: { tag: ["a", "b"] } });
});

test("matchRoute: single search param stays as string", () => {
  setup();
  const result = matchRoute(
    "/api/bookmarks",
    "http://localhost:3000/api/bookmarks?tag=a",
  );
  expect(result).toEqual({ path: {}, search: { tag: "a" } });
});

test("matchRoute: returns null on mismatch", () => {
  setup();
  const result = matchRoute(
    "/api/bookmarks/:id",
    "http://localhost:3000/api/users/42",
  );
  expect(result).toBeNull();
});

test("matchRoute: supports relative URLs", () => {
  setup();
  const result = matchRoute(
    "/api/bookmarks/:id",
    "/api/bookmarks/42",
  );
  expect(result).toEqual({ path: { id: "42" }, search: {} });
});

test("matchRoute: supports relative URLs with search params", () => {
  setup();
  const result = matchRoute(
    "/api/bookmarks/:id",
    "/api/bookmarks/42?fields=title",
  );
  expect(result).toEqual({ path: { id: "42" }, search: { fields: "title" } });
});

test("matchRoute: extracts both path and search", () => {
  setup();
  const result = matchRoute(
    "/api/bookmarks/:id",
    "http://localhost:3000/api/bookmarks/42?fields=title",
  );
  expect(result).toEqual({ path: { id: "42" }, search: { fields: "title" } });
});

// ---------------------------------------------------------------------------
// routePattern()
// ---------------------------------------------------------------------------

test("routePattern: exposes .pattern", () => {
  setup();
  const bookmarks = routePattern("/api/bookmarks/:id");
  expect(bookmarks.pattern).toBe("/api/bookmarks/:id");
});

test("routePattern: builds URLs when called", () => {
  setup();
  const bookmarks = routePattern("/api/bookmarks/:id");
  expect(
    bookmarks({ path: { id: "42" } }),
  ).toBe("http://localhost:3000/api/bookmarks/42");
});

test("routePattern: builds with search params", () => {
  setup();
  const bookmarks = routePattern("/api/bookmarks");
  expect(
    bookmarks({ search: { page: "1" } }),
  ).toBe("http://localhost:3000/api/bookmarks?page=1");
});

test("routePattern: no-param pattern callable without args", () => {
  setup();
  const health = routePattern("/api/health");
  expect(health()).toBe("http://localhost:3000/api/health");
});

test("routePattern: .match() delegates to matchRoute", () => {
  setup();
  const bookmarks = routePattern("/api/bookmarks/:id");
  const result = bookmarks.match("http://localhost:3000/api/bookmarks/42");
  expect(result).toEqual({ path: { id: "42" }, search: {} });
});

test("routePattern: .match() returns null on mismatch", () => {
  setup();
  const bookmarks = routePattern("/api/bookmarks/:id");
  expect(
    bookmarks.match("http://localhost:3000/api/users/42"),
  ).toBeNull();
});

test("routePattern: pattern is read-only", () => {
  setup();
  const bookmarks = routePattern("/api/bookmarks/:id");
  expect(() => {
    (bookmarks as any).pattern = "/something/else";
  }).toThrow();
});

// ---------------------------------------------------------------------------
// Round-trip: route() → matchRoute()
// ---------------------------------------------------------------------------

test("round-trip: path params survive build → match", () => {
  setup();
  const url = route("/api/:org/bookmarks/:id", {
    path: { org: "acme", id: "42" },
  });
  const result = matchRoute("/api/:org/bookmarks/:id", url);
  expect(result?.path).toEqual({ org: "acme", id: "42" });
});

test("round-trip: search params survive build → match", () => {
  setup();
  const url = route("/api/bookmarks", {
    search: { tag: ["a", "b"], sort: "name" },
  });
  const result = matchRoute("/api/bookmarks", url);
  expect(result?.search).toEqual({ tag: ["a", "b"], sort: "name" });
});

test("round-trip: encoded path params round-trip correctly", () => {
  setup();
  const url = route("/api/search/:query", { path: { query: "hello world" } });
  const result = matchRoute("/api/search/:query", url);
  expect(result?.path).toEqual({ query: "hello world" });
});

// ---------------------------------------------------------------------------
// configureRoute()
// ---------------------------------------------------------------------------

test("configureRoute: custom base", () => {
  configureRoute({ base: "https://api.example.com" });
  expect(route("/bookmarks")).toBe("https://api.example.com/bookmarks");
});

test("configureRoute: custom fallback", () => {
  configureRoute({ fallback: "http://localhost:8080" });
  expect(route("/bookmarks")).toBe("http://localhost:8080/bookmarks");
});

test("configureRoute: strips trailing slash from base", () => {
  configureRoute({ base: "https://api.example.com/" });
  expect(route("/bookmarks")).toBe("https://api.example.com/bookmarks");
});

test("resetRouteConfig: clears configured base", () => {
  configureRoute({ base: "https://api.example.com" });
  expect(route("/bookmarks")).toBe("https://api.example.com/bookmarks");

  resetRouteConfig();
  expect(route("/bookmarks")).toBe("http://localhost:3000/bookmarks");
});

test("resetRouteConfig: clears cached source info", () => {
  configureRoute({ base: "https://api.example.com" });
  expect(getBaseInfo().source).toBe("config.base");

  resetRouteConfig();
  expect(getBaseInfo().source).toBe("fallback");
});

// ---------------------------------------------------------------------------
// hash
// ---------------------------------------------------------------------------

test("hash: appends fragment to URL", () => {
  setup();
  expect(
    route("/docs", { hash: "installation" }),
  ).toBe("http://localhost:3000/docs#installation");
});

test("hash: with path params", () => {
  setup();
  expect(
    route("/docs/:section", {
      path: { section: "api" },
      hash: "route",
    }),
  ).toBe("http://localhost:3000/docs/api#route");
});

test("hash: with search and path params", () => {
  setup();
  expect(
    route("/docs/:section", {
      path: { section: "api" },
      search: { v: "2" },
      hash: "route",
    }),
  ).toBe("http://localhost:3000/docs/api?v=2#route");
});

// ---------------------------------------------------------------------------
// relative
// ---------------------------------------------------------------------------

test("relative: returns pathname only", () => {
  setup();
  expect(
    route("/api/bookmarks/:id", {
      path: { id: "42" },
      relative: true,
    }),
  ).toBe("/api/bookmarks/42");
});

test("relative: includes search params", () => {
  setup();
  expect(
    route("/api/bookmarks", {
      search: { page: "1" },
      relative: true,
    }),
  ).toBe("/api/bookmarks?page=1");
});

test("relative: includes hash", () => {
  setup();
  expect(
    route("/docs/:section", {
      path: { section: "api" },
      hash: "top",
      relative: true,
    }),
  ).toBe("/docs/api#top");
});

test("relative: includes search and hash", () => {
  setup();
  expect(
    route("/docs", {
      search: { v: "2" },
      hash: "install",
      relative: true,
    }),
  ).toBe("/docs?v=2#install");
});

test("relative: no params pattern", () => {
  setup();
  expect(
    route("/api/health", { relative: true }),
  ).toBe("/api/health");
});

// ---------------------------------------------------------------------------
// per-call base
// ---------------------------------------------------------------------------

test("base: overrides global config", () => {
  setup();
  expect(
    route("/api/users/:id", {
      path: { id: "42" },
      base: "https://users.internal",
    }),
  ).toBe("https://users.internal/api/users/42");
});

test("base: strips trailing slash", () => {
  setup();
  expect(
    route("/api/users", { base: "https://users.internal/" }),
  ).toBe("https://users.internal/api/users");
});

test("base: no params pattern", () => {
  setup();
  expect(
    route("/health", { base: "https://other.service" }),
  ).toBe("https://other.service/health");
});

test("base: combined with search and hash", () => {
  setup();
  expect(
    route("/api/bookmarks/:id", {
      path: { id: "42" },
      search: { fields: "title" },
      hash: "details",
      base: "https://api.prod.com",
    }),
  ).toBe("https://api.prod.com/api/bookmarks/42?fields=title#details");
});

// ---------------------------------------------------------------------------
// Optional params (:param?)
// ---------------------------------------------------------------------------

test("optional param: omitted", () => {
  setup();
  expect(
    route("/api/bookmarks/:id?", {}),
  ).toBe("http://localhost:3000/api/bookmarks");
});

test("optional param: provided", () => {
  setup();
  expect(
    route("/api/bookmarks/:id?", { path: { id: "42" } }),
  ).toBe("http://localhost:3000/api/bookmarks/42");
});

test("optional param: no args when all optional", () => {
  setup();
  expect(
    route("/api/bookmarks/:id?"),
  ).toBe("http://localhost:3000/api/bookmarks");
});

test("optional param: mixed required and optional", () => {
  setup();
  expect(
    route("/api/:org/bookmarks/:id?", { path: { org: "acme" } }),
  ).toBe("http://localhost:3000/api/acme/bookmarks");
});

test("optional param: mixed required and optional, both provided", () => {
  setup();
  expect(
    route("/api/:org/bookmarks/:id?", { path: { org: "acme", id: "42" } }),
  ).toBe("http://localhost:3000/api/acme/bookmarks/42");
});

test("optional param: with search params", () => {
  setup();
  expect(
    route("/api/bookmarks/:id?", {
      path: { id: "42" },
      search: { fields: "title" },
    }),
  ).toBe("http://localhost:3000/api/bookmarks/42?fields=title");
});

test("optional param: omitted with search params", () => {
  setup();
  expect(
    route("/api/bookmarks/:id?", {
      search: { page: "1" },
    }),
  ).toBe("http://localhost:3000/api/bookmarks?page=1");
});

// ---------------------------------------------------------------------------
// Wildcard params (:param* and :param+)
// ---------------------------------------------------------------------------

test("wildcard *: with value", () => {
  setup();
  expect(
    route("/files/:path*", { path: { path: "docs/readme.md" } }),
  ).toBe("http://localhost:3000/files/docs/readme.md");
});

test("wildcard *: omitted (zero-or-more)", () => {
  setup();
  expect(
    route("/files/:path*"),
  ).toBe("http://localhost:3000/files/");
});

test("wildcard *: single segment", () => {
  setup();
  expect(
    route("/files/:path*", { path: { path: "readme.md" } }),
  ).toBe("http://localhost:3000/files/readme.md");
});

test("wildcard +: with value", () => {
  setup();
  expect(
    route("/files/:path+", { path: { path: "docs/readme.md" } }),
  ).toBe("http://localhost:3000/files/docs/readme.md");
});

test("wildcard: encodes segments individually", () => {
  setup();
  expect(
    route("/files/:path*", { path: { path: "my docs/hello world.md" } }),
  ).toBe("http://localhost:3000/files/my%20docs/hello%20world.md");
});

// ---------------------------------------------------------------------------
// matchRoute with optional/wildcard params
// ---------------------------------------------------------------------------

test("matchRoute: optional param present", () => {
  setup();
  const result = matchRoute(
    "/api/bookmarks/:id?",
    "http://localhost:3000/api/bookmarks/42",
  );
  expect(result?.path.id).toBe("42");
});

test("matchRoute: wildcard param", () => {
  setup();
  const result = matchRoute(
    "/files/:path*",
    "http://localhost:3000/files/docs/readme.md",
  );
  expect(result?.path.path).toBe("docs/readme.md");
});

// ---------------------------------------------------------------------------
// Round-trip: optional/wildcard
// ---------------------------------------------------------------------------

test("round-trip: optional param provided", () => {
  setup();
  const url = route("/api/bookmarks/:id?", { path: { id: "42" } });
  const result = matchRoute("/api/bookmarks/:id?", url);
  expect(result?.path.id).toBe("42");
});

test("round-trip: wildcard param", () => {
  setup();
  const url = route("/files/:path*", { path: { path: "docs/readme.md" } });
  const result = matchRoute("/files/:path*", url);
  expect(result?.path.path).toBe("docs/readme.md");
});

// ---------------------------------------------------------------------------
// Edge cases: encoding always applied
// ---------------------------------------------------------------------------

test("encoding: percent signs are always encoded", () => {
  setup();
  expect(
    route("/api/search/:query", { path: { query: "100%natural" } }),
  ).toBe("http://localhost:3000/api/search/100%25natural");
});

test("encoding: spaces are always encoded", () => {
  setup();
  expect(
    route("/api/search/:query", { path: { query: "hello world" } }),
  ).toBe("http://localhost:3000/api/search/hello%20world");
});

test("encoding: literal %20 round-trips correctly", () => {
  setup();
  const url = route("/api/search/:query", { path: { query: "%20" } });
  expect(url).toBe("http://localhost:3000/api/search/%2520");
  const result = matchRoute("/api/search/:query", url);
  expect(result?.path).toEqual({ query: "%20" });
});

// ---------------------------------------------------------------------------
// Edge cases: trailing slash with hash (no query)
// ---------------------------------------------------------------------------

test("trailing slash: strip mode with hash and no query", () => {
  configureRoute({ base: "http://localhost:3000", trailingSlash: "strip" });
  expect(
    route("/docs/", { hash: "section" }),
  ).toBe("http://localhost:3000/docs#section");
});

test("trailing slash: strip mode with hash and query", () => {
  configureRoute({ base: "http://localhost:3000", trailingSlash: "strip" });
  expect(
    route("/docs/", { search: { v: "2" }, hash: "section" }),
  ).toBe("http://localhost:3000/docs?v=2#section");
});

// ---------------------------------------------------------------------------
// Edge cases: top-level params are rejected
// ---------------------------------------------------------------------------

test("options: throws when using top-level path params", () => {
  setup();
  expect(
    () => (route as any)("/api/:id", { id: "42" }),
  ).toThrow("Invalid route options");
});

test("options: throws when using multiple top-level params", () => {
  setup();
  expect(
    () => (route as any)("/api/:org/:id", { org: "acme", id: "42" }),
  ).toThrow("Invalid route options");
});

test("options: reserved-name params work via explicit path", () => {
  setup();
  expect(
    route(
      "/api/:search/:relative",
      { path: { search: "users", relative: "yes" } } as any,
    ),
  ).toBe("http://localhost:3000/api/users/yes");
});

// ---------------------------------------------------------------------------
// Edge cases: pattern validation
// ---------------------------------------------------------------------------

test("route: throws on pattern without leading slash", () => {
  setup();
  expect(
    () => (route as any)("api/bookmarks"),
  ).toThrow('Pattern must start with "/"');
});

test("matchRoute: throws on pattern without leading slash", () => {
  setup();
  expect(
    () =>
      matchRoute("api/bookmarks" as any, "http://localhost:3000/api/bookmarks"),
  ).toThrow('Pattern must start with "/"');
});

// ---------------------------------------------------------------------------
// Edge cases: strip() with multiple trailing slashes
// ---------------------------------------------------------------------------

test("configureRoute: strips multiple trailing slashes from base", () => {
  configureRoute({ base: "https://api.example.com///" });
  expect(route("/bookmarks")).toBe("https://api.example.com/bookmarks");
});

// ---------------------------------------------------------------------------
// Edge cases: matchRoute decodes path params
// ---------------------------------------------------------------------------

test("matchRoute: decodes percent-encoded path params", () => {
  setup();
  const result = matchRoute(
    "/api/search/:query",
    "http://localhost:3000/api/search/hello%20world",
  );
  expect(result?.path).toEqual({ query: "hello world" });
});

test("matchRoute: decodes special characters in path params", () => {
  setup();
  const result = matchRoute(
    "/api/files/:name",
    "http://localhost:3000/api/files/my%20file%26data.txt",
  );
  expect(result?.path).toEqual({ name: "my file&data.txt" });
});

// ---------------------------------------------------------------------------
// routePattern: optional params and eager validation
// ---------------------------------------------------------------------------

test("routePattern: optional-only pattern callable without args", () => {
  setup();
  const optRoute = routePattern("/api/bookmarks/:id?");
  expect(optRoute()).toBe("http://localhost:3000/api/bookmarks");
});

test("routePattern: optional-only pattern callable with args", () => {
  setup();
  const optRoute = routePattern("/api/bookmarks/:id?");
  expect(
    optRoute({ path: { id: "42" } }),
  ).toBe("http://localhost:3000/api/bookmarks/42");
});

test("routePattern: wildcard+ pattern callable with args", () => {
  setup();
  const files = routePattern("/files/:p+");
  expect(
    files({ path: { p: "docs/readme.md" } }),
  ).toBe("http://localhost:3000/files/docs/readme.md");
});

test("unreplaced check: catches single-char wildcard+ param", () => {
  setup();
  const pattern = "/files/:a+" as string;
  expect(
    () => (route as any)(pattern, {}),
  ).toThrow(":a+");
});

test("routePattern: throws eagerly on pattern without leading slash", () => {
  setup();
  expect(
    () => routePattern("api/bookmarks" as any),
  ).toThrow('Pattern must start with "/"');
});

// ---------------------------------------------------------------------------
// Bug fix: reserved-name params work via explicit path
// ---------------------------------------------------------------------------

test("options: reserved-name params 'hash' and 'base' work via explicit path", () => {
  setup();
  expect(
    route("/api/:hash/:base", { path: { hash: "abc", base: "main" } } as any),
  ).toBe("http://localhost:3000/api/abc/main");
});

test("options: hash+base top-level keys are treated as explicit extras", () => {
  setup();
  expect(
    route("/api/bookmarks", { hash: "section", base: "http://other.com" }),
  ).toBe("http://other.com/api/bookmarks#section");
});

// ---------------------------------------------------------------------------
// Bug fix: duplicate required param replaced globally
// ---------------------------------------------------------------------------

test("replaceParams: duplicate param name replaced in all positions", () => {
  setup();
  expect(
    (route as any)("/api/:id/copy/:id", { path: { id: "42" } }),
  ).toBe("http://localhost:3000/api/42/copy/42");
});

// ---------------------------------------------------------------------------
// Bug fix: matchRoute handles malformed percent sequences without crashing
// ---------------------------------------------------------------------------

test("matchRoute: handles malformed percent sequence without throwing", () => {
  setup();
  const result = matchRoute(
    "/api/:id",
    "http://localhost:3000/api/%ZZ",
  );
  expect(result?.path).toEqual({ id: "%ZZ" });
});

// ---------------------------------------------------------------------------
// URLPattern availability
// ---------------------------------------------------------------------------

test("isURLPatternSupported: reflects URLPattern availability", () => {
  const original = (globalThis as any).URLPattern;
  try {
    (globalThis as any).URLPattern = undefined;
    expect(isURLPatternSupported()).toBe(false);
  } finally {
    (globalThis as any).URLPattern = original;
  }
  expect(isURLPatternSupported()).toBe(
    typeof (globalThis as any).URLPattern !== "undefined",
  );
});

test("matchRoute: throws clear error when URLPattern is unavailable", () => {
  setup();
  const original = (globalThis as any).URLPattern;
  try {
    (globalThis as any).URLPattern = undefined;
    expect(
      () => matchRoute("/api/:id", "http://localhost:3000/api/42"),
    ).toThrow("URLPattern is not available");
  } finally {
    (globalThis as any).URLPattern = original;
  }
});

test("tryMatchRoute: returns null when URLPattern is unavailable", () => {
  setup();
  const original = (globalThis as any).URLPattern;
  try {
    (globalThis as any).URLPattern = undefined;
    expect(tryMatchRoute("/api/:id", "http://localhost:3000/api/42"))
      .toBeNull();
  } finally {
    (globalThis as any).URLPattern = original;
  }
});

test("tryMatchRoute: returns match result when URLPattern is available", () => {
  setup();
  const result = tryMatchRoute("/api/:id", "http://localhost:3000/api/42?x=1");
  expect(result).toEqual({ path: { id: "42" }, search: { x: "1" } });
});

// ---------------------------------------------------------------------------
// matchRoute: advanced URLPattern regex syntax
// ---------------------------------------------------------------------------

test("matchRoute: regex constraint matches valid input", () => {
  setup();
  const result = matchRoute(
    "/api/:id(\\d+)" as any,
    "http://localhost:3000/api/123",
  );
  expect(result?.path).toEqual({ id: "123" });
});

test("matchRoute: regex constraint rejects invalid input", () => {
  setup();
  const result = matchRoute(
    "/api/:id(\\d+)" as any,
    "http://localhost:3000/api/abc",
  );
  expect(result).toBeNull();
});

test("matchRoute: enum pattern", () => {
  setup();
  const result = matchRoute(
    "/blog/:lang(en|no|de)/:slug" as any,
    "http://localhost:3000/blog/en/hello-world",
  );
  expect(result?.path).toEqual({ lang: "en", slug: "hello-world" });
});

// ---------------------------------------------------------------------------
// createRoute (alias for routePattern)
// ---------------------------------------------------------------------------

test("createRoute: works as alias for routePattern", () => {
  setup();
  const users = createRoute("/api/users/:id");
  expect(users.pattern).toBe("/api/users/:id");
  expect(users({ path: { id: "42" } })).toBe(
    "http://localhost:3000/api/users/42",
  );
  expect(
    users.match("http://localhost:3000/api/users/42")?.path,
  ).toEqual({ id: "42" });
});

// ---------------------------------------------------------------------------
// getBaseURL / getConfig / getBaseInfo
// ---------------------------------------------------------------------------

test("getBaseURL: returns resolved base", () => {
  configureRoute({ base: "https://api.example.com" });
  expect(getBaseURL()).toBe("https://api.example.com");
});

test("getConfig: returns config copy", () => {
  configureRoute({ base: "https://api.example.com", trailingSlash: "strip" });
  const config = getConfig();
  expect(config.base).toBe("https://api.example.com");
  expect(config.trailingSlash).toBe("strip");
});

test("getBaseInfo: returns resolved base and source", () => {
  configureRoute({ base: "https://api.example.com" });
  expect(getBaseInfo()).toEqual({
    base: "https://api.example.com",
    source: "config.base",
  });
});

test("getBaseInfo: reports fallback source", () => {
  configureRoute({});
  const info = getBaseInfo();
  expect(info.base).toBe("http://localhost:3000");
  expect(info.source).toBe("fallback");
});

// ---------------------------------------------------------------------------
// route: rejects regex patterns (matchRoute does not)
// ---------------------------------------------------------------------------

test("route: throws on regex pattern syntax", () => {
  setup();
  expect(
    () => (route as any)("/api/:id(\\d+)", { path: { id: "123" } }),
  ).toThrow("regex syntax");
});
