// Knicks Scores Application
// AC-2: Fetch game data from NBA.com CDN API and filter completed games

const API_URL = 'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json';
const CORS_PROXY_URL = 'https://api.allorigins.win/get?url=' + encodeURIComponent(API_URL);
const KNICKS_TEAM_ID = 1610612752; // NBA team ID for New York Knicks
const REQUEST_TIMEOUT_MS = 10000; // 10 second timeout for API requests

// Initialize app on page load
document.addEventListener('DOMContentLoaded', init);

async function init() {
    console.log('Knicks Scores app initialized');
    const container = document.getElementById('games-container');

    if (!container) {
        console.error('Games container not found');
        return;
    }

    showLoading(container);

    try {
        const games = await fetchGamesWithFallback();
        const finalGames = filterFinalGames(games);

        if (finalGames.length === 0) {
            showMessage(container, 'No completed games found.', 'info');
            return;
        }

        renderGames(container, finalGames);
    } catch (error) {
        console.error('Error loading games:', error);
        showMessage(container, 'Unable to load scores. Please try again later.', 'error');
    }
}

/**
 * Fetch games with CORS fallback using allorigins proxy
 * AC-1: Handles CORS restrictions by using a proxy when direct fetch fails
 */
async function fetchGamesWithFallback() {
    try {
        // Try direct fetch first
        return await fetchGamesDirect();
    } catch (error) {
        console.log('Direct fetch failed, trying CORS proxy...');
        // If direct fails (likely CORS), use proxy
        return await fetchGamesViaProxy();
    }
}

/**
 * Direct API fetch from NBA.com CDN
 */
async function fetchGamesDirect() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return extractKnicksGames(data);
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Fetch via CORS proxy (allorigins.win)
 */
async function fetchGamesViaProxy() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(CORS_PROXY_URL, {
            method: 'GET',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Proxy API error: ${response.status}`);
        }

        const proxyData = await response.json();
        // allorigins returns data in 'contents' field as a string
        const data = JSON.parse(proxyData.contents);
        return extractKnicksGames(data);
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again later.');
        }
        throw error;
    }
}

/**
 * Extract Knicks games from NBA schedule data
 */
function extractKnicksGames(data) {
    const gameDates = data.leagueSchedule?.gameDates || [];
    const allGames = [];

    gameDates.forEach(gameDate => {
        const games = gameDate.games || [];
        games.forEach(game => {
            // Only include games involving the Knicks
            if (game.homeTeam?.teamId == KNICKS_TEAM_ID ||
                game.awayTeam?.teamId == KNICKS_TEAM_ID) {
                allGames.push(game);
            }
        });
    });

    return allGames;
}

/**
 * Filter games to only include completed/final games
 * Excludes scheduled, live, and postponed games
 */
function filterFinalGames(games) {
    if (!Array.isArray(games)) {
        return [];
    }

    return games
        .filter(game => {
            // Check for "Final" status
            const status = game.gameStatusText || '';
            const isFinal = status.toLowerCase().includes('final');

            // Game status code: 3 = Final
            const statusCode = game.gameStatus;
            const isFinalCode = statusCode === 3;

            return isFinal || isFinalCode;
        })
        .sort((a, b) => {
            // Sort by game date descending (most recent first)
            const dateA = new Date(a.gameDateEst || a.gameDateUTC);
            const dateB = new Date(b.gameDateEst || b.gameDateUTC);
            return dateB - dateA;
        });
}

/**
 * Render games to the container
 * Basic implementation for AC-2, enhanced in AC-3
 */
function renderGames(container, games) {
    container.innerHTML = '';

    games.forEach(game => {
        const gameElement = createGameElement(game);
        container.appendChild(gameElement);
    });
}

/**
 * Create a game card element with full game details
 * AC-3: Displays opponent, date, home/away, scores, and win/loss indicator
 */
function createGameElement(game) {
    const div = document.createElement('div');
    div.className = 'game-card';

    // Determine if Knicks are home or away
    const isKnicksHome = game.homeTeam?.teamId == KNICKS_TEAM_ID;
    const opponent = isKnicksHome ? game.awayTeam : game.homeTeam;

    // Get scores
    const knicksScore = parseInt(isKnicksHome ? game.homeTeam?.score : game.awayTeam?.score, 10) || 0;
    const opponentScore = parseInt(isKnicksHome ? game.awayTeam?.score : game.homeTeam?.score, 10) || 0;

    // Determine win/loss
    const isWin = knicksScore > opponentScore;
    const resultClass = isWin ? 'win' : 'loss';
    const resultText = isWin ? 'W' : 'L';

    // Format date
    const gameDate = new Date(game.gameDateEst || game.gameDateUTC);
    const formattedDate = gameDate.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    div.innerHTML = `
        <div class="game-card-header">
            <span class="game-result-badge ${resultClass}">${resultText}</span>
            <span class="game-date">${formattedDate}</span>
            <span class="home-away-badge">${isKnicksHome ? 'Home' : 'Away'}</span>
        </div>
        <div class="game-card-body">
            <div class="team-row knicks-row">
                <span class="team-name">New York Knicks</span>
                <span class="team-score">${knicksScore}</span>
            </div>
            <div class="team-row opponent-row">
                <span class="team-name">${opponent?.teamName || opponent?.teamTricode || 'Unknown'}</span>
                <span class="team-score">${opponentScore}</span>
            </div>
        </div>
    `;

    return div;
}

/**
 * Show loading state
 */
function showLoading(container) {
    container.innerHTML = '<div class="loading">Loading games...</div>';
}

/**
 * Show message (error or info)
 */
function showMessage(container, message, type) {
    container.innerHTML = `<div class="message ${type}">${message}</div>`;
}

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { filterFinalGames };
}
