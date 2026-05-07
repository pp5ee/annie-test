// Playwright test to verify API failure handling
// Blocks cdn.nba.com requests and verifies mock data is displayed

const { chromium } = require('playwright');

async function runTest() {
    console.log('Starting Playwright test for API failure handling...\n');

    let browser;
    let allPassed = true;
    const results = [];

    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();

        // Block requests to cdn.nba.com to simulate API failure
        await context.route('**cdn.nba.com**', route => {
            console.log('Blocked request to:', route.request().url());
            route.abort('blockedbyclient');
        });

        const page = await context.newPage();

        // Navigate to the app
        console.log('Navigating to http://localhost:8080/...');
        await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });

        // Wait a bit for the app to load and process
        await page.waitForTimeout(2000);

        // Test 1: Verify game cards are displayed
        console.log('\n--- Test Results ---\n');

        const gameCards = await page.locator('.game-card').all();
        const gameCardCount = gameCards.length;
        const test1Passed = gameCardCount > 0;
        results.push({
            name: 'Game cards displayed',
            passed: test1Passed,
            details: `Found ${gameCardCount} game card(s)`
        });
        console.log(`✓ Test 1: Game cards displayed - ${test1Passed ? 'PASSED' : 'FAILED'} (${gameCardCount} cards found)`);

        // Test 2: Verify "Offline Mode" indicator is visible
        const offlineIndicator = await page.locator('.offline-indicator').first();
        const offlineIndicatorVisible = await offlineIndicator.isVisible().catch(() => false);
        const test2Passed = offlineIndicatorVisible;
        results.push({
            name: 'Offline Mode indicator visible',
            passed: test2Passed,
            details: offlineIndicatorVisible ? 'Offline indicator is visible' : 'Offline indicator NOT found'
        });
        console.log(`✓ Test 2: Offline Mode indicator - ${test2Passed ? 'PASSED' : 'FAILED'}`);

        // Test 3: Verify no Chinese error message "加载失败" is visible
        const pageContent = await page.content();
        const hasChineseError = pageContent.includes('加载失败');
        const test3Passed = !hasChineseError;
        results.push({
            name: 'No Chinese error message',
            passed: test3Passed,
            details: hasChineseError ? 'Chinese error message "加载失败" found' : 'No Chinese error message found'
        });
        console.log(`✓ Test 3: No Chinese error message - ${test3Passed ? 'PASSED' : 'FAILED'}`);

        // Additional info
        console.log('\n--- Additional Info ---');
        const offlineText = await offlineIndicator.textContent().catch(() => 'N/A');
        console.log(`Offline indicator text: "${offlineText}"`);

        // Summary
        console.log('\n--- Summary ---');
        const totalTests = results.length;
        const passedTests = results.filter(r => r.passed).length;

        if (passedTests === totalTests) {
            console.log(`\n✅ ALL TESTS PASSED (${passedTests}/${totalTests})`);
        } else {
            console.log(`\n❌ SOME TESTS FAILED (${passedTests}/${totalTests} passed)`);
            allPassed = false;
        }

        results.forEach(r => {
            const icon = r.passed ? '✓' : '✗';
            console.log(`  ${icon} ${r.name}: ${r.details}`);
        });

    } catch (error) {
        console.error('Test execution error:', error);
        allPassed = false;
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    return allPassed;
}

runTest()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
