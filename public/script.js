// API Configuration
const API_URL = 'http://localhost:3000/api';

// Global state
let currentScanId = null;

// DOM Elements
const scanForm = document.getElementById('scan-form');
const urlInput = document.getElementById('url-input');
const scanBtn = document.getElementById('scan-btn');
const loadingSection = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const resultsSection = document.getElementById('results-section');
const downloadBtn = document.getElementById('download-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
  scanForm.addEventListener('submit', handleScanSubmit);
  downloadBtn.addEventListener('click', handleDownload);
}

// Handle form submission
async function handleScanSubmit(e) {
  e.preventDefault();

  const url = urlInput.value.trim();

  if (!url) {
    showError('Please enter a URL');
    return;
  }

  // Basic URL validation
  if (!isValidURL(url)) {
    showError('Please enter a valid URL (must start with http:// or https://)');
    return;
  }

  // Show loading, hide previous results
  showLoading();
  hideResults();
  hideError();

  try {
    // Call scan API
    const response = await fetch(`${API_URL}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    });

    const result = await response.json();

    if (result.success) {
      // Store scan ID
      currentScanId = result.data.scanId;

      // Display results
      displayResults(result.data);
      showResults();
    } else {
      showError(result.error || 'Failed to scan website. Please try again.');
    }

  } catch (error) {
    console.error('Scan error:', error);
    showError('Network error. Please check your connection and try again.');
  } finally {
    hideLoading();
  }
}

// Validate URL format
function isValidURL(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

// Display scan results
function displayResults(data) {
  // Update score
  const scoreElement = document.getElementById('score-display');
  scoreElement.textContent = data.score;
  scoreElement.className = 'score ' + getScoreClass(data.score);

  // Update stats
  document.getElementById('total-issues').textContent = data.violations.length;
  document.getElementById('critical-count').textContent = data.issueCount.critical;
  document.getElementById('serious-count').textContent = data.issueCount.serious;
  document.getElementById('moderate-count').textContent = data.issueCount.moderate;

  // Update WCAG breakdown
  document.getElementById('wcag-a-passed').textContent = data.wcagLevel.A.passed;
  document.getElementById('wcag-a-failed').textContent = data.wcagLevel.A.failed;
  document.getElementById('wcag-aa-passed').textContent = data.wcagLevel.AA.passed;
  document.getElementById('wcag-aa-failed').textContent = data.wcagLevel.AA.failed;
  document.getElementById('wcag-aaa-passed').textContent = data.wcagLevel.AAA.passed;
  document.getElementById('wcag-aaa-failed').textContent = data.wcagLevel.AAA.failed;

  // Render violations
  renderViolations(data.violations);
}

// Get score class for color coding
function getScoreClass(score) {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  return 'poor';
}

// Render violations list
function renderViolations(violations) {
  const container = document.getElementById('violations-list');
  container.innerHTML = '';

  if (violations.length === 0) {
    container.innerHTML = `
      <div class="no-violations">
        <h3>✓ No Violations Found!</h3>
        <p>This page passed all automated accessibility tests.</p>
      </div>
    `;
    return;
  }

  violations.forEach((violation, index) => {
    const item = createViolationElement(violation, index + 1);
    container.appendChild(item);
  });
}

// Create violation element
function createViolationElement(violation, number) {
  const div = document.createElement('div');
  div.className = 'violation-item';

  const impact = violation.impact || 'minor';
  const wcagTags = violation.tags.filter(tag => tag.includes('wcag')).join(', ');
  const affectedCount = violation.nodes.length;

  div.innerHTML = `
    <div class="violation-header">
      <span class="severity-badge ${impact}">${impact}</span>
      <h3>${number}. ${escapeHtml(violation.help)}</h3>
    </div>
    <p class="violation-description">${escapeHtml(violation.description)}</p>
    <div class="violation-meta">
      <div><strong>WCAG:</strong> ${escapeHtml(wcagTags)}</div>
      <div><strong>Affected elements:</strong> ${affectedCount}</div>
      <div><strong>Impact:</strong> ${escapeHtml(impact)}</div>
    </div>
    <details class="violation-details">
      <summary>View affected elements</summary>
      <pre>${JSON.stringify(violation.nodes.slice(0, 3), null, 2)}</pre>
      ${violation.nodes.length > 3 ? `<p><em>...and ${violation.nodes.length - 3} more</em></p>` : ''}
    </details>
  `;

  return div;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Handle PDF download
function handleDownload() {
  if (!currentScanId) {
    showError('No scan results available. Please run a scan first.');
    return;
  }

  // Open download in new window
  window.open(`${API_URL}/report/${currentScanId}`, '_blank');
}

// UI State Management Functions
function showLoading() {
  loadingSection.classList.remove('hidden');
  scanBtn.disabled = true;
  scanBtn.textContent = 'Scanning...';
}

function hideLoading() {
  loadingSection.classList.add('hidden');
  scanBtn.disabled = false;
  scanBtn.textContent = 'Scan Website';
}

function showResults() {
  resultsSection.classList.remove('hidden');
  // Scroll to results
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideResults() {
  resultsSection.classList.add('hidden');
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
  // Auto-hide after 5 seconds
  setTimeout(hideError, 5000);
}

function hideError() {
  errorMessage.classList.add('hidden');
}
