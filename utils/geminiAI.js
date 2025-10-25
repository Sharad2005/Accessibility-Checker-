const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Suggestion cache: { violationId_context: { suggestion, timestamp } }
const suggestionCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Clean expired cache entries
 */
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of suggestionCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      suggestionCache.delete(key);
    }
  }
}

/**
 * Generate cache key for a violation
 */
function getCacheKey(violationId, context) {
  return `${violationId}_${JSON.stringify(context)}`;
}

/**
 * Generate AI-powered fix suggestion for image alt text
 */
async function generateAltText(violationData) {
  const { html, context } = violationData;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an accessibility expert. Fix this image HTML by adding a proper alt attribute.

Current HTML:
${html}

Context: ${context || 'General website image'}

Instructions:
1. Return the FIXED HTML with a descriptive alt attribute
2. Alt text should be concise (under 125 characters)
3. Describe what's in the image, not that it's an image
4. Don't start with "Image of" or "Picture of"
5. If the image is decorative, use alt=""
6. Keep all other attributes unchanged

Respond in this EXACT format:
FIXED_HTML:
[corrected HTML here]

EXPLANATION:
[brief explanation of the alt text you chose and why]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const fixedHtmlMatch = text.match(/FIXED_HTML:\s*\n([\s\S]+?)(?=\n\s*EXPLANATION:|$)/);
    const explanationMatch = text.match(/EXPLANATION:\s*\n([\s\S]+)/);

    const fixedHtml = fixedHtmlMatch ? fixedHtmlMatch[1].trim() : html;
    const explanation = explanationMatch ? explanationMatch[1].trim() : 'Added descriptive alt text for screen readers.';

    return {
      before: html,
      after: fixedHtml,
      explanation: explanation,
      aiGenerated: true
    };
  } catch (error) {
    console.error('Gemini AI error for alt text:', error.message);

    return {
      before: html,
      after: html,
      explanation: `Unable to generate AI fix. Manual review needed.\n\nTo fix missing alt text:\n1. Add alt="" for decorative images\n2. Add descriptive alt="..." for meaningful images\n3. Describe what's in the image, not that it's an image\n4. Keep it under 125 characters`,
      aiGenerated: false
    };
  }
}


/**
 * Generate AI-powered fix for color contrast issues
 */
async function generateColorFix(violationData) {
  const { html, context, wcagReference } = violationData;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an accessibility expert. Fix this HTML to meet WCAG 2.1 AA color contrast standards (4.5:1 for normal text, 3:1 for large text).

Current HTML with contrast issue:
${html}

Context: ${context || 'Color contrast violation'}
WCAG Reference: ${wcagReference || 'color-contrast'}

Instructions:
1. Return the FIXED HTML with proper color contrast
2. Modify inline styles or add style attribute with accessible colors
3. Use colors that meet minimum 4.5:1 contrast ratio
4. Keep the HTML structure identical, only fix colors
5. After the HTML, explain what you changed in 2-3 sentences

Respond in this EXACT format:
FIXED_HTML:
[corrected HTML here]

EXPLANATION:
[brief explanation of what was changed and why]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse AI response
    const fixedHtmlMatch = text.match(/FIXED_HTML:\s*\n([\s\S]+?)(?=\n\s*EXPLANATION:|$)/);
    const explanationMatch = text.match(/EXPLANATION:\s*\n([\s\S]+)/);

    const fixedHtml = fixedHtmlMatch ? fixedHtmlMatch[1].trim() : html;
    const explanation = explanationMatch ? explanationMatch[1].trim() : 'Fixed color contrast to meet WCAG AA standards.';

    return {
      before: html,
      after: fixedHtml,
      explanation: explanation,
      aiGenerated: true
    };
  } catch (error) {
    console.error('Gemini AI error for color contrast:', error.message);

    return {
      before: html,
      after: html,
      explanation: `Unable to generate AI fix. Manual review needed.\n\nTo fix color contrast:\n1. Use dark text on light backgrounds (e.g., #000000 on #FFFFFF)\n2. Or light text on dark backgrounds (e.g., #FFFFFF on #000000)\n3. Ensure minimum 4.5:1 contrast ratio\n4. Test with WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/`,
      aiGenerated: false
    };
  }
}


/**
 * Generate AI-powered fix for missing form labels
 */
