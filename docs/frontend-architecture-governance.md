# Frontend architecture governance

This document records the architecture rules that CI enforces for the
`nuono-next/frontend` repository. It describes the steady-state boundaries,
not the history of a particular refactor.

## Route and menu ownership

`src/features/route-catalog/` is the source of truth for workspace routes,
menu metadata, access matching, and workspace mounts.

- Business features may consume route paths, access policy, owned-tab helpers,
  and the `WorkspaceMountProps` interface from the route catalog.
- `app-shell` renders the catalog and owns shell runtime behavior. It must not
  duplicate route-to-menu or route-to-workspace dispatch tables.
- A workspace entry is complete only when its route definition, menu identity,
  access semantics, and mount are represented by the catalog contracts.
- Menu visibility and route reachability must derive from the same capability
  identity. A menu-only or route-only permission rule is invalid.

Run the focused semantic gate with:

```bash
pnpm route-catalog:check
```

## Feature dependency direction

Feature Modules may depend on stable shared Modules and on explicit interfaces
owned by another feature. They must not form runtime import cycles.

- A business feature must not import from `app-shell`; shell dependencies point
  toward business capabilities, never back from them.
- Cross-feature imports must use an intentional public Seam instead of reaching
  through a page component or convenience barrel.
- Type-only imports are not runtime edges.
- New cycle exceptions are not accepted. Remove or invert the dependency by
  extracting an interface, domain Module, or Adapter.

Run the dependency gate with:

```bash
pnpm dependencies:check
```

## Module size and locality

Every scanned source, style, contract, script, and E2E file has a 300-line
ceiling. `source-size-baseline.json` contains no grandfathered files.

- A file approaching the limit should be split by responsibility before it
  crosses the limit.
- Extract domain rules, transport Adapters, presentation models, components,
  fixtures, and test Drivers along real behavior boundaries.
- Do not split a cohesive Module into pass-through files only to satisfy the
  line count.
- Keep behavior and its focused contract local to the owning Module.

Run the policy and its self-tests with:

```bash
pnpm source-size:check
pnpm source-size:test
```

## Product baseline display

Product identity, image, title, SKU, site, and store presentation must flow
through the shared product baseline display Seam. Consumer pages must not
recreate these rules with direct `ProductImageThumb` imports.

Run the focused contract with:

```bash
pnpm product-baseline:display-contract
```

## Required verification

Pull requests to `master` or `develop` run the focused architecture gates,
all source contracts, type checking, release artifact contracts, and the
production build. Browser E2E remains an environment acceptance activity
because it requires services, accounts, roles, and controlled data.

Before merging architecture changes:

1. Run `pnpm source-size:test`, `pnpm source-size:check`,
   `pnpm route-catalog:check`, `pnpm dependencies:check`,
   `pnpm product-baseline:display-contract`, `pnpm contract:test`, and
   `pnpm typecheck`.
2. Let CI run the `/ai/` production build and release artifact checks.
3. In the test environment, verify representative menu roles and the primary
   workspace journeys affected by the change.
4. Record any skipped browser journey as an explicit follow-up; passing source
   contracts is not evidence that the deployed UI journey passed.
