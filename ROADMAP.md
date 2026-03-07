# Roadmap

## Planned

### Optional and wildcard params

URLPattern supports `:id?` (optional), `:path*` (zero-or-more), and `:path+` (one-or-more), but `ExtractParams` and the replacement logic don't handle these yet.

**What it would look like:**

```ts
// Optional param
route("/api/bookmarks/:id?", {});                    // → "/api/bookmarks"
route("/api/bookmarks/:id?", { id: "42" });           // → "/api/bookmarks/42"

// Wildcard
route("/files/:path*", { path: "docs/readme.md" });   // → "/files/docs/readme.md"
```

**What needs to change:**

1. `ExtractParams` must strip modifier suffixes (`?`, `*`, `+`):

```ts
type StripModifier<T extends string> =
  T extends `${infer Name}${"?" | "*" | "+"}` ? Name : T;
```

2. Optional params (`?`) must become optional keys in the type:

```ts
type RequiredParams<T> = /* params without ? */;
type OptionalParams<T> = /* params with ? */;
// → Record<Required, ParamValue> & Partial<Record<Optional, ParamValue>>
```

3. The replacement loop in `route()` must handle missing optional params (remove the `:param?` segment) and wildcard params (no `encodeURIComponent` on `/` separators).

**Complexity:** Medium — ~30 lines of implementation, meaningful type-level changes.

**When:** When there's real demand. The current API covers the vast majority of API route patterns.
