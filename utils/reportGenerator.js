const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Get color for score
function getScoreColor(score) {
  if (score >= 90) return '#10b981'; // Green - Excellent
  if (score >= 70) return '#f59e0b'; // Yellow - Good
  if (score >= 50) return '#f97316'; // Orange - Needs improvement
  return '#ef4444'; // Red - Poor
}

// Get severity color
function getSeverityColor(severity) {
  const colors = {
    critical: '#dc2626',
    serious: '#f97316',
    moderate: '#fbbf24',
    minor: '#60a5fa'
  };
  return colors[severity] || '#6b7280';
}

// Generate PDF report from scan results
async function generateReport(scanResults, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // Ensure reports directory exists
      const reportsDir = path.dirname(outputPath);
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // ===== PAGE 1: EXECUTIVE SUMMARY =====

      // Header
      doc.fontSize(28)
         .fillColor('#1f2937')
         .text('Accessibility Compliance Report', { align: 'center' });

      doc.moveDown(0.5);

      // URL and date
      doc.fontSize(12)
         .fillColor('#6b7280')
         .text(`URL: ${scanResults.url}`, { align: 'center' });

      const scanDate = new Date(scanResults.timestamp).toLocaleString();
      doc.text(`Scanned: ${scanDate}`, { align: 'center' });

      doc.moveDown(2);

      // Score display (large and prominent)
      const scoreColor = getScoreColor(scanResults.score);
      doc.fontSize(72)
         .fillColor(scoreColor)
         .text(scanResults.score, { align: 'center' });

      doc.fontSize(24)
         .fillColor('#6b7280')
         .text('out of 100', { align: 'center' });

      doc.moveDown(2);

      // Score interpretation
      let scoreLabel = '';
      if (scanResults.score >= 90) scoreLabel = 'Excellent Accessibility';
      else if (scanResults.score >= 70) scoreLabel = 'Good Accessibility';
      else if (scanResults.score >= 50) scoreLabel = 'Needs Improvement';
      else scoreLabel = 'Poor Accessibility';

      doc.fontSize(18)
         .fillColor('#1f2937')
         .text(scoreLabel, { align: 'center' });

      doc.moveDown(3);

      // Issues summary
      doc.fontSize(16)
         .fillColor('#1f2937')
         .text('Issues Found', { underline: true });

      doc.moveDown(0.5);

      const totalIssues = scanResults.violations.length;
      doc.fontSize(14)
         .fillColor('#374151')
         .text(`Total Violations: ${totalIssues}`, { indent: 20 });

      doc.moveDown(0.5);

      // Breakdown by severity
      doc.fontSize(12)
         .fillColor(getSeverityColor('critical'))
         .text(`Critical: ${scanResults.issueCount.critical}`, { indent: 40 });

      doc.fillColor(getSeverityColor('serious'))
         .text(`Serious: ${scanResults.issueCount.serious}`, { indent: 40 });

      doc.fillColor(getSeverityColor('moderate'))
         .text(`Moderate: ${scanResults.issueCount.moderate}`, { indent: 40 });

      doc.fillColor(getSeverityColor('minor'))
         .text(`Minor: ${scanResults.issueCount.minor}`, { indent: 40 });

      doc.moveDown(2);

      // WCAG Compliance Breakdown
      doc.fontSize(16)
         .fillColor('#1f2937')
         .text('WCAG Compliance', { underline: true });

      doc.moveDown(0.5);

      doc.fontSize(12)
         .fillColor('#374151')
         .text(`Level A: ${scanResults.wcagLevel.A.passed} passed, ${scanResults.wcagLevel.A.failed} failed`, { indent: 20 });

      doc.text(`Level AA: ${scanResults.wcagLevel.AA.passed} passed, ${scanResults.wcagLevel.AA.failed} failed`, { indent: 20 });

      doc.text(`Level AAA: ${scanResults.wcagLevel.AAA.passed} passed, ${scanResults.wcagLevel.AAA.failed} failed`, { indent: 20 });

      // ===== PAGE 2+: DETAILED VIOLATIONS =====

      if (scanResults.violations.length > 0) {
        doc.addPage();

        doc.fontSize(22)
           .fillColor('#1f2937')
           .text('Detailed Violations', { underline: true });

        doc.moveDown(1);

        scanResults.violations.forEach((violation, index) => {
          // Check if we need a new page
          if (doc.y > 650) {
            doc.addPage();
          }

          // Violation number and title
          doc.fontSize(14)
             .fillColor('#1f2937')
             .text(`${index + 1}. ${violation.help}`, { continued: false });

          doc.moveDown(0.3);

          // Severity badge
          const severityColor = getSeverityColor(violation.impact);
          doc.fontSize(10)
             .fillColor(severityColor)
             .text(`Severity: ${violation.impact.toUpperCase()}`, { indent: 20 });

          doc.moveDown(0.3);

          // WCAG reference
          doc.fontSize(10)
             .fillColor('#6b7280')
             .text(`WCAG: ${violation.tags.join(', ')}`, { indent: 20 });

          doc.moveDown(0.3);

          // Description
          doc.fontSize(10)
             .fillColor('#374151')
             .text(`Description: ${violation.description}`, {
               indent: 20,
               width: 500,
               align: 'left'
             });

          doc.moveDown(0.3);

          // Affected elements
          doc.fontSize(10)
             .fillColor('#374151')
             .text(`Affected elements: ${violation.nodes.length}`, { indent: 20 });

          doc.moveDown(0.3);

          // Impact
          doc.fontSize(10)
             .fillColor('#374151')
             .text(`Impact: ${violation.impact} - This affects users with disabilities`, {
               indent: 20,
               width: 500
             });

          doc.moveDown(1);

          // Add a separator line
          doc.strokeColor('#e5e7eb')
             .lineWidth(1)
             .moveTo(50, doc.y)
             .lineTo(550, doc.y)
             .stroke();

          doc.moveDown(1);
        });

      } else {
        doc.addPage();
        doc.fontSize(18)
           .fillColor('#10b981')
           .text('No Violations Found!', { align: 'center' });

        doc.moveDown(1);

        doc.fontSize(12)
           .fillColor('#374151')
           .text('Congratulations! This page passed all automated accessibility tests.', {
             align: 'center'
           });
      }

      // ===== FINAL PAGE: RECOMMENDATIONS =====

      doc.addPage();

      doc.fontSize(22)
         .fillColor('#1f2937')
         .text('Recommendations & Next Steps', { underline: true });

      doc.moveDown(1);

      if (scanResults.violations.length > 0) {
        doc.fontSize(14)
           .fillColor('#374151')
           .text('Priority Actions:', { underline: true });

        doc.moveDown(0.5);

        doc.fontSize(11)
           .fillColor('#374151')
           .text('1. Fix all Critical issues first - these create major barriers for users', { indent: 20 });
        doc.text('2. Address Serious issues - these significantly impact accessibility', { indent: 20 });
        doc.text('3. Resolve Moderate and Minor issues for full compliance', { indent: 20 });

        doc.moveDown(1);
      }

      doc.fontSize(14)
         .fillColor('#374151')
         .text('Best Practices:', { underline: true });

      doc.moveDown(0.5);

      doc.fontSize(11)
         .text('• Provide alt text for all images', { indent: 20 });
      doc.text('• Ensure sufficient color contrast (4.5:1 minimum)', { indent: 20 });
      doc.text('• Make all interactive elements keyboard accessible', { indent: 20 });
      doc.text('• Use semantic HTML elements', { indent: 20 });
      doc.text('• Add ARIA labels where necessary', { indent: 20 });
      doc.text('• Test with screen readers regularly', { indent: 20 });

      doc.moveDown(1);

      doc.fontSize(14)
         .fillColor('#374151')
         .text('Resources:', { underline: true });

      doc.moveDown(0.5);

      doc.fontSize(10)
         .fillColor('#2563eb')
         .text('• WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/', {
           indent: 20,
           link: 'https://www.w3.org/WAI/WCAG21/quickref/'
         });
      doc.text('• WebAIM: https://webaim.org/', {
        indent: 20,
        link: 'https://webaim.org/'
      });
      doc.text('• A11y Project: https://www.a11yproject.com/', {
        indent: 20,
        link: 'https://www.a11yproject.com/'
      });

      // Footer
      doc.fontSize(8)
         .fillColor('#9ca3af')
         .text('Generated by Accessibility Checker',
           50,
           doc.page.height - 50,
           { align: 'center' }
         );

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        resolve(outputPath);
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateReport
};