async function generateLabelFix(violationData) {
  const { html, context } = violationData;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an accessibility expert. Fix this form input by adding a proper label element.

Current HTML:
${html}

Context: ${context || 'Form input field'}

Instructions:
1. Return the FIXED HTML with a <label> element
2. Ensure the input has an id attribute
3. Link the label to the input using for="[id]"
4. Label text should be clear and descriptive (2-5 words)
5. Place the label before the input element
6. Keep all other attributes unchanged

Respond in this EXACT format:
FIXED_HTML:
[corrected HTML with label here]

EXPLANATION:
[brief explanation of the label text you chose and why]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const fixedHtmlMatch = text.match(/FIXED_HTML:\s*\n([\s\S]+?)(?=\n\s*EXPLANATION:|$)/);
    const explanationMatch = text.match(/EXPLANATION:\s*\n([\s\S]+)/);

    const fixedHtml = fixedHtmlMatch ? fixedHtmlMatch[1].trim() : html;
    const explanation = explanationMatch ? explanationMatch[1].trim() : 'Added accessible label for form input.';

    return {
      before: html,
      after: fixedHtml,
      explanation: explanation,
      aiGenerated: true
    };
  } catch (error) {
    console.error('Gemini AI error for label:', error.message);

    return {
      before: html,
      after: html,
      explanation: `Unable to generate AI fix. Manual review needed.\n\nTo fix missing label:\n1. Add an id to the input: <input id="myInput" ...>\n2. Add a label before it: <label for="myInput">Label Text</label>\n3. Or wrap it: <label>Label Text <input ...></label>\n4. Label should describe what to enter`,
      aiGenerated: false
    };
  }
}


/**
 * Generate AI-powered fix suggestion based on violation type
 */
async function generateFixSuggestion(violation) {
  cleanCache(); // Clean expired cache entries

  const { id, description, help, helpUrl, impact, nodes } = violation;

  // Check cache
  const cacheKey = getCacheKey(id, nodes[0]?.html || '');
  const cached = suggestionCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return { ...cached.suggestion, fromCache: true };
  }

  // Prepare violation data
  const violationData = {
    html: nodes[0]?.html || '',
    context: description,
    wcagReference: helpUrl,
    impact: impact
  };

  let suggestion;

  // Route to appropriate AI function based on violation ID
  if (id.includes('image-alt') || id.includes('alt-text')) {
    suggestion = await generateAltText(violationData);
  } else if (id.includes('color-contrast')) {
    suggestion = await generateColorFix(violationData);
  } else if (id.includes('label') || id.includes('form')) {
    suggestion = await generateLabelFix(violationData);
  } else {
    // Generic fix suggestion for other violation types
    suggestion = await generateGenericFix(violation);
  }

  // Cache the suggestion
  suggestionCache.set(cacheKey, {
    suggestion,
    timestamp: Date.now()
  });

  return suggestion;
}

/**
 * Generate generic AI fix for other violation types
 */
async function generateGenericFix(violation) {
  const { id, description, help, helpUrl, nodes } = violation;
  const html = nodes[0]?.html || '';

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an accessibility expert. Fix this WCAG accessibility violation.

Violation Type: ${id}
Description: ${description}
Help Text: ${help}
Current HTML:
${html}

WCAG Reference: ${helpUrl}

Instructions:
1. Return the FIXED HTML that resolves this accessibility issue
2. Keep the HTML structure as similar as possible
3. Only change what's necessary to fix the violation
4. Ensure the fix meets WCAG 2.1 standards

Respond in this EXACT format:
FIXED_HTML:
[corrected HTML here]

EXPLANATION:
[2-3 sentences explaining what was changed and why it matters for accessibility]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const fixedHtmlMatch = text.match(/FIXED_HTML:\s*\n([\s\S]+?)(?=\n\s*EXPLANATION:|$)/);
    const explanationMatch = text.match(/EXPLANATION:\s*\n([\s\S]+)/);

    const fixedHtml = fixedHtmlMatch ? fixedHtmlMatch[1].trim() : html;
    const explanation = explanationMatch ? explanationMatch[1].trim() : `Fixed ${id} violation to meet WCAG standards.`;

    return {
      before: html,
      after: fixedHtml,
      explanation: explanation,
      aiGenerated: true
    };
  } catch (error) {
    console.error('Gemini AI error for generic fix:', error.message);

    return {
      before: html,
      after: html,
      explanation: `Unable to generate AI fix. Manual review needed.\n\nViolation: ${help}\n\nSee WCAG guidelines: ${helpUrl}`,
      aiGenerated: false
    };
  }
}

module.exports = {
  generateFixSuggestion,
  generateAltText,
  generateColorFix,
  generateLabelFix
};
