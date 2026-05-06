## Goal
Build a responsive, single-page website using vanilla HTML/CSS/JavaScript that fetches and displays recent final scores for New York Knicks games from a third-party sports API.

## Context
This is a greenfield frontend project with no existing codebase or workspace files. The site targets mobile and desktop users seeking quick access to completed Knicks game results without live updates. Because the solution must remain a static site (suitable for GitHub Pages, Netlify, or similar) without a backend server, API selection is constrained to CORS-friendly endpoints or public APIs that don't require secret keys in client-side code.

## Acceptance Criteria
- AC-1: The homepage displays clear "New York Knicks" branding with team-inspired visual design (blue/orange color scheme).
- AC-2: On load, the application fetches game data from a sports API and filters to display only completed games with final scores.
- AC-3: Each game entry displays: opponent team name, game date (localized), home/away indicator, Knicks final score, opponent final score, and a win/loss indicator.
- AC-4: The layout adapts responsively to mobile (< 768px) and desktop viewports without horizontal scrolling or layout breakage.
- AC-5: A clear section heading "Recent Final Scores" (or equivalent) appears above the results list.
- AC-6: If the API request fails, returns empty data, or times out, the UI displays a user-friendly error message (e.g., "Unable to load scores. Please try again later.") rather than breaking or showing blank space.
- AC-7: The site loads without JavaScript console errors in modern browsers (Chrome, Firefox, Safari, Edge).
- AC-8: Games are presented in a card or table format with readable typography and adequate color contrast.
- AC-9: Data is filtered to exclude scheduled, live, or postponed games; only games with "Final" or equivalent status appear.

## Implementation Notes
- **API Selection**: Prioritize free, CORS-enabled APIs (e.g., ESPN API endpoints, BallDontLie, or API-Sports) that don't require server-side proxies. If API keys are unavoidable, document that a backend proxy is required for production to avoid exposing keys in client-side code.
- **Architecture**: Keep all logic in vanilla JS (ES6+) with modular functions: `fetchGames()`, `filterFinalGames()`, `renderGames()`. Isolate API response mapping in a dedicated adapter function to ease future provider swaps.
- **Data Filtering**: Implement client-side filtering to check `game.status` or equivalent fields for "Final" or "Completed" states, and exclude games where `is_live` or similar is true.
- **Styling**: Use CSS Grid or Flexbox for responsive layouts. Implement Knicks color palette: #006BB6 (blue), #F58426 (orange), with white/gray backgrounds for readability. Avoid using official copyrighted logos unless explicitly permitted.
- **Error Handling**: Wrap fetch calls in try/catch blocks. Implement loading states (skeleton screens or spinner) and empty states.
- **Sorting**: Sort results chronologically with most recent final game first (descending date).
- **Performance**: Respect API rate limits (typically 10-100 requests/day for free tiers); consider implementing basic client-side caching using `localStorage` with a timestamp to avoid redundant calls during a single session.

## Out of Scope
- Real-time live score updates or WebSocket connections.
- Historical archives beyond the API-provided recent window (e.g., past seasons).
- User authentication, accounts, or personalization features.
- E-commerce functionality (ticket sales, merchandise).
- Player statistics, team standings, injury reports, or news articles.
- Administrative interfaces for content management.
- Backend server, database, or API proxy implementation (unless required for API key security).
- Accessibility compliance auditing (though semantic HTML is encouraged).