// Knicks Scores Application
// AC-2: Fetch game data from NBA.com CDN API and filter completed games

const API_URL = 'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json';
const KNICKS_TEAM_ID = 1610612752; // NBA team ID for New York Knicks

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
        const games = await fetchGames();
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
 * Fetch games from the NBA.com CDN API
 * Returns recent games for the New York Knicks
 */
async function fetchGames() {
    const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    // Extract games from the schedule
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
 * Create a game card element
 * Basic implementation - will be enhanced in AC-3
 */
function createGameElement(game) {
    const div = document.createElement('div');
    div.className = 'game-card';

    // Determine if Knicks are home or away
    const isKnicksHome = game.homeTeam?.teamId == KNICKS_TEAM_ID;
    const opponent = isKnicksHome ? game.awayTeam : game.homeTeam;

    // Get scores
    const knicksScore = isKnicksHome ? game.homeTeam?.score : game.awayTeam?.score;
    const opponentScore = isKnicksHome ? game.awayTeam?.score : game.homeTeam?.score;

    // Format date
    const gameDate = new Date(game.gameDateEst || game.gameDateUTC);
    const formattedDate = gameDate.toLocaleDateString();

    div.innerHTML = `
        <div class="game-info">
            <span class="opponent-name">${opponent?.teamName || opponent?.teamTricode || 'Unknown'}</span>
            <span class="game-date">${formattedDate}</span>
            <span class="home-away">${isKnicksHome ? 'Home' : 'Away'}</span>
            <span class="score">${knicksScore} - ${opponentScore}</span>
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
