I'll examine the current code to understand the error and create a plan to fix the NBA API connectivity issue.## Goal
Fix the NBA API connection error by ensuring mock data fallback activates when all fetch methods fail, instead of displaying an error screen.

## Context
The Knicks Scores app attempts to fetch data from `cdn.nba.com` which returns `ERR_CONNECTION_CLOSED` due to CORS/network restrictions. The app has CORS proxy fallbacks and mock data, but the fallback logic is broken—when all fetch methods fail, it throws an error that triggers an error screen instead of using mock data.

**Current broken flow:**
1. Direct fetch to NBA CDN → fails  
2. CORS proxies tried sequentially → all fail  
3. `fetchGamesWithFallback()` throws error  
4. `init()` catches error → shows error screen with retry button  
5. Mock data (`getMockKnicksGames()`) is never used

## Acceptance Criteria
- **AC-1:** When NBA API and all CORS proxies fail, app automatically displays mock data instead of error screen
- **AC-2:** Mock data displays within the 3-second total load time budget  
- **AC-3:** Console logs indicate which fallback level was used (proxy vs mock)  
- **AC-4:** Retry button still available to attempt fresh API fetch  
- **AC-5:** Verify fix by checking that page loads games without `net::ERR_CONNECTION_CLOSED` error visible to users

## Implementation Notes
**Primary fix location:** `app.js` lines 35-59 in `init()` function

**Required changes:**
1. Modify error handling in `init()` to call `getMockKnicksGames()` when `fetchGamesWithFallback()` fails
2. Ensure mock data path is treated as success case (renders games) not error case
3. Consider adding a visual indicator (subtle badge/text) showing "offline mode" when mock data is used
4. Keep retry button functional for users who want to attempt live data again

**Verification approach:**
- Load page with DevTools Network tab open
- Confirm `scheduleLeagueV2.json` shows connection error in console (expected)
- Verify page displays 5 mock Knicks games instead of error message
- Confirm load time is under 3 seconds

**Risk:** Low—mock data already exists and is well-formed; change is to invocation path only

## Out of Scope
- Adding new CORS proxies  
- Modifying mock data content  
- Changing styling of game cards  
- Implementing actual offline/PWA caching