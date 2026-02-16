const { getDb } = require('../db');
const { crawlCourse } = require('./crawler');
const { analyzeGrammar } = require('./analyzers/grammar');
const { analyzeDesign } = require('./analyzers/design');
const { analyzeFunctionality } = require('./analyzers/functionality');

/**
 * Runs a full review of an eLearning course at the given URL.
 * Crawls through slides like a learner, then analyzes each slide
 * for grammar, design, and functionality issues.
 */
async function runReview(reviewId, url) {
  const db = getDb();

  db.prepare("UPDATE reviews SET status = 'in_progress' WHERE id = ?").run(reviewId);

  // Step 1: Crawl the course and extract slide data
  const slides = await crawlCourse(url, reviewId);

  // Store slide data
  const insertSlide = db.prepare(
    `INSERT INTO slides (review_id, slide_number, title, screenshot_path, url, text_content)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  for (const slide of slides) {
    insertSlide.run(
      reviewId,
      slide.slideNumber,
      slide.title,
      slide.screenshotPath,
      slide.url,
      slide.textContent
    );
  }

  // Step 2: Run all analyzers
  const allFindings = [];

  for (const slide of slides) {
    const grammarFindings = analyzeGrammar(slide);
    const designFindings = analyzeDesign(slide);
    const functionalityFindings = analyzeFunctionality(slide);

    allFindings.push(...grammarFindings, ...designFindings, ...functionalityFindings);
  }

  // Step 3: Store findings
  const insertFinding = db.prepare(
    `INSERT INTO findings (review_id, category, severity, slide_number, slide_title,
     description, suggestion, element_selector, raw_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertMany = db.transaction((findings) => {
    for (const f of findings) {
      insertFinding.run(
        reviewId,
        f.category,
        f.severity,
        f.slideNumber,
        f.slideTitle,
        f.description,
        f.suggestion,
        f.elementSelector,
        f.rawText
      );
    }
  });

  insertMany(allFindings);

  // Step 4: Generate summary
  const summary = generateSummary(allFindings, slides.length);

  db.prepare("UPDATE reviews SET status = 'completed', completed_at = datetime('now'), summary = ? WHERE id = ?").run(
    JSON.stringify(summary),
    reviewId
  );

  return { slides, findings: allFindings, summary };
}

function generateSummary(findings, slideCount) {
  const bySeverity = { critical: 0, warning: 0, info: 0 };
  const byCategory = { grammar: 0, design: 0, functionality: 0 };

  for (const f of findings) {
    bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
    byCategory[f.category] = (byCategory[f.category] || 0) + 1;
  }

  return {
    totalFindings: findings.length,
    slidesReviewed: slideCount,
    bySeverity,
    byCategory,
  };
}

module.exports = { runReview };
