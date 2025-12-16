# Theme Caching Documentation

This document describes how theme JSON files are cached in localStorage for faster loading.

## Overview

The Octa Shell implements a **stale-while-revalidate** caching strategy for theme files:

1. **Fast initial load** - Cached themes are applied immediately
2. **Background updates** - Stale caches trigger silent background refresh
3. **Multi-theme support** - Both light AND dark themes are cached simultaneously
4. **Automatic cleanup** - Old cache entries are purged periodically

---

## Cache Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| **TTL (Time-to-Live)** | 6 hours | After this, cache is "stale" but still usable |
| **Max Age** | 24 hours | Hard expiry - cache is completely invalidated |
| **Cleanup Interval** | 1 hour | How often old entries are removed |
| **Storage Key** | `octa.shell.themeCache` | localStorage key |

---

## Cache Storage Structure

```typescript
interface ThemeCacheStorage {
  entries: {
    [themeUrl: string]: {
      themeUrl: string;      // URL of the theme file
      themeData: ThemeDefinition;  // Full theme JSON
      version: string;       // Config version (e.g., "2025.01.0")
      timestamp: number;     // Unix timestamp when cached
    }
  };
  lastCleanup: number;       // Last cleanup timestamp
}
```

### Example localStorage Entry

```json
{
  "entries": {
    "assets/themes/khidmah_light.json": {
      "themeUrl": "assets/themes/khidmah_light.json",
      "version": "2025.01.0",
      "timestamp": 1702656000000,
      "themeData": { /* full theme JSON */ }
    },
    "assets/themes/khidmah_dark.json": {
      "themeUrl": "assets/themes/khidmah_dark.json",
      "version": "2025.01.0",
      "timestamp": 1702656120000,
      "themeData": { /* full theme JSON */ }
    }
  },
  "lastCleanup": 1702656000000
}
```

---

