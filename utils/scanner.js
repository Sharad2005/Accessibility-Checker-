const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');

// Validate URL format
function isValidURL(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

// Calculate accessibility score based on violations
function calculateScore(results) {
  const { violations, passes } = results;

  // Scoring based on violation severity
  let penaltyPoints = 0;

  violations.forEach(violation => {
    const count = violation.nodes.length;
    switch (violation.impact) {
      case 'critical':
        penaltyPoints += count * 10;
        break;
      case 'serious':
        penaltyPoints += count * 5;
        break;
      case 'moderate':
        penaltyPoints += count * 2;
        break;
      case 'minor':
        penaltyPoints += count * 1;
        break;
      default:
        penaltyPoints += count * 1;
    }
  });

  // Calculate score (start from 100, deduct penalties)
  let score = Math.max(0, 100 - penaltyPoints);

  // Alternative: percentage-based score if there are passes
  if (passes.length > 0) {
    const totalTests = violations.length + passes.length;
    const percentageScore = (passes.length / totalTests) * 100;
    // Use average of both methods
    score = Math.round((score + percentageScore) / 2);
  }

  return Math.max(0, Math.min(100, score));
}

// Categorize violations by severity and WCAG level
function categorizeViolations(violations) {
  const categorized = {
    critical: [],
    serious: [],
    moderate: [],
    minor: []
  };

  const counts = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0
  };

  violations.forEach(violation => {
    const impact = violation.impact || 'minor';
    categorized[impact].push(violation);
    counts[impact] += violation.nodes.length;
  });

  return { categorized, counts };
}

// Get WCAG level breakdown
function getWCAGBreakdown(results) {
  const { violations, passes } = results;

  const wcagLevels = {
    A: { passed: 0, failed: 0 },
    AA: { passed: 0, failed: 0 },
    AAA: { passed: 0, failed: 0 }
  };

  violations.forEach(violation => {
    violation.tags.forEach(tag => {
      if (tag === 'wcag2a' || tag === 'wcag21a') wcagLevels.A.failed++;
      if (tag === 'wcag2aa' || tag === 'wcag21aa') wcagLevels.AA.failed++;
      if (tag === 'wcag2aaa' || tag === 'wcag21aaa') wcagLevels.AAA.failed++;
    });
  });

  passes.forEach(pass => {
    pass.tags.forEach(tag => {
      if (tag === 'wcag2a' || tag === 'wcag21a') wcagLevels.A.passed++;
      if (tag === 'wcag2aa' || tag === 'wcag21aa') wcagLevels.AA.passed++;
      if (tag === 'wcag2aaa' || tag === 'wcag21aaa') wcagLevels.AAA.passed++;
    });
  });

  return wcagLevels;
}

// Main scan function
async function scanURL(url) {
  // Validate URL
  if (!isValidURL(url)) {
    throw new Error('Invalid URL format. Please provide a valid HTTP or HTTPS URL.');
  }

  let browser;

  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to URL with timeout
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Run axe accessibility analysis
    const results = await new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Close browser
    await browser.close();

    // Calculate score
    const score = calculateScore(results);

    // Categorize violations
    const { categorized, counts } = categorizeViolations(results.violations);

    // Get WCAG breakdown
    const wcagLevel = getWCAGBreakdown(results);

    // Return formatted results
    return {
      url,
      timestamp: new Date().toISOString(),
      score,
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      issueCount: counts,
      wcagLevel,
      violationsByImpact: categorized
    };

  } catch (error) {
    // Close browser if still open
    if (browser) {
      await browser.close();
    }

    // Handle specific errors
    if (error.message.includes('timeout')) {
      throw new Error('Page load timeout. The website took too long to respond.');
    } else if (error.message.includes('net::ERR')) {
      throw new Error('Unable to reach the website. Please check the URL and try again.');
    } else {
      throw new Error(`Scan failed: ${error.message}`);
    }
  }
}

module.exports = {
  scanURL,
  isValidURL
};
