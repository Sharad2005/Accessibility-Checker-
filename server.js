const express = require('express');
const cors = require('cors');
const path = require('path');
const { scanURL, isValidURL } = require('./utils/scanner');
const { generateReport } = require('./utils/reportGenerator');
const { generateFixSuggestion } = require('./utils/geminiAI');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory cache for scan results
const scanCache = {};

// Generate unique scan ID
function generateScanId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Clean up old scans (keep last 50)
function cleanupOldScans() {
  const scanIds = Object.keys(scanCache);
  if (scanIds.length > 50) {
    const toDelete = scanIds.slice(0, scanIds.length - 50);
    toDelete.forEach(id => delete scanCache[id]);
  }
}

// POST /api/scan - Scan a URL for accessibility issues
app.post('/api/scan', async (req, res) => {
  try {
    const { url } = req.body;

    // Validate URL
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    if (!isValidURL(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format. Please provide a valid HTTP or HTTPS URL.'
      });
    }

    console.log(`Scanning URL: ${url}`);

    // Run scan
    const results = await scanURL(url);

    // Generate unique scan ID
    const scanId = generateScanId();

    // Store results in cache
    scanCache[scanId] = results;

    // Clean up old scans
    cleanupOldScans();

    console.log(`Scan completed. Score: ${results.score}, Violations: ${results.violations.length}`);

    // Return results
    res.json({
      success: true,
      data: {
        scanId,
        ...results
      }
    });

  } catch (error) {
    console.error('Scan error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to scan website. Please try again.'
    });
  }
});

// GET /api/report/:scanId - Generate and download PDF report
app.get('/api/report/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;

    // Retrieve scan results from cache
    const scanResults = scanCache[scanId];

    if (!scanResults) {
      return res.status(404).json({
        success: false,
        error: 'Scan results not found. Please run a new scan.'
      });
    }

    console.log(`Generating report for scan ID: ${scanId}`);

    // Generate filename
    const domain = new URL(scanResults.url).hostname.replace(/[^a-z0-9]/gi, '-');
    const timestamp = Date.now();
    const filename = `accessibility-report-${domain}-${timestamp}.pdf`;
    const reportPath = path.join(__dirname, 'reports', filename);

    // Generate PDF
    await generateReport(scanResults, reportPath);

    console.log(`Report generated: ${filename}`);

    // Send file for download
    res.download(reportPath, 'accessibility-report.pdf', (err) => {
      if (err) {
        console.error('Download error:', err);
      }

      // Clean up file after download (or after error)
      const fs = require('fs');
      setTimeout(() => {
        if (fs.existsSync(reportPath)) {
          fs.unlinkSync(reportPath);
          console.log(`Cleaned up report: ${filename}`);
        }
      }, 5000); // Delete after 5 seconds
    });

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report. Please try again.'
    });
  }
});

// POST /api/suggest-fix - Generate AI-powered fix suggestion for a violation
app.post('/api/suggest-fix', async (req, res) => {
  try {
    const { violation } = req.body;

    // Validate violation data
    if (!violation || !violation.id) {
      return res.status(400).json({
        success: false,
        error: 'Violation data is required'
      });
    }

    console.log(`Generating AI fix for violation: ${violation.id}`);

    // Generate AI suggestion
    const suggestion = await generateFixSuggestion(violation);

    console.log(`AI suggestion generated (AI: ${suggestion.aiGenerated}, Cache: ${suggestion.fromCache || false})`);

    // Return suggestion
    res.json({
      success: true,
      data: suggestion
    });

  } catch (error) {
    console.error('AI suggestion error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate suggestion. Please try again.'
    });
  }
});

// GET / - Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Accessibility Checker API is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║    Accessibility Checker Server                       ║
║                                                       ║
║    Server running on: http://localhost:${PORT}        ║
║                                                       ║
║    API Endpoints:                                     ║
║    • POST /api/scan - Scan a URL                      ║
║    • POST /api/suggest-fix - Get AI fix (NEW)         ║
║    • GET  /api/report/:scanId - Download report       ║
║    • GET  /api/health - Health check                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
