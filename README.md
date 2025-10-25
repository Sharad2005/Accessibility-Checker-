# Accessibility Checker

A web-based tool that checks and scores digital accessibility for citizens with disabilities. Scan any website for WCAG 2.1 compliance, get a detailed accessibility score, and download comprehensive PDF reports.

## Features

- **URL-Based Scanning**: Simply enter any website URL to analyze
- **WCAG 2.1 Compliance**: Automated checks against Web Content Accessibility Guidelines
- **Accessibility Scoring**: 0-100 score based on violations and severity
- **Detailed Reports**: See exactly what issues were found and how to fix them
- **PDF Export**: Download professional compliance reports
- **Real-Time Analysis**: Powered by axe-core accessibility testing engine

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Scanning Engine**: Puppeteer + axe-core
- **Report Generation**: PDFKit
- **Standards**: WCAG 2.1 Level A & AA

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. **Clone or download this repository**

2. **Install dependencies**
```bash
npm install
```

This will install:
- express - Web server framework
- cors - Cross-origin resource sharing
- puppeteer - Headless Chrome browser
- @axe-core/puppeteer - Accessibility testing
- pdfkit - PDF generation

## Usage

### Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

### Using the Application

1. **Open your browser** and navigate to `http://localhost:3000`

2. **Enter a URL** in the input field (e.g., `https://example.com`)

3. **Click "Scan Website"** and wait for the analysis to complete

4. **View Results**:
   - Overall accessibility score (0-100)
   - Breakdown by severity (Critical, Serious, Moderate, Minor)
   - WCAG compliance levels (A, AA, AAA)
   - Detailed list of all violations

5. **Download PDF Report** for detailed documentation and sharing

## API Documentation

### POST `/api/scan`

Scan a URL for accessibility issues.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scanId": "abc123",
    "url": "https://example.com",
    "timestamp": "2025-10-25T10:30:00Z",
    "score": 75,
    "violations": [...],
    "passes": [...],
    "incomplete": [...],
    "issueCount": {
      "critical": 2,
      "serious": 5,
      "moderate": 3,
      "minor": 1
    },
    "wcagLevel": {
      "A": { "passed": 15, "failed": 3 },
      "AA": { "passed": 22, "failed": 5 },
      "AAA": { "passed": 8, "failed": 12 }
    }
  }
}
```

### GET `/api/report/:scanId`

Download PDF report for a completed scan.

**Response:** PDF file download

### GET `/api/health`

Health check endpoint.

**Response:**
```json
{
  "success": true,
  "message": "Accessibility Checker API is running",
  "timestamp": "2025-10-25T10:30:00Z"
}
```

## Project Structure

```
accessibility-checker/
├── package.json              # Dependencies and scripts
├── server.js                 # Express API server
├── .gitignore               # Git ignore rules
├── README.md                # This file
├── PLAN.md                  # Detailed implementation plan
├── public/                  # Frontend files
│   ├── index.html           # Main UI
│   ├── style.css            # Styling
│   └── script.js            # Frontend logic
├── utils/                   # Backend modules
│   ├── scanner.js           # Accessibility scanning
│   └── reportGenerator.js   # PDF generation
└── reports/                 # Temporary PDF storage
```

## How It Works

### Scanning Process

1. **User Input**: User provides a website URL through the frontend
2. **Backend Processing**: Express server receives the request
3. **Browser Launch**: Puppeteer launches a headless Chrome browser
4. **Page Load**: Browser navigates to the target URL
5. **Accessibility Analysis**: axe-core runs automated WCAG tests
6. **Score Calculation**: Violations are weighted by severity to calculate score
7. **Results Return**: Formatted results sent back to frontend
8. **Display**: Frontend shows score, violations, and WCAG breakdown

### Scoring Algorithm

```
Base Score = 100

Deductions:
- Critical violation: -10 points per affected element
- Serious violation: -5 points per affected element
- Moderate violation: -2 points per affected element
- Minor violation: -1 point per affected element

Alternative calculation (averaged):
Percentage Score = (Tests Passed / Total Tests) × 100

Final Score = Average of both methods (0-100 range)
```

### PDF Report Structure

**Page 1 - Executive Summary:**
- URL scanned and date
- Overall score with color coding
- Issue count by severity
- WCAG compliance breakdown

**Page 2+ - Detailed Violations:**
- Each violation with:
  - Title and description
  - Severity level
  - WCAG reference
  - Number of affected elements
  - Impact explanation

**Final Page - Recommendations:**
- Priority actions
- Best practices
- Resources and links

## Testing

### Test URLs

Use these URLs to test the scanner:

**Good Accessibility:**
- https://www.a11yproject.com/
- https://www.w3.org/WAI/

**Medium Accessibility:**
- https://example.com

**Poor Accessibility (Demo):**
- https://www.w3.org/WAI/demos/bad/

### Running Tests

1. Start the server: `npm start`
2. Open browser to `http://localhost:3000`
3. Test with each URL above
4. Verify:
   - Scan completes successfully
   - Score displays correctly
   - Violations are listed
   - PDF downloads properly

## Troubleshooting

### Puppeteer Installation Issues

If Puppeteer fails to install:
```bash
npm install puppeteer --unsafe-perm=true
```

Or install Chromium separately:
```bash
npx puppeteer browsers install chrome
```

### Port Already in Use

If port 3000 is occupied, change it in `server.js`:
```javascript
const PORT = 3001; // Change to any available port
```

### PDF Generation Fails

Ensure the `reports/` directory exists:
```bash
mkdir reports
```

### CORS Errors

CORS is already enabled, but if you encounter issues, check that the frontend is accessing the correct API URL in `public/script.js`.

## Browser Compatibility

The web interface works on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Limitations

- **Client-side Rendering**: Some JavaScript-heavy sites may not fully load
- **Authentication**: Cannot scan pages behind login
- **CAPTCHA**: Sites with CAPTCHA will fail
- **Timeouts**: Very slow sites may timeout (30s limit)
- **Automated Tests Only**: Manual accessibility testing still recommended

## Future Enhancements

- [ ] Batch URL scanning
- [ ] Historical tracking and trends
- [ ] User authentication and saved scans
- [ ] Scheduled automated scans
- [ ] Email notifications
- [ ] CI/CD integration
- [ ] Site-wide crawling
- [ ] Custom scoring weights
- [ ] Multiple report formats (JSON, CSV, HTML)
- [ ] Visual highlighting of issues

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [Web Accessibility Introduction](https://www.w3.org/WAI/fundamentals/accessibility-intro/)

## License

ISC

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

---

**Built for making the web more accessible to everyone.**
