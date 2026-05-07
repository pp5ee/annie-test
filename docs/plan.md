I'll examine the current implementation to understand the data fetching logic and create a plan to fix the offline mode issue.Now I understand the issue. The NBA CDN API has CORS restrictions and the free CORS proxies are unreliable (403 errors, connection failures). Let me create a plan to fix this.

## Goal
Fix the persistent offline mode issue by replacing unreliable CORS proxies with a working data fetch strategy that doesn't depend on free third-party proxies.

## Context
The current implementation tries to fetch NBA schedule data via:
1. Direct fetch from `cdn.nba.com` - blocked by CORS
2. Three free CORS proxies (allorigins.win, thingproxy.freeboard.io, corsproxy.io) - returning 403/forbidden errors

The app falls back to hardcoded mock data, which always shows the same outdated games. User sees "📴 Offline Mode" on every page load.

**Current files:**
- `app.js` - Lines 9-14 define CORS proxies, lines 76-99 handle fallback logic
- `index.html` - Main page structure
- `styles.css` - Includes `.offline-indicator` styling

## Acceptance Criteria

- **AC-1:** Replace free CORS proxies with a working data source strategy that successfully fetches live NBA data without 403 errors
  - File: `app.js` lines 9-14 (replace proxy list)
  - Verification: Page loads without "Offline Mode" banner; console shows successful fetch
  - Target: `https://data.nba.com/data/10s/v2015/json/mobile_teams/nba/2024/league/00_full_schedule.json` (CORS-friendly NBA endpoint)

- **AC-2:** Implement localStorage cache to persist successfully fetched data
  - File: `app.js` - Add cache read before any fetch attempt, cache write after successful fetch
  - Cache key: `knicks_games_cache`
  - Cache TTL: 1 hour (3600000 ms)
  - Verification: After successful load, refreshing page uses cached data immediately while fetching fresh data in background

- **AC-3:** Update offline indicator to distinguish between "cached data" (fresh cache) vs "mock data" (all APIs failed)
  - File: `app.js` lines 334-352 and `styles.css`
  - Show "📴 Cached" (yellow) when using localStorage cache
  - Show "📴 Offline Mode" (red) only when using mock fallback data
  - Verification: Visual indicator changes based on data source

- **AC-4:** Add cache timestamp display to offline indicator
  - Show "Last updated: X minutes ago" when using cached data
  - File: `app.js` in `renderGamesWithOfflineIndicator()` function
  - Verification: Timestamp visible in offline banner

## Implementation Notes

**Data Source Strategy:**
The NBA provides a CORS-friendly endpoint at `data.nba.com` that doesn't require proxies. Update `API_URL` to:
```javascript
const API_URL = 'https://data.nba.com/data/10s/v2015/json/mobile_teams/nba/2024/league/00_full_schedule.json';
```
This endpoint returns a different schema - games are in `lscd` array with `mscd` games list. Update `extractKnicksGames()` accordingly.

**Cache Implementation Pattern:**
```javascript
// Check cache first
const cached = localStorage.getItem('knicks_games_cache');
if (cached) {
    const { timestamp, games } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL) {
        // Use cache immediately, fetch in background
        renderGames(container, games);
        fetchFreshDataInBackground();
        return;
    }
}
```

**Schema Mapping:**
The new NBA endpoint uses different field names:
- `lscd[].mscd.g[]` instead of `leagueSchedule.gameDates[].games[]`
- `gid` instead of `gameId`
- `h.ta` (home team abbreviation) instead of `homeTeam.teamTricode`
- Map: `h.tid` → home team ID, `v.tid` → away team ID

**Verification Commands:**
```bash
# Test the new endpoint directly
curl -I "https://data.nba.com/data/10s/v2015/json/mobile_teams/nba/2024/league/00_full_schedule.json"

# Start local server and verify
python3 -m http.server 8000
# Open http://localhost:8000 and check console for successful fetch
```

## Out of Scope
- Server-side proxy implementation (staying static GitHub Pages compatible)
- Real-time websocket updates
- User-configurable data sources
- Historical season data beyond 2024-2025