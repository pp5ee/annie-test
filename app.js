// Knicks Scores Application
// AC-2: Fetch game data from API and filter completed games

const API_BASE_URL = 'https://www.balldontlie.io/api/v1';
const KNICKS_TEAM_ID = 20; // BallDontLie team ID for New York Knicks

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
 * Fetch games from the BallDontLie API
 * Returns recent games for the New York Knicks
 */
async function fetchGames() {
    const url = `${API_BASE_URL}/games?team_ids[]=${KNICKS_TEAM_ID}&per_page=25`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
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
            // Check for "Final" status or completed game indicators
            const status = game.status?.toLowerCase() || '';
            const isFinal = status.includes('final');
            const isCompleted = game.time === '' || game.time === null;
            const hasScore = game.home_team_score !== null &&
                           game.home_team_score !== undefined &&
                           game.visitor_team_score !== null &&
                           game.visitor_team_score !== undefined;

            return isFinal || (isCompleted && hasScore);
        })
        .sort((a, b) => {
            // Sort by date descending (most recent first)
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });
}

/**
 * Render games to the container
 * Placeholder implementation for AC-3
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

    const isKnicksHome = game.home_team?.id === KNICKS_TEAM_ID;
    const opponent = isKnicksHome ? game.visitor_team : game.home_team;

    div.innerHTML = `
        <div class="game-info">
            <span class="opponent-name">${opponent?.full_name || 'Unknown'}</span>
            <span class="game-date">${new Date(game.date).toLocaleDateString()}</span>
            <span class="home-away">${isKnicksHome ? 'Home' : 'Away'}</span>
            <span class="score">${game.home_team_score} - ${game.visitor_team_score}</span>
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
