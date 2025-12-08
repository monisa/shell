# Octa Multi-Tenant Shell

A reusable Angular host application that bootstraps Octa microfrontends with runtime branding, tenant configuration, and MFE orchestration. Branding, layout, and navigation are entirely data-driven via JSON so new clients can be onboarded without rebuilding the shell or MFEs.

## Highlights

- **Runtime branding** — load tenant-specific light/dark theme JSON, convert to CSS variables, and cascade into Shadow DOM for Angular Web Components.
- **Configurable shell layout** — header, sidebar, notifications, footer, and menus hydrate from `<tenant>.config.json` at runtime.
- **MFE orchestration** — declarative registry for Module Federation/Web Component endpoints, injected on demand with caching and developer overrides.
- **Caching & resilience** — theme JSON is cached in `localStorage` with versioning + TTL. Fallback themes/logos/icons apply if a fetch fails.
- **Developer-friendly** — query `?tenant=expocity` to hot-swap tenants, `/style-guide` preview of tokens, and automatic fallback assets for local MFE dev.

## Getting started

```bash
npm install
npm start
```

The shell serves on `http://localhost:4200`. Append `?tenant=khidmah` or `?tenant=expocity` to switch runtime branding. Tenant preference and theme mode are persisted in `localStorage`.

## Project structure

```
src/
├── app/
│   ├── core/              # models + services (config, theme, MFE loader)
│   ├── layout/            # header, sidebar, footer, notifications, toggle
│   ├── shared/            # MFE host, style guide, not-found components
│   └── features/          # dashboard placeholder + future routes
├── assets/
│   ├── config/            # <tenant>.config.json
│   ├── themes/            # <tenant>_<mode>.json + fallbacks
│   ├── icons/             # tenant branded SVG icons
│   └── logos/             # tenant logos/marks
```

## Runtime JSON contracts

### Theme JSON (`assets/themes/<tenant>_<mode>.json`)

```json
{
  "meta": { "tenant": "khidmah", "mode": "light", "version": "1.0.0" },
  "colors": { "primary": "#0F766E", "surface": "#FFFFFF" },
  "typography": { "font-family-base": "'Inter', sans-serif" },
  "spacing": { "md": "16px" },
  "radius": { "pill": "999px" },
  "layout": { "sidebar-width": "280px" },
  "components": { "header": { "background": "#fff" } },
  "icons": { "dashboard": { "type": "svg", "value": "assets/icons/khidmah/dashboard.svg" } },
  "logos": { "main": { "type": "svg", "value": "assets/logos/khidmah-logo.svg" } }
}
```

The `ThemeService` flattens every token into CSS variables (`--octa-colors-primary`, `--octa-icons-dashboard`, etc.) and applies them to `:root`, so any Web Component (even inside Shadow DOM) can call `var(--octa-colors-primary)`.

### Shell config (`assets/config/<tenant>.config.json`)

Key fields:

- `layout` — sidebar placement/width, footer copy, notification toggle.
- `defaultTheme` — URLs for light/dark/fallback JSON + cache version.
- `menu` — renders sidebar and maps to `mfeId` routes.
- `mfeRegistry` — metadata for each remote (tag name, remoteEntry, dev overrides).
- `notifications` — banner items shown above the layout.
- `developer` — fallback theme + dummy user shown in header.

## MFE development flow

1. Register the Web Component in `<tenant>.config.json` (`tagName`, optional `remoteEntry`).
2. Use `/mfe/<id>` route to mount it. The shell injects scripts once and provides tenant + theme context through CSS variables and `data-tenant` attributes.
3. For local dev, point `localDev.remoteEntry` to your `ng serve` output; toggle via query params without rebuilding the shell.

## Useful scripts

| Command        | Description                                |
| -------------- | ------------------------------------------ |
| `npm start`    | Serve the shell with live reload            |
| `npm run build`| Production build                            |
| `npm run test` | Execute unit tests (Vitest)                 |

## Next steps

- Wire ThemeService to remote CDN once endpoints are available.
- Expand Module Federation handling (lazy routes, manifests) as MFEs evolve.
- Hook notifications/user profile to real APIs.
