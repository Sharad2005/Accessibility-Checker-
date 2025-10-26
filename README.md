# Accessibility Checker

**AI-Powered Web Accessibility Scanner with Automated Code Fixes**

Scan any website for WCAG 2.1 compliance and get **instant AI-generated code fixes** powered by Google Gemini. Built for the "Track India" Hackathon to make digital services accessible to 200M+ Indians with disabilities.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up API key
cp .env.example .env
# Edit .env and add your Gemini API key from https://aistudio.google.com/app/apikey

# 3. Start the server
npm start

# 4. Open http://localhost:3000
```

---

## Key Features

### AI-Powered Fix Suggestions
- **Instant Code Fixes**: Google Gemini AI generates ready-to-use HTML/CSS fixes
- **Before/After Comparison**: Side-by-side code view shows exactly what to change
- **Copy to Clipboard**: One-click copying for immediate implementation
- **Smart Explanations**: Understand why each fix matters for accessibility

### Comprehensive Analysis
- **WCAG 2.1 Compliance**: Automated checks against Level A & AA standards
- **Accessibility Scoring**: 0-100 score based on violation severity
- **Detailed Breakdown**: Critical, Serious, Moderate, and Minor issue categorization
- **PDF Reports**: Professional downloadable compliance reports

### Developer-Friendly
- **Real-Time Analysis**: Powered by axe-core accessibility testing engine
- **URL-Based Scanning**: Simply enter any website URL to analyze
- **Smart Caching**: 1-hour cache for faster repeated suggestions
- **Fallback Handling**: Manual guidance when AI is unavailable

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Node.js, Express |
| Frontend | HTML, CSS, JavaScript |
| Scanning Engine | Puppeteer + axe-core |
| **AI Engine** | **Google Gemini 2.5 Flash** |
| Reports | PDFKit |
| Standards | WCAG 2.1 Level A & AA |

---

## What Makes This Different?

Unlike traditional accessibility checkers that only identify problems, our tool:

- **Generates Real Code Fixes** - Not just descriptions, but actual working HTML/CSS
- **Explains the Impact** - Understand how each issue affects users with disabilities
- **Teaches Best Practices** - Learn correct implementations while fixing
- **Saves Development Time** - Copy-paste ready code instead of researching solutions

### Example AI Suggestion

**Before (Violation):**
```html
<img src="logo.png">
```

**After (AI Fix):**
```html
<img src="logo.png" alt="Company logo with blue geometric design">
```

**AI Explanation:**
> "Added descriptive alt text that describes the visual content of the image. This helps screen reader users understand what the logo looks like, meeting WCAG 1.1.1 (Non-text Content) requirements."

---

## Project Structure

```
accessibility-checker/
├── server.js              # Express API server
├── .env.example          # Environment variables template
├── public/               # Frontend files
│   ├── index.html        # Main UI
│   ├── style.css         # Styling with AI purple theme
│   └── script.js         # Frontend logic with AI integration
└── utils/                # Backend modules
    ├── scanner.js        # Accessibility scanning
    ├── geminiAI.js       # Google Gemini AI integration
    └── reportGenerator.js # PDF report generation
```

---

## API Endpoints

### `POST /api/scan`
Scan a URL for accessibility issues and get detailed analysis.

### `POST /api/suggest-fix`
Generate AI-powered fix suggestion for a specific violation.

### `GET /api/report/:scanId`
Download PDF compliance report for a completed scan.

### `GET /api/health`
Health check endpoint.

---

## How It Works

### Scanning Process
1. User enters website URL
2. Puppeteer launches headless Chrome browser
3. axe-core runs automated WCAG tests
4. System calculates accessibility score
5. Results displayed with violation breakdown

### AI Fix Suggestion Process
1. User clicks "Get AI Suggestion" on a violation
2. Google Gemini AI analyzes HTML and context
3. AI generates fixed code that resolves the issue
4. Before/after comparison displayed with explanation
5. User copies fixed code with one click

---

## Supported Fix Types

- **Color Contrast**: WCAG-compliant color combinations
- **Missing Alt Text**: Descriptive image alt attributes
- **Form Labels**: Proper label elements with meaningful text
- **Generic WCAG Violations**: Various other accessibility issues

---

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API Key (free) - Get from [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## Installation

```bash
# Clone repository
git clone <your-repo-url>
cd accessibility-checker

# Install dependencies
npm install

# Configure API key
cp .env.example .env
# Edit .env and add: GEMINI_API_KEY=your_key_here

# Start server
npm start
```

---

## Scoring Algorithm

```
Base Score = 100

Deductions:
- Critical: -10 points per element
- Serious: -5 points per element
- Moderate: -2 points per element
- Minor: -1 point per element

Final Score = Average of deduction method & percentage passed
```

---

## Testing

**Test with these URLs:**

- Good: https://www.a11yproject.com/
- Medium: https://example.com
- Poor: https://www.facebook.com (color contrast issues)

**To test AI suggestions:**
1. Scan https://www.facebook.com
2. Click "Get AI Suggestion" on any violation
3. View AI-generated fix with explanation
4. Copy fixed code to clipboard

---

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

---

## Known Limitations

- Cannot scan pages behind authentication
- JavaScript-heavy sites may not fully render
- Sites with CAPTCHA will fail
- Timeout after 30 seconds for slow sites

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [Google Gemini AI](https://ai.google.dev/)
- [WebAIM](https://webaim.org/)

---

**Built for making the web accessible to everyone**