## Cache Status Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Theme Load Request                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Check Cache Status                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        │             │             │             │
        ▼             ▼             ▼             ▼
    ┌───────┐   ┌─────────┐   ┌─────────┐   ┌───────────────┐
    │  HIT  │   │  STALE  │   │  MISS   │   │VERSION_MISMATCH│
    │(<6hrs)│   │(6-24hrs)│   │(no cache│   │(config changed)│
    └───┬───┘   └────┬────┘   └────┬────┘   └───────┬───────┘
        │            │             │                │
        ▼            ▼             ▼                ▼
    ┌───────┐   ┌─────────────┐   ┌────────────────────────────┐
    │ Apply │   │Apply cached │   │     Fetch from network     │
    │ cache │   │+ background │   │    Apply + Write cache     │
    │       │   │   refresh   │   │                            │
    └───────┘   └─────────────┘   └────────────────────────────┘
```

---

## Cache Statuses Explained

### `hit` - Fresh Cache
- **Age**: Less than 6 hours
- **Action**: Apply cached theme immediately
- **Network**: None

### `stale` - Stale but Usable
- **Age**: Between 6 and 24 hours
- **Action**: Apply cached theme immediately, then fetch fresh theme in background
- **Network**: Background request (non-blocking)
- **User Experience**: Instant load, theme may update silently if changed

### `miss` - No Cache
- **Age**: N/A or > 24 hours
- **Action**: Fetch from network, wait for response
- **Network**: Blocking request
- **User Experience**: Slight delay on first load

### `version_mismatch` - Config Updated
- **Condition**: `cacheVersion` in config.json doesn't match cached version
- **Action**: Fetch fresh theme (cached entry may still be used as fallback)
- **Network**: Blocking request

---

## Cache Invalidation

### Automatic Invalidation

Cache is automatically invalidated when:

1. **TTL Expired (6 hours)** - Triggers background refresh
2. **Max Age Exceeded (24 hours)** - Entry is removed
3. **Version Mismatch** - Config's `cacheVersion` changed
4. **Periodic Cleanup** - Removes entries older than 24 hours

### Manual Invalidation

```typescript
// Inject ThemeService
private themeService = inject(ThemeService);

// Clear all cached themes
this.themeService.clearCache();

// Clear specific theme
this.themeService.clearCacheForTheme('assets/themes/khidmah_light.json');

// Force refresh (bypasses cache)
this.themeService.refresh(themeConfig, true); // forceNetwork = true
```

### Via Config Version

Update `cacheVersion` in your config file to invalidate caches for all users:

```json
{
  "defaultTheme": {
    "cacheVersion": "2025.01.1",  // ← Bump this to invalidate
    "lightThemeUrl": "assets/themes/tenant_light.json",
    "darkThemeUrl": "assets/themes/tenant_dark.json"
  }
}
```

---

## Debugging Cache

### Browser DevTools

1. Open DevTools → Application → Local Storage
2. Look for `octa.shell.themeCache`
3. Expand to see cached entries with timestamps

### Console Commands

```javascript
// Get cache stats
const stats = window.__OCTA_THEME_SERVICE__?.getCacheStats();
console.log(stats);

// Output:
// {
//   totalEntries: 2,
//   entries: [
//     { url: "assets/themes/khidmah_light.json", age: "2h 15m", version: "2025.01.0" },
//     { url: "assets/themes/khidmah_dark.json", age: "1h 30m", version: "2025.01.0" }
//   ]
// }
```

### Clear Cache Manually

```javascript
localStorage.removeItem('octa.shell.themeCache');
location.reload();
```

---

## Benefits

| Feature | Benefit |
|---------|---------|
| **Multi-theme caching** | Instant light/dark toggle (both cached) |
| **Stale-while-revalidate** | Fast loads + fresh data |
| **Version-based invalidation** | Deploy updates without user action |
| **Automatic cleanup** | No localStorage bloat |
| **Background refresh** | Non-blocking updates |

---

## Sequence Diagrams

### First Visit (Cache Miss)

```
User              ThemeService           Network            localStorage
 │                     │                    │                    │
 │──Load Theme────────▶│                    │                    │
 │                     │──Check Cache──────▶│                    │
 │                     │◀──MISS────────────┤│                    │
 │                     │──GET theme.json───▶│                    │
 │                     │◀──200 OK──────────┤│                    │
 │◀──Apply Theme──────┤│                    │                    │
 │                     │──Write Cache──────────────────────────▶│
 │                     │                    │                    │
```

### Return Visit (Cache Hit)

```
User              ThemeService           Network            localStorage
 │                     │                    │                    │
 │──Load Theme────────▶│                    │                    │
 │                     │──Check Cache──────────────────────────▶│
 │                     │◀──HIT (fresh)─────────────────────────┤│
 │◀──Apply Theme──────┤│                    │                    │
 │                     │                    │                    │
 │  (No network!)      │                    │                    │
```

### Stale Cache (Background Refresh)

```
User              ThemeService           Network            localStorage
 │                     │                    │                    │
 │──Load Theme────────▶│                    │                    │
 │                     │──Check Cache──────────────────────────▶│
 │                     │◀──STALE───────────────────────────────┤│
 │◀──Apply Cached─────┤│                    │                    │
 │                     │                    │                    │
 │  (User sees UI!)    │──Background GET───▶│                    │
 │                     │◀──200 OK──────────┤│                    │
 │                     │──Update Cache─────────────────────────▶│
 │◀──Silent Update────┤│ (only if version changed)              │
```

---

## Testing Cache Behavior

### Test 1: Fresh Load
1. Clear localStorage
2. Load app
3. Verify theme loads (check Network tab)
4. Check localStorage has cache entry

### Test 2: Cache Hit
1. Load app (with existing cache < 6 hours)
2. Verify NO network request for theme
3. Theme applies instantly

### Test 3: Stale Cache + Background Refresh
1. Modify cache timestamp in localStorage to 7 hours ago
2. Load app
3. Verify cached theme applies instantly
4. Verify background network request occurs
5. Cache timestamp should update

### Test 4: Version Invalidation
1. Load app (cache exists)
2. Change `cacheVersion` in config.json
3. Reload app
4. Verify fresh theme is fetched
5. Cache version should match new version

### Test 5: Light/Dark Toggle
1. Load app with light theme
2. Toggle to dark theme
3. Verify dark theme is cached
4. Toggle back to light
5. Verify light theme loads from cache (no network)

---

## Summary

| Scenario | Cache Status | Behavior |
|----------|--------------|----------|
| First visit | MISS | Fetch → Apply → Cache |
| Return < 6h | HIT | Apply from cache |
| Return 6-24h | STALE | Apply cache → Background refresh |
| Return > 24h | MISS | Fetch → Apply → Cache |
| Version changed | VERSION_MISMATCH | Fetch → Apply → Cache |
| `forceNetwork=true` | N/A | Bypass cache, fetch fresh |

