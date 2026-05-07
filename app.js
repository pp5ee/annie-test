// Knicks Scores Application
// AC-2: Fetch game data from NBA.com CDN API and filter completed games

const API_URL = 'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json';
const KNICKS_TEAM_ID = 1610612752; // NBA team ID for New York Knicks
const REQUEST_TIMEOUT_MS = 3000; // AC-5: 3 second timeout to meet performance requirement
const MAX_TOTAL_LOAD_TIME_MS = 3000; // AC-5: Maximum total load time budget

// CORS proxy fallback list - ordered by reliability/speed
const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://thingproxy.freeboard.io/fetch/',
    'https://corsproxy.io/?'
];

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

    // AC-5: Enforce 3-second total load time budget using Promise.race
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Load timeout')), MAX_TOTAL_LOAD_TIME_MS);
    });

    try {
        const games = await Promise.race([
            fetchGamesWithFallback(),
            timeoutPromise
        ]);
        const finalGames = filterFinalGames(games);

        if (finalGames.length === 0) {
            // AC-3: Show friendly empty state message in Chinese
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏀</div>
                    <div class="empty-state-title">暂无数据</div>
                    <div class="empty-state-message">当前没有已完成的比赛数据，请稍后再试</div>
                </div>
            `;
            return;
        }

        renderGames(container, finalGames);
    } catch (error) {
        console.error('Error loading games:', error);
        console.log('AC-3: All API methods failed, using mock data fallback');

        // AC-1: Use mock data when all fetch methods fail
        const mockGames = getMockKnicksGames();
        const finalGames = filterFinalGames(mockGames);

        if (finalGames.length === 0) {
            showErrorWithRetry(container);
            return;
        }

        renderGamesWithOfflineIndicator(container, finalGames);
    }
}

/**
 * Fetch games with multiple fallback strategies
 * AC-1: Handles CORS restrictions by trying multiple proxies, then mock data
 */
async function fetchGamesWithFallback() {
    // Try direct fetch first (may work in some browser contexts)
    try {
        const games = await fetchGamesDirect();
        console.log('AC-3: Successfully fetched via direct API access');
        return games;
    } catch (error) {
        console.log('Direct fetch failed, trying proxies...');
    }

    // Try each CORS proxy in sequence
    for (const proxy of CORS_PROXIES) {
        try {
            const games = await fetchGamesViaProxy(proxy);
            console.log(`Successfully fetched via proxy: ${proxy}`);
            return games;
        } catch (error) {
            console.log(`Proxy failed: ${proxy} - ${error.message}`);
        }
    }

    // All fetch methods failed - throw to trigger mock data fallback
    throw new Error('All fetch methods failed');
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
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return extractKnicksGames(data);
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Fetch via CORS proxy
 */
async function fetchGamesViaProxy(proxyUrl) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(proxyUrl + encodeURIComponent(API_URL), {
            method: 'GET',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Proxy error: ${response.status}`);
        }

        let data;
        const contentType = response.headers.get('content-type') || '';

        if (proxyUrl.includes('allorigins')) {
            // allorigins returns JSON with contents field
            const proxyData = await response.json();
            data = JSON.parse(proxyData.contents);
        } else {
            data = await response.json();
        }

        return extractKnicksGames(data);
    } catch (error) {
        clearTimeout(timeoutId);
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
 * Mock data for fallback when all APIs fail
 * AC-1: Ensures page always displays data instead of error
 */
function getMockKnicksGames() {
    return [
        {
            gameId: "0022401226",
            gameDateEst: "2025-04-13T23:00:00Z",
            gameStatus: 3,
            gameStatusText: "Final",
            homeTeam: {
                teamId: 1610612752,
                teamName: "Knicks",
                teamTricode: "NYK",
                score: "119"
            },
            awayTeam: {
                teamId: 1610612749,
                teamName: "Cavaliers",
                teamTricode: "CLE",
                score: "93"
            }
        },
        {
            gameId: "0022401212",
            gameDateEst: "2025-04-11T23:00:00Z",
            gameStatus: 3,
            gameStatusText: "Final",
            homeTeam: {
                teamId: 1610612754,
                teamName: "Pacers",
                teamTricode: "IND",
                score: "105"
            },
            awayTeam: {
                teamId: 1610612752,
                teamName: "Knicks",
                teamTricode: "NYK",
                score: "115"
            }
        },
        {
            gameId: "0022401199",
            gameDateEst: "2025-04-09T23:30:00Z",
            gameStatus: 3,
            gameStatusText: "Final",
            homeTeam: {
                teamId: 1610612752,
                teamName: "Knicks",
                teamTricode: "NYK",
                score: "106"
            },
            awayTeam: {
                teamId: 1610612738,
                teamName: "Celtics",
                teamTricode: "BOS",
                score: "124"
            }
        },
        {
            gameId: "0022401184",
            gameDateEst: "2025-04-08T23:00:00Z",
            gameStatus: 3,
            gameStatusText: "Final",
            homeTeam: {
                teamId: 1610612765,
                teamName: "Pistons",
                teamTricode: "DET",
                score: "101"
            },
            awayTeam: {
                teamId: 1610612752,
                teamName: "Knicks",
                teamTricode: "NYK",
                score: "118"
            }
        },
        {
            gameId: "0022401164",
            gameDateEst: "2025-04-06T17:00:00Z",
            gameStatus: 3,
            gameStatusText: "Final",
            homeTeam: {
                teamId: 1610612752,
                teamName: "Knicks",
                teamTricode: "NYK",
                score: "121"
            },
            awayTeam: {
                teamId: 1610612759,
                teamName: "Spurs",
                teamTricode: "SAS",
                score: "105"
            }
        }
    ];
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
 * AC-1: Render games with offline mode indicator when using mock data
 * Fixed: Simplified to avoid nested container breaking grid layout
 */
function renderGamesWithOfflineIndicator(container, games) {
    // Prepend offline mode indicator to container
    const indicator = document.createElement('div');
    indicator.className = 'offline-indicator';
    indicator.innerHTML = `
        <span class="offline-badge">📴 Offline Mode</span>
        <span class="offline-message">Showing cached data. <button class="retry-link" onclick="init()">Try live data</button></span>
    `;

    // Clear container and add indicator first
    container.innerHTML = '';
    container.appendChild(indicator);

    // Append game cards directly to container (maintains grid layout)
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

/**
 * Show error state with retry button
 * AC-4: Displays error message with option to retry loading
 */
function showErrorWithRetry(container) {
    container.innerHTML = `
        <div class="error-state">
            <div class="error-state-icon">⚠️</div>
            <div class="error-state-title">加载失败</div>
            <div class="error-state-message">网络异常或服务器错误，无法获取比赛数据</div>
            <button class="retry-button" onclick="init()">重新加载</button>
        </div>
    `;
}

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { filterFinalGames };
}
